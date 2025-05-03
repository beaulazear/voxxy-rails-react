namespace :activities do
    desc "Mark all past activities complete and send completion emails"
    task complete_past: :environment do
      today = Date.current

      Activity
        .where("date_day < ? AND completed = ?", today, false)
        .find_each(batch_size: 100) do |activity|
          Activity.transaction do
            activity.update!(completed: true)
            ActivityCompletionEmailService.send_completion_emails(activity)
            Rails.logger.info "✅ Marked Activity ##{activity.id} complete and emailed participants"
          end
        end

      Rails.logger.info "🎬 Finished marking past activities complete"
    end
  end
