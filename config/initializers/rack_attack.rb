# config/initializers/rack_attack.rb

class Rack::Attack
  # Always allow requests in test environment
  Rack::Attack.enabled = !Rails.env.test?

  # Use Redis for caching
  Rack::Attack.cache.store = ActiveSupport::Cache::RedisCacheStore.new(
    url: ENV.fetch("REDIS_URL", "redis://localhost:6379/1")
  )

  # Mobile-friendly rate limiting - higher limits to not break mobile apps

  # General API rate limiting per IP (excluding login which has its own throttle)
  # Skip rate limiting for admin users
  throttle("api/ip", limit: 300, period: 1.hour) do |req|
    if (req.path.start_with?("/api/") || api_endpoint?(req.path)) && req.path != "/login"
      # Don't rate limit admin users
      next if admin_user?(req)
      req.ip
    end
  end

  # Authenticated user rate limiting (more generous for logged-in users)
  # Skip rate limiting for admin users
  throttle("api/user", limit: 500, period: 1.hour) do |req|
    if (req.path.start_with?("/api/") || api_endpoint?(req.path)) && authenticated_user_id(req)
      # Don't rate limit admin users
      next if admin_user?(req)
      authenticated_user_id(req)
    end
  end

  # Login attempts per IP (prevent brute force)
  throttle("login/ip", limit: 10, period: 15.minutes) do |req|
    req.ip if req.path == "/login" && req.post?
  end

  # Try Voxxy specific limiting - increased to work with controller logic
  # Controller handles per-session limiting, this is per-IP backup
  throttle("try_voxxy/ip", limit: 10, period: 1.hour) do |req|
    if req.path == "/try_voxxy_recommendations" && req.post?
      next if admin_user?(req)
      req.ip
    end
  end

  # Separate limit for cached endpoint
  throttle("try_voxxy_cached/ip", limit: 100, period: 1.hour) do |req|
    if req.path == "/try_voxxy_cached" && req.get?
      next if admin_user?(req)
      req.ip
    end
  end

  # OpenAI endpoints (protect expensive API calls)
  throttle("openai/ip", limit: 50, period: 1.hour) do |req|
    if req.path.include?("openai")
      next if admin_user?(req)
      req.ip
    end
  end

  # Photo proxy endpoint
  throttle("photos/ip", limit: 200, period: 1.hour) do |req|
    if req.path.start_with?("/photos/")
      next if admin_user?(req)
      req.ip
    end
  end

  # Places API proxy endpoint (protect Google Places API costs)
  throttle("places/ip", limit: 100, period: 1.hour) do |req|
    if req.path.start_with?("/api/places/")
      next if admin_user?(req)
      req.ip
    end
  end

  # Block obviously malicious requests
  blocklist("block bad actors") do |req|
    # Skip blocking for localhost/development
    next false if req.ip == "::1" || req.ip == "127.0.0.1"
    
    # Block requests with suspicious user agents
    req.user_agent&.match?(/curl|wget|scanner|bot/i) && !whitelisted_bot?(req.user_agent)
  end

  # Custom response for rate limited requests
  self.throttled_responder = lambda do |request|
    match_data = request.env["rack.attack.match_data"] || {}
    now = match_data[:epoch_time] || Time.now.to_i
    period = match_data[:period] || 3600
    limit = match_data[:limit] || 0

    headers = {
      "Content-Type" => "application/json",
      "Retry-After" => period.to_s,
      "X-RateLimit-Limit" => limit.to_s,
      "X-RateLimit-Remaining" => "0",
      "X-RateLimit-Reset" => (now + period).to_s
    }

    [ 429, headers, [ { error: "Rate limit exceeded. Please try again later." }.to_json ] ]
  end

  private

  # Helper to identify API endpoints
  def self.api_endpoint?(path)
    api_paths = [
      "/login", "/logout", "/me", "/activities", "/responses", "/users",
      "/pinned_activities", "/comments", "/votes", "/time_slots",
      "/activity_participants", "/waitlists", "/feedbacks", "/contacts",
      "/bug_reports", "/password_reset", "/admin"
    ]

    api_paths.any? { |api_path| path.start_with?(api_path) }
  end

  # Extract user ID from JWT token for authenticated rate limiting
  def self.authenticated_user_id(request)
    return nil unless request.env["HTTP_AUTHORIZATION"]

    token = request.env["HTTP_AUTHORIZATION"].split(" ").last
    return nil unless token

    begin
      decoded = JWT.decode(token, Rails.application.credentials.secret_key_base)[0]
      decoded["user_id"]
    rescue JWT::DecodeError
      nil
    end
  end

  # Check if the request is from an admin user
  def self.admin_user?(request)
    user_id = authenticated_user_id(request)
    return false unless user_id

    begin
      user = User.find_by(id: user_id)
      user&.admin == true
    rescue
      false
    end
  end

  # Allow legitimate bots/crawlers
  def self.whitelisted_bot?(user_agent)
    whitelisted = [
      /googlebot/i,
      /bingbot/i,
      /slackbot/i,
      /twitterbot/i,
      /facebookexternalhit/i
    ]

    whitelisted.any? { |pattern| user_agent.match?(pattern) }
  end
end

# Log blocked and throttled requests in development
if Rails.env.development?
  ActiveSupport::Notifications.subscribe(/rack_attack/) do |name, start, finish, request_id, payload|
    req = payload[:request]
    Rails.logger.info "[Rack::Attack] #{name}: #{req.ip} #{req.request_method} #{req.fullpath}"
  end
end
