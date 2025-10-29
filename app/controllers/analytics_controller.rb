class AnalyticsController < ApplicationController
  skip_before_action :authorized

  def track
    event_name = params[:event]
    properties = params[:properties] || {}

    Rails.logger.info "📊 Analytics track: event='#{event_name}', properties=#{properties.inspect}, user=#{current_user&.id || 'anonymous'}"

    if current_user
      properties[:user_id] = current_user.id
      properties[:user_email] = current_user.email
      properties[:user_name] = current_user.name
    else
      Rails.logger.debug "Analytics track: No authenticated user, tracking as anonymous"
    end

    MixpanelService.track(event_name, properties)

    render json: { status: "success" }, status: :ok
  rescue => e
    Rails.logger.error "❌ Analytics tracking error: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    render json: { status: "error", message: e.message }, status: :internal_server_error
  end

  def identify
    return render json: { status: "error", message: "User not authenticated" }, status: :unauthorized unless current_user

    Rails.logger.info "📊 Analytics identify: user=#{current_user.id}, track_login=#{params[:track_login]}"

    properties = {
      "$name" => current_user.name,
      "$email" => current_user.email,
      "created_at" => current_user.created_at,
      "confirmed_at" => current_user.confirmed_at
    }

    MixpanelService.identify(current_user.id, properties)

    if params[:track_login]
      Rails.logger.info "📊 Tracking 'User Logged In' event for user #{current_user.id}"
      MixpanelService.track("User Logged In", {
        user_id: current_user.id,
        email: current_user.email,
        name: current_user.name
      })
    end

    render json: { status: "success" }, status: :ok
  rescue => e
    Rails.logger.error "❌ Analytics identify error: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    render json: { status: "error", message: e.message }, status: :internal_server_error
  end

  def page_view
    page_name = params[:page]
    properties = params[:properties] || {}

    if current_user
      properties[:user_id] = current_user.id
    end

    MixpanelService.track("#{page_name} Page Loaded", properties)

    render json: { status: "success" }, status: :ok
  rescue => e
    Rails.logger.error "Analytics page view error: #{e.message}"
    render json: { status: "error", message: e.message }, status: :internal_server_error
  end
end
