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

  # GET /user_activities/community_feed
  # Returns recent favorites from community members
  # Optional params:
  #   - with_coordinates: true/false (filter to only include items with lat/lng)
  def community_feed
    # Get community members
    community_member_ids = current_user.community_member_ids

    # Return empty if no community
    if community_member_ids.empty?
      render json: []
      return
    end

    # Get recent favorites from community (last year, limit 50)
    @community_favorites = UserActivity
      .where(user_id: community_member_ids, favorited: true)
      .where("user_activities.created_at > ?", 1.year.ago)
      .includes(:user, pinned_activity: :activity)

    # Optional filter: only include items with coordinates
    if params[:with_coordinates] == "true"
      @community_favorites = @community_favorites
        .where.not(latitude: nil)
        .where.not(longitude: nil)
    end

    @community_favorites = @community_favorites
      .order(created_at: :desc)
      .limit(50)

    render json: @community_favorites.map { |fav|
      # Get the pinned_activity to access activity_type
      pinned_activity = fav.pinned_activity

      {
        id: fav.id,
        user: {
          id: fav.user.id,
          name: fav.user.name,
          avatar: fav.user.avatar,
          profile_image: fav.user.profile_pic_url,
          profile_pic_url: fav.user.profile_pic_url
        },
        favorite: {
          id: fav.id,
          title: fav.title,
          address: fav.address,
          latitude: fav.latitude,
          longitude: fav.longitude,
          price_range: fav.price_range,
          description: fav.description,
          photos: fav.photos,
          reviews: fav.reviews,
          hours: fav.hours,
          reason: fav.reason,
          website: fav.website,
          activity_type: pinned_activity&.activity&.activity_type
        },
        created_at: fav.created_at
      }
    }
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
