# Phase 3 Test Script: Application Received Email (No Payment Info)
# Run in Rails console: load 'test_phase3_application_received.rb'

puts "\n=== PHASE 3 TEST: Application Received Email ===\n\n"

# Find most recent vendor registration (or create one for testing)
registration = Registration.where(vendor_registration: true).last

if registration.nil?
  puts "❌ No vendor registrations found."
  puts "   Creating test registration..."

  # Find an event with vendor applications
  event = Event.joins(:vendor_applications)
              .where(vendor_applications: { status: 'active' })
              .last

  if event.nil?
    puts "❌ No events with active vendor applications found."
    puts "   Please run: load 'test_phase1_staging.rb' first"
    exit
  end

  vendor_app = event.vendor_applications.active.first

  # Create test registration
  registration = Registration.create!(
    event: event,
    vendor_application: vendor_app,
    vendor_registration: true,
    name: "Test Vendor User",
    email: "team@voxxypresents.com",
    business_name: "Test Business LLC",
    vendor_category: vendor_app.name,
    phone: "303-555-0100",
    instagram_handle: "@testbusiness",
    status: "pending"
  )

  puts "✓ Created test registration (ID: #{registration.id})"
end

puts "✓ Using registration for: #{registration.business_name}"
puts "✓ Event: #{registration.event.title}"
puts "✓ Email: #{registration.email}"
puts "✓ Category: #{registration.vendor_category}"

puts "\n--- Testing Email Send ---\n"

# Send Application Received email
begin
  RegistrationEmailService.send_confirmation(registration)
  puts "✅ Application Received email sent to: #{registration.email}\n"
  puts "📧 Check your email inbox!\n"
  puts ""
  puts "Expected email content:"
  puts "- Subject: 'Application Received - #{registration.event.title}'"
  puts "- Greeting: 'Hi #{registration.name.split(' ').first},' or 'Hi #{registration.business_name},'"
  puts "- Body: 'Thanks for submitting your application...'"
  puts "- Body: 'IMPORTANT: This is NOT an acceptance email...'"
  puts "- Section: EVENT DETAILS (installation, age policy, category)"
  puts "- Section: IMPORTANT GUIDELINES (size/space, equipment, load out, no commission)"
  puts "- Link: Vendor portal dashboard link"
  puts "- Footer: Questions? Reply to this email..."
  puts ""
  puts "⚠️  REMOVED (should NOT appear):"
  puts "- ❌ PRICING & PAYMENT section"
  puts "- ❌ Booth/Space Fee"
  puts "- ❌ Payment due date"
  puts "- ❌ Any mention of fees or pricing"
  puts ""
rescue => e
  puts "❌ Error sending email: #{e.message}"
  puts "   #{e.backtrace.first(3).join('\n   ')}"
  exit
end

puts "\n=== VERIFICATION CHECKLIST ===\n"
puts "[ ] Email received in inbox"
puts "[ ] Subject: 'Application Received - [Event Name]'"
puts "[ ] Greeting uses first name or business name"
puts "[ ] IMPORTANT disclaimer about NOT being acceptance email"
puts "[ ] EVENT DETAILS section present (installation, age, category)"
puts "[ ] IMPORTANT GUIDELINES section present (4 bullet points)"
puts "[ ] Vendor portal link present and clickable"
puts "[ ] Footer has 'Questions? Reply to this email...'"
puts "[ ] NO PRICING & PAYMENT section (removed)"
puts "[ ] NO booth/space fee mentioned (removed)"
puts "[ ] NO payment due date mentioned (removed)"
puts ""
puts "✅ Phase 3 Complete! Ready for your review.\n\n"
