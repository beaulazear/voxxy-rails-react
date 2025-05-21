class ApplicationController < ActionController::API
  include ActionController::Cookies
  include JsonWebToken

  before_action :authorized
  skip_before_action :authorized, only: [ :test ]

  def test
    render json: { message: "API is working", cookies: cookies.to_hash }
  end

  def authorized
    if request.headers["Authorization"].present?
      token = request.headers["Authorization"].split(" ").last
      decoded = JsonWebToken.decode(token)
      @current_user = User.find_by(id: decoded[:user_id]) if decoded
    else
      @current_user = User.find_by(id: session[:user_id])
    end

    render json: { error: "Not authorized" }, status: :unauthorized unless @current_user
  end

  def current_user
    return @current_user if defined?(@current_user)

    if request.headers["Authorization"].present?
      token = request.headers["Authorization"].split(" ").last
      decoded = JsonWebToken.decode(token)
      @current_user = User.find_by(id: decoded[:user_id]) if decoded
    else
      @current_user = User.find_by(id: session[:user_id])
    end
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
