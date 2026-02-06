# Email Preview Generator
# Run in Rails console: load 'preview_email.rb'

puts "\n=== GENERATING EMAIL PREVIEW ===\n\n"

# Get the most recent invitation
invitation = EventInvitation.last

if invitation.nil?
  puts "❌ No invitations found. Please run 'load test_phase1_staging.rb' first"
  exit
end

puts "✓ Found invitation for event: #{invitation.event.title}"
puts "✓ Vendor contact: #{invitation.vendor_contact.email}"

# Generate the email
email = EventInvitationMailer.invitation_email(invitation)

# Get the HTML content
html_content = email.html_part.body.to_s

# Save to file
preview_file = File.join(Dir.pwd, 'email_preview.html')
File.write(preview_file, html_content)

puts "\n✅ Email preview saved!"
puts ""
puts "📧 To view the email:"
puts "   1. Open Finder"
puts "   2. Navigate to: #{Dir.pwd}"
puts "   3. Double-click: email_preview.html"
puts ""
puts "   OR from terminal:"
puts "   open email_preview.html"
puts ""
puts "Full path: #{preview_file}"
puts ""
