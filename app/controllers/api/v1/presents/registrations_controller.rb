module Api
  module V1
    module Presents
      class RegistrationsController < BaseController
        skip_before_action :authorized, only: [ :create, :track ]
        skip_before_action :check_presents_access, only: [ :create, :track ]
        before_action :set_event, only: [ :index, :create ]
        before_action :set_registration, only: [ :show, :update ]

        # GET /api/v1/presents/events/:event_id/registrations
        def index
          # Only event owner can see registrations
          unless @event.organization.user_id == @current_user.id || @current_user.admin?
            return render json: { error: "Not authorized" }, status: :forbidden
          end

          registrations = @event.registrations.includes(:user)
          registrations = registrations.confirmed if params[:status] == "confirmed"
          registrations = registrations.pending if params[:status] == "pending"

          serialized = registrations.map do |registration|
            RegistrationSerializer.new(registration, include_user: true).as_json
          end

          render json: serialized, status: :ok
        end

        # POST /api/v1/presents/events/:event_id/registrations
        def create
          # Check if this is a vendor application submission
          if registration_params[:vendor_application_id].present?
            vendor_app = VendorApplication.find_by(id: registration_params[:vendor_application_id])

            unless vendor_app && vendor_app.event_id == @event.id
              return render json: { error: "Invalid vendor application" },
                            status: :unprocessable_entity
            end

            unless vendor_app.accepting_submissions?
              return render json: { error: "This vendor application is not accepting submissions" },
                            status: :unprocessable_entity
            end

            # Vendor applications start as pending
            registration = @event.registrations.build(registration_params)
            registration.user = @current_user if @current_user
            registration.status = "pending"
          else
            # Regular event registration
            unless @event.registration_open?
              return render json: { error: "Registration is closed for this event" },
                            status: :unprocessable_entity
            end

            if @event.full?
              return render json: { error: "Event is at capacity" },
                            status: :unprocessable_entity
            end

            registration = @event.registrations.build(registration_params)
            registration.user = @current_user if @current_user
            registration.status = "confirmed"
          end

          if registration.save
            # Confirmation email sent via after_create callback in Registration model

            serialized = RegistrationSerializer.new(registration, include_event: true).as_json
            render json: serialized, status: :created
          else
            render json: { errors: registration.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # GET /api/v1/presents/registrations/:id
        def show
          serialized = RegistrationSerializer.new(@registration, include_event: true).as_json
          render json: serialized, status: :ok
        end

        # PATCH/PUT /api/v1/presents/registrations/:id
        def update
          if @registration.update(update_params)
            serialized = RegistrationSerializer.new(@registration, include_event: true).as_json
            render json: serialized, status: :ok
          else
            render json: { errors: @registration.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # GET /api/v1/presents/registrations/track/:ticket_code
        # Public endpoint to track application status
        def track
          registration = Registration.find_by!(ticket_code: params[:ticket_code])

          serialized = RegistrationSerializer.new(registration, include_event: true).as_json
          render json: serialized, status: :ok
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Application not found" }, status: :not_found
        end

        private

        def set_event
          @event = Event.find_by!(slug: params[:event_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Event not found" }, status: :not_found
        end

        def set_registration
          @registration = Registration.find(params[:id])

          # Check ownership: registration owner, event owner, or admin
          is_registration_owner = @registration.user_id == @current_user&.id
          is_event_owner = @registration.event.organization.user_id == @current_user&.id
          is_admin = @current_user&.admin?

          unless is_registration_owner || is_event_owner || is_admin
            render json: { error: "Not authorized" }, status: :forbidden
          end
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Registration not found" }, status: :not_found
        end

        def registration_params
          params.require(:registration).permit(
            :email,
            :name,
            :phone,
            :subscribed,
            :business_name,
            :vendor_category,
            :vendor_application_id
          )
        end

        def update_params
          params.require(:registration).permit(:name, :phone, :status)
        end
      end
    end
  end
end
