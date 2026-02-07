module Api
  module V1
    class SendgridWebhooksController < ApplicationController
      skip_before_action :verify_authenticity_token
      skip_before_action :authenticate_user!

      # POST /api/v1/sendgrid/webhook
      def event
        events = params['_json'] || [params]

        events.each do |event_data|
          process_sendgrid_event(event_data)
        end

        head :ok
      rescue => e
        Rails.logger.error "SendGrid webhook error: #{e.message}\n#{e.backtrace.join("\n")}"
        head :ok # Always return 200 to prevent SendGrid from retrying
      end

      private

      def process_sendgrid_event(event_data)
        event_type = event_data['event']
        email = event_data['email']

        Rails.logger.info "SendGrid Event: #{event_type} for #{email}"

        case event_type
        when 'bounce', 'dropped', 'blocked'
          handle_failure_event(event_data)
        when 'delivered'
          handle_delivered_event(event_data)
        when 'open'
          handle_open_event(event_data)
        when 'click'
          handle_click_event(event_data)
        end
      end

      def handle_failure_event(event_data)
        email = event_data['email']
        reason = event_data['reason']
        event_type = event_data['event']

        # Log critical bounce information
        Rails.logger.error "[SENDGRID BOUNCE] Email: #{email}, Type: #{event_type}, Reason: #{reason}"

        # Find the email delivery record if it exists
        if event_data['custom_args']
          event_id = event_data.dig('custom_args', 'event_id')
          email_type = event_data.dig('custom_args', 'email_type')

          # Update email delivery status
          if event_id.present?
            EmailDelivery.where(
              event_id: event_id,
              recipient_email: email
            ).update_all(
              status: 'failed',
              error_message: reason,
              failed_at: Time.current
            )
          end
        end

        # Alert admins for critical bounces
        if reason&.include?('Domain not found') || reason&.include?('Sender address rejected')
          AdminMailer.critical_sendgrid_error(
            email: email,
            reason: reason,
            event_data: event_data
          ).deliver_later rescue nil
        end
      end

      def handle_delivered_event(event_data)
        email = event_data['email']

        if event_data['custom_args']
          event_id = event_data.dig('custom_args', 'event_id')

          if event_id.present?
            EmailDelivery.where(
              event_id: event_id,
              recipient_email: email
            ).update_all(
              status: 'delivered',
              delivered_at: Time.current
            )
          end
        end
      end

      def handle_open_event(event_data)
        email = event_data['email']

        if event_data['custom_args']
          event_id = event_data.dig('custom_args', 'event_id')

          if event_id.present?
            EmailDelivery.where(
              event_id: event_id,
              recipient_email: email
            ).update_all(
              opened_at: Time.current
            )
          end
        end
      end

      def handle_click_event(event_data)
        email = event_data['email']
        url = event_data['url']

        Rails.logger.info "Email click: #{email} clicked #{url}"
      end
    end
  end
end
