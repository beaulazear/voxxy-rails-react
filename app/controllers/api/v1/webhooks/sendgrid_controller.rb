# Controller for handling SendGrid webhook events
# This endpoint must be FAST - it just enqueues background jobs for processing

module Api
  module V1
    module Webhooks
      class SendgridController < ApplicationController
        skip_before_action :authorized # Webhooks don't require user authentication

        # POST /api/v1/webhooks/sendgrid
        def create
          events = parse_events

          if events.empty?
            render json: { error: "No events provided" }, status: :bad_request
            return
          end

          # Enqueue background jobs for each event (keep webhook fast!)
          events.each do |event|
            EmailDeliveryProcessorJob.perform_async(event.as_json)
          end

          Rails.logger.info("SendGrid webhook: Enqueued #{events.count} events for processing")

          render json: {
            message: "Queued #{events.count} events for processing",
            queued: events.count
          }, status: :ok
        end

        private

        def parse_events
          # SendGrid sends events as an array of JSON objects
          if params[:_json].present?
            params[:_json]
          elsif params[:sendgrid].present?
            [ params[:sendgrid] ]
          else
            []
          end
        end
      end
    end
  end
end
