class PinnedActivitiesController < ApplicationController
  before_action :authorized

  def create
    Rails.logger.info("Pinned Activity Params: #{params[:pinned_activity].inspect}")
    activity = Activity.find(params[:activity_id])
    pinned_activity = activity.pinned_activities.build(pinned_activity_params)

    if pinned_activity.save
      # Send push notification to activity participants about new venue suggestion
      PushNotificationService.send_venue_suggestion_notification(pinned_activity)
      
      # Enrich with Google Places data on creation
      enriched_pinned_activity = PinnedActivitySerializer.with_places_data(pinned_activity)
      render json: enriched_pinned_activity, status: :created
    else
      render json: { errors: pinned_activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def index
    activity = Activity.find_by(id: params[:activity_id])

    if activity
      pinned_activities = activity.pinned_activities
                                 .includes(:comments, :votes, :voters)

      render json: PinnedActivitySerializer.list_for_activity(pinned_activities)
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
      :title, :hours, :price_range, :selected, :address,
      :description, :reason, :website
      # Remove photos and reviews from params - we'll fetch them automatically
    )
  end
end
