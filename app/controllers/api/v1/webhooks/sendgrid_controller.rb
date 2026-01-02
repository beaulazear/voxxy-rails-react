# Controller for handling SendGrid webhook events

module Api
  module V1
    module Webhooks
      class SendgridController < ApplicationController
        skip_before_action :authorized

        # POST /api/v1/webhooks/sendgrid
        def create
          events = parse_events

          if events.empty?
            render json: { error: "No events provided" }, status: :bad_request
            return
          end

          processed = []
          errors = []

          events.each do |event|
            result = process_event(event)
            if result[:success]
              processed << result[:data]
            else
              errors << result[:error]
            end
          end

          render json: {
            message: "Processed #{processed.count} events",
            processed: processed.count,
            errors: errors
          }, status: :ok
        end

        private

        def parse_events
          if params[:_json].present?
            params[:_json]
          elsif params[:sendgrid].present?
            [ params[:sendgrid] ]
          else
            []
          end
        end

        def process_event(event)
          sg_message_id = extract_message_id(event)

          unless sg_message_id
            return { success: false, error: "No message ID in event: #{event['event']}" }
          end

          delivery = EmailDelivery.find_by(sendgrid_message_id: sg_message_id)

          unless delivery
            return { success: true, data: { message: "No delivery found for #{sg_message_id}", skipped: true } }
          end

          case event["event"]
          when "delivered"
            handle_delivered(delivery, event)
          when "bounce"
            handle_bounce(delivery, event)
          when "dropped"
            handle_dropped(delivery, event)
          when "deferred"
            handle_deferred(delivery, event)
          when "unsubscribe", "spamreport"
            handle_unsubscribe(delivery, event)
          else
            return { success: true, data: { message: "Event logged: #{event['event']}", delivery_id: delivery.id } }
          end

          { success: true, data: { delivery_id: delivery.id, event: event["event"], status: delivery.status } }
        rescue => e
          { success: false, error: "Error processing event: #{e.message}" }
        end

        def extract_message_id(event)
          event["sg_message_id"] || event["smtp-id"]&.gsub(/[<>]/, "")
        end

        def handle_delivered(delivery, event)
          delivery.update(
            status: "delivered",
            delivered_at: Time.at(event["timestamp"].to_i)
          )
        end

        def handle_bounce(delivery, event)
          bounce_type = event["bounce_classification"] == "hard" ? "hard" : "soft"

          delivery.update(
            status: "bounced",
            bounce_type: bounce_type,
            bounce_reason: event["reason"],
            bounced_at: Time.at(event["timestamp"].to_i)
          )

          schedule_retry(delivery) if delivery.retryable?
        end

        def handle_dropped(delivery, event)
          delivery.update(status: "dropped", bounce_reason: event["reason"])
        end

        def handle_deferred(delivery, event)
          Rails.logger.info("Email deferred: #{delivery.id} - #{event['reason']}")
        end

        def handle_unsubscribe(delivery, event)
          delivery.update(status: "unsubscribed")
          delivery.registration&.update(email_unsubscribed: true)
        end

        def schedule_retry(delivery)
          retry_count = delivery.retry_count + 1
          next_retry_hours = 2 ** retry_count

          delivery.update(
            retry_count: retry_count,
            next_retry_at: next_retry_hours.hours.from_now
          )
        end
      end
    end
  end
end
