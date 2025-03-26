class PinnedActivitiesController < ApplicationController
  before_action :authorized

  def create
    Rails.logger.info("Pinned Activity Params: #{params[:pinned_activity].inspect}")
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
        only: [
          :id,
          :title,
          :hours,
          :price_range,
          :address,
          :description,
          :activity_id,
          :reviews,
          :photos,
          :reason,
          :website
        ],
        methods: [ :vote_count ],
        include: {
          comments: {
            only: [ :id, :content, :created_at ],
            include: {
              user: { only: [ :id, :name, :email, :avatar ] }
            }
          },
          voters: { only: [ :id, :name, :avatar ] },
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
    params.require(:pinned_activity).permit(
      :title,
      :hours,
      :price_range,
      :address,
      :description,
      :reason,
      :website,
      reviews: [
        :author_name,
        :author_url,
        :language,
        :original_language,
        :profile_photo_url,
        :rating,
        :relative_time_description,
        :text,
        :time,
        :translated
      ],
      photos: [
        :height,
        :html_attributions,
        :photo_reference,
        :width
      ]
    )
  end
end
