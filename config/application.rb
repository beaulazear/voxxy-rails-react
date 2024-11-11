require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module VoxxyRails
  class Application < Rails::Application
    # API-only mode
    config.api_only = true
    
    # Adding cookies and session middleware
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore

    # Configure the session store with SameSite=None and Secure attributes in production
    config.session_store :cookie_store, key: '_voxxy_session', same_site: :none, secure: Rails.env.production?

    # Ensure SameSite attribute is None for cookies during development and production
    config.action_dispatch.cookies_same_site_protection = :none

    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.2

    # CORS configuration for both development and production
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins 'http://localhost:3000', 'https://voxxy-rails-react.onrender.com' # Development and Production URLs
        resource '*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head],
          credentials: true # Allows cookies to be shared between frontend and backend
      end
    end
  end
end