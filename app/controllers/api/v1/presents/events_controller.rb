module Api
  module V1
    module Presents
      class EventsController < BaseController
        skip_before_action :authorized, only: [ :index, :show ]
        skip_before_action :check_presents_access, only: [ :index, :show ]
        before_action :require_venue_owner, only: [ :create, :update, :destroy ]
        before_action :set_event, only: [ :show, :update, :destroy ]

        # GET /api/v1/presents/events
        # GET /api/v1/presents/organizations/:organization_id/events
        def index
          events = Event.includes(:organization)
          events = events.published unless @current_user&.admin?

          # Support nested route (events under organization)
          if params[:organization_id]
            organization = Organization.find_by!(slug: params[:organization_id])
            events = events.where(organization_id: organization.id)
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
          serialized = EventSerializer.new(@event, include_organization: true).as_json
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
