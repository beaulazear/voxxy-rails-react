# Phase 1 Test Script: Preview Category-Specific Links in Email
# Run in Rails console: load 'test_phase1_preview.rb'

puts "\n=== PHASE 1 TEST: Email Preview with Category Links ===\n\n"

# Get the most recent invitation
invitation = EventInvitation.includes(:vendor_contact, :event).last

if invitation.nil?
  puts "❌ No invitations found."
  puts "   Please run: load 'test_phase1_staging.rb' first"
  exit
end

puts "✓ Found invitation for event: #{invitation.event.title}"
puts "✓ Vendor contact: #{invitation.vendor_contact.name} (#{invitation.vendor_contact.email})"
puts "✓ Invitation token: #{invitation.invitation_token[0..10]}..."

# Test the category links
app_links = invitation.vendor_application_links
puts "\n✓ Generated #{app_links.count} category-specific links:\n"
app_links.each_with_index do |link, idx|
  puts "#{idx + 1}. #{link[:name]}: #{link[:url]}"
end

# Generate the email HTML
email = EventInvitationMailer.invitation_email(invitation)
html_content = email.html_part.body.to_s

# Save to file
preview_file = File.join(Dir.pwd, 'email_preview.html')
File.write(preview_file, html_content)

puts "\n✅ Email preview saved to: email_preview.html"
puts ""
puts "📧 To view the email:"
puts "   open email_preview.html"
puts ""
puts "=== VERIFICATION CHECKLIST ===\n"
puts "[ ] Subject: '#{invitation.event.title} is coming in #{invitation.event.location || 'your area'}'"
puts "[ ] Email shows 'Submit your work below:'"
puts "[ ] ARTIST/GALLERY SUBMISSIONS link (on separate line)"
puts "[ ] VENDOR/TABLE SUBMISSIONS link (on separate line)"
puts "[ ] Both links include ?token=#{invitation.invitation_token[0..10]}..."
puts "[ ] Links go to /events/#{invitation.event.slug}/{app-id}/apply"
puts "[ ] Unsubscribe text at bottom present"
puts ""
puts "✅ Phase 1 Complete! Open the HTML file to see the email.\n\n"
