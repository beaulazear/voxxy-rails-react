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

      puts "   Recipients: #{email.recipient_count}"
      puts "   Trigger: #{email.trigger_type} (#{email.trigger_value} days, #{email.trigger_time})"
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
      puts "🔍 TROUBLESHOOTING STEPS:"
      puts "  1. Check if Sidekiq worker is running:"
      puts "     ps aux | grep sidekiq"
      puts ""
      puts "  2. Check Sidekiq queue status:"
      puts "     rails sidekiq:debug"
      puts ""
      puts "  3. Manually trigger EmailSenderWorker:"
      puts "     rails runner 'EmailSenderWorker.new.perform'"
      puts ""
      puts "  4. Check Sidekiq logs for errors:"
      puts "     tail -f log/sidekiq.log"
      puts ""
    elsif ready_to_send_count > 0
      puts "✅ #{ready_to_send_count} email#{'s' if ready_to_send_count != 1} ready to send (within grace period)"
      puts "   These should be processed by EmailSenderWorker within 10 minutes"
      puts ""
    else
      puts "✅ All emails are either sent or scheduled for the future"
      puts ""
    end

    puts "=" * 80
  end

  desc "Check specific event's email schedule"
  task :check_event, [ :event_slug ] => :environment do |t, args|
    unless args[:event_slug]
      puts "❌ Error: Please provide an event slug"
      puts "   Usage: rails email_schedule:check_event[event-slug]"
      next
    end

    event = Event.find_by(slug: args[:event_slug])
    unless event
      puts "❌ Error: Event not found with slug '#{args[:event_slug]}'"
      next
    end

    puts ""
    puts "=" * 80
    puts "📧 EMAIL SCHEDULE FOR EVENT: #{event.title}"
    puts "=" * 80
    puts ""

    puts "📅 EVENT DETAILS:"
    puts "  Slug: #{event.slug}"
    puts "  Event Date: #{event.event_date&.strftime('%B %d, %Y') || 'Not set'}"
    puts "  Application Deadline: #{event.application_deadline&.strftime('%B %d, %Y') || 'Not set'}"
    puts "  Payment Deadline: #{event.payment_deadline&.strftime('%B %d, %Y') || 'Not set'}"
    puts "  Registrations: #{event.registrations.count}"
    puts ""

    scheduled_emails = event.scheduled_emails.order(scheduled_for: :asc)

    if scheduled_emails.empty?
      puts "⚠️  No scheduled emails found for this event"
      puts ""
      puts "💡 To generate emails:"
      puts "   rails email_automation:regenerate[#{event.slug}]"
      puts ""
      next
    end

    puts "📧 SCHEDULED EMAILS (#{scheduled_emails.count} total):"
    puts "-" * 80
    puts ""

    scheduled_emails.each_with_index do |email, index|
      scheduled_eastern = email.scheduled_for.in_time_zone("America/New_York")

      status_badge = case email.status
      when "sent" then "✅ SENT"
      when "paused" then "⏸️  PAUSED"
      when "failed" then "❌ FAILED"
      when "scheduled"
        if email.overdue?
          "🚨 OVERDUE"
        elsif email.sendable?
          "✅ READY"
        else
          "⏰ SCHEDULED"
        end
      else
        email.status.upcase
      end

      puts "#{index + 1}. [#{status_badge}] #{email.name}"
      puts "   Scheduled: #{scheduled_eastern.strftime('%b %d, %Y at %I:%M %p %Z')}"
      puts "   Status: #{email.status}"

      if email.overdue?
        puts "   ⚠️  #{email.overdue_message}"
      elsif email.status == "sent"
        puts "   Sent at: #{email.sent_at&.in_time_zone('America/New_York')&.strftime('%b %d at %I:%M %p %Z')}"
        puts "   Recipients: #{email.recipient_count}"
        puts "   Delivered: #{email.delivered_count}"
      end

      puts ""
    end

    puts "=" * 80
  end

  desc "List all overdue emails across all events"
  task overdue: :environment do
    puts ""
    puts "=" * 80
    puts "🚨 OVERDUE EMAILS REPORT"
    puts "=" * 80
    puts ""

    overdue_emails = ScheduledEmail.scheduled.select(&:overdue?)

    if overdue_emails.empty?
      puts "✅ No overdue emails found!"
      puts ""
      puts "All scheduled emails are either:"
      puts "  - Sent successfully"
      puts "  - Scheduled for the future"
      puts "  - Within the 10-minute grace period"
      puts ""
      next
    end

    puts "Found #{overdue_emails.count} overdue email#{'s' if overdue_emails.count != 1}:"
    puts ""

    overdue_emails.each_with_index do |email, index|
      event = email.event
      scheduled_eastern = email.scheduled_for.in_time_zone("America/New_York")

      puts "#{index + 1}. #{email.name}"
      puts "   Event: #{event.title} (#{event.slug})"
      puts "   Scheduled: #{scheduled_eastern.strftime('%b %d, %Y at %I:%M %p %Z')}"
      puts "   ⚠️  #{email.overdue_message}"
      puts "   ID: #{email.id}"
      puts ""
    end

    puts "=" * 80
    puts "🔧 RECOMMENDED ACTIONS:"
    puts "=" * 80
    puts ""
    puts "1. Check Sidekiq worker status:"
    puts "   rails sidekiq:debug"
    puts ""
    puts "2. Manually run EmailSenderWorker to process overdue emails:"
    puts "   rails runner 'EmailSenderWorker.new.perform'"
    puts ""
    puts "3. Check logs for errors:"
    puts "   tail -100 log/production.log | grep -i 'email\\|sidekiq'"
    puts ""
    puts "=" * 80
  end
end
