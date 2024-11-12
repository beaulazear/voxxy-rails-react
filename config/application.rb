require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module VoxxyRails
  class Application < Rails::Application
    # API-only mode
    config.api_only = true

    # Adding cookies and session middleware for API-only app
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore

    # Use SameSite=Strict for all cookies, similar to previous configuration
    config.action_dispatch.cookies_same_site_protection = :strict

    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.2

    # CORS configuration for development and production
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins 'http://localhost:3000', 'https://www.voxxyai.com' # Update with your frontend URLs
        resource '*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head],
          credentials: true # Allows cookies to be shared between frontend and backend
      end
    end
  end
end