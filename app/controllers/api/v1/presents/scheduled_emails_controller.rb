# Controller for managing scheduled emails for events

module Api
  module V1
    module Presents
      class ScheduledEmailsController < BaseController
        before_action :set_event
        before_action :set_scheduled_email, only: [ :show, :update, :destroy, :pause, :resume, :send_now, :preview ]

        # GET /api/v1/presents/events/:event_id/scheduled_emails
        def index
          emails = @event.scheduled_emails.includes(:email_template_item, :latest_delivery)
          emails = emails.where(status: params[:status]) if params[:status]

          if params[:category]
            emails = emails.joins(:email_template_item)
              .where(email_template_items: { category: params[:category] })
          end

          render json: emails.order(scheduled_for: :asc), include: [ :email_template_item, :latest_delivery ]
        end

        # GET /api/v1/presents/events/:event_id/scheduled_emails/:id
        def show
          render json: @scheduled_email, include: {
            email_template_item: {},
            email_deliveries: { only: [ :id, :recipient_email, :status, :sent_at, :delivered_at, :bounced_at ] }
          }, methods: [ :delivery_status ]
        end

        # POST /api/v1/presents/events/:event_id/scheduled_emails/generate
        def generate
          unless @event.email_campaign_template
            render json: { error: "Event has no email campaign template" }, status: :unprocessable_entity
            return
          end

          generator = ScheduledEmailGenerator.new(@event)

          emails = if params[:category] || params[:positions]
            generator.generate_selective(category: params[:category], positions: params[:positions])
          else
            generator.generate
          end

          render json: {
            message: "Generated #{emails.count} scheduled emails",
            emails: emails,
            errors: generator.errors
          }, status: :created
        end

        # PATCH /api/v1/presents/events/:event_id/scheduled_emails/:id
        def update
          unless @scheduled_email.editable?
            render json: { error: "Cannot edit sent emails" }, status: :forbidden
            return
          end

          if @scheduled_email.update(scheduled_email_params)
            render json: @scheduled_email
          else
            render json: { errors: @scheduled_email.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/events/:event_id/scheduled_emails/:id
        def destroy
          unless @scheduled_email.editable?
            render json: { error: "Cannot delete sent emails" }, status: :forbidden
            return
          end

          @scheduled_email.destroy
          head :no_content
        end

        # POST /api/v1/presents/events/:event_id/scheduled_emails/:id/pause
        def pause
          if @scheduled_email.status == "sent"
            render json: { error: "Cannot pause sent emails" }, status: :unprocessable_entity
            return
          end

          @scheduled_email.update(status: "paused")
          render json: { message: "Email paused", email: @scheduled_email }
        end

        # POST /api/v1/presents/events/:event_id/scheduled_emails/:id/resume
        def resume
          if @scheduled_email.status != "paused"
            render json: { error: "Email is not paused" }, status: :unprocessable_entity
            return
          end

          @scheduled_email.update(status: "scheduled")
          render json: { message: "Email resumed", email: @scheduled_email }
        end

        # POST /api/v1/presents/events/:event_id/scheduled_emails/:id/send_now
        def send_now
          unless @scheduled_email.editable?
            render json: { error: "Cannot send emails that are already sent" }, status: :forbidden
            return
          end

          # Send immediately using EmailSenderService
          begin
            service = EmailSenderService.new(@scheduled_email)
            result = service.send_to_recipients

            render json: {
              message: "Email sent successfully",
              sent_count: result[:sent],
              failed_count: result[:failed],
              email: @scheduled_email.reload
            }
          rescue => e
            Rails.logger.error("Failed to send email immediately: #{e.message}")
            @scheduled_email.update(status: "failed", error_message: e.message)

            render json: {
              error: "Failed to send email: #{e.message}"
            }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/presents/events/:event_id/scheduled_emails/:id/preview
        def preview
          registration = if params[:registration_id]
            @event.registrations.find(params[:registration_id])
          else
            @event.registrations.first
          end

          unless registration
            render json: { error: "No registration found for preview" }, status: :not_found
            return
          end

          resolver = EmailVariableResolver.new(@event, registration)
          resolved = resolver.resolve_email(
            @scheduled_email.subject_template,
            @scheduled_email.body_template
          )

          render json: {
            registration: { id: registration.id, name: registration.name, email: registration.email },
            subject: resolved[:subject],
            body: resolved[:body],
            original_subject: @scheduled_email.subject_template,
            original_body: @scheduled_email.body_template
          }
        end

        private

        def set_event
          @event = Event.find(params[:event_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Event not found" }, status: :not_found
        end

        def set_scheduled_email
          @scheduled_email = @event.scheduled_emails.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Scheduled email not found" }, status: :not_found
        end

        def scheduled_email_params
          params.require(:scheduled_email).permit(
            :name, :subject_template, :body_template, :scheduled_for, :status,
            filter_criteria: {}
          )
        end
      end
    end
  end
end
