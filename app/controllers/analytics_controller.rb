class AnalyticsController < ApplicationController
  skip_before_action :authorized

  def track
    event_name = params[:event]
    properties = params[:properties] || {}

    if current_user
      properties[:user_id] = current_user.id
      properties[:user_email] = current_user.email
      properties[:user_name] = current_user.name
    end

    MixpanelService.track(event_name, properties)

    render json: { status: "success" }, status: :ok
  rescue => e
    Rails.logger.error "Analytics tracking error: #{e.message}"
    render json: { status: "error", message: e.message }, status: :internal_server_error
  end

  def identify
    return render json: { status: "error", message: "User not authenticated" }, status: :unauthorized unless current_user

    properties = {
      "$name" => current_user.name,
      "$email" => current_user.email,
      "created_at" => current_user.created_at,
      "confirmed_at" => current_user.confirmed_at
    }

    MixpanelService.identify(current_user.id, properties)

    if params[:track_login]
      MixpanelService.track("User Logged In", {
        user_id: current_user.id,
        email: current_user.email,
        name: current_user.name
      })
    end

    render json: { status: "success" }, status: :ok
  rescue => e
    Rails.logger.error "Analytics identify error: #{e.message}"
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
