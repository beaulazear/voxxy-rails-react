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

    # CORS configuration for development and production
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins "http://localhost:3000", "https://www.voxxyai.com" # Frontend URLs
        resource "*",
          headers: :any,
          methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
          credentials: true # Ensure cookies are included for cross-origin requests
      end
    end
  end
end
