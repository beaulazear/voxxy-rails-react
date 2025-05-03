namespace :activities do
  desc "Mark all past activities complete and send completion emails"
  task complete_past: :environment do
    today = Date.current
    puts "[#{Time.current}] Starting complete_past (today=#{today})"

    count = 0
    Activity
      .where("date_day < ? AND completed = ?", today, false)
      .find_each(batch_size: 100) do |activity|
        begin
          Activity.transaction do
            activity.update!(completed: true)
            Rails.logger.info "  ✓ Marked Activity ##{activity.id} complete"
            ActivityCompletionEmailService.send_completion_emails(activity)
            Rails.logger.info "    → Emails sent for ##{activity.id}"
          end

          count += 1
        rescue => e
          Rails.logger.error "‼️ Failed to process Activity ##{activity.id}: #{e.class} – #{e.message}"
        end
      end

    puts "Done! #{count} activities marked complete."
  end
end
