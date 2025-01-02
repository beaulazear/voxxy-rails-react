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

    def index
      activities = Activity.all
      render json: activities
    end

    private

    def activity_params
      params.require(:activity).permit(:activity_name, :activity_type, :activity_location, :group_size, :date_notes)
    end
end
