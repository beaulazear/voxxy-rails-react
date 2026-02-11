class SessionsController < ApplicationController
  skip_before_action :authorized, only: [ :create ]

  def create
    Rails.logger.info "🔐 [AUTH DEBUG] Login attempt - email: #{params[:email]}"
    Rails.logger.info "🔎 [AUTH DEBUG] Request Origin: #{request.headers['Origin']}"
    Rails.logger.info "🔎 [AUTH DEBUG] X-Mobile-App header: #{request.headers['X-Mobile-App']}"

    user = User.includes(
      activities: [
        :user, :participants, :activity_participants, :responses,
        { comments: :user },
        { pinned_activities: [ :votes, { comments: :user }, :voters ] }
      ]
    ).find_by(email: params[:email])

    if user&.authenticate(params[:password])
      Rails.logger.info "✅ [AUTH DEBUG] Authentication successful for user: #{user.email} (id: #{user.id})"

      session[:user_id] = user.id unless mobile_app_request?

      payload = UserSerializer.dashboard(user)

      if mobile_app_request?
        Rails.logger.info "📱 [AUTH DEBUG] Mobile app request - generating JWT token"
        token = JsonWebToken.encode(user_id: user.id)
        Rails.logger.info "🔑 [AUTH DEBUG] JWT token generated: #{token[0..20]}... (length: #{token.length})"
        render json: payload.merge("token" => token)
      else
        Rails.logger.info "🌐 [AUTH DEBUG] Web request - using session (session[:user_id] = #{session[:user_id]})"
        render json: payload
      end
    else
      Rails.logger.error "❌ [AUTH DEBUG] Authentication failed for email: #{params[:email]}"
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def destroy
    session.delete(:user_id)
    head :no_content
  end

  private

  def mobile_app_request?
    request.headers["X-Mobile-App"] == "true"
  end
end
