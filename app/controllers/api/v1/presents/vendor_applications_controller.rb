module Api
  module V1
    module Presents
      class VendorApplicationsController < BaseController
        skip_before_action :authorized, only: [ :lookup_by_code ]
        skip_before_action :check_presents_access, only: [ :lookup_by_code ]
        before_action :require_venue_owner, only: [ :create, :update, :destroy ]
        before_action :set_event, only: [ :index, :create ]
        before_action :set_vendor_application, only: [ :show, :update, :destroy, :submissions ]

        # GET /api/v1/presents/events/:event_slug/vendor_applications
        def index
          applications = @event.vendor_applications.recent

          serialized = applications.map do |application|
            VendorApplicationSerializer.new(application, include_event: false).as_json
          end

          render json: serialized, status: :ok
        end

        # GET /api/v1/presents/vendor_applications/:id
        def show
          serialized = VendorApplicationSerializer.new(
            @vendor_application,
            include_event: true
          ).as_json

          render json: serialized, status: :ok
        end

        # POST /api/v1/presents/events/:event_slug/vendor_applications
        def create
          application = @event.vendor_applications.build(vendor_application_params)

          if application.save
            serialized = VendorApplicationSerializer.new(application, include_event: true).as_json
            render json: serialized, status: :created
          else
            render json: { errors: application.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/presents/vendor_applications/:id
        def update
          if @vendor_application.update(vendor_application_params)
            serialized = VendorApplicationSerializer.new(@vendor_application, include_event: true).as_json
            render json: serialized, status: :ok
          else
            render json: { errors: @vendor_application.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/vendor_applications/:id
        def destroy
          @vendor_application.destroy
          head :no_content
        end

        # GET /api/v1/presents/vendor_applications/:id/submissions
        def submissions
          registrations = @vendor_application.registrations

          # Filter by category if provided
          if params[:category].present?
            registrations = registrations.by_category(params[:category])
          end

          # Filter by status if provided
          if params[:status].present?
            registrations = registrations.where(status: params[:status])
          end

          # Order by most recent first
          registrations = registrations.order(created_at: :desc)

          serialized = registrations.map do |registration|
            RegistrationSerializer.new(registration).as_json
          end

          render json: serialized, status: :ok
        end

        # GET /api/v1/presents/vendor_applications/lookup/:code
        # Public endpoint to lookup application by shareable code
        def lookup_by_code
          vendor_app = VendorApplication.find_by!(shareable_code: params[:code])

          # Load the event with the application
          event = vendor_app.event
          serialized = EventSerializer.new(
            event,
            include_organization: true,
            include_vendor_application: true
          ).as_json

          render json: serialized, status: :ok
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Application not found" }, status: :not_found
        end

        private

        def set_event
          @event = Event.find_by!(slug: params[:event_id])

          # Check ownership
          unless @event.organization.user_id == @current_user.id || @current_user.admin?
            render json: { error: "Not authorized" }, status: :forbidden
            nil
          end
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Event not found" }, status: :not_found
        end

        def set_vendor_application
          @vendor_application = VendorApplication.find(params[:id])

          # Check ownership for update/destroy
          if action_name.in?([ "update", "destroy", "submissions" ])
            unless @vendor_application.event.organization.user_id == @current_user.id || @current_user.admin?
              render json: { error: "Not authorized" }, status: :forbidden
              nil
            end
          end
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Vendor application not found" }, status: :not_found
        end

        def vendor_application_params
          params.require(:vendor_application).permit(
            :name,
            :description,
            :status,
            :booth_price,
            :install_date,
            :install_start_time,
            :install_end_time,
            :payment_link,
            :application_tags,
            categories: []
          )
        end
      end
    end
  end
end
