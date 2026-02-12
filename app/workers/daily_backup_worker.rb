# frozen_string_literal: true

# Daily Backup Worker
# Runs automated backups of all events at 2 AM EST
# Scheduled via Sidekiq Scheduler (see config/sidekiq.yml)
class DailyBackupWorker
  include Sidekiq::Worker

  sidekiq_options queue: :default, retry: 3

  def perform
    Rails.logger.info("="*80)
    Rails.logger.info("Starting daily backup job at #{Time.current}")
    Rails.logger.info("="*80)

    backup_count = 0
    error_count = 0

    # Backup all organizations
    Organization.find_each do |organization|
      begin
        Rails.logger.info("Backing up organization: #{organization.name} (#{organization.slug})")

        # Run backup script for this organization
        # This will create individual backup files for each event
        result = run_backup_script(organization.slug)

        if result[:success]
          backup_count += result[:event_count]
          Rails.logger.info("✅ Successfully backed up #{result[:event_count]} events for #{organization.name}")
        else
          error_count += 1
          Rails.logger.error("❌ Failed to backup #{organization.name}: #{result[:error]}")
        end

      rescue => e
        error_count += 1
        Rails.logger.error("❌ Error backing up #{organization.name}: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
      end
    end

    # Log summary
    Rails.logger.info("="*80)
    Rails.logger.info("Daily backup job completed at #{Time.current}")
    Rails.logger.info("Events backed up: #{backup_count}")
    Rails.logger.info("Errors: #{error_count}")
    Rails.logger.info("="*80)

    # Clean up old backups (older than 30 days)
    cleanup_old_backups

    { backup_count: backup_count, error_count: error_count }
  end

  private

  def run_backup_script(organization_slug)
    # Use backticks to capture output
    script_path = Rails.root.join("lib", "scripts", "data_backup.rb")

    # Run the script
    output = `rails runner #{script_path} --organization=#{organization_slug} 2>&1`
    exit_status = $?.exitstatus

    if exit_status == 0
      # Count how many events were backed up from output
      event_count = count_events_from_output(output)
      { success: true, event_count: event_count, output: output }
    else
      { success: false, error: "Exit status #{exit_status}", output: output }
    end
  rescue => e
    { success: false, error: e.message }
  end

  def count_events_from_output(output)
    # Parse output to count successful backups
    # Look for lines like "✅ Event data exported successfully!"
    output.scan(/✅ Event data exported successfully!/).count
  end

  def cleanup_old_backups
    backup_dir = Rails.root.join("backups")
    return unless Dir.exist?(backup_dir)

    cutoff_date = 30.days.ago

    deleted_count = 0
    Dir.glob(File.join(backup_dir, "*.json")).each do |file|
      if File.mtime(file) < cutoff_date
        File.delete(file)
        deleted_count += 1
        Rails.logger.info("🗑️  Deleted old backup: #{File.basename(file)}")
      end
    end

    Rails.logger.info("Cleaned up #{deleted_count} backups older than 30 days")
  rescue => e
    Rails.logger.error("Error cleaning up old backups: #{e.message}")
  end
end
