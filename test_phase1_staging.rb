# Phase 1 Test Script for STAGING
# Run in staging Rails console: load 'test_phase1_staging.rb'

puts "\n=== PHASE 1 TEST: Category-Specific Application Links (STAGING) ===\n\n"

# Find ANY event with active vendor applications in staging
event = Event.includes(:vendor_applications, :organization)
           .joins(:vendor_applications)
           .where(vendor_applications: { status: 'active' })
           .last

if event.nil?
  puts "❌ No events with active vendor applications found in staging."
  puts "   Let's create test data..."

  # Find any organization
  org = Organization.first
  if org.nil?
    puts "❌ No organizations found. Cannot proceed."
    exit
  end

  puts "✓ Using organization: #{org.name}"

  # Create test event
  event = org.events.create!(
    title: "Test Event for Category Links",
    slug: "test-category-links-#{Time.now.to_i}",
    location: "Denver, CO",
    venue: "Test Venue",
    event_date: 1.month.from_now,
    application_deadline: 2.weeks.from_now,
    event_type: "market",
    status: "published"
  )
  puts "✓ Created event: #{event.title}"

  # Create Artists application
  artist = event.vendor_applications.create!(
    name: "Artists",
    status: "active",
    booth_price: 150
  )
  puts "✓ Created Artists vendor application (ID: #{artist.id})"

  # Create Vendors application
  vendor = event.vendor_applications.create!(
    name: "Vendors",
    status: "active",
    booth_price: 100
  )
  puts "✓ Created Vendors vendor application (ID: #{vendor.id})"
end

puts "✓ Using event: #{event.title} (slug: #{event.slug})"

# Check for vendor applications
vendor_apps = event.vendor_applications.active
if vendor_apps.empty?
  puts "❌ No active vendor applications found."
  exit
end

puts "✓ Found #{vendor_apps.count} vendor application(s):"
vendor_apps.each do |app|
  puts "  - #{app.name} (ID: #{app.id})"
end

# Find or create vendor contact
org = event.organization
vendor_contact = org.vendor_contacts.first

if vendor_contact.nil?
  puts "\n⚠️  No vendor contacts found. Creating test contact..."
  vendor_contact = org.vendor_contacts.create!(
    name: "Test Vendor",
    email: "courtney@voxxypresents.com",  # Use your email!
    business_name: "Test Business"
  )
  puts "✓ Created vendor contact: #{vendor_contact.email}"
else
  puts "✓ Using vendor contact: #{vendor_contact.email}"
end

# Find or create invitation
invitation = EventInvitation.find_or_create_by!(
  event: event,
  vendor_contact: vendor_contact
)
puts "✓ Using invitation with token: #{invitation.invitation_token[0..10]}..."

puts "\n--- Testing URL Generation ---\n"

# Test vendor_application_links method
links = invitation.vendor_application_links
puts "✓ Generated #{links.count} application link(s):\n\n"

links.each_with_index do |link, index|
  puts "#{index + 1}. Category: #{link[:name]}"
  puts "   URL: #{link[:url]}"
  puts ""
end

puts "--- Testing Email Send ---\n"

# Send test email
begin
  EventInvitationMailer.invitation_email(invitation).deliver_now
  puts "✅ Test email sent to: #{vendor_contact.email}\n"
  puts "📧 Check your email inbox for the invitation!"
  puts ""
  puts "Expected email content:"
  puts "- Subject: '#{event.title} is coming in #{event.location || 'your area'}'"
  puts "- Body contains: 'Submit your work below:'"
  puts "- ARTIST/GALLERY SUBMISSIONS - Apply Here"
  puts "- VENDOR/TABLE SUBMISSIONS - Apply Here"
  puts "- Custom descriptions for each category"
  puts "- If you're unable to participate, please click here..."
  puts ""
rescue => e
  puts "❌ Error sending email: #{e.message}"
  puts "   #{e.backtrace.first(3).join('\n   ')}"
  exit
end

puts "\n=== VERIFICATION CHECKLIST ===\n"
puts "[ ] Email received in inbox"
puts "[ ] Subject: '#{event.title} is coming in #{event.location || 'your area'}'"
puts "[ ] Email shows custom category descriptions (not generic text)"
puts "[ ] Links are clickable and styled correctly"
puts "[ ] URL format: /events/#{event.slug}/[vendor-app-id]/apply?token=..."
puts "[ ] ARTIST/GALLERY SUBMISSIONS link present"
puts "[ ] VENDOR/TABLE SUBMISSIONS link present"
puts "[ ] Unsubscribe text at bottom: 'If you're unable to participate...'"
puts ""
puts "✅ Phase 1 Complete! Ready for your review.\n\n"
