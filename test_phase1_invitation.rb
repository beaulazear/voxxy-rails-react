# Phase 1 Test Script: Category-Specific Application Links
# Run this in Rails console: load 'test_phase1_invitation.rb'

puts "\n=== PHASE 1 TEST: Category-Specific Application Links ===\n\n"

# Find test event created by setup script, or any event with vendor applications
event = Event.includes(:vendor_applications, :organization)
           .joins(:vendor_applications)
           .where(vendor_applications: { status: 'active' })
           .last

if event.nil?
  puts "❌ No events with active vendor applications found."
  puts "   Please run: load 'setup_test_data.rb' first"
  exit
end

puts "✓ Using event: #{event.title} (slug: #{event.slug})"

# Check for vendor applications
vendor_apps = event.vendor_applications.active
if vendor_apps.empty?
  puts "❌ No active vendor applications found for this event."
  puts "   Please run: load 'setup_test_data.rb' first"
  exit
end

puts "✓ Found #{vendor_apps.count} vendor application(s):"
vendor_apps.each do |app|
  puts "  - #{app.name} (ID: #{app.id})"
end

# Find or create vendor contact
vendor_contact = event.organization.vendor_contacts.first
if vendor_contact.nil?
  puts "\n⚠️  No vendor contacts found. Creating test contact..."
  vendor_contact = event.organization.vendor_contacts.create!(
    name: "Test Vendor",
    email: "test@example.com",
    business_name: "Test Business"
  )
  puts "✓ Created test vendor contact: #{vendor_contact.email}"
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
  puts "- Subject: 'Submissions Open for #{event.title}'"
  puts "- Body contains: 'Submit your work below:'"
  links.each do |link|
    puts "- Clickable link: '#{link[:name]} - Apply Here'"
  end
  puts ""
rescue => e
  puts "❌ Error sending email: #{e.message}"
  puts "   #{e.backtrace.first}"
  exit
end

puts "\n=== VERIFICATION CHECKLIST ===\n"
puts "[ ] Email received in inbox"
puts "[ ] Subject line correct"
puts "[ ] Email shows category names (not raw URLs)"
puts "[ ] Links are clickable and styled correctly"
puts "[ ] URL format: /events/#{event.slug}/[vendor-app-id]/apply?token=..."
puts "[ ] Each category has its own unique link"
puts ""
puts "✅ Phase 1 Complete! Ready for your review.\n\n"
