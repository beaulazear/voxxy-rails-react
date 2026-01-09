module Api
  module V1
    module Presents
      class EmailNotificationsController < BaseController
        before_action :set_event, only: [ :check_event_update_impact, :send_event_update_emails, :check_cancellation_impact, :send_cancellation_emails ]
        before_action :set_registration, only: [ :send_payment_confirmation, :send_category_change ]

        # POST /api/v1/presents/events/:event_id/email_notifications/check_event_update_impact
        # Check how many people would receive emails if event details are updated
        def check_event_update_impact
          unless @event.organization.user_id == @current_user.id || @current_user.admin?
            return render json: { error: "Not authorized" }, status: :forbidden
          end

          recipient_count = @event.registrations.where(email_unsubscribed: false).count

          render json: {
            action: "event_details_changed",
            recipient_count: recipient_count,
            event: {
              id: @event.id,
              title: @event.title,
              event_date: @event.event_date,
              venue: @event.venue,
              location: @event.location,
              start_time: @event.start_time
            },
            warning: "This will send an email notification to #{recipient_count} #{'recipient'.pluralize(recipient_count)}.",
            requires_confirmation: true
          }, status: :ok
        end

        # POST /api/v1/presents/events/:event_id/email_notifications/send_event_update
        # Send event update emails after confirmation
        def send_event_update_emails
          unless @event.organization.user_id == @current_user.id || @current_user.admin?
            return render json: { error: "Not authorized" }, status: :forbidden
          end

          unless params[:confirmed] == true || params[:confirmed] == "true"
            return render json: { error: "Email sending not confirmed" }, status: :unprocessable_entity
          end

          result = RegistrationEmailService.send_event_details_changed_to_all(@event)

          render json: {
            success: true,
            message: "Event update emails sent",
            sent_count: result[:sent],
            failed_count: result[:failed]
          }, status: :ok
        rescue StandardError => e
          Rails.logger.error "Failed to send event update emails: #{e.message}"
          render json: { error: "Failed to send emails: #{e.message}" }, status: :internal_server_error
        end

        # POST /api/v1/presents/events/:event_id/email_notifications/check_cancellation_impact
        # Check how many people would receive emails if event is canceled
        def check_cancellation_impact
          unless @event.organization.user_id == @current_user.id || @current_user.admin?
            return render json: { error: "Not authorized" }, status: :forbidden
          end

          recipient_count = @event.registrations.where(email_unsubscribed: false).count

          render json: {
            action: "event_canceled",
            recipient_count: recipient_count,
            event: {
              id: @event.id,
              title: @event.title
            },
            warning: "⚠️ IMPORTANT: This will send a cancellation email to #{recipient_count} #{'recipient'.pluralize(recipient_count)} and cannot be undone.",
            requires_confirmation: true
          }, status: :ok
        end

        # POST /api/v1/presents/events/:event_id/email_notifications/send_cancellation
        # Send cancellation emails after confirmation
        def send_cancellation_emails
          unless @event.organization.user_id == @current_user.id || @current_user.admin?
            return render json: { error: "Not authorized" }, status: :forbidden
          end

          unless params[:confirmed] == true || params[:confirmed] == "true"
            return render json: { error: "Email sending not confirmed" }, status: :unprocessable_entity
          end

          result = RegistrationEmailService.send_event_canceled_to_all(@event)

          render json: {
            success: true,
            message: "Cancellation emails sent",
            sent_count: result[:sent],
            failed_count: result[:failed]
          }, status: :ok
        rescue StandardError => e
          Rails.logger.error "Failed to send cancellation emails: #{e.message}"
          render json: { error: "Failed to send emails: #{e.message}" }, status: :internal_server_error
        end

        # POST /api/v1/presents/registrations/:id/email_notifications/send_payment_confirmation
        # Send payment confirmation email
        def send_payment_confirmation
          unless can_manage_registration?(@registration)
            return render json: { error: "Not authorized" }, status: :forbidden
          end

          # Check if payment is actually confirmed
          unless @registration.payment_status == "paid" || @registration.payment_status == "confirmed"
            return render json: {
              error: "Payment must be confirmed before sending confirmation email",
              current_status: @registration.payment_status
            }, status: :unprocessable_entity
          end

          RegistrationEmailService.send_payment_confirmation(@registration)

          render json: {
            success: true,
            message: "Payment confirmation email sent to #{@registration.email}"
          }, status: :ok
        rescue StandardError => e
          Rails.logger.error "Failed to send payment confirmation: #{e.message}"
          render json: { error: "Failed to send email: #{e.message}" }, status: :internal_server_error
        end

        # POST /api/v1/presents/registrations/:id/email_notifications/send_category_change
        # Send category change notification
        def send_category_change
          unless can_manage_registration?(@registration)
            return render json: { error: "Not authorized" }, status: :forbidden
          end

          new_price = params[:new_price] # Optional

          RegistrationEmailService.send_category_change_notification(@registration, new_price)

          render json: {
            success: true,
            message: "Category change notification sent to #{@registration.email}"
          }, status: :ok
        rescue StandardError => e
          Rails.logger.error "Failed to send category change notification: #{e.message}"
          render json: { error: "Failed to send email: #{e.message}" }, status: :internal_server_error
        end

        private

        def set_event
          @event = Event.find_by!(slug: params[:event_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Event not found" }, status: :not_found
        end

        def set_registration
          @registration = Registration.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Registration not found" }, status: :not_found
        end

        def can_manage_registration?(registration)
          registration.event.organization.user_id == @current_user.id || @current_user.admin?
        end
      end
    end
  end
end
