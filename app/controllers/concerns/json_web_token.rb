# app/controllers/concerns/json_web_token.rb
module JsonWebToken
  require "jwt"

    SECRET_KEY = Rails.application.credentials.secret_key_base

    def self.encode(payload, exp = 24.hours.from_now)
      payload[:exp] = exp.to_i
      JWT.encode(payload, SECRET_KEY)
    end

    def self.decode(token)
      Rails.logger.info "🔓 [JWT DEBUG] Attempting to decode token: #{token[0..20]}..."
      Rails.logger.info "🔑 [JWT DEBUG] Using SECRET_KEY: #{SECRET_KEY ? 'present' : 'MISSING'} (length: #{SECRET_KEY&.length || 0})"

      body = JWT.decode(token, SECRET_KEY)[0]
      Rails.logger.info "✅ [JWT DEBUG] Token decoded successfully: #{body.inspect}"
      HashWithIndifferentAccess.new(body)
    rescue => e
      Rails.logger.error "❌ [JWT DEBUG] Token decode failed: #{e.class} - #{e.message}"
      Rails.logger.error "❌ [JWT DEBUG] Token that failed: #{token}"
      nil
    end
end
