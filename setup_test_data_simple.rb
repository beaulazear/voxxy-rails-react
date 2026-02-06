# Simple Setup Test Data - Works with ANY existing user/org
# Run in Rails console: load 'setup_test_data_simple.rb'

puts "\n=== SETTING UP TEST DATA (SIMPLE) ===\n\n"

# Find ANY user with an organization
user = User.joins(:organizations).first
if user.nil?
  puts "❌ No users with organizations found."
  puts "   Creating a test user and organization..."

  user = User.create!(
    email: "test@voxxypresents.com",
    password: "password123",
    password_confirmation: "password123",
    role: "venue_owner",
    product_context: "presents"
  )
  puts "✓ Created test user: #{user.email}"
end

puts "✓ Using user: #{user.email}"

# Find or create organization
org = user.organizations.first
if org.nil?
  puts "\n⚠️  No organization found. Creating test organization..."
  org = Organization.create!(
    user: user,
    name: "Voxxy Test Organization",
    email: user.email,
    reply_to_email: user.email,
    reply_to_name: "Voxxy Team"
  )
  puts "✓ Created organization: #{org.name}"
else
  puts "✓ Using organization: #{org.name} (ID: #{org.id})"
end

# Find or create test event
event = org.events.find_by(slug: "phase1-test-event")
if event.nil?
  puts "\n⚠️  Creating test event..."
  event = org.events.create!(
    title: "Phase 1 Test Event",
    slug: "phase1-test-event",
    description: "Test event for category-specific application links",
    location: "Denver, CO",
    venue: "Test Venue",
    event_date: 1.month.from_now,
    application_deadline: 2.weeks.from_now,
    event_type: "market",
    status: "published"
  )
  puts "✓ Created event: #{event.title}"
else
  puts "✓ Using existing event: #{event.title}"
end

# Create or update Artists vendor application
artist_app = event.vendor_applications.find_or_initialize_by(name: "Artists")
artist_app.assign_attributes(
  description: "For visual artists, painters, sculptors, photographers, body painters",
  status: "active",
  booth_price: 150.00,
  install_date: event.event_date - 1.day,
  install_start_time: "9:00 AM",
  install_end_time: "12:00 PM"
)

if artist_app.save
  puts "✓ #{artist_app.persisted? ? 'Updated' : 'Created'} vendor application: Artists (ID: #{artist_app.id})"
else
  puts "❌ Failed to save Artists application: #{artist_app.errors.full_messages.join(', ')}"
end

# Create or update Vendors vendor application
vendor_app = event.vendor_applications.find_or_initialize_by(name: "Vendors")
vendor_app.assign_attributes(
  description: "For table vendors selling clothing, jewelry, and other merchandise",
  status: "active",
  booth_price: 100.00,
  install_date: event.event_date - 1.day,
  install_start_time: "9:00 AM",
  install_end_time: "12:00 PM"
)

if vendor_app.save
  puts "✓ #{vendor_app.persisted? ? 'Updated' : 'Created'} vendor application: Vendors (ID: #{vendor_app.id})"
else
  puts "❌ Failed to save Vendors application: #{vendor_app.errors.full_messages.join(', ')}"
end

# Create or find test vendor contact
# Use YOUR actual email here so you can receive the test email
test_email = "#{user.email.split('@').first}+testvendor@#{user.email.split('@').last}"
vendor_contact = org.vendor_contacts.find_or_initialize_by(email: test_email)
vendor_contact.assign_attributes(
  name: "John Smith",
  business_name: "Art Studio Co",
  phone: "555-1234"
)

if vendor_contact.save
  puts "✓ #{vendor_contact.persisted? ? 'Updated' : 'Created'} vendor contact: #{vendor_contact.email}"
else
  puts "❌ Failed to save vendor contact: #{vendor_contact.errors.full_messages.join(', ')}"
end

puts "\n=== TEST DATA READY ===\n\n"
puts "User: #{user.email}"
puts "Organization: #{org.name}"
puts "Event: #{event.title} (#{event.slug})"
puts "Vendor Applications: #{event.vendor_applications.active.count}"
puts "  - Artists (ID: #{artist_app.id})"
puts "  - Vendors (ID: #{vendor_app.id})"
puts "Vendor Contact: #{vendor_contact.email}"
puts "\n✅ Setup complete! Now run: load 'test_phase1_invitation.rb'\n\n"
