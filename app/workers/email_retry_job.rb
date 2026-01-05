# Background job to retry sending emails that soft bounced
# Automatically scheduled by EmailDeliveryProcessorJob with exponential backoff

class EmailRetryJob
  include Sidekiq::Job

  sidekiq_options queue: :email_delivery, retry: 2

  def perform(delivery_id)
    delivery = EmailDelivery.find_by(id: delivery_id)

    unless delivery
      Rails.logger.warn("EmailRetryJob: Delivery ##{delivery_id} not found")
      return
    end

    # Don't retry if already successfully delivered or unsubscribed
    if delivery.status.in?([ "delivered", "unsubscribed" ])
      Rails.logger.info("EmailRetryJob: Delivery ##{delivery.id} already #{delivery.status}, skipping retry")
      return
    end

    # Don't retry if max retries exceeded
    unless delivery.retryable?
      Rails.logger.warn("EmailRetryJob: Delivery ##{delivery.id} exceeded max retries (#{delivery.retry_count}/#{delivery.max_retries})")
      return
    end

    # Resend the email
    Rails.logger.info("↻ Retrying email send for delivery ##{delivery.id} (attempt #{delivery.retry_count + 1})")

    begin
      EmailSenderService.retry_delivery(delivery)

      # Clear next_retry_at since we just attempted
      delivery.update(next_retry_at: nil)

      Rails.logger.info("✓ Email retry sent successfully for delivery ##{delivery.id}")
    rescue => e
      Rails.logger.error("✗ Email retry failed for delivery ##{delivery.id}: #{e.message}")

      # If this was the last retry, mark as permanently failed
      if delivery.retry_count >= delivery.max_retries
        delivery.update(
          status: "dropped",
          drop_reason: "Max retries exceeded: #{e.message}",
          next_retry_at: nil
        )
      end

      raise e # Re-raise so Sidekiq can handle retry logic
    end
  end
end
