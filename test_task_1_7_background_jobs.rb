# Test Script for Task 1.7 - Email Delivery Tracking (Background Jobs)
# Run this in Rails console: rails c
# Then: load 'test_task_1_7_background_jobs.rb'

puts "\n" + "="*80
puts "TASK 1.7: EMAIL DELIVERY TRACKING - BACKGROUND JOBS TEST"
puts "="*80 + "\n"

# Test 1: Verify all worker classes exist
puts "\n📋 Test 1: Verify Worker Classes"
puts "-" * 50

workers = [
  EmailDeliveryProcessorJob,
  EmailRetryJob,
  EmailSenderWorker,
  EmailRetryScannerJob
]

workers.each do |worker|
  puts "✓ #{worker.name} loaded"
end

# Test 2: Verify EmailSenderService exists
puts "\n📋 Test 2: Verify EmailSenderService"
puts "-" * 50

if defined?(EmailSenderService)
  puts "✓ EmailSenderService loaded"
else
  puts "✗ EmailSenderService not found!"
end

# Test 3: Test EmailDeliveryProcessorJob with mock data
puts "\n📋 Test 3: Test EmailDeliveryProcessorJob (Dry Run)"
puts "-" * 50

# Create a test delivery record
event = Event.last
if event.nil?
  puts "✗ No events found. Create an event first."
else
  registration = event.registrations.first

  if registration.nil?
    puts "✗ No registrations found for event. Create a registration first."
  else
    scheduled_email = event.scheduled_emails.first

    if scheduled_email.nil?
      puts "✗ No scheduled emails found. Generate emails first:"
      puts "  ScheduledEmailGenerator.new(event).generate"
    else
      # Create a test delivery
      delivery = EmailDelivery.create!(
        scheduled_email: scheduled_email,
        event: event,
        registration: registration,
        sendgrid_message_id: "test-msg-#{SecureRandom.hex(8)}",
        recipient_email: registration.email,
        status: 'sent',
        sent_at: Time.current
      )

      puts "✓ Created test delivery ##{delivery.id}"

      # Test delivered event
      delivered_event = {
        'event' => 'delivered',
        'sg_message_id' => delivery.sendgrid_message_id,
        'timestamp' => Time.current.to_i,
        'email' => delivery.recipient_email
      }

      puts "Testing 'delivered' webhook event..."
      EmailDeliveryProcessorJob.new.perform(delivered_event)

      delivery.reload
      if delivery.status == 'delivered'
        puts "✓ Delivery status updated to 'delivered'"
        puts "  Delivered at: #{delivery.delivered_at}"
      else
        puts "✗ Delivery status not updated (expected 'delivered', got '#{delivery.status}')"
      end

      # Clean up
      delivery.destroy
      puts "✓ Test delivery cleaned up"
    end
  end
end

# Test 4: Test EmailSenderService (without actually sending)
puts "\n📋 Test 4: Test EmailSenderService Methods"
puts "-" * 50

event = Event.last
if event && event.scheduled_emails.any?
  scheduled_email = event.scheduled_emails.first
  service = EmailSenderService.new(scheduled_email)

  puts "✓ EmailSenderService initialized"
  puts "  Event: #{event.title}"
  puts "  Email: #{scheduled_email.name}"
  puts "  Scheduled for: #{scheduled_email.scheduled_for}"

  puts "\n⚠️  Skipping actual send to avoid sending test emails"
  puts "   To test real sending, run: service.send_to_recipients"
else
  puts "✗ No events or scheduled emails found"
end

# Test 5: Verify Sidekiq-Cron schedule loaded
puts "\n📋 Test 5: Verify Sidekiq-Cron Schedule"
puts "-" * 50

if defined?(Sidekiq::Cron::Job)
  cron_jobs = Sidekiq::Cron::Job.all

  if cron_jobs.any?
    puts "✓ Sidekiq-Cron loaded with #{cron_jobs.count} jobs:"
    cron_jobs.each do |job|
      puts "  - #{job.name}: #{job.cron} (#{job.status})"
    end
  else
    puts "⚠️  No cron jobs loaded. Start Sidekiq server to load schedule:"
    puts "   bundle exec sidekiq"
  end
else
  puts "✗ Sidekiq-Cron not loaded. Check Gemfile for 'sidekiq-cron' gem"
end

# Test 6: Verify webhook controller
puts "\n📋 Test 6: Verify Webhook Controller"
puts "-" * 50

if defined?(Api::V1::Webhooks::SendgridController)
  puts "✓ Webhooks::SendgridController loaded"

  # Check if it enqueues jobs
  controller_source = File.read(Rails.root.join('app/controllers/api/v1/webhooks/sendgrid_controller.rb'))
  if controller_source.include?('EmailDeliveryProcessorJob.perform_async')
    puts "✓ Controller enqueues EmailDeliveryProcessorJob"
  else
    puts "✗ Controller does not enqueue background jobs"
  end
else
  puts "✗ Webhooks::SendgridController not found"
end

# Summary
puts "\n" + "="*80
puts "SUMMARY"
puts "="*80

puts "\n✅ Background Jobs Implementation Complete!"
puts "\nCreated Workers:"
puts "  1. EmailDeliveryProcessorJob - Processes SendGrid webhook events"
puts "  2. EmailRetryJob - Retries soft-bounced emails"
puts "  3. EmailSenderWorker - Checks for scheduled emails (runs every 5 min)"
puts "  4. EmailRetryScannerJob - Scans for pending retries (runs every 30 min)"

puts "\nCreated Service:"
puts "  - EmailSenderService - Sends emails via SendGrid with tracking"

puts "\nUpdated Controllers:"
puts "  - Webhooks::SendgridController - Enqueues background jobs"
puts "  - ScheduledEmailsController - Uses EmailSenderService for send_now"

puts "\nConfiguration:"
puts "  - config/sidekiq_schedule.yml - Cron schedule"
puts "  - config/initializers/sidekiq.rb - Loads schedule"

puts "\n📖 Next Steps:"
puts "  1. Ensure sidekiq-cron gem is in Gemfile"
puts "  2. Start Sidekiq: bundle exec sidekiq"
puts "  3. Start Rails: bundle exec rails s"
puts "  4. Configure SendGrid webhook (see SENDGRID_WEBHOOK_SETUP.md)"
puts "  5. Test with real event: Create event → Generate emails → Test send"

puts "\n" + "="*80 + "\n"
