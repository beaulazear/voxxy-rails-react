# Background job that scans for emails pending retry
# Runs every 30 minutes as a backup to webhook-based retry scheduling

class EmailRetryScannerJob
  include Sidekiq::Job

  sidekiq_options queue: :email_delivery, retry: 1

  def perform
    Rails.logger.info("EmailRetryScannerJob: Scanning for emails pending retry...")

    # Find all deliveries that have a next_retry_at in the past
    pending_retries = EmailDelivery
      .pending_retry
      .where("next_retry_at <= ?", Time.current)

    if pending_retries.empty?
      Rails.logger.info("No emails pending retry")
      return
    end

    Rails.logger.info("Found #{pending_retries.count} emails pending retry")

    retried_count = 0
    failed_count = 0

    pending_retries.each do |delivery|
      begin
        # Enqueue the retry job
        EmailRetryJob.perform_async(delivery.id)
        retried_count += 1
      rescue => e
        Rails.logger.error("Failed to enqueue retry for delivery ##{delivery.id}: #{e.message}")
        failed_count += 1
      end
    end

    Rails.logger.info("EmailRetryScannerJob complete: #{retried_count} retries queued, #{failed_count} failed")

    { retried: retried_count, failed: failed_count }
  end
end
