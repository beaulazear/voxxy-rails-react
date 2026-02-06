# frozen_string_literal: true

class HealthController < ApplicationController
  # Skip authentication for health checks (public endpoint for monitoring services)

  # GET /health
  # Comprehensive health check for monitoring
  def show
    health_status = {
      status: "ok",
      timestamp: Time.current.iso8601,
      services: {
        database: check_database,
        redis: check_redis,
        sidekiq: check_sidekiq
      }
    }

    # Determine overall status
    services_ok = health_status[:services].values.all? { |s| s[:status] == "ok" }
    health_status[:status] = services_ok ? "ok" : "degraded"

    status_code = services_ok ? :ok : :service_unavailable
    render json: health_status, status: status_code
  rescue => e
    Sentry.capture_exception(e) if defined?(Sentry)
    render json: { status: "error", message: e.message }, status: :internal_server_error
  end

  private

  def check_database
    ActiveRecord::Base.connection.execute("SELECT 1")
    { status: "ok", latency_ms: measure_latency { ActiveRecord::Base.connection.execute("SELECT 1") } }
  rescue => e
    { status: "error", error: e.message }
  end

  def check_redis
    Redis.new(url: ENV["REDIS_URL"] || "redis://localhost:6379/0").ping
    { status: "ok", latency_ms: measure_latency { Redis.new(url: ENV["REDIS_URL"] || "redis://localhost:6379/0").ping } }
  rescue => e
    { status: "error", error: e.message }
  end

  def check_sidekiq
    stats = Sidekiq::Stats.new
    {
      status: "ok",
      enqueued: stats.enqueued,
      failed: stats.failed,
      retry: stats.retry_size,
      dead: stats.dead_size
    }
  rescue => e
    { status: "error", error: e.message }
  end

  def measure_latency
    start = Time.current
    yield
    ((Time.current - start) * 1000).round(2)
  end
end
