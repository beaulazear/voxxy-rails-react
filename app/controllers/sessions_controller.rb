class SessionsController < ApplicationController
  skip_before_action :authorized, only: [ :create ]

  def create
    puts "🔎 Request Origin: #{request.headers['Origin']}"

    user = User.includes(
      activities: [
        :user, :participants, :activity_participants, :responses,
        { comments: :user },
        { pinned_activities: [ :votes, { comments: :user }, :voters ] }
      ]
    ).find_by(email: params[:email])

    if user&.authenticate(params[:password])
      session[:user_id] = user.id unless mobile_app_request?

      payload = UserSerializer.dashboard(user)

      if mobile_app_request?
        token = JsonWebToken.encode(user_id: user.id)
        render json: payload.merge("token" => token)
      else
        render json: payload
      end
    else
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
