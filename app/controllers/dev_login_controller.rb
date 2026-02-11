# Development-only login bypass
# DO NOT USE IN PRODUCTION
class DevLoginController < ApplicationController
  skip_before_action :authorized

  def create
    unless Rails.env.development?
      return render json: { error: "This endpoint only works in development" }, status: :forbidden
    end

    # Find or create test user
    user = User.find_or_create_by!(email: "test-producer@voxxypresents.com") do |u|
      u.role = "venue_owner"
      u.name = "Test Producer"
      u.confirmed_at = Time.current
      # Don't set password - we're bypassing auth anyway
    end

    # Set password if it's not set or wrong
    user.update(password: "test123", password_confirmation: "test123") unless user.authenticate("test123")

    Rails.logger.info "🔧 [DEV] Auto-login for test user: #{user.email}"

    # Generate token
    token = JsonWebToken.encode(user_id: user.id)

    # Return full user payload with token (same as normal login)
    payload = UserSerializer.dashboard(user)

    render json: payload.merge("token" => token)
  end
end
