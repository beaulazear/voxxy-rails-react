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
  throttle("api/ip", limit: 300, period: 1.hour) do |req|
    req.ip if (req.path.start_with?("/api/") || api_endpoint?(req.path)) && req.path != "/login"
  end

  # Authenticated user rate limiting (more generous for logged-in users)
  throttle("api/user", limit: 500, period: 1.hour) do |req|
    if (req.path.start_with?("/api/") || api_endpoint?(req.path)) && authenticated_user_id(req)
      authenticated_user_id(req)
    end
  end

  # Login attempts per IP (prevent brute force)
  throttle("login/ip", limit: 10, period: 15.minutes) do |req|
    req.ip if req.path == "/login" && req.post?
  end

  # Try Voxxy specific limiting (already has custom rate limiting, this is backup)
  throttle("try_voxxy/ip", limit: 20, period: 1.hour) do |req|
    req.ip if req.path.include?("try_voxxy")
  end

  # OpenAI endpoints (protect expensive API calls)
  throttle("openai/ip", limit: 50, period: 1.hour) do |req|
    req.ip if req.path.include?("openai")
  end

  # Photo proxy endpoint
  throttle("photos/ip", limit: 200, period: 1.hour) do |req|
    req.ip if req.path.start_with?("/photos/")
  end

  # Places API proxy endpoint (protect Google Places API costs)
  throttle("places/ip", limit: 100, period: 1.hour) do |req|
    req.ip if req.path.start_with?("/api/places/")
  end

  # Block obviously malicious requests
  blocklist("block bad actors") do |req|
    # Block requests with suspicious user agents
    req.user_agent&.match?(/curl|wget|scanner|bot/i) && !whitelisted_bot?(req.user_agent)
  end

  # Custom response for rate limited requests
  self.throttled_responder = lambda do |env|
    match_data = env["rack.attack.match_data"] || {}
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
      "/bug_reports", "/password_reset"
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
