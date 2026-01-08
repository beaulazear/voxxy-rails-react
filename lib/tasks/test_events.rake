# lib/tasks/test_events.rake
namespace :events do
  desc "Create a test event with vendor application, contacts, invitations, and sample submissions"
  task :create_test, [ :event_title ] => :environment do |t, args|
    puts "🎪 Creating test event..."
    puts ""

    # Find your user account
    test_user = User.find_by!(email: "beaulazear@gmail.com")

    # Ensure user has correct role for creating events
    unless test_user.role == "venue_owner" || test_user.role == "producer" || test_user.admin?
      test_user.update!(role: "venue_owner")
      puts "⚠️  Updated user role to venue_owner"
    end

    # Find or create organization for this user
    org = test_user.organizations.first || Organization.create!(
      user: test_user,
      name: "Beau's Test Venue",
      description: "Test venue for development",
      city: "New York",
      state: "NY",
      verified: true,
      active: true
    )

    puts "✅ Organization: #{org.name}"

    # Generate event with randomized data
    timestamp = Time.current.strftime("%m%d-%H%M")
    event_title = args[:event_title] || "Test Event #{timestamp}"
    event_date = rand(14..60).days.from_now
    application_deadline = event_date - rand(7..14).days

    event = Event.create!(
      organization: org,
      title: event_title,
      description: "This is a test event created via Rake task for development testing. Created at #{Time.current}.",
      event_date: event_date,
      event_end_date: event_date + 6.hours,
      application_deadline: application_deadline,
      location: "123 Test Street, New York, NY 10001",
      ticket_price: [ 25, 35, 50, 75 ].sample,
      capacity: [ 100, 200, 300, 500 ].sample,
      published: true,
      registration_open: true,
      status: "published"
    )

    puts "✅ Event created: #{event.title}"
    puts "   📅 Date: #{event.event_date.strftime('%B %d, %Y')}"
    puts "   🔗 Slug: #{event.slug}"
    puts "   ⏰ Application deadline: #{application_deadline.strftime('%B %d, %Y')}"

    # Create vendor application with categories
    vendor_app = VendorApplication.create!(
      event: event,
      name: "#{event_title} - Vendor Application",
      description: "Apply to be a vendor at this exciting event!",
      status: "active",
      booth_price: [ 100, 150, 200, 250, 300 ].sample,
      categories: [ "Food", "Art", "Music", "Crafts", "Retail", "Services" ]
    )

    puts "✅ Vendor Application created"
    puts "   💰 Booth price: $#{vendor_app.booth_price}"
    puts "   🏷️  Categories: #{vendor_app.categories.join(', ')}"
    puts "   🔢 Shareable code: #{vendor_app.shareable_code}"

    # Create or find your test contact
    your_contact = VendorContact.find_or_create_by!(
      organization: org,
      email: "beaulazear@gmail.com"
    ) do |c|
      c.name = "Beau Lazear"
      c.business_name = "Beau Test Business"
      c.contact_type = "vendor"
      c.status = "new"
      c.source = "manual"
    end

    puts "✅ Your test contact ready: #{your_contact.email}"

    # Create additional random vendor contacts
    vendor_names = [
      { name: "Sarah Johnson", business: "Artisan Breads Co", type: "Food" },
      { name: "Mike Chen", business: "Urban Art Studio", type: "Art" },
      { name: "Emily Rodriguez", business: "Handcrafted Jewelry", type: "Crafts" },
      { name: "James Wilson", business: "Live Music Productions", type: "Music" },
      { name: "Lisa Anderson", business: "Organic Treats", type: "Food" }
    ]

    created_contacts = [ your_contact ]

    vendor_names.each do |vendor_data|
      contact = VendorContact.create!(
        organization: org,
        name: vendor_data[:name],
        business_name: vendor_data[:business],
        email: "#{vendor_data[:name].parameterize}@example.com",
        phone: "(555) #{rand(100..999)}-#{rand(1000..9999)}",
        contact_type: "vendor",
        status: [ "new", "contacted", "interested" ].sample,
        source: "manual",
        tags: [ vendor_data[:type] ]
      )
      created_contacts << contact
    end

    puts "✅ Created #{created_contacts.length} vendor contacts"

    # Create batch invitations
    invitation_tokens = []
    created_contacts.each do |contact|
      invitation = EventInvitation.create!(
        event: event,
        vendor_contact: contact,
        status: "sent",
        sent_at: Time.current,
        expires_at: application_deadline
      )
      invitation_tokens << invitation.invitation_token
    end

    puts "✅ Sent #{invitation_tokens.length} invitations"
    puts "   🔗 Your test invitation: /invitations/#{EventInvitation.find_by(vendor_contact: your_contact).invitation_token}"

    # Create sample vendor applications (registrations)
    sample_applications = [
      { name: "Alex Martinez", business: "Taco Fiesta", category: "Food", status: "pending" },
      { name: "Rachel Kim", business: "Pottery Paradise", category: "Art", status: "pending" },
      { name: "Tom Williams", business: "DJ Tom Productions", category: "Music", status: "approved" }
    ]

    sample_applications.each do |app_data|
      reg = Registration.create!(
        event: event,
        vendor_application: vendor_app,
        name: app_data[:name],
        email: "#{app_data[:name].parameterize}@example.com",
        phone: "(555) #{rand(100..999)}-#{rand(1000..9999)}",
        business_name: app_data[:business],
        vendor_category: app_data[:category],
        status: app_data[:status]
      )
    end

    puts "✅ Created #{sample_applications.length} sample vendor applications"

    puts ""
    puts "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    puts "🎉 TEST EVENT CREATED SUCCESSFULLY!"
    puts "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    puts ""
    puts "📋 EVENT DETAILS:"
    puts "   Title: #{event.title}"
    puts "   Slug: #{event.slug}"
    puts "   ID: #{event.id}"
    puts ""
    puts "🔗 FRONTEND URLS (assuming localhost:5173):"
    puts "   Public Event Page: http://localhost:5173/events/#{event.slug}"
    puts "   Application Form: http://localhost:5173/events/#{event.slug}/apply"
    puts "   Your Test Invitation: http://localhost:5173/invitations/#{EventInvitation.find_by(vendor_contact: your_contact).invitation_token}"
    puts "   Shareable Application Link: http://localhost:5173/apply/#{vendor_app.shareable_code}"
    puts ""
    puts "📊 STATISTICS:"
    puts "   Vendor Contacts: #{created_contacts.length}"
    puts "   Invitations Sent: #{invitation_tokens.length}"
    puts "   Sample Applications: #{sample_applications.length}"
    puts "   Booth Price: $#{vendor_app.booth_price}"
    puts ""
    puts "💡 NEXT STEPS:"
    puts "   1. Visit the producer dashboard to see the event"
    puts "   2. Check your test invitation link above"
    puts "   3. Review sample applications in Command Center"
    puts ""
    puts "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  end

  desc "Clean up all test events (removes events with 'Test Event' in title from your organization)"
  task cleanup_test: :environment do
    puts "🧹 Cleaning up test events..."

    test_user = User.find_by(email: "beaulazear@gmail.com")
    unless test_user
      puts "❌ User beaulazear@gmail.com not found"
      next
    end

    org = test_user.organizations.first
    unless org
      puts "ℹ️  No organization found for user"
      next
    end

    test_events = org.events.where("title LIKE ?", "%Test Event%")
    count = test_events.count

    if count > 0
      test_events.destroy_all
      puts "✅ Deleted #{count} test events from #{org.name}"
    else
      puts "ℹ️  No test events found to clean up"
    end
  end

  desc "List all test events from your organization"
  task list_test: :environment do
    puts "📋 Test Events:"
    puts ""

    test_user = User.find_by(email: "beaulazear@gmail.com")
    unless test_user
      puts "❌ User beaulazear@gmail.com not found"
      next
    end

    org = test_user.organizations.first
    unless org
      puts "ℹ️  No organization found for user"
      next
    end

    test_events = org.events.where("title LIKE ?", "%Test Event%").order(created_at: :desc)

    if test_events.any?
      puts "Organization: #{org.name}"
      puts ""
      test_events.each do |event|
        puts "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        puts "#{event.title}"
        puts "   Slug: #{event.slug}"
        puts "   Date: #{event.event_date.strftime('%B %d, %Y')}"
        puts "   Applications: #{event.vendor_applications.first&.submissions_count || 0}"
        puts "   Created: #{event.created_at.strftime('%Y-%m-%d %H:%M')}"
        puts "   URL: http://localhost:5173/events/#{event.slug}"
      end
      puts "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      puts ""
      puts "Total: #{test_events.count} test events"
    else
      puts "No test events found for #{org.name}"
    end
  end
end
