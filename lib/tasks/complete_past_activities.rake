namespace :activities do
  desc "Mark all past activities complete and send completion emails"
  task complete_past: :environment do
    today = Date.current
    puts "[#{Time.current}] Starting complete_past (today=#{today})"

    updated = 0
    emailed  = 0

    Activity
      .where("date_day < ? AND completed = ?", today, false)
      .find_each(batch_size: 100) do |activity|
        begin
          activity.update!(completed: true)
          Rails.logger.info "  ✓ Marked Activity ##{activity.id} complete"
          updated += 1
        rescue => e
          Rails.logger.error "‼️ Failed to mark ##{activity.id} complete: #{e.message}"
          next
        end

        begin
          ActivityCompletionEmailService.send_completion_emails(activity)
          Rails.logger.info "    → Emails sent for ##{activity.id}"
          emailed += 1
        rescue => e
          Rails.logger.error "‼️ Failed to email for ##{activity.id}: #{e.class} – #{e.message}"
        end
      end

    puts "Done! #{updated} activities marked complete, #{emailed} email batches sent."
  end
end
