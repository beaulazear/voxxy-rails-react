class ApplicationController < ActionController::API
  include ActionController::Cookies
  include ActionController::MimeResponds
  include JsonWebToken

  before_action :set_robots_header
  before_action :authorized
  skip_before_action :authorized, only: [ :test ]

  def test
    render json: { message: "API is working", cookies: cookies.to_hash }
  end

  def authorized
    Rails.logger.info "🔐 [AUTH DEBUG] Starting authorization check"
    Rails.logger.info "🔐 [AUTH DEBUG] Request path: #{request.method} #{request.path}"

    if request.headers["Authorization"].present?
      Rails.logger.info "✅ [AUTH DEBUG] Authorization header present"
      token = request.headers["Authorization"].split(" ").last
      Rails.logger.info "🔍 [AUTH DEBUG] Token extracted: #{token[0..20]}... (length: #{token.length})"

      decoded = JsonWebToken.decode(token)
      Rails.logger.info "🔓 [AUTH DEBUG] Token decoded: #{decoded.inspect}"

      @current_user = User.find_by(id: decoded[:user_id]) if decoded

      if @current_user
        Rails.logger.info "✅ [AUTH DEBUG] User found: #{@current_user.email} (id: #{@current_user.id})"
      elsif decoded
        Rails.logger.error "❌ [AUTH DEBUG] Token valid but user not found (user_id: #{decoded[:user_id]})"
      else
        Rails.logger.error "❌ [AUTH DEBUG] Token decode failed"
      end
    else
      Rails.logger.warn "⚠️ [AUTH DEBUG] No Authorization header - checking session"
      @current_user = User.find_by(id: session[:user_id])

      if @current_user
        Rails.logger.info "✅ [AUTH DEBUG] User found in session: #{@current_user.email}"
      else
        Rails.logger.warn "⚠️ [AUTH DEBUG] No user in session (session[:user_id] = #{session[:user_id].inspect})"
      end
    end

    unless @current_user
      Rails.logger.error "❌ [AUTH DEBUG] Authorization failed - no current user"
      render json: { error: "Not authorized" }, status: :unauthorized
    else
      Rails.logger.info "✅ [AUTH DEBUG] Authorization successful"
    end
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

  def set_robots_header
    # Block search engines on staging domain (voxxyai.com)
    if request.host == "voxxyai.com" || request.host == "www.voxxyai.com"
      response.headers["X-Robots-Tag"] = "noindex, nofollow"
    end
  end

  def frontend_host
    if Rails.env.production?
      primary_domain = ENV.fetch("PRIMARY_DOMAIN", "voxxyai.com")
      "https://#{primary_domain}/"
    else
      "http://localhost:3000/"
    end
  end
end
