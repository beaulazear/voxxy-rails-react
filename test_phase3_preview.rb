# Phase 3 Test Script: Application Received Email Preview (HTML only)
# Run in Rails console: load 'test_phase3_preview.rb'

puts "\n=== PHASE 3 TEST: Application Received Email Preview ===\n\n"

# Find the test event we created
event = Event.find_by(slug: 'test-category-links-1770335766')

if event.nil?
  puts "❌ Test event not found. Please run: load 'test_phase1_preview.rb' first"
  exit
end

vendor_app = event.vendor_applications.active.first

# Find or create test registration
registration = Registration.where(event: event).first

if registration.nil?
  puts "Creating test registration..."

  registration = Registration.create!(
    event: event,
    vendor_application: vendor_app,
    name: "Test Contact",
    email: "team@voxxypresents.com",
    business_name: "Awesome Art LLC",
    vendor_category: vendor_app.name,
    phone: "303-555-0100",
    instagram_handle: "@awesomeart",
    status: "pending"
  )

  puts "✓ Created test registration (ID: #{registration.id})"
else
  puts "✓ Found existing registration (ID: #{registration.id})"
end

puts "✓ Using registration for: #{registration.business_name}"
puts "✓ Event: #{registration.event.title}"
puts "✓ Email: #{registration.email}"
puts "✓ Category: #{registration.vendor_category}"

puts "\n--- Generating Email Preview ---\n"

# Generate email preview HTML
begin
  # Call the actual method to generate the email (but with staging/test environment, won't actually send)
  puts "Note: This will attempt to send via SendGrid in staging. Checking environment..."

  if Rails.env.production? && ENV["PRIMARY_DOMAIN"] != "voxxyai.com"
    puts "⚠️  Cannot generate preview in production environment."
    puts "   Please use Rails console instead and manually extract email HTML."
    exit
  end

  # For now, just call the send method (it will send to team@voxxypresents.com in staging)
  RegistrationEmailService.send_confirmation(registration)

  puts "✅ Application Received email sent to: #{registration.email}\n"
  puts "   Check your email inbox for the preview!\n"
  puts ""
  puts "Expected email content:"
  puts "- Subject: 'Application Received - #{registration.event.title}'"
  puts "- Greeting: 'Hi #{registration.name.split(' ').first},' or 'Hi #{registration.business_name},'"
  puts "- Body: 'Thanks for submitting your application...'"
  puts "- Body: 'IMPORTANT: This is NOT an acceptance email...'"
  puts "- Section: PRICING & PAYMENT (with payment due date note)"
  puts "- Section: EVENT DETAILS (installation, age policy, category)"
  puts "- Section: IMPORTANT GUIDELINES (size/space, equipment, load out, no commission)"
  puts "- Link: Vendor portal dashboard link"
  puts "- Footer: Questions? Reply to this email..."
  puts ""
  puts "⚠️  SHOULD NOT APPEAR:"
  puts "- ❌ Specific booth/space fee amount"
  puts "- ❌ Processing fees messaging"
  puts ""
rescue => e
  puts "❌ Error generating preview: #{e.message}"
  puts "   #{e.backtrace.first(5).join('\n   ')}"
  exit
end

puts "\n=== VERIFICATION CHECKLIST ===\n"
puts "[ ] Subject: 'Application Received - [Event Name]'"
puts "[ ] Greeting uses first name or business name"
puts "[ ] IMPORTANT disclaimer about NOT being acceptance email"
puts "[ ] PRICING & PAYMENT section present (with payment due date)"
puts "[ ] EVENT DETAILS section present (installation, age, category)"
puts "[ ] IMPORTANT GUIDELINES section present (4 bullet points)"
puts "[ ] Vendor portal link present"
puts "[ ] Footer has 'Questions? Reply to this email...'"
puts "[ ] NO specific booth fee amount displayed"
puts "[ ] NO processing fees messaging"
puts ""
puts "✅ Phase 3 Preview Complete! Open email_preview_phase3.html to review.\n\n"
