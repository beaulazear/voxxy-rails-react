# frozen_string_literal: true

Sentry.init do |config|
  config.dsn = ENV["SENTRY_DSN"] || "https://8ad986421baae2d740b4a34c3e46b005@o4510790092914688.ingest.us.sentry.io/4510790103400448"
  config.breadcrumbs_logger = [ :active_support_logger, :http_logger ]

  # Add data like request headers and IP for users,
  # see https://docs.sentry.io/platforms/ruby/data-management/data-collected/ for more info
  config.send_default_pii = true

  # Set traces_sample_rate to 1.0 to capture 100% of transactions for tracing.
  # We recommend adjusting this value in production (0.1 = 10% of requests)
  config.traces_sample_rate = Rails.env.production? ? 0.1 : 1.0
end
