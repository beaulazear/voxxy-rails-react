class PinnedActivitiesController < ApplicationController
    before_action :authorized

    def create
      activity = Activity.find(params[:activity_id])
      pinned_activity = activity.pinned_activities.build(pinned_activity_params)

      if pinned_activity.save
        render json: pinned_activity, status: :created
      else
        render json: { errors: pinned_activity.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def index
      activity = Activity.find_by(id: params[:activity_id])

      if activity
        pinned_activities = activity.pinned_activities.includes(:comments, :votes)

        render json: pinned_activities.as_json(
          only: [ :id, :title, :hours, :price_range, :address, :description, :activity_id ],
          methods: [ :vote_count ],
          include: {
            comments: {
              only: [ :id, :content, :created_at ],
              include: {
                user: { only: [ :id, :name, :email, :avatar ] }
              }
            },
            voters: { only: [ :id, :name, :avatar ] }, # ✅ Include voters in the response
            votes: { only: [ :id, :user_id ] }
          }
        )
      else
        render json: { error: "Activity not found" }, status: :not_found
      end
    end

        def destroy
          activity = Activity.find_by(id: params[:activity_id])

          if activity
            pinned_activity = activity.pinned_activities.find_by(id: params[:id])

            if pinned_activity
              pinned_activity.destroy
              render json: { message: "Pinned activity deleted successfully" }, status: :ok
            else
              render json: { error: "Pinned activity not found" }, status: :not_found
            end
          else
            render json: { error: "Activity not found or unauthorized" }, status: :forbidden
          end
        end

    private

    def pinned_activity_params
      params.require(:pinned_activity).permit(:title, :hours, :price_range, :address, :description)
    end
end
