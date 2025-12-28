# Test script for event invitation emails
# Run with: bundle exec rails runner test_email_invitation.rb

puts "Testing Event Invitation Email Functionality"
puts "=" * 50

# Find or create test data
org = Organization.first
event = Event.first
contact = VendorContact.first

if org.nil? || event.nil? || contact.nil?
  puts "❌ Error: Need at least one Organization, Event, and VendorContact in the database"
  puts "Please create these records first using the Rails console or application"
  exit 1
end

# Create test invitation
invitation = EventInvitation.create!(
  event: event,
  vendor_contact: contact
)

puts "✓ Test invitation created successfully"
puts "  Invitation ID: #{invitation.id}"
puts "  Event: #{event.title}"
puts "  Contact: #{contact.name} (#{contact.email})"
puts "  Token: #{invitation.invitation_token}"
puts "  URL: #{invitation.invitation_url}"
puts ""

# Test invitation email
puts "Testing invitation email..."
mailer = EventInvitationMailer.invitation_email(invitation)
puts "  ✓ Subject: #{mailer.subject}"
puts "  ✓ To: #{mailer.to.join(', ')}"
puts "  ✓ From: #{mailer.from.join(', ')}"
puts ""

# Test acceptance emails
puts "Testing acceptance confirmation emails..."
invitation.accept!(response_notes: "Test acceptance")
mailer1 = EventInvitationMailer.accepted_confirmation_vendor(invitation)
mailer2 = EventInvitationMailer.accepted_notification_producer(invitation)
puts "  ✓ Vendor confirmation: #{mailer1.subject}"
puts "  ✓ Producer notification: #{mailer2.subject}"
puts ""

# Clean up
invitation.destroy
puts "✓ Test invitation cleaned up"
puts ""
puts "🎉 All email functionality is working correctly!"
puts ""
puts "Note: No actual emails were sent. To send test emails, use .deliver_now"
