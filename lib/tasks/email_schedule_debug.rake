# frozen_string_literal: true

namespace :email_schedule do
  desc "Debug email scheduling times and timezone handling"
  task debug: :environment do
    puts ""
    puts "=" * 80
    puts "📧 EMAIL SCHEDULE DEBUGGING - Timezone & Overdue Analysis"
    puts "=" * 80
    puts ""

    # Show timezone configuration
    puts "⏰ TIMEZONE CONFIGURATION:"
    puts "-" * 80
    puts "  Rails timezone: #{Time.zone.name}"
    puts "  Current time (UTC): #{Time.current.strftime('%Y-%m-%d %H:%M:%S %Z')}"
    eastern_time = Time.use_zone("America/New_York") { Time.zone.now }
    puts "  Current time (Eastern): #{eastern_time.strftime('%Y-%m-%d %H:%M:%S %Z')}"
    puts "  Offset: #{eastern_time.formatted_offset}"
    puts ""

    # Find all scheduled emails
    scheduled_emails = ScheduledEmail.where(status: "scheduled").order(scheduled_for: :asc)

    if scheduled_emails.empty?
      puts "✅ No scheduled emails found"
      puts ""
      next
    end

    puts "📋 SCHEDULED EMAILS (#{scheduled_emails.count} total):"
    puts "-" * 80
    puts ""

    overdue_count = 0
    upcoming_count = 0
    ready_to_send_count = 0

    scheduled_emails.each_with_index do |email, index|
      event = email.event
      scheduled_utc = email.scheduled_for
      scheduled_eastern = scheduled_utc.in_time_zone("America/New_York")
      time_diff_minutes = ((Time.current - scheduled_utc) / 60).round

      # Categorize
      is_overdue = email.overdue?
      is_ready = email.sendable? && !is_overdue
      is_upcoming = scheduled_utc > Time.current

      if is_overdue
        status_icon = "🚨"
        status_text = "OVERDUE - #{email.overdue_message}"
        overdue_count += 1
      elsif is_ready
        status_icon = "✅"
        status_text = "READY TO SEND"
        ready_to_send_count += 1
      else
        status_icon = "⏰"
        status_text = "UPCOMING"
        upcoming_count += 1
      end

      puts "#{index + 1}. #{status_icon} #{email.name}"
      puts "   Event: #{event.title} (#{event.slug})"
      puts "   Scheduled (UTC): #{scheduled_utc.strftime('%Y-%m-%d %H:%M:%S %Z')}"
      puts "   Scheduled (EST): #{scheduled_eastern.strftime('%Y-%m-%d %H:%M:%S %Z')}"
      puts "   Status: #{status_text}"

      if time_diff_minutes > 0
        puts "   Time since scheduled: #{time_diff_minutes} minutes ago"
      else
        puts "   Time until scheduled: #{-time_diff_minutes} minutes from now"
      end

      puts ""
    end

    puts "=" * 80
    puts "📊 SUMMARY:"
    puts "=" * 80
    puts "  🚨 Overdue (late): #{overdue_count}"
    puts "  ✅ Ready to send (in grace period): #{ready_to_send_count}"
    puts "  ⏰ Upcoming: #{upcoming_count}"
    puts "  📧 Total scheduled: #{scheduled_emails.count}"
    puts ""

    if overdue_count > 0
      puts "⚠️  WARNING: #{overdue_count} email#{'s' if overdue_count != 1} overdue!"
      puts ""
      puts "🔍 TROUBLESHOOTING:"
      puts "  1. Check Sidekiq: rails sidekiq:debug"
      puts "  2. Manual trigger: rails runner 'EmailSenderWorker.new.perform'"
      puts ""
    end

    puts "=" * 80
  end
end
