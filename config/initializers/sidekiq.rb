require "sidekiq"

begin
  require "sidekiq-cron"
rescue LoadError
  Rails.logger.warn("sidekiq-cron gem not installed - recurring jobs will not be available")
end

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }

  # Load sidekiq-cron schedule if gem is available
  if defined?(Sidekiq::Cron)
    schedule_file = "config/sidekiq_schedule.yml"

    if File.exist?(schedule_file)
      schedule = YAML.load_file(schedule_file)
      Sidekiq::Cron::Job.load_from_hash(schedule)
      Rails.logger.info("✓ Loaded sidekiq-cron schedule with #{schedule.keys.count} jobs")
    end
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }
end
