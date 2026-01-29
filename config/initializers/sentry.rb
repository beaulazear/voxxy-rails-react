# Sentry error tracking configuration
# https://docs.sentry.io/platforms/ruby/guides/rails/

Sentry.init do |config|
  # Get DSN from environment variable
  # Set this in Heroku: heroku config:set SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
  config.dsn = ENV['SENTRY_DSN']

  # Only enable in production and staging
  config.enabled_environments = %w[production staging]

  # Set breadcrumbs logger
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]

  # Performance monitoring (10% sample rate to reduce cost)
  config.traces_sample_rate = 0.1

  # Filter sensitive data
  config.send_default_pii = false  # Don't send user IP, cookies, etc.

  # Custom error tagging for email system
  config.before_send = lambda do |event, hint|
    # Tag email-related errors as high priority
    if event.transaction&.include?('Email') ||
       event.exception&.values&.any? { |e| e.type&.include?('Email') } ||
       event.breadcrumbs&.any? { |b| b.message&.include?('email') }

      event.tags[:component] = 'email_system'
      event.tags[:priority] = 'high'
      event.fingerprint = ['{{ default }}', 'email-system']
    end

    # Tag webhook errors
    if event.transaction&.include?('webhook') ||
       event.breadcrumbs&.any? { |b| b.message&.include?('webhook') }

      event.tags[:component] = 'webhook'
      event.tags[:priority] = 'high'
    end

    # Tag Sidekiq job errors
    if event.transaction&.include?('Worker') ||
       event.transaction&.include?('Job')

      event.tags[:component] = 'background_job'
    end

    event
  end

  # Set release version (optional, but useful for tracking deployments)
  config.release = ENV['HEROKU_SLUG_COMMIT'] || `git rev-parse --short HEAD`.strip

  # Set environment
  config.environment = Rails.env

  # Sample rate for errors (1.0 = capture all errors)
  config.sample_rate = 1.0
end

# Additional configuration for Rails
if defined?(Sentry::Rails)
  Sentry::Rails.configuration.capture_exception_frame_locals = true
end
