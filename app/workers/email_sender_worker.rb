# Background job that checks for scheduled emails ready to send
# Runs every 5 minutes via Sidekiq-Cron

class EmailSenderWorker
  include Sidekiq::Job

  sidekiq_options queue: :email_delivery, retry: 2

  def perform
    Rails.logger.info("EmailSenderWorker: Checking for scheduled emails ready to send...")

    # Find all scheduled emails that:
    # 1. Status is 'scheduled' (not paused, sent, or cancelled)
    # 2. Scheduled time is in the past (ready to send)
    # 3. Scheduled within the last 7 days (skip very old emails)
    ready_emails = ScheduledEmail
      .where(status: "scheduled")
      .where("scheduled_for <= ?", Time.current)
      .where("scheduled_for >= ?", 7.days.ago)
      .includes(:event, event: :organization)
      .order(scheduled_for: :asc)

    if ready_emails.empty?
      Rails.logger.info("No scheduled emails ready to send")
      return
    end

    Rails.logger.info("Found #{ready_emails.count} scheduled emails ready to send")

    sent_count = 0
    failed_count = 0

    ready_emails.each do |scheduled_email|
      begin
        send_scheduled_email(scheduled_email)
        sent_count += 1
      rescue => e
        Rails.logger.error("Failed to send scheduled email ##{scheduled_email.id}: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))

        # Mark as failed
        scheduled_email.update(
          status: "failed",
          error_message: "#{e.class}: #{e.message}"
        )

        failed_count += 1
      end
    end

    Rails.logger.info("EmailSenderWorker complete: #{sent_count} sent, #{failed_count} failed")

    { sent: sent_count, failed: failed_count }
  end

  private

  def send_scheduled_email(scheduled_email)
    Rails.logger.info("Sending scheduled email ##{scheduled_email.id}: #{scheduled_email.name}")

    # Use EmailSenderService to send to all recipients
    service = EmailSenderService.new(scheduled_email)
    result = service.send_to_recipients

    Rails.logger.info("✓ Scheduled email ##{scheduled_email.id} sent to #{result[:sent]} recipients")

    result
  end
end
