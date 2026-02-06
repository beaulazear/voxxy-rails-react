# Quick test to verify invitation email template (without sending)
# Run in Rails console: load 'test_invitation_template_check.rb'

puts "\n=== INVITATION EMAIL TEMPLATE CHECK ===\n\n"

# Find any event with vendor applications
event = Event.joins(:vendor_applications)
            .where(vendor_applications: { status: 'active' })
            .last

if event.nil?
  puts "❌ No events with active vendor applications found."
  exit
end

# Find or create a test invitation
invitation = event.event_invitations.first

if invitation.nil?
  # Find a vendor contact to use
  vendor_contact = VendorContact.first

  if vendor_contact.nil?
    puts "❌ No vendor contacts found. Cannot create test invitation."
    exit
  end

  # Create a test invitation (won't send email, just for template inspection)
  invitation = EventInvitation.new(
    event: event,
    vendor_contact: vendor_contact,
    status: 'pending'
  )
  invitation.save(validate: false) # Skip validation for test
  puts "✓ Created test invitation"
else
  puts "✓ Using existing invitation (ID: #{invitation.id})"
end

puts "✓ Event: #{event.title}"
puts "✓ Vendor Contact: #{invitation.vendor_contact.email}"
puts "\n--- Inspecting Email Template (No Email Sent) ---\n"

# Generate the mailer instance but don't send
mailer = EventInvitationMailer.invitation_email(invitation)

# Extract the text part of the email
text_part = mailer.text_part&.body&.to_s || mailer.body.to_s

puts "\n📧 TEXT EMAIL PREVIEW:\n"
puts "=" * 60
puts text_part
puts "=" * 60

# Check for new template features
if text_part.include?("ARTIST/GALLERY SUBMISSIONS") || text_part.include?("VENDOR/TABLE SUBMISSIONS")
  puts "\n✅ SUCCESS! Template includes category-specific links"
  puts "   New template is deployed and working correctly!"
else
  puts "\n❌ PROBLEM! Template still uses old format"
  puts "   Old generic invitation URL detected"
  puts "   Render may not have deployed the latest code yet"
end

puts "\n"
