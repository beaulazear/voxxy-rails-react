class ApplicationController < ActionController::API
  include ActionController::Cookies

  before_action :authorized

  def authorized
    render json: { error: "Not authorized" }, status: :unauthorized unless session.include?(:user_id)
  end

  def current_user
    @current_user = User.find_by(id: session[:user_id])
  end

  private

  def frontend_host
    if Rails.env.production?
      "https://www.voxxyai.com/"
    else
      "http://localhost:3000/"
    end
  end
end
