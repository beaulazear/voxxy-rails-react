class PinnedActivitiesController < ApplicationController
    before_action :authorized

    def create
      activity = current_user.activities.find(params[:activity_id])
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
          pinned_activities = activity.pinned_activities.includes(:comments)

          render json: pinned_activities.as_json(
            only: [ :id, :title, :hours, :price_range, :address, :votes, :description ],
            include: {
              comments: {
                only: [ :id, :content, :created_at ],
                include: {
                  user: { only: [ :id, :name, :email ] } # Includes the commenter's name and email
                }
              }
            }
          )
        else
          render json: { error: "Activity not found" }, status: :not_found
        end
      end

    private

    def pinned_activity_params
      params.require(:pinned_activity).permit(:title, :hours, :price_range, :address, :votes, :description)
    end
end
