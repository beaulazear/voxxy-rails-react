namespace :activities do
  desc "Mark all finalized activities that are 24+ hours past their date/time as complete and send completion emails"
  task complete_past: :environment do
    now = Time.current
    cutoff_time = now - 24.hours
    puts "[#{now}] Starting complete_past (cutoff=#{cutoff_time})"

    updated = 0
    emailed  = 0
    skipped = 0

    # Find finalized activities that are not yet completed and have both date and time set
    Activity
      .where(finalized: true, completed: false)
      .where.not(date_day: nil)
      .where.not(date_time: nil)
      .find_each(batch_size: 100) do |activity|
        begin
          # Combine date_day and date_time to get the full activity datetime
          # date_day is stored as a date (YYYY-MM-DD)
          # date_time is stored as a datetime but we only need the time portion
          activity_date = activity.date_day.is_a?(Date) ? activity.date_day : Date.parse(activity.date_day.to_s)
          activity_time = activity.date_time

          # Create a datetime by combining the date and extracting time from date_time
          activity_datetime = Time.zone.local(
            activity_date.year,
            activity_date.month,
            activity_date.day,
            activity_time.hour,
            activity_time.min,
            activity_time.sec
          )

          # Check if activity datetime is more than 24 hours in the past
          if activity_datetime < cutoff_time
            activity.update!(completed: true)
            Rails.logger.info "  ✓ Marked Activity ##{activity.id} (#{activity.activity_name}) complete - was scheduled for #{activity_datetime}"
            puts "  ✓ Completed: ##{activity.id} - #{activity.activity_name} (#{activity_datetime})"
            updated += 1

            # Send completion emails
            begin
              ActivityCompletionEmailService.send_completion_emails(activity)
              Rails.logger.info "    → Emails sent for ##{activity.id}"
              emailed += 1
            rescue => e
              Rails.logger.error "‼️ Failed to email for ##{activity.id}: #{e.class} – #{e.message}"
            end
          else
            Rails.logger.debug "  ⏱ Skipping Activity ##{activity.id} - scheduled for #{activity_datetime} (not yet 24h past)"
            skipped += 1
          end
        rescue => e
          Rails.logger.error "‼️ Failed to process ##{activity.id}: #{e.message}"
          Rails.logger.error e.backtrace.first(5).join("\n")
          next
        end
      end

    puts "Done! #{updated} activities marked complete, #{emailed} email batches sent, #{skipped} skipped (not yet 24h past)."
  end
end
