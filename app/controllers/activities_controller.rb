class ActivitiesController < ApplicationController
    before_action :authorized

    def create
      activity = current_user.activities.build(activity_params)
      if activity.save
        render json: activity, status: :created
      else
        render json: { errors: activity.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      activity = current_user.activities.find_by(id: params[:id])
      if activity.update(activity_params)
        render json: activity, status: :ok
      else
        render json: { error: activity.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      activity = current_user.activities.find_by(id: params[:id])
      if activity
        activity.destroy
        render json: { message: "Activity deleted" }, status: :ok
      else
        render json: { message: "Not Found" }, status: :not_found
      end
    end

    def index
      activities = current_user.activities.all
      render json: activities
    end

    def show
      activity = current_user.activities.includes(:responses).find_by(id: params[:id])

      if activity
        render json: activity.as_json(
          include: {
            responses: { only: [ :id, :notes, :created_at ] }
          }
        )
      else
        render json: { error: "Not found" }, status: :not_found
      end
    end

    private

    def activity_params
      params.require(:activity).permit(:activity_name, :activity_type, :activity_location, :group_size, :date_notes, :active, :emoji)
    end
end
