# frozen_string_literal: true

# Diagnostic rake task to debug Sidekiq queue status

namespace :sidekiq do
  desc "Debug Sidekiq queues and job status"
  task debug: :environment do
    require 'sidekiq/api'

    puts "\n" + "="*80
    puts "🔍 SIDEKIQ DIAGNOSTICS"
    puts "="*80
    puts ""

    # Overall stats
    stats = Sidekiq::Stats.new
    puts "📊 OVERALL STATS:"
    puts "   Enqueued: #{stats.enqueued}"
    puts "   Processed: #{stats.processed}"
    puts "   Failed: #{stats.failed}"
    puts "   Scheduled: #{stats.scheduled_size}"
    puts "   Retry: #{stats.retry_size}"
    puts "   Dead: #{stats.dead_size}"
    puts ""

    # Queue-specific stats
    puts "📋 QUEUE STATUS:"
    puts "-" * 80
    Sidekiq::Queue.all.each do |queue|
      puts "Queue: #{queue.name.ljust(20)} Size: #{queue.size}"
    end
    puts ""

    # Email delivery queue details
    email_queue = Sidekiq::Queue.new('email_delivery')
    puts "📧 EMAIL_DELIVERY QUEUE DETAILS:"
    puts "-" * 80
    puts "Total jobs: #{email_queue.size}"
    puts ""

    if email_queue.size > 0
      puts "First 10 jobs in queue:"
      email_queue.first(10).each_with_index do |job, index|
        enqueued_at = Time.at(job.enqueued_at).strftime('%Y-%m-%d %H:%M:%S')
        puts "  #{index + 1}. Class: #{job.klass}"
        puts "     Args: #{job.args.inspect}"
        puts "     Enqueued: #{enqueued_at}"
        puts "     JID: #{job.jid}"
        puts ""
      end
    else
      puts "✅ Queue is empty"
    end
    puts ""

    # Scheduled jobs
    scheduled_set = Sidekiq::ScheduledSet.new
    puts "⏰ SCHEDULED JOBS:"
    puts "-" * 80
    puts "Total scheduled: #{scheduled_set.size}"
    puts ""

    if scheduled_set.size > 0
      puts "Next 10 scheduled jobs:"
      scheduled_set.first(10).each_with_index do |job, index|
        scheduled_at = Time.at(job.at).strftime('%Y-%m-%d %H:%M:%S')
        time_until = ((job.at - Time.now.to_f) / 60).round
        puts "  #{index + 1}. Class: #{job.klass}"
        puts "     Scheduled for: #{scheduled_at} (in #{time_until} min)"
        puts "     Queue: #{job.queue}"
        puts ""
      end
    else
      puts "✅ No scheduled jobs"
    end
    puts ""

    # Retry jobs
    retry_set = Sidekiq::RetrySet.new
    puts "🔄 RETRY QUEUE:"
    puts "-" * 80
    puts "Total retries: #{retry_set.size}"
    puts ""

    if retry_set.size > 0
      puts "First 10 retrying jobs:"
      retry_set.first(10).each_with_index do |job, index|
        retry_at = Time.at(job.at).strftime('%Y-%m-%d %H:%M:%S')
        puts "  #{index + 1}. Class: #{job.klass}"
        puts "     Retry at: #{retry_at}"
        puts "     Error: #{job['error_message']}"
        puts "     Queue: #{job.queue}"
        puts ""
      end
    else
      puts "✅ No jobs retrying"
    end
    puts ""

    # Dead jobs
    dead_set = Sidekiq::DeadSet.new
    puts "💀 DEAD QUEUE:"
    puts "-" * 80
    puts "Total dead: #{dead_set.size}"
    puts ""

    if dead_set.size > 0
      puts "First 10 dead jobs:"
      dead_set.first(10).each_with_index do |job, index|
        failed_at = Time.at(job.at).strftime('%Y-%m-%d %H:%M:%S')
        puts "  #{index + 1}. Class: #{job.klass}"
        puts "     Failed at: #{failed_at}"
        puts "     Error: #{job['error_message']}"
        puts "     Queue: #{job.queue}"
        puts ""
      end
    else
      puts "✅ No dead jobs"
    end
    puts ""

    # Check for EmailSenderWorker specifically
    puts "="*80
    puts "🎯 EMAILSENDERWORKER STATUS:"
    puts "="*80
    puts ""

    email_sender_jobs = email_queue.select { |job| job.klass == 'EmailSenderWorker' }
    puts "EmailSenderWorker jobs in email_delivery queue: #{email_sender_jobs.count}"

    scheduled_email_sender = scheduled_set.select { |job| job.klass == 'EmailSenderWorker' }
    puts "EmailSenderWorker jobs in scheduled set: #{scheduled_email_sender.count}"

    retry_email_sender = retry_set.select { |job| job.klass == 'EmailSenderWorker' }
    puts "EmailSenderWorker jobs in retry queue: #{retry_email_sender.count}"

    dead_email_sender = dead_set.select { |job| job.klass == 'EmailSenderWorker' }
    puts "EmailSenderWorker jobs in dead queue: #{dead_email_sender.count}"

    puts ""
    puts "="*80
    puts "🚀 RECOMMENDATIONS:"
    puts "="*80
    puts ""

    if email_sender_jobs.any?
      puts "✅ EmailSenderWorker jobs ARE in the queue"
      puts "   They should process within next few minutes"
    elsif scheduled_email_sender.any?
      next_run = scheduled_email_sender.min_by(&:at)
      minutes_until = ((next_run.at - Time.now.to_f) / 60).round
      puts "⏰ EmailSenderWorker jobs are SCHEDULED"
      puts "   Next run in: #{minutes_until} minutes"
    elsif dead_email_sender.any?
      puts "❌ EmailSenderWorker jobs are in DEAD queue"
      puts "   Check error messages above"
      puts "   Clear dead queue: rake sidekiq:clear_dead"
    else
      puts "❓ No EmailSenderWorker jobs found in any queue"
      puts "   Try triggering again: rake email_automation:trigger_worker_now"
    end

    puts ""
  end

  desc "Clear all dead jobs from Sidekiq"
  task clear_dead: :environment do
    require 'sidekiq/api'
    dead_set = Sidekiq::DeadSet.new
    count = dead_set.size
    dead_set.clear
    puts "✅ Cleared #{count} dead jobs"
  end

  desc "Clear all retry jobs from Sidekiq"
  task clear_retry: :environment do
    require 'sidekiq/api'
    retry_set = Sidekiq::RetrySet.new
    count = retry_set.size
    retry_set.clear
    puts "✅ Cleared #{count} retry jobs"
  end
end
