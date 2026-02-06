# Test script to send application received emails
# Usage: bin/rails runner test_email_templates.rb

# Find or create a test event
event = Event.find_by(title: "Test") || Event.first

if event.nil?
  puts "❌ No events found. Please create an event first."
  exit
end

# Find or create a test registration
registration = Registration.where(event: event).first

if registration.nil?
  puts "❌ No registrations found for event: #{event.title}"
  puts "Creating a test registration..."

  # Create test vendor contact
  vendor_contact = VendorContact.create!(
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    organization: event.organization
  )

  # Create test vendor application
  vendor_app = VendorApplication.create!(
    name: "Artists",
    event: event,
    organization: event.organization
  )

  # Create test registration
  registration = Registration.create!(
    vendor_contact: vendor_contact,
    vendor_application: vendor_app,
    event: event,
    organization: event.organization,
    status: "pending"
  )
end

puts "📧 Sending test emails..."
puts "Event: #{event.title}"
puts "Registration ID: #{registration.id}"
puts ""

# Send artist application received email
puts "Sending Artist Application Received email..."
begin
  RegistrationEmailService.send_vendor_submission_confirmation(registration)
  puts "✅ Artist email sent to #{registration.email}"
rescue => e
  puts "❌ Error sending artist email: #{e.message}"
  puts e.backtrace.first(5)
end

puts ""
puts "✅ Test emails sent!"
puts ""
puts "Note: To send vendor table email, update the registration's vendor_application"
puts "to have a name containing 'table' or 'vendor'"
