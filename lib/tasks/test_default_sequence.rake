# frozen_string_literal: true

# Rake task for testing the new "Default Sequence" template with 22 emails
# Uses Artist/Vendor categories for testing category-specific email filtering

namespace :email_automation do
  desc "Create test event with Default Sequence (22 emails) using compressed schedule"
  task create_test_event_with_default_sequence: :environment do
    puts "\n" + "="*80
    puts "🎨 CREATING TEST EVENT WITH DEFAULT SEQUENCE (22 EMAILS)"
    puts "="*80

    # Find test user
    test_user = User.find_by(email: "beaulazear@gmail.com")

    unless test_user
      puts "❌ Error: User beaulazear@gmail.com not found"
      puts "   Please create a user account first or log in to the platform"
      exit 1
    end

    # Use user's actual organization so events appear in their account
    org = test_user.organizations.first

    unless org
      puts "❌ Error: User has no organizations"
      exit 1
    end

    # Update email to noreply@voxxypresents.com for consistency
    if org.email != "noreply@voxxypresents.com"
      org.update!(email: "noreply@voxxypresents.com")
    end

    puts "✅ Organization: #{org.name}"
    puts "   📧 Email: #{org.email}"
    puts "   Owner: #{test_user.email}"

    # Find the Default Sequence template
    default_sequence = EmailCampaignTemplate.find_by(
      template_type: "system",
      name: "Default Sequence"
    )

    unless default_sequence
      puts "❌ Error: Default Sequence template not found"
      puts "   Run: bundle exec rails runner db/seeds/default_sequence_template.rb"
      exit 1
    end

    puts "✅ Found Default Sequence template (#{default_sequence.email_template_items.count} email templates)"

    # Create event (8 days out - normal timeline)
    event = Event.create!(
      organization: org,
      title: "Default Sequence Test #{Time.current.strftime('%m/%d %H:%M')}",
      slug: "sequence-test-#{SecureRandom.hex(6)}",
      event_date: 8.days.from_now.to_date,
      event_end_date: 8.days.from_now.to_date,
      application_deadline: 5.days.from_now.to_date,
      payment_deadline: 7.days.from_now.to_date,
      start_time: "10:00",
      venue: "Test Venue",
      location: "Brooklyn, NY",
      age_restriction: "21",
      published: true,
      description: "Test event for Default Sequence template with Artist/Vendor categories",
      email_campaign_template: default_sequence  # 🔑 Use the new sequence!
    )
    puts "✅ Event created: #{event.title}"
    puts "   Slug: #{event.slug}"
    puts "   Event date: #{event.event_date}"
    puts "   Template: #{default_sequence.name}"

    # Generate scheduled emails from Default Sequence template
    generator = ScheduledEmailGenerator.new(event)
    emails = generator.generate
    puts "✅ Generated #{emails.count} scheduled emails from Default Sequence"
    puts ""

    # Create vendor applications (Artist and Vendor categories)
    puts "📋 Creating vendor applications (Artist & Vendor categories)..."

    artist_app = VendorApplication.create!(
      event: event,
      name: "Artist Application",
      categories: [ "Painting", "Sculpture", "Photography" ],
      booth_price: 20.00,  # Early rate
      install_date: event.event_date - 1.day,
      install_start_time: "6:00 AM",
      install_end_time: "9:00 AM",
      payment_link: "https://payment.example.com/artist",
      status: "active",
      description: "Apply to exhibit your artwork (2-10 pieces, max 3ft x 3ft)"
    )

    vendor_app = VendorApplication.create!(
      event: event,
      name: "Vendor Table Application",
      categories: [ "Jewelry", "Clothing", "Handmade Goods" ],
      booth_price: 150.00,
      install_date: event.event_date - 1.day,
      install_start_time: "7:00 AM",
      install_end_time: "10:00 AM",
      payment_link: "https://payment.example.com/vendor",
      status: "active",
      description: "Apply for a vendor table (6ft table area)"
    )

    puts "✅ Created 2 vendor applications:"
    puts "   - Artist ($20/piece)"
    puts "   - Vendor Table ($150)"
    puts ""

    # Create vendor contacts and send invitations
    puts "📨 Creating vendor contacts and sending invitations..."

    test_emails = [
      "beaulazear@gmail.com",
      "beau09946@gmail.com",
      "beaulazear@voxxyai.com"
    ]

    contacts = []
    test_emails.each do |email|
      contacts << VendorContact.create!(
        organization: org,
        name: email.split("@").first.titleize,
        email: email,
        contact_type: "vendor"
      )
    end

    puts "✅ Created #{contacts.count} vendor contacts"

    # Create and send invitations
    invitations = []
    contacts.each do |contact|
      invitation = EventInvitation.create!(
        event: event,
        vendor_contact: contact,
        status: "sent",
        sent_at: Time.current
      )
      invitations << invitation

      # Send invitation email immediately
      EventInvitationMailer.invitation_email(invitation).deliver_now
    end

    puts "✅ Sent #{invitations.count} invitations"
    puts "   📧 Invitations sent to:"
    test_emails.each { |email| puts "      - #{email}" }
    puts ""

    # Activate all paused scheduled emails
    paused_emails = event.scheduled_emails.where(status: "paused")
    if paused_emails.any?
      paused_emails.update_all(status: "scheduled")
      puts "✅ Activated #{paused_emails.count} scheduled emails (changed from paused → scheduled)"
    end

    # Mark event as live
    event.update!(is_live: true)
    puts "✅ Event marked as LIVE"
    puts ""

    # Create test registrations for ARTISTS (will receive Artist emails)
    puts "🎨 Creating ARTIST registrations (will receive Artist-specific emails)..."

    # BEAU - Artist registrations
    artist_registrations = []

    # 1. Artist - Pending (gets art call emails)
    artist_registrations << event.registrations.create!(
      name: "Beau Lazear",
      email: "beaulazear+artist-pending@gmail.com",
      business_name: "Beau's Art Studio",
      vendor_category: "Artist",  # 🎨 ARTIST category
      status: "pending",
      payment_status: "pending",
      vendor_application: artist_app
    )

    # 2. Artist - Approved + Unpaid (gets artist payment reminders)
    artist_registrations << event.registrations.create!(
      name: "Beau Lazear",
      email: "beaulazear+artist-unpaid@gmail.com",
      business_name: "Beau's Gallery",
      vendor_category: "Artist",  # 🎨 ARTIST category
      status: "approved",
      payment_status: "pending",
      vendor_application: artist_app
    )

    # 3. Artist - Confirmed (gets artist countdown emails)
    artist_registrations << event.registrations.create!(
      name: "Beau Lazear",
      email: "beaulazear+artist-confirmed@gmail.com",
      business_name: "Beau's Art Collective",
      vendor_category: "Artist",  # 🎨 ARTIST category
      status: "confirmed",
      payment_status: "confirmed",
      payment_confirmed_at: Time.current,
      vendor_application: artist_app
    )

    puts "✅ Created #{artist_registrations.count} ARTIST registrations"
    puts ""

    # Create test registrations for VENDORS (will receive Vendor emails)
    puts "🛒 Creating VENDOR registrations (will receive Vendor-specific emails)..."

    vendor_registrations = []

    # 1. Vendor - Approved + Unpaid (gets vendor payment reminders)
    vendor_registrations << event.registrations.create!(
      name: "Beau Lazear",
      email: "beaulazear+vendor-unpaid@gmail.com",
      business_name: "Beau's Handmade Jewelry",
      vendor_category: "Vendor",  # 🛒 VENDOR category
      status: "approved",
      payment_status: "pending",
      vendor_application: vendor_app
    )

    # 2. Vendor - Confirmed (gets vendor countdown emails)
    vendor_registrations << event.registrations.create!(
      name: "Beau Lazear",
      email: "beaulazear+vendor-confirmed@gmail.com",
      business_name: "Beau's Vintage Clothing",
      vendor_category: "Vendor",  # 🛒 VENDOR category
      status: "confirmed",
      payment_status: "confirmed",
      payment_confirmed_at: Time.current,
      vendor_application: vendor_app
    )

    puts "✅ Created #{vendor_registrations.count} VENDOR registrations"
    puts ""

    total_registrations = artist_registrations.count + vendor_registrations.count
    puts "📊 Total registrations: #{total_registrations}"
    puts "   🎨 Artists: #{artist_registrations.count} (pending, unpaid, confirmed)"
    puts "   🛒 Vendors: #{vendor_registrations.count} (unpaid, confirmed)"
    puts ""
    puts "   📧 All emails will arrive at: beaulazear@gmail.com"
    puts "      (using +artist-pending, +artist-unpaid, +artist-confirmed, +vendor-unpaid, +vendor-confirmed)"
    puts ""

    # Now compress the schedule
    puts "🔧 Compressing email schedule to ~90-minute window (22 emails × 4min = 88min)..."

    scheduled_emails = event.scheduled_emails.where(status: "scheduled").order(:scheduled_for)
    base_time = Time.current
    interval_minutes = 4

    scheduled_emails.each_with_index do |email, index|
      new_time = base_time + (index * interval_minutes).minutes
      email.update!(scheduled_for: new_time)
    end

    # Print final schedule with category filtering
    puts ""
    puts "📅 COMPRESSED EMAIL TIMELINE (22 EMAILS):"
    puts "-" * 100
    scheduled_emails.reload.each_with_index do |email, index|
      scheduled_time = email.scheduled_for.in_time_zone("America/New_York")

      # Show which category this email targets
      category_filter = email.filter_criteria&.dig("vendor_category") || "All"
      recipient_count = RecipientFilterService.new(event, email.filter_criteria).filter_recipients.count

      puts sprintf("  %2d. %-45s → %s | %s (%d recipients)",
        index + 1,
        email.name,
        scheduled_time.strftime("%H:%M:%S"),
        category_filter.ljust(8),
        recipient_count
      )
    end

    total_duration = (scheduled_emails.count - 1) * interval_minutes
    puts ""
    puts "="*100
    puts "✅ TEST EVENT READY FOR DEFAULT SEQUENCE TEST!"
    puts "="*100
    puts ""
    puts "📊 EVENT SUMMARY:"
    puts "   Event Slug: #{event.slug}"
    puts "   Email Template: Default Sequence (22 emails)"
    puts "   Vendor Applications: #{event.vendor_applications.count} (Artist, Vendor)"
    puts "   Invitations: #{event.event_invitations.count}"
    puts "   Registrations: #{total_registrations} (#{artist_registrations.count} artists, #{vendor_registrations.count} vendors)"
    puts "   Scheduled Emails: #{scheduled_emails.count}"
    puts "   Schedule Duration: #{total_duration} minutes (~#{(total_duration/60.0).round(1)} hours)"
    puts ""
    puts "📧 EMAIL BREAKDOWN (Default Sequence):"
    puts "   🎨 ARTIST-ONLY EMAILS:"
    artist_emails = scheduled_emails.select { |e| e.filter_criteria&.dig("vendor_category") == "Artist" }
    puts "      - #{artist_emails.count} emails (art calls, artist payment, artist countdown)"
    puts "      - Recipients: beaulazear+artist-* emails"
    puts ""
    puts "   🛒 VENDOR-ONLY EMAILS:"
    vendor_emails = scheduled_emails.select { |e| e.filter_criteria&.dig("vendor_category") == "Vendor" }
    puts "      - #{vendor_emails.count} emails (vendor payment, vendor countdown)"
    puts "      - Recipients: beaulazear+vendor-* emails"
    puts ""
    puts "   📨 ALL CONTACTS (no category filter):"
    general_emails = scheduled_emails.select { |e| e.filter_criteria&.dig("vendor_category").nil? }
    puts "      - #{general_emails.count} emails (invitations, general announcements)"
    puts ""
    puts "⏰ AUTOMATED SENDING:"
    puts "   EmailSenderWorker runs every 5 minutes"
    puts "   First email: #{scheduled_emails.first.scheduled_for.in_time_zone('America/New_York').strftime('%H:%M:%S %Z')}"
    puts "   Last email:  #{scheduled_emails.last.scheduled_for.in_time_zone('America/New_York').strftime('%H:%M:%S %Z')}"
    puts ""
    puts "🚀 NEXT STEPS:"
    puts "   Option 1 (Manual): rake email_automation:trigger_worker_now"
    puts "               Trigger worker every ~5 minutes to send next batch"
    puts ""
    puts "   Option 2 (Automatic): Wait - emails will send automatically over ~#{(total_duration/60.0).round(1)} hours"
    puts ""
    puts "   Monitor: /events/#{event.slug}/emails"
    puts "   Cleanup: rake email_automation:cleanup_test_events"
    puts ""
    puts "📬 CHECK YOUR INBOX:"
    puts "   beaulazear@gmail.com will receive:"
    puts "   - 3 invitation emails (already sent)"
    puts "   - 5 registration confirmation emails (already sent)"
    puts "   - 22 scheduled emails (will send automatically)"
    puts ""
  end
end
