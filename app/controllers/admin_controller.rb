class AdminController < ApplicationController
  before_action :authorized
  before_action :admin_authorized

  def analytics
    # User statistics
    total_users = User.count
    confirmed_users = User.where.not(confirmed_at: nil).count
    unconfirmed_users = User.where(confirmed_at: nil).count

    # User engagement stats
    users_with_activities = User.joins(:activities).distinct.count
    users_with_push_enabled = User.where(push_notifications: true).where.not(push_token: nil).count

    # Recent user activity
    new_users_today = User.where("created_at >= ?", Time.current.beginning_of_day).count
    new_users_this_week = User.where("created_at >= ?", 1.week.ago).count
    new_users_this_month = User.where("created_at >= ?", 1.month.ago).count

    # Activity statistics
    activities_today = Activity.where("created_at >= ?", Time.current.beginning_of_day).count
    activities_this_week = Activity.where("created_at >= ?", 1.week.ago).count
    activities_this_month = Activity.where("created_at >= ?", 1.month.ago).count

    render json: {
      # Keep backward compatibility for frontend
      total_users: total_users,
      total_activities: Activity.count,
      activities_by_status: {
        collecting: Activity.where(active: true, finalized: false, completed: false).count,
        voting: Activity.joins(:responses).where(active: true, finalized: false, completed: false).having("COUNT(responses.id) > 0").group("activities.id").count.length,
        finalized: Activity.where(finalized: true, completed: false).count,
        completed: Activity.where(completed: true).count
      },
      # New enhanced analytics
      users: {
        total: total_users,
        confirmed: confirmed_users,
        unconfirmed: unconfirmed_users,
        confirmation_rate: total_users > 0 ? (confirmed_users.to_f / total_users * 100).round(2) : 0,
        with_activities: users_with_activities,
        with_push_notifications: users_with_push_enabled,
        engagement_rate: total_users > 0 ? (users_with_activities.to_f / total_users * 100).round(2) : 0
      },
      user_growth: {
        today: new_users_today,
        this_week: new_users_this_week,
        this_month: new_users_this_month
      },
      activities: {
        total: Activity.count,
        by_status: {
          collecting: Activity.where(active: true, finalized: false, completed: false).count,
          voting: Activity.joins(:responses).where(active: true, finalized: false, completed: false).having("COUNT(responses.id) > 0").group("activities.id").count.length,
          finalized: Activity.where(finalized: true, completed: false).count,
          completed: Activity.where(completed: true).count
        },
        by_type: Activity.group(:activity_type).count,
        recent: {
          today: activities_today,
          this_week: activities_this_week,
          this_month: activities_this_month
        }
      },
      platform_breakdown: User.where.not(platform: nil).group(:platform).count
    }
  end

  def admin_users
    begin
      admin_users_data = User.where(admin: true).select(:id, :name, :email)
      admin_users_count = User.where(admin: true).count
      render json: {
        total_admin_users: admin_users_count,
        admin_users: admin_users_data.map { |user| { name: user.name || "", email: user.email || "" } }
      }
    rescue => e
      render json: { error: "Failed to fetch admin users: #{e.message}" }, status: :internal_server_error
    end
  end

  def flagged_restaurants
    begin
      flagged_activities = UserActivity.flagged
                                      .includes(pinned_activity: { activity: :user })
                                      .includes(:user)
                                      .order(updated_at: :desc)

      flagged_data = flagged_activities.map do |user_activity|
        {
          id: user_activity.id,
          restaurant_name: user_activity.title,
          address: user_activity.address,
          description: user_activity.description,
          reason: user_activity.reason,
          website: user_activity.website,
          price_range: user_activity.price_range,
          hours: user_activity.hours,
          flagged_by: user_activity.user.name || user_activity.user.email,
          flagged_at: user_activity.updated_at,
          activity_host: user_activity.pinned_activity.activity.user.name || user_activity.pinned_activity.activity.user.email,
          activity_id: user_activity.pinned_activity.activity.id,
          pinned_activity_id: user_activity.pinned_activity.id
        }
      end

      render json: {
        total_flagged: flagged_activities.count,
        flagged_restaurants: flagged_data
      }
    rescue => e
      render json: { error: "Failed to fetch flagged restaurants: #{e.message}" }, status: :internal_server_error
    end
  end

  def user_breakdown
    # Get users with pagination
    page = params[:page].to_i > 0 ? params[:page].to_i : 1
    per_page = params[:per_page].to_i > 0 ? params[:per_page].to_i : 50

    # Allow filtering by confirmation status
    users_query = User.all

    if params[:confirmed] == "true"
      users_query = users_query.where.not(confirmed_at: nil)
    elsif params[:confirmed] == "false"
      users_query = users_query.where(confirmed_at: nil)
    end

    # Allow filtering by activity
    if params[:has_activities] == "true"
      users_query = users_query.joins(:activities).distinct
    elsif params[:has_activities] == "false"
      users_query = users_query.left_joins(:activities).where(activities: { id: nil })
    end

    # Allow filtering by push notifications
    if params[:push_enabled] == "true"
      users_query = users_query.where(push_notifications: true).where.not(push_token: nil)
    elsif params[:push_enabled] == "false"
      users_query = users_query.where("push_notifications = ? OR push_token IS NULL", false)
    end

    # Search by name or email
    if params[:search].present?
      search_term = "%#{params[:search].downcase}%"
      users_query = users_query.where("LOWER(name) LIKE ? OR LOWER(email) LIKE ?", search_term, search_term)
    end

    # Order by created_at desc by default
    users_query = users_query.order(created_at: :desc)

    # Paginate
    total_users = users_query.count
    users = users_query.offset((page - 1) * per_page).limit(per_page)

    # Get detailed user data
    user_data = users.map do |user|
      activities_count = user.activities.count
      participations_count = user.activity_participants.where(accepted: true).count

      {
        id: user.id,
        name: user.name,
        email: user.email,
        confirmed: user.confirmed_at.present?,
        confirmed_at: user.confirmed_at,
        created_at: user.created_at,
        admin: user.admin,
        role: user.role,
        platform: user.platform,
        push_enabled: user.push_notifications && user.push_token.present?,
        notification_preferences: {
          email: user.email_notifications,
          text: user.text_notifications,
          push: user.push_notifications
        },
        activity_stats: {
          hosted: activities_count,
          participated: participations_count,
          total: activities_count + participations_count
        },
        last_activity: user.activities.order(created_at: :desc).first&.created_at
      }
    end

    render json: {
      users: user_data,
      pagination: {
        current_page: page,
        per_page: per_page,
        total_pages: (total_users.to_f / per_page).ceil,
        total_users: total_users
      }
    }
  rescue => e
    render json: { error: "Failed to fetch user breakdown: #{e.message}" }, status: :internal_server_error
  end

  def unconfirmed_users
    # Get all unconfirmed users with details
    unconfirmed = User.where(confirmed_at: nil).order(created_at: :desc)

    # Group by time periods
    today = unconfirmed.where("created_at >= ?", Time.current.beginning_of_day)
    this_week = unconfirmed.where("created_at >= ?", 1.week.ago)
    older = unconfirmed.where("created_at < ?", 1.week.ago)

    render json: {
      summary: {
        total: unconfirmed.count,
        today: today.count,
        this_week: this_week.count,
        older: older.count
      },
      recent_unconfirmed: unconfirmed.limit(20).map do |user|
        {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          days_since_signup: (Time.current - user.created_at).to_i / 86400,
          has_activities: user.activities.exists?,
          invited_to_activities: user.activity_participants.exists?
        }
      end
    }
  rescue => e
    render json: { error: "Failed to fetch unconfirmed users: #{e.message}" }, status: :internal_server_error
  end

  private

  def admin_authorized
    render json: { error: "Admin access required" }, status: :forbidden unless @current_user&.admin?
  end
end
