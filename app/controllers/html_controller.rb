# app/controllers/html_controller.rb
class HtmlController < ActionController::Base
  include ActionController::Cookies
  include JsonWebToken  # Add JWT support

  before_action :authorized

  # Skip CSRF for mobile requests (when JWT token is present)
  skip_before_action :verify_authenticity_token,
    if: -> { request.headers["Authorization"].present? }

  private

  def authorized
    # Check for mobile JWT token first
    if request.headers["Authorization"].present?
      token = request.headers["Authorization"].split(" ").last
      decoded = JsonWebToken.decode(token)
      @current_user = User.find_by(id: decoded[:user_id]) if decoded
    else
      # Fall back to web session authentication
      @current_user = User.find_by(id: session[:user_id]) if session.include?(:user_id)
    end

    render json: { error: "Not authorized" }, status: :unauthorized unless @current_user
  end

  def current_user
    return @current_user if defined?(@current_user)

    # Same dual authentication logic
    if request.headers["Authorization"].present?
      token = request.headers["Authorization"].split(" ").last
      decoded = JsonWebToken.decode(token)
      @current_user = User.find_by(id: decoded[:user_id]) if decoded
    else
      @current_user = User.find_by(id: session[:user_id])
    end
  end
end
