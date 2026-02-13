# Setup Test Data for Category-Specific Application Links
# Run in Rails console: load 'setup_test_data.rb'

puts "\n=== SETTING UP TEST DATA ===\n\n"

# Find admin user (team@voxxypresents.com)
admin_user = User.find_by(email: "team@voxxypresents.com")
if admin_user.nil?
  puts "❌ Admin user not found (team@voxxypresents.com)"
  puts "   Please create this user first or use a different email"
  exit
end

puts "✓ Found admin user: #{admin_user.email}"

# Find or create organization
org = admin_user.organizations.first
if org.nil?
  puts "\n⚠️  No organization found for admin user. Creating test organization..."
  org = Organization.create!(
    user: admin_user,
    name: "Test Organization",
    email: "team@voxxypresents.com",
    reply_to_email: "team@voxxypresents.com",
    reply_to_name: "Voxxy Presents Team",
    timezone: "America/Los_Angeles"
  )
  puts "✓ Created organization: #{org.name}"
else
  puts "✓ Using organization: #{org.name} (ID: #{org.id})"
end

# Get timezone for date calculations
timezone = org.timezone || "America/Los_Angeles"
tz = ActiveSupport::TimeZone[timezone]
puts "✓ Using timezone: #{timezone}"

# Find or create test event
event = org.events.find_by(slug: "phase1-test-event")
if event.nil?
  puts "\n⚠️  Creating test event..."
  # Calculate dates in the organization's timezone at midnight
  event_date = tz.now.beginning_of_day + 1.month
  application_deadline = tz.now.beginning_of_day + 2.weeks

  event = org.events.create!(
    title: "Phase 1 Test Event",
    slug: "phase1-test-event",
    description: "Test event for category-specific application links",
    location: "Denver, CO",
    venue: "Test Venue",
    event_date: event_date,
    application_deadline: application_deadline,
    event_type: "market",
    status: "published"
  )
  puts "✓ Created event: #{event.title} (Event Date: #{event_date.strftime('%Y-%m-%d')})"
else
  puts "✓ Using existing event: #{event.title}"
end

# Calculate install date in the organization's timezone (one day before event)
install_date = event.event_date.in_time_zone(timezone).beginning_of_day - 1.day

# Create or update Artists vendor application
artist_app = event.vendor_applications.find_or_initialize_by(name: "Artists")
artist_app.assign_attributes(
  description: "For visual artists, painters, sculptors, photographers, body painters",
  status: "active",
  booth_price: 150.00,
  install_date: install_date,
  install_start_time: "9:00 AM",
  install_end_time: "12:00 PM"
)
if artist_app.save
  puts "✓ #{artist_app.new_record? ? 'Created' : 'Updated'} vendor application: Artists (ID: #{artist_app.id}, Install: #{install_date.strftime('%Y-%m-%d')})"
else
  puts "❌ Failed to save Artists application: #{artist_app.errors.full_messages.join(', ')}"
end

# Create or update Vendors vendor application
vendor_app = event.vendor_applications.find_or_initialize_by(name: "Vendors")
vendor_app.assign_attributes(
  description: "For table vendors selling clothing, jewelry, and other merchandise",
  status: "active",
  booth_price: 100.00,
  install_date: install_date,
  install_start_time: "9:00 AM",
  install_end_time: "12:00 PM"
)
if vendor_app.save
  puts "✓ #{vendor_app.new_record? ? 'Created' : 'Updated'} vendor application: Vendors (ID: #{vendor_app.id}, Install: #{install_date.strftime('%Y-%m-%d')})"
else
  puts "❌ Failed to save Vendors application: #{vendor_app.errors.full_messages.join(', ')}"
end

# Create or find test vendor contact
vendor_contact = org.vendor_contacts.find_or_initialize_by(email: "test.vendor@example.com")
vendor_contact.assign_attributes(
  name: "John Smith",
  business_name: "Art Studio Co",
  phone: "555-1234"
)
if vendor_contact.save
  puts "✓ #{vendor_contact.new_record? ? 'Created' : 'Updated'} vendor contact: #{vendor_contact.email}"
else
  puts "❌ Failed to save vendor contact: #{vendor_contact.errors.full_messages.join(', ')}"
end

puts "\n=== TEST DATA READY ===\n\n"
puts "Event: #{event.title} (#{event.slug})"
puts "Vendor Applications: #{event.vendor_applications.active.count}"
puts "  - Artists (ID: #{artist_app.id})"
puts "  - Vendors (ID: #{vendor_app.id})"
puts "Vendor Contact: #{vendor_contact.email}"
puts "\n✅ Setup complete! Now run: load 'test_phase1_invitation.rb'\n\n"
