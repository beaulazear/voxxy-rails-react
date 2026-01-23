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

  def presents_analytics
    # Voxxy Presents specific analytics

    # User statistics (Presents users only)
    presents_users = User.where(role: ['vendor', 'venue_owner', 'producer'])
    total_presents_users = presents_users.count
    producers_count = User.where(role: ['venue_owner', 'producer']).count
    vendors_count = User.where(role: 'vendor').count

    # Event statistics
    total_events = Event.count
    today = Date.today
    active_events = Event.where('event_date >= ?', today).count
    past_events = Event.where('event_date < ?', today).count
    upcoming_events = Event.where('event_date > ?', today).count
    events_today = Event.where(event_date: today).count

    # Event status breakdown
    draft_events = Event.where(published: false).count
    published_events = Event.where(published: true).count

    # Organization statistics
    total_orgs = Organization.count
    verified_orgs = Organization.where(verified: true).count

    # Registration (vendor application) statistics
    total_registrations = Registration.count
    pending_registrations = Registration.where(status: 'pending').count
    approved_registrations = Registration.where(status: 'approved').count
    rejected_registrations = Registration.where(status: 'rejected').count

    # Top event creators (users with most events via their organizations)
    top_creators = User.joins(:organizations)
                      .joins('INNER JOIN events ON events.organization_id = organizations.id')
                      .group('users.id', 'users.name', 'users.email', 'users.role')
                      .select('users.id, users.name, users.email, users.role, COUNT(events.id) as events_count')
                      .order('events_count DESC')
                      .limit(10)
                      .map do |user|
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        events_count: user.events_count
      }
    end

    # Users with event counts (all presents users)
    users_with_events = presents_users.left_joins(:organizations)
                                      .left_joins('LEFT JOIN events ON events.organization_id = organizations.id')
                                      .group('users.id', 'users.name', 'users.email', 'users.role', 'users.confirmed_at', 'users.created_at')
                                      .select('users.*, COUNT(DISTINCT events.id) as events_count')
                                      .order('events_count DESC')
                                      .map do |user|
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        confirmed_at: user.confirmed_at,
        created_at: user.created_at,
        events_count: user.events_count || 0
      }
    end

    # Recent events
    recent_events = Event.order(created_at: :desc).limit(5).map do |event|
      {
        id: event.id,
        title: event.title,
        slug: event.slug,
        event_date: event.event_date,
        published: event.published,
        registered_count: event.registered_count,
        created_at: event.created_at,
        organization_name: event.organization&.name
      }
    end

    render json: {
      users: {
        total: total_presents_users,
        producers: producers_count,
        vendors: vendors_count
      },
      events: {
        total: total_events,
        active: active_events,
        past: past_events,
        upcoming: upcoming_events,
        today: events_today,
        draft: draft_events,
        published: published_events
      },
      organizations: {
        total: total_orgs,
        verified: verified_orgs
      },
      registrations: {
        total: total_registrations,
        pending: pending_registrations,
        approved: approved_registrations,
        rejected: rejected_registrations
      },
      top_creators: top_creators,
      users_with_events: users_with_events,
      recent_events: recent_events
    }
  rescue => e
    Rails.logger.error "Failed to fetch presents analytics: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    render json: { error: "Failed to fetch analytics: #{e.message}" }, status: :internal_server_error
  end

  private

  def admin_authorized
    render json: { error: "Admin access required" }, status: :forbidden unless @current_user&.admin?
  end
end
