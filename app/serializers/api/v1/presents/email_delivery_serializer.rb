module Api
  module V1
    module Presents
      class EmailDeliverySerializer
        def initialize(email_delivery)
          @email_delivery = email_delivery
        end

        def as_json
          {
            id: @email_delivery.id,
            sendgrid_message_id: @email_delivery.sendgrid_message_id,
            recipient_email: @email_delivery.recipient_email,
            subject: determine_subject,
            status: @email_delivery.status,
            email_type: @email_delivery.email_type,
            bounce_type: @email_delivery.bounce_type,
            bounce_reason: @email_delivery.bounce_reason,
            drop_reason: @email_delivery.drop_reason,
            sent_at: @email_delivery.sent_at,
            delivered_at: @email_delivery.delivered_at,
            bounced_at: @email_delivery.bounced_at,
            dropped_at: @email_delivery.dropped_at,
            unsubscribed_at: @email_delivery.unsubscribed_at,
            retry_count: @email_delivery.retry_count,
            next_retry_at: @email_delivery.next_retry_at,
            max_retries: @email_delivery.max_retries,
            created_at: @email_delivery.created_at,
            updated_at: @email_delivery.updated_at,
            scheduled_email: scheduled_email_json
          }
        end

        private

        def determine_subject
          # 1. Use stored subject if present (for notification/invitation emails)
          return @email_delivery.subject if @email_delivery.subject.present?

          # 2. Fall back to scheduled email subject if available
          if @email_delivery.scheduled_email.present?
            return @email_delivery.scheduled_email.subject_template || @email_delivery.scheduled_email.name
          end

          # 3. Generic fallback based on email_type
          case @email_delivery.email_type
          when "invitation"
            "Event Invitation"
          when "notification"
            "Event Notification"
          when "scheduled"
            "Scheduled Email"
          else
            "Unknown Email"
          end
        end

        def scheduled_email_json
          return nil unless @email_delivery.scheduled_email.present?

          {
            id: @email_delivery.scheduled_email.id,
            subject: @email_delivery.scheduled_email.subject_template || @email_delivery.scheduled_email.name,
            scheduled_for: @email_delivery.scheduled_email.scheduled_for,
            sent_at: @email_delivery.scheduled_email.sent_at
          }
        end
      end
    end
  end
end
