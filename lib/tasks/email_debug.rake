# frozen_string_literal: true

# Diagnostic rake task to debug why scheduled emails aren't sending

namespace :email_automation do
  desc "Debug scheduled emails - check why they're not sending"
  task debug_scheduled_emails: :environment do
    puts "\n" + "="*80
    puts "🔍 DEBUGGING SCHEDULED EMAILS"
    puts "="*80
    puts ""

    # Current time
    current_time = Time.current
    puts "⏰ Current Time: #{current_time.strftime('%Y-%m-%d %H:%M:%S %Z')} (UTC)"
    puts "   In EST: #{current_time.in_time_zone('America/New_York').strftime('%Y-%m-%d %H:%M:%S %Z')}"
    puts ""

    # Check recent scheduled emails (created in last hour)
    recent_emails = ScheduledEmail.where("created_at > ?", 1.hour.ago).order(:scheduled_for)

    puts "📧 SCHEDULED EMAILS CREATED IN LAST HOUR: #{recent_emails.count}"
    puts ""

    if recent_emails.empty?
      puts "❌ No scheduled emails found created in the last hour"
      puts "   Did the rake task run successfully?"
      puts ""
      exit 0
    end

    # Show details of each email
    puts "Email Details:"
    puts "-" * 80
    recent_emails.each_with_index do |email, index|
      scheduled_time = email.scheduled_for
      time_diff = ((scheduled_time - current_time) / 60).round if scheduled_time

      ready_status = if scheduled_time && scheduled_time <= current_time
        "✅ READY (#{time_diff.abs} min ago)"
      else
        "⏳ FUTURE (in #{time_diff} min)"
      end

      puts "#{index + 1}. #{email.name}"
      puts "   ID: #{email.id}"
      puts "   Status: #{email.status}"
      puts "   Scheduled For: #{scheduled_time&.strftime('%Y-%m-%d %H:%M:%S %Z') || 'NULL'}"
      puts "   #{ready_status}"
      puts "   Event: #{email.event.title}"
      puts ""
    end

    # Check what the worker query would return
    puts "="*80
    puts "🤖 WHAT THE WORKER SEES:"
    puts "="*80
    puts ""

    ready_emails = ScheduledEmail
      .where(status: "scheduled")
      .where("scheduled_for <= ?", current_time)
      .where("scheduled_for >= ?", 7.days.ago)
      .order(scheduled_for: :asc)

    puts "Worker Query Results: #{ready_emails.count} emails ready to send"
    puts ""

    if ready_emails.empty?
      puts "❌ Worker found NO emails ready to send"
      puts ""
      puts "Possible reasons:"
      puts "  1. All emails have scheduled_for in the FUTURE"
      puts "  2. Emails don't have status='scheduled'"
      puts "  3. Emails are older than 7 days"
      puts ""

      # Show status breakdown
      status_counts = recent_emails.group(:status).count
      puts "Status breakdown of recent emails:"
      status_counts.each do |status, count|
        puts "  - #{status}: #{count}"
      end
      puts ""

    else
      puts "✅ Worker SHOULD send these emails:"
      ready_emails.each do |email|
        puts "  - #{email.name} (scheduled: #{email.scheduled_for.strftime('%H:%M:%S')})"
      end
      puts ""
    end

    # Check Sidekiq cron schedule
    puts "="*80
    puts "⚙️  SIDEKIQ CONFIGURATION:"
    puts "="*80
    puts ""

    if defined?(Sidekiq::Cron::Job)
      email_sender_job = Sidekiq::Cron::Job.find("email_sender_worker")
      if email_sender_job
        puts "✅ EmailSenderWorker cron job configured:"
        puts "   Schedule: #{email_sender_job.cron}"
        puts "   Class: #{email_sender_job.klass}"
        puts "   Last run: #{email_sender_job.last_enqueue_time}"
        puts "   Status: #{email_sender_job.status}"
      else
        puts "❌ EmailSenderWorker cron job NOT FOUND"
        puts "   Available jobs:"
        Sidekiq::Cron::Job.all.each do |job|
          puts "   - #{job.name}"
        end
      end
    else
      puts "❌ Sidekiq::Cron not loaded"
    end

    puts ""
    puts "="*80
    puts "🚀 RECOMMENDED ACTIONS:"
    puts "="*80
    puts ""

    if ready_emails.any?
      puts "✅ Emails are ready - manually trigger worker:"
      puts "   bundle exec rake email_automation:trigger_worker_now"
    else
      if recent_emails.all? { |e| e.scheduled_for && e.scheduled_for > current_time }
        puts "⏳ Emails are scheduled for the FUTURE - wait or recompress:"
        earliest = recent_emails.min_by(&:scheduled_for)
        minutes_until = ((earliest.scheduled_for - current_time) / 60).round
        puts "   Next email in: #{minutes_until} minutes"
        puts "   Or recompress: bundle exec rake email_automation:compress_schedule[EVENT_SLUG]"
      elsif recent_emails.any? { |e| e.status != "scheduled" }
        puts "⚠️  Some emails have wrong status - check manually"
      else
        puts "❓ Unknown issue - check logs above"
      end
    end

    puts ""
  end
end
