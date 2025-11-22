class PinnedActivitiesController < ApplicationController
  before_action :authorized
  before_action :set_activity
  before_action :authorize_activity_access

  def create
    Rails.logger.info("Pinned Activity Params: #{params[:pinned_activity].inspect}")
    pinned_activity = @activity.pinned_activities.build(pinned_activity_params)

    if pinned_activity.save
      # Enrich with Google Places data on creation
      enriched_pinned_activity = PinnedActivitySerializer.with_places_data(pinned_activity)
      render json: enriched_pinned_activity, status: :created
    else
      render json: { errors: pinned_activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def index
    pinned_activities = @activity.pinned_activities
                                 .includes(:comments, :votes, :voters)

    render json: PinnedActivitySerializer.list_for_activity(pinned_activities)
  end

  def destroy
    pinned_activity = @activity.pinned_activities.find_by(id: params[:id])

    if pinned_activity
      pinned_activity.destroy
      render json: { message: "Pinned activity deleted successfully" }, status: :ok
    else
      render json: { error: "Pinned activity not found" }, status: :not_found
    end
  end

  private

  def set_activity
    @activity = Activity.find_by(id: params[:activity_id])

    unless @activity
      render json: { error: "Activity not found" }, status: :not_found
    end
  end

  # Security: Verify user is owner or participant of the activity
  def authorize_activity_access
    return unless @activity # set_activity already handled the error

    is_owner = @activity.user_id == current_user.id
    is_participant = @activity.participants.exists?(id: current_user.id) ||
                     @activity.activity_participants.exists?(invited_email: current_user.email)

    unless is_owner || is_participant
      render json: { error: "Not authorized to access this activity" }, status: :forbidden
    end
  end

  def pinned_activity_params
    params.require(:pinned_activity).permit(
      :title, :hours, :price_range, :selected, :address,
      :description, :reason, :website, :latitude, :longitude
      # Remove photos and reviews from params - we'll fetch them automatically
    )
  end
end
