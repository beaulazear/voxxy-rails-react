module Api
  module V1
    module Presents
      class EventsController < BaseController
        skip_before_action :authorized, only: [ :index, :show ]
        skip_before_action :check_presents_access, only: [ :index, :show ]
        before_action :set_current_user_optional, only: [ :index, :show ]
        before_action :require_venue_owner, only: [ :create, :update, :destroy ]
        before_action :set_event, only: [ :show, :update, :destroy ]

        # GET /api/v1/presents/events
        # GET /api/v1/presents/organizations/:organization_id/events
        def index
          events = Event.includes(:organization)

          # Support nested route (events under organization)
          if params[:organization_id]
            organization = Organization.find_by!(slug: params[:organization_id])
            Rails.logger.info "=== Events Index Debug ==="
            Rails.logger.info "Organization: #{organization.inspect}"
            Rails.logger.info "Current User: #{@current_user&.id}"
            Rails.logger.info "Organization User ID: #{organization.user_id}"

            events = events.where(organization_id: organization.id)
            Rails.logger.info "Events for org (before published filter): #{events.pluck(:id, :title, :published)}"

            # Show all events (including unpublished) to the organization owner
            is_owner = @current_user && organization.user_id == @current_user.id
            Rails.logger.info "Is Owner: #{is_owner}"
            Rails.logger.info "Is Admin: #{@current_user&.admin?}"

            events = events.published unless @current_user&.admin? || is_owner
            Rails.logger.info "Events after published filter: #{events.pluck(:id, :title, :published)}"
          else
            # For general event list, only show published events unless admin
            events = events.published unless @current_user&.admin?
          end

          # Filter by status
          events = case params[:status]
          when "upcoming"
                     events.upcoming
          when "past"
                     events.past
          else
                     events.order(event_date: :desc)
          end

          serialized = events.map do |event|
            EventSerializer.new(event, include_organization: true).as_json
          end

          render json: serialized, status: :ok
        end

        # GET /api/v1/presents/events/:id
        def show
          serialized = EventSerializer.new(
            @event,
            include_organization: true,
            include_vendor_application: true
          ).as_json
          render json: serialized, status: :ok
        end

        # POST /api/v1/presents/organizations/:organization_id/events
        def create
          organization = @current_user.organizations.find_by!(slug: params[:organization_id])
          event = organization.events.build(event_params)

          if event.save
            serialized = EventSerializer.new(event, include_organization: true).as_json
            render json: serialized, status: :created
          else
            render json: { errors: event.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/presents/events/:id
        def update
          if @event.update(event_params)
            serialized = EventSerializer.new(@event, include_organization: true).as_json
            render json: serialized, status: :ok
          else
            render json: { errors: @event.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/events/:id
        def destroy
          @event.destroy
          head :no_content
        end

        private

        def set_current_user_optional
          # Set @current_user if token is present, but don't require it
          return unless request.headers["Authorization"].present?

          token = request.headers["Authorization"].split(" ").last
          decoded = JsonWebToken.decode(token)
          @current_user = User.find_by(id: decoded[:user_id]) if decoded
        rescue
          # If token is invalid, just set @current_user to nil
          @current_user = nil
        end

        def set_event
          @event = Event.find_by!(slug: params[:id])

          # Check ownership for update/destroy
          if action_name.in?([ "update", "destroy" ])
            unless @event.organization.user_id == @current_user.id || @current_user.admin?
              render json: { error: "Not authorized" }, status: :forbidden
            end
          end
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Event not found" }, status: :not_found
        end

        def event_params
          params.require(:event).permit(
            :title, :description, :event_date, :event_end_date, :location,
            :poster_url, :ticket_url, :ticket_price, :capacity,
            :published, :registration_open, :status
          )
        end
      end
    end
  end
end
