module Api
  module V1
    module Presents
      class BulletinsController < BaseController
        before_action :set_event, only: [ :index, :create ]
        before_action :set_bulletin, only: [ :show, :update, :destroy, :toggle_pin, :mark_read ]
        before_action :require_venue_owner, only: [ :create, :update, :destroy, :toggle_pin ]
        skip_before_action :authorized, only: [ :index, :show, :mark_read ]
        skip_before_action :check_presents_access, only: [ :index, :show, :mark_read ]

        # GET /api/v1/presents/events/:event_slug/bulletins
        def index
          bulletins = @event.bulletins.for_display

          render json: {
            bulletins: bulletins.map { |b|
              BulletinSerializer.new(b, current_user_email: current_user_email).as_json
            }
          }
        end

        # GET /api/v1/presents/bulletins/:id
        def show
          render json: {
            bulletin: BulletinSerializer.new(@bulletin, current_user_email: current_user_email).as_json
          }
        end

        # POST /api/v1/presents/events/:event_slug/bulletins
        def create
          bulletin = @event.bulletins.build(bulletin_params)
          bulletin.author = @current_user

          if bulletin.save
            render json: {
              bulletin: BulletinSerializer.new(bulletin).as_json
            }, status: :created
          else
            render json: {
              error: "Failed to create bulletin",
              errors: bulletin.errors.full_messages
            }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/presents/bulletins/:id
        def update
          if @bulletin.update(bulletin_params)
            render json: {
              bulletin: BulletinSerializer.new(@bulletin).as_json
            }
          else
            render json: {
              error: "Failed to update bulletin",
              errors: @bulletin.errors.full_messages
            }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/bulletins/:id
        def destroy
          @bulletin.destroy
          head :no_content
        end

        # POST /api/v1/presents/bulletins/:id/toggle_pin
        def toggle_pin
          @bulletin.update(pinned: !@bulletin.pinned)
          render json: {
            bulletin: BulletinSerializer.new(@bulletin).as_json
          }
        end

        # POST /api/v1/presents/bulletins/:id/mark_read
        def mark_read
          user_or_email = @current_user || current_user_email

          if user_or_email
            @bulletin.mark_read_by(user_or_email)
            render json: { success: true }
          else
            render json: { error: "No user context available" }, status: :unauthorized
          end
        end

        private

        def set_event
          @event = Event.find_by!(slug: params[:event_slug] || params[:event_id])
        end

        def set_bulletin
          @bulletin = Bulletin.find(params[:id])
        end

        def bulletin_params
          params.require(:bulletin).permit(:subject, :body, :bulletin_type, :pinned)
        end

        def current_user_email
          # Try to get email from session, query params, or current user
          params[:email] || session[:vendor_email] || @current_user&.email
        end
      end
    end
  end
end
