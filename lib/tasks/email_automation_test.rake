# frozen_string_literal: true

# Rake tasks for testing email automation with compressed schedules
# Allows testing 8-day email schedules in 30-minute windows

namespace :email_automation do
  desc "Compress scheduled emails into 30-minute window (usage: rake email_automation:compress_schedule[event_slug])"
  task :compress_schedule, [ :event_slug ] => :environment do |t, args|
    unless args[:event_slug]
      puts "❌ Error: Event slug required"
      puts "Usage: rake email_automation:compress_schedule[your-event-slug]"
      exit 1
    end

    event = Event.find_by(slug: args[:event_slug])
    unless event
      puts "❌ Error: Event not found with slug '#{args[:event_slug]}'"
      exit 1
    end

    scheduled_emails = event.scheduled_emails.where(status: "scheduled").order(:scheduled_for)

    if scheduled_emails.empty?
      puts "❌ Error: No scheduled emails found for this event"
      puts "   Run: rake email_automation:create_test_event_with_compressed_schedule"
      exit 1
    end

    puts "\n" + "="*80
    puts "📧 COMPRESSING EMAIL SCHEDULE FOR 30-MINUTE TEST"
    puts "="*80
    puts "Event: #{event.title}"
    puts "Total scheduled emails: #{scheduled_emails.count}"
    puts ""

    # Compress schedule: 4 minutes apart
    base_time = Time.current
    interval_minutes = 4

    scheduled_emails.each_with_index do |email, index|
      new_time = base_time + (index * interval_minutes).minutes
      email.update!(scheduled_for: new_time)
    end

    # Print updated schedule
    puts "📅 COMPRESSED EMAIL TIMELINE:"
    puts "-" * 80
    scheduled_emails.reload.each_with_index do |email, index|
      scheduled_time = email.scheduled_for.in_time_zone("America/New_York")
      puts sprintf("  %d. %-40s → %s",
        index + 1,
        email.name,
        scheduled_time.strftime("%Y-%m-%d %H:%M:%S %Z")
      )
    end

    total_duration = (scheduled_emails.count - 1) * interval_minutes
    puts ""
    puts "✅ All emails scheduled within #{total_duration} minutes"
    puts "⏰ First email: #{scheduled_emails.first.scheduled_for.in_time_zone('America/New_York').strftime('%H:%M:%S %Z')}"
    puts "⏰ Last email:  #{scheduled_emails.last.scheduled_for.in_time_zone('America/New_York').strftime('%H:%M:%S %Z')}"
    puts ""
    puts "🚀 To send immediately, run: rake email_automation:trigger_worker_now"
    puts "🔄 To reset schedule, run: rake email_automation:reset_schedule[#{event.slug}]"
    puts ""
  end

  desc "Create test event with compressed 30-minute email schedule"
  task create_test_event_with_compressed_schedule: :environment do
    puts "\n" + "="*80
    puts "🎬 CREATING TEST EVENT WITH COMPRESSED EMAIL SCHEDULE"
    puts "="*80

    # Find test user
    test_user = User.find_by(email: "beaulazear@gmail.com")

    unless test_user
      puts "❌ Error: User beaulazear@gmail.com not found"
      puts "   Please create a user account first or log in to the platform"
      exit 1
    end

    # Find or create organization for test user
    org = test_user.organizations.first || Organization.create!(
      user: test_user,
      name: "Test Email Automation Org",
      slug: "test-automation-org-#{SecureRandom.hex(4)}",
      email: "testautomation@voxxyai.com"
    )
    puts "✅ Organization: #{org.name}"
    puts "   Owner: #{test_user.email}"

    # Create event (8 days out - normal timeline)
    event = Event.create!(
      organization: org,
      title: "30-Minute Email Test Event #{Time.current.strftime('%m/%d %H:%M')}",
      slug: "email-test-#{SecureRandom.hex(6)}",
      event_date: 8.days.from_now.to_date,
      application_deadline: 5.days.from_now.to_date,
      payment_deadline: 7.days.from_now.to_date,
      start_time: "10:00",
      venue: "Test Venue",
      location: "Test City, CA",
      published: true,
      description: "Automated test event for 30-minute email schedule testing"
    )
    puts "✅ Event created: #{event.title}"
    puts "   Slug: #{event.slug}"
    puts "   Event date: #{event.event_date}"

    # Generate scheduled emails
    generator = ScheduledEmailGenerator.new(event)
    emails = generator.generate
    puts "✅ Generated #{emails.count} scheduled emails"

    # Create test registrations (different statuses for filtering)
    # Using Gmail's plus addressing (email+tag@gmail.com) to bypass uniqueness validation
    # All emails still arrive at the base Gmail address
    # BOTH users get 3 registrations each to receive ALL 7 emails
    registrations = []

    puts "\n📝 Creating registrations to ensure BOTH users receive ALL 7 emails..."
    puts "   Using Gmail plus addressing (email+tag@gmail.com) to create multiple registrations"
    puts ""

    # BEAU'S REGISTRATIONS (3 total - covers all email types)

    # 1. Approved + Unpaid (will get payment reminder emails #3-4)
    registrations << Registration.create!(
      event: event,
      name: "Beau Lazear (Payment Pending)",
      email: "beaulazear+unpaid@gmail.com",
      status: "approved",
      payment_status: "pending"
    )

    # 2. Approved + Confirmed (will get event countdown emails #5-7)
    registrations << Registration.create!(
      event: event,
      name: "Beau Lazear (Confirmed)",
      email: "beaulazear+confirmed@gmail.com",
      status: "approved",
      payment_status: "confirmed"
    )

    # 3. Pending (will get application deadline emails #1-2)
    registrations << Registration.create!(
      event: event,
      name: "Beau Lazear (Pending)",
      email: "beaulazear+pending@gmail.com",
      status: "pending"
    )

    # COURTNEY'S REGISTRATIONS (3 total - covers all email types)

    # 1. Approved + Unpaid (will get payment reminder emails #3-4)
    registrations << Registration.create!(
      event: event,
      name: "Courtney Greer (Payment Pending)",
      email: "greerlcourtney+unpaid@gmail.com",
      status: "approved",
      payment_status: "pending"
    )

    # 2. Approved + Confirmed (will get event countdown emails #5-7)
    registrations << Registration.create!(
      event: event,
      name: "Courtney Greer (Confirmed)",
      email: "greerlcourtney+confirmed@gmail.com",
      status: "approved",
      payment_status: "confirmed"
    )

    # 3. Pending (will get application deadline emails #1-2)
    registrations << Registration.create!(
      event: event,
      name: "Courtney Greer (Pending)",
      email: "greerlcourtney+pending@gmail.com",
      status: "pending"
    )

    puts "✅ Created #{registrations.count} test registrations (3 per person)"
    puts ""
    puts "   📧 All emails will arrive at:"
    puts "      - beaulazear@gmail.com (receives all 3 registrations → ALL 7 emails)"
    puts "      - greerlcourtney@gmail.com (receives all 3 registrations → ALL 7 emails)"
    puts ""
    puts "   ℹ️  Gmail plus addressing used (+unpaid, +confirmed, +pending)"
    puts "      All emails arrive at the base inbox regardless of the +tag"
    puts ""
    puts "   📬 Email Distribution:"
    puts "      - Deadline reminders (#1-2) → email+pending@ registrations"
    puts "      - Payment reminders (#3-4) → email+unpaid@ registrations"
    puts "      - Event countdown (#5-7) → email+confirmed@ registrations"

    # Now compress the schedule
    puts ""
    puts "🔧 Compressing email schedule to 30-minute window..."

    scheduled_emails = event.scheduled_emails.where(status: "scheduled").order(:scheduled_for)
    base_time = Time.current
    interval_minutes = 4

    scheduled_emails.each_with_index do |email, index|
      new_time = base_time + (index * interval_minutes).minutes
      email.update!(scheduled_for: new_time)
    end

    # Print final schedule
    puts ""
    puts "📅 COMPRESSED EMAIL TIMELINE:"
    puts "-" * 80
    scheduled_emails.reload.each_with_index do |email, index|
      scheduled_time = email.scheduled_for.in_time_zone("America/New_York")
      recipient_count = RecipientFilterService.new(event, email).filter_recipients.count
      puts sprintf("  %d. %-40s → %s (%d recipients)",
        index + 1,
        email.name,
        scheduled_time.strftime("%Y-%m-%d %H:%M:%S %Z"),
        recipient_count
      )
    end

    total_duration = (scheduled_emails.count - 1) * interval_minutes
    puts ""
    puts "="*80
    puts "✅ TEST EVENT READY!"
    puts "="*80
    puts "Event Slug: #{event.slug}"
    puts "Total Emails: #{scheduled_emails.count}"
    puts "Schedule Duration: #{total_duration} minutes"
    puts ""
    puts "🚀 Next Steps:"
    puts "   1. To send emails immediately: rake email_automation:trigger_worker_now"
    puts "   2. Or wait for automatic sending (4-minute intervals)"
    puts "   3. To reset schedule: rake email_automation:reset_schedule[#{event.slug}]"
    puts ""
    puts "📧 Monitor in dashboard: /events/#{event.slug}/emails"
    puts ""
  end

  desc "Manually trigger EmailSenderWorker to send ready emails now"
  task trigger_worker_now: :environment do
    puts "\n" + "="*80
    puts "🚀 TRIGGERING EMAIL SENDER WORKER"
    puts "="*80

    # Show what emails are ready to send
    ready_emails = ScheduledEmail
      .where(status: "scheduled")
      .where("scheduled_for <= ?", Time.current)
      .where("scheduled_for >= ?", 7.days.ago)
      .order(scheduled_for: :asc)

    if ready_emails.empty?
      puts "ℹ️  No emails ready to send at this time"
      puts "   (scheduled_for must be <= current time)"
      puts ""

      # Show upcoming emails
      upcoming = ScheduledEmail
        .where(status: "scheduled")
        .where("scheduled_for > ?", Time.current)
        .order(scheduled_for: :asc)
        .limit(5)

      if upcoming.any?
        puts "📅 Upcoming scheduled emails:"
        upcoming.each do |email|
          time_until = ((email.scheduled_for - Time.current) / 60).round
          puts "   - #{email.name} in #{time_until} minutes"
        end
      end

      exit 0
    end

    puts "📧 Found #{ready_emails.count} ready to send:"
    ready_emails.each do |email|
      event_title = email.event.title rescue "Unknown Event"
      puts "   - #{email.name} (#{event_title})"
    end
    puts ""

    # Trigger worker
    puts "⚡ Enqueuing EmailSenderWorker..."
    EmailSenderWorker.perform_async

    puts "✅ Worker triggered!"
    puts ""
    puts "📊 Check Sidekiq dashboard to monitor: /sidekiq"
    puts "📧 Or check Rails logs for send results"
    puts ""
  end

  desc "Reset email schedule to normal 8-day timeline (usage: rake email_automation:reset_schedule[event_slug])"
  task :reset_schedule, [ :event_slug ] => :environment do |t, args|
    unless args[:event_slug]
      puts "❌ Error: Event slug required"
      puts "Usage: rake email_automation:reset_schedule[your-event-slug]"
      exit 1
    end

    event = Event.find_by(slug: args[:event_slug])
    unless event
      puts "❌ Error: Event not found with slug '#{args[:event_slug]}'"
      exit 1
    end

    puts "\n" + "="*80
    puts "🔄 RESETTING EMAIL SCHEDULE TO NORMAL TIMELINE"
    puts "="*80
    puts "Event: #{event.title}"
    puts ""

    # Delete existing scheduled emails (only scheduled status)
    deleted_count = event.scheduled_emails.where(status: "scheduled").destroy_all.count
    puts "🗑️  Deleted #{deleted_count} scheduled emails"

    # Regenerate emails with normal schedule
    generator = ScheduledEmailGenerator.new(event)
    emails = generator.generate
    puts "✅ Generated #{emails.count} new emails with normal schedule"

    # Print new schedule
    puts ""
    puts "📅 RESTORED EMAIL TIMELINE:"
    puts "-" * 80
    emails.each_with_index do |email, index|
      scheduled_time = email.scheduled_for.in_time_zone("America/New_York")
      days_from_now = ((email.scheduled_for - Time.current) / 1.day).round
      puts sprintf("  %d. %-40s → %s (%d days from now)",
        index + 1,
        email.name,
        scheduled_time.strftime("%Y-%m-%d %H:%M:%S %Z"),
        days_from_now
      )
    end

    puts ""
    puts "✅ Schedule reset to normal 8-day timeline"
    puts ""
  end

  desc "Cleanup all test events created by email automation tests"
  task cleanup_test_events: :environment do
    puts "\n" + "="*80
    puts "🧹 CLEANING UP TEST EVENTS"
    puts "="*80

    # Find all test events (created by this rake task or email_testing.rake)
    test_events = Event.where(
      "title LIKE ? OR title LIKE ?",
      "%30-Minute Email Test Event%",
      "%TEST EMAIL FILTERING EVENT%"
    ).order(created_at: :desc)

    if test_events.empty?
      puts "✅ No test events found - nothing to cleanup"
      puts ""
      exit 0
    end

    puts "Found #{test_events.count} test event(s):"
    puts ""
    test_events.each_with_index do |event, index|
      puts "  #{index + 1}. #{event.title}"
      puts "     Slug: #{event.slug}"
      puts "     Created: #{event.created_at.strftime('%Y-%m-%d %H:%M')}"
      puts "     Scheduled Emails: #{event.scheduled_emails.count}"
      puts "     Registrations: #{event.registrations.count}"
      puts ""
    end

    # Confirmation prompt
    print "⚠️  Delete all #{test_events.count} test events and associated data? (yes/no): "
    confirmation = STDIN.gets.chomp.downcase

    unless confirmation == "yes"
      puts "❌ Cleanup cancelled"
      exit 0
    end

    # Delete events and count associated records
    total_stats = {
      events: 0,
      scheduled_emails: 0,
      registrations: 0,
      email_deliveries: 0,
      invitations: 0
    }

    test_events.each do |event|
      puts "🗑️  Deleting: #{event.title}"

      # Count associated records before deletion
      total_stats[:scheduled_emails] += event.scheduled_emails.count
      total_stats[:registrations] += event.registrations.count
      total_stats[:email_deliveries] += event.scheduled_emails.sum { |e| e.email_deliveries.count }
      total_stats[:invitations] += event.event_invitations.count rescue 0

      # Delete event (will cascade delete associated records due to dependent: :destroy)
      event.destroy!
      total_stats[:events] += 1
    end

    puts ""
    puts "="*80
    puts "✅ CLEANUP COMPLETE!"
    puts "="*80
    puts "Deleted records:"
    puts "  📅 Events: #{total_stats[:events]}"
    puts "  📧 Scheduled Emails: #{total_stats[:scheduled_emails]}"
    puts "  👥 Registrations: #{total_stats[:registrations]}"
    puts "  📬 Email Deliveries: #{total_stats[:email_deliveries]}"
    puts "  📨 Invitations: #{total_stats[:invitations]}" if total_stats[:invitations] > 0
    puts ""
    puts "🎉 All test data cleaned up successfully!"
    puts ""
  end
end
