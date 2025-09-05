class UserActivitiesController < ApplicationController
  before_action :authorized
  before_action :set_pinned_activity, only: [ :toggle_flag, :toggle_favorite ]
  before_action :set_user_activity, only: [ :toggle_flag, :toggle_favorite ]

  # GET /user_activities
  # Returns all user activities for the current user
  def index
    # Get blocked user IDs
    blocked_user_ids = current_user.blocked_users.pluck(:id)

    # Filter out activities from blocked users
    user_activities = current_user.user_activities
                                  .includes(pinned_activity: { activity: :user })
                                  .where.not(pinned_activities: { activities: { user_id: blocked_user_ids } })

    render json: UserActivitySerializer.collection(user_activities)
  end

  # GET /user_activities/flagged
  # Returns only flagged activities
  def flagged
    # Get blocked user IDs
    blocked_user_ids = current_user.blocked_users.pluck(:id)

    # Filter out activities from blocked users
    flagged_activities = current_user.user_activities
                                     .flagged
                                     .includes(pinned_activity: { activity: :user })
                                     .where.not(pinned_activities: { activities: { user_id: blocked_user_ids } })

    render json: UserActivitySerializer.collection(flagged_activities)
  end

  # GET /user_activities/favorited
  # Returns only favorited activities
  def favorited
    # Get blocked user IDs
    blocked_user_ids = current_user.blocked_users.pluck(:id)

    # Filter out activities from blocked users
    favorited_activities = current_user.user_activities
                                       .favorited
                                       .includes(pinned_activity: { activity: :user })
                                       .where.not(pinned_activities: { activities: { user_id: blocked_user_ids } })

    render json: UserActivitySerializer.collection(favorited_activities)
  end

  # POST /pinned_activities/:pinned_activity_id/toggle_flag
  # Toggles the flag status for a pinned activity
  def toggle_flag
    if @user_activity.toggle_flag!
      render json: UserActivitySerializer.single(@user_activity), status: :ok
    else
      render json: { errors: @user_activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /pinned_activities/:pinned_activity_id/toggle_favorite
  # Toggles the favorite status for a pinned activity
  def toggle_favorite
    if @user_activity.toggle_favorite!
      render json: UserActivitySerializer.single(@user_activity), status: :ok
    else
      render json: { errors: @user_activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /user_activities/:id
  # Removes a user activity (unflag and unfavorite)
  def destroy
    user_activity = current_user.user_activities.find(params[:id])

    if user_activity.destroy
      render json: { message: "User activity removed successfully" }, status: :ok
    else
      render json: { errors: user_activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_pinned_activity
    @pinned_activity = PinnedActivity.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Pinned activity not found" }, status: :not_found
  end

  def set_user_activity
    @user_activity = UserActivity.find_or_create_for_user_and_pinned_activity(
      current_user,
      @pinned_activity
    )
  end
end
