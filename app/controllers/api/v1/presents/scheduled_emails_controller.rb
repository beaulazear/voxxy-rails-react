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

          # Calculate skipped count from errors
          skipped_count = generator.errors.count

          render json: {
            message: "Generated #{emails.count} scheduled emails",
            generated_count: emails.count,
            skipped_count: skipped_count,
            scheduled_emails: emails
          }, status: :created
        end

        # PATCH /api/v1/presents/events/:event_id/scheduled_emails/:id
        def update
          unless @scheduled_email.editable?
            render json: { error: "Cannot edit sent emails" }, status: :forbidden
            return
          end

          Rails.logger.info("📧 Updating scheduled email #{@scheduled_email.id}: #{@scheduled_email.name}")
          Rails.logger.info("📦 Update params: #{params[:scheduled_email].inspect}")
          Rails.logger.info("🔍 Trigger fields changed? #{trigger_fields_changed?}")

          # Recalculate scheduled_for if trigger fields are being updated
          if trigger_fields_changed?
            recalculate_scheduled_time
          end

          if @scheduled_email.update(scheduled_email_params)
            Rails.logger.info("✅ Email updated successfully. New scheduled_for: #{@scheduled_email.scheduled_for}")
            render json: @scheduled_email
          else
            Rails.logger.error("❌ Failed to update email: #{@scheduled_email.errors.full_messages}")
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
            recipient_name: registration.name,
            recipient_email: registration.email,
            subject: resolved[:subject],
            body: resolved[:body]
          }
        end

        private

        def set_event
          @event = Event.find_by(slug: params[:event_id])
          unless @event
            render json: { error: "Event not found" }, status: :not_found
          end
        end

        def set_scheduled_email
          @scheduled_email = @event.scheduled_emails.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Scheduled email not found" }, status: :not_found
        end

        def scheduled_email_params
          params.require(:scheduled_email).permit(
            :name, :subject_template, :body_template, :scheduled_for, :status,
            :trigger_type, :trigger_value, :trigger_time,
            filter_criteria: {}
          )
        end

        def trigger_fields_changed?
          email_params = params[:scheduled_email]
          return false unless email_params

          # Check if keys exist (not if values are present, since 0 is a valid value)
          email_params.key?(:trigger_type) ||
            email_params.key?(:trigger_value) ||
            email_params.key?(:trigger_time)
        end

        def recalculate_scheduled_time
          email_params = params[:scheduled_email]

          # Build a temporary object with the updated trigger values
          calculator = EmailScheduleCalculator.new(@event)

          # Use updated values if provided, otherwise use existing values
          trigger_type = email_params[:trigger_type] || @scheduled_email.trigger_type
          # Handle trigger_value properly - convert to integer if it's a string
          trigger_value = if email_params.key?(:trigger_value)
            email_params[:trigger_value].to_i
          else
            @scheduled_email.trigger_value
          end
          trigger_time = email_params[:trigger_time] || @scheduled_email.trigger_time

          Rails.logger.info("🧮 Recalculating scheduled_for with:")
          Rails.logger.info("   trigger_type: #{trigger_type}")
          Rails.logger.info("   trigger_value: #{trigger_value}")
          Rails.logger.info("   trigger_time: #{trigger_time}")
          Rails.logger.info("   event_date: #{@event.event_date}")
          Rails.logger.info("   application_deadline: #{@event.application_deadline}")

          # Create a simple object that responds to the calculator's needs
          temp_item = OpenStruct.new(
            trigger_type: trigger_type,
            trigger_value: trigger_value,
            trigger_time: trigger_time
          )

          # Calculate new scheduled time
          new_scheduled_for = calculator.calculate(temp_item)

          if new_scheduled_for
            # Add the calculated scheduled_for to params so it gets updated
            params[:scheduled_email][:scheduled_for] = new_scheduled_for
            Rails.logger.info("✨ Recalculated scheduled_for: #{new_scheduled_for} (was: #{@scheduled_email.scheduled_for})")
          else
            Rails.logger.warn("⚠️  Could not recalculate scheduled_for for email #{@scheduled_email.id}")
          end
        end
      end
    end
  end
end
