require_relative "boot"
require "rails/all"
Bundler.require(*Rails.groups)

module VoxxyRails
  class Application < Rails::Application
    # Enable full middleware stack by setting `api_only` to false
    config.api_only = false

    # Configure the session store with cross-origin support and secure settings for production
    config.session_store :cookie_store, key: "_session_id", same_site: :none, secure: Rails.env.production?

    # Add cookies and session middleware
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore

    # Initialize configuration defaults for originally generated Rails version
    config.load_defaults 7.2

    local_ip = ENV.fetch("LOCAL_IP", nil)
    allowed_origins = [
      "http://localhost:3000",
      "https://www.voxxyai.com",
      "https://voxxy-rails-react-staging.onrender.com",
      "http://192.168.1.123:8081", # mobile dev origin
      "null" # React Native often uses 'null' as origin
    ]
    allowed_origins << local_ip if local_ip

    # CORS configuration for development and production
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins(*allowed_origins)
        resource "*",
          headers: :any,
          methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
          credentials: true,
          expose: [ "Access-Control-Allow-Origin" ] # ← optional but sometimes needed
      end
    end
  end
end
