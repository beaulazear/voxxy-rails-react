module Api
  module V1
    module Presents
      class UnsubscribesController < BaseController
        # No authentication required - public endpoint with token-based security
        skip_before_action :authorized, only: [ :show, :create, :resubscribe ]
        skip_before_action :check_presents_access, only: [ :show, :create, :resubscribe ]

        # GET /api/v1/presents/unsubscribe/:token
        # Validates token and returns context (event, organization info)
        def show
        begin
          context = UnsubscribeTokenService.validate_and_get_context(params[:token])

          unsubscribe_token = context[:token]
          event = context[:event]
          organization = context[:organization]

          # Check current subscription status
          email = context[:email]
          subscription_status = {
            event_unsubscribed: event ? EmailUnsubscribe.unsubscribed_from_event?(email, event) : false,
            organization_unsubscribed: organization ? EmailUnsubscribe.unsubscribed_from_organization?(email, organization) : false,
            globally_unsubscribed: EmailUnsubscribe.unsubscribed_globally?(email)
          }

          render json: {
            email: email,
            event: event ? {
              id: event.id,
              title: event.title,
              slug: event.slug,
              event_date: event.event_date
            } : nil,
            organization: organization ? {
              id: organization.id,
              name: organization.name,
              slug: organization.slug
            } : nil,
            subscription_status: subscription_status,
            available_scopes: available_scopes(event, organization)
          }, status: :ok

        rescue ActiveRecord::RecordNotFound => e
          render json: {
            error: "Invalid or expired unsubscribe token",
            message: e.message
          }, status: :not_found
        rescue => e
          Rails.logger.error("Unsubscribe token validation error: #{e.message}")
          render json: {
            error: "Failed to validate unsubscribe token",
            message: e.message
          }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/presents/unsubscribe/:token
      # Process unsubscribe with specified scope
      def create
        begin
          scope = params[:scope]

          unless EmailUnsubscribe::SCOPES.include?(scope)
            return render json: {
              error: "Invalid scope",
              message: "Scope must be one of: #{EmailUnsubscribe::SCOPES.join(', ')}"
            }, status: :bad_request
          end

          # Process the unsubscribe
          unsubscribe_record = UnsubscribeTokenService.process_unsubscribe(params[:token], scope: scope)

          # Get context for response
          context = {
            scope: unsubscribe_record.scope,
            email: unsubscribe_record.email
          }

          if unsubscribe_record.event
            context[:event] = {
              id: unsubscribe_record.event.id,
              title: unsubscribe_record.event.title
            }
          end

          if unsubscribe_record.organization
            context[:organization] = {
              id: unsubscribe_record.organization.id,
              name: unsubscribe_record.organization.name
            }
          end

          render json: {
            success: true,
            message: unsubscribe_success_message(scope, unsubscribe_record),
            unsubscribe: context
          }, status: :ok

        rescue ActiveRecord::RecordNotFound => e
          render json: {
            error: "Invalid or expired unsubscribe token",
            message: e.message
          }, status: :not_found
        rescue ArgumentError => e
          render json: {
            error: "Invalid request",
            message: e.message
          }, status: :bad_request
        rescue => e
          Rails.logger.error("Unsubscribe processing error: #{e.message}")
          Rails.logger.error(e.backtrace.join("\n"))
          render json: {
            error: "Failed to process unsubscribe",
            message: e.message
          }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/presents/unsubscribe/:token/resubscribe
      # Resubscribe (delete the unsubscribe record)
      def resubscribe
        begin
          context = UnsubscribeTokenService.validate_and_get_context(params[:token])
          email = context[:email]
          event = context[:event]
          organization = context[:organization]

          # Get the scope from the original unsubscribe
          # Check what the user was unsubscribed from
          if EmailUnsubscribe.unsubscribed_globally?(email)
            scope = "global"
          elsif organization && EmailUnsubscribe.unsubscribed_from_organization?(email, organization)
            scope = "organization"
          elsif event && EmailUnsubscribe.unsubscribed_from_event?(email, event)
            scope = "event"
          else
            return render json: {
              error: "Not currently unsubscribed",
              message: "This email address is not currently unsubscribed"
            }, status: :bad_request
          end

          # Resubscribe
          success = EmailUnsubscribe.resubscribe(
            email: email,
            scope: scope,
            event: event,
            organization: organization
          )

          if success
            render json: {
              success: true,
              message: "You have been resubscribed and will receive emails again",
              scope: scope
            }, status: :ok
          else
            render json: {
              error: "Failed to resubscribe",
              message: "Could not find unsubscribe record"
            }, status: :not_found
          end

        rescue ActiveRecord::RecordNotFound => e
          render json: {
            error: "Invalid or expired token",
            message: e.message
          }, status: :not_found
        rescue => e
          Rails.logger.error("Resubscribe error: #{e.message}")
          Rails.logger.error(e.backtrace.join("\n"))
          render json: {
            error: "Failed to process resubscribe",
            message: e.message
          }, status: :unprocessable_entity
        end
      end

      private

      def available_scopes(event, organization)
        scopes = []
        scopes << "event" if event
        scopes << "organization" if organization
        scopes << "global"
        scopes
      end

      def unsubscribe_success_message(scope, unsubscribe_record)
        case scope
        when "event"
          "You have been unsubscribed from emails about #{unsubscribe_record.event.title}"
        when "organization"
          "You have been unsubscribed from all emails from #{unsubscribe_record.organization.name}"
        when "global"
          "You have been unsubscribed from all Voxxy Presents emails"
        else
          "You have been successfully unsubscribed"
        end
      end
      end
    end
  end
end
