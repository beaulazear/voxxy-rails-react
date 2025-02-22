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
        render json: activity.to_json(include: [ :participants, :activity_participants ]), status: :ok
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
      activities = current_user.activities.includes(:user, :responses, :activity_participants, :participants)

      render json: activities.as_json(
        only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji, :user_id ],
        include: {
          user: { only: [ :id, :name, :email ] },
          responses: { only: [ :id, :notes, :created_at ] },
          activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] },
          participants: { only: [ :id, :name, :email ] }
        }
      )
    end

    def show
      activity = Activity.includes(:user, :responses, :activity_participants, :participants).find_by(id: params[:id])

      if activity
        render json: activity.as_json(
          only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji, :user_id ], # 👈 Ensure `user_id` is included
          include: {
            user: { only: [ :id, :name, :email ] }, # 👈 Include the host details
            responses: { only: [ :id, :notes, :created_at ] },
            activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] },
            participants: { only: [ :id, :name, :email ] }
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
