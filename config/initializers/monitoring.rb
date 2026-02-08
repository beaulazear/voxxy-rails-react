# frozen_string_literal: true

# Application monitoring configuration
# Tracks errors, performance issues, and suspicious activity

if Rails.env.production? && defined?(Sentry)
  # Track 404 errors (potential broken links or attacks)
  Rails.application.config.after_initialize do
    ActiveSupport::Notifications.subscribe "process_action.action_controller" do |name, started, finished, unique_id, data|
      # Track 404s that might indicate broken links
      if data[:status] == 404
        path = data[:path]

        # Skip known bots and scanners looking for vulnerabilities
        skip_paths = [
          /\.php$/,           # PHP file probes
          /\/wp-/,            # WordPress probes
          /\/admin/,          # Admin panel probes (unless it's our actual admin)
          /\.env$/,           # .env file probes
          /\.git/,            # Git repository probes
          /\/xmlrpc\.php$/,   # XML-RPC probes
          /\/phpmyadmin/      # phpMyAdmin probes
        ]

        is_probe = skip_paths.any? { |pattern| path.match?(pattern) }

        unless is_probe
          Sentry.capture_message(
            "404 Not Found",
            level: :warning,
            extra: {
              path: path,
              method: data[:method],
              controller: data[:controller],
              action: data[:action],
              params: data[:params]&.except(:password, :token, :api_key)
            },
            fingerprint: [ "404", path ]  # Group by path
          )
        end
      end

      # Track slow requests (> 3 seconds)
      duration = finished - started
      if duration > 3.0
        Sentry.capture_message(
          "Slow request detected",
          level: :warning,
          extra: {
            duration_seconds: duration.round(2),
            path: data[:path],
            method: data[:method],
            controller: data[:controller],
            action: data[:action],
            db_runtime: data[:db_runtime],
            view_runtime: data[:view_runtime]
          },
          fingerprint: [ "slow-request", "#{data[:controller]}##{data[:action]}" ]
        )
      end
    end
  end

  # Track failed background jobs
  ActiveSupport::Notifications.subscribe "failure.job" do |_name, _started, _finished, _unique_id, data|
    job = data[:job]
    error = data[:error]

    Sentry.capture_exception(
      error,
      extra: {
        job_class: job.class.name,
        job_id: job.job_id,
        arguments: job.arguments,
        queue_name: job.queue_name,
        executions: job.executions
      }
    )
  end
end
