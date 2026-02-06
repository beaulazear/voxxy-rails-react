# Phase 1 Manual Testing Instructions

## Step 1: Start Rails Console
```bash
rails console
```

## Step 2: Get Test Data
```ruby
# Find an event with vendor applications
event = Event.includes(:vendor_applications, :organization).last
puts "Event: #{event.title}"

# Check vendor applications
vendor_apps = event.vendor_applications.active
puts "Vendor Applications (#{vendor_apps.count}):"
vendor_apps.each { |app| puts "  - #{app.name} (ID: #{app.id})" }
```

## Step 3: Get or Create Vendor Contact
```ruby
# Find existing contact
vendor_contact = event.organization.vendor_contacts.first

# OR create test contact if none exist
if vendor_contact.nil?
  vendor_contact = event.organization.vendor_contacts.create!(
    name: "Test Vendor",
    email: "your-email@example.com",  # Use YOUR email to receive test
    business_name: "Test Business"
  )
end

puts "Vendor Contact: #{vendor_contact.email}"
```

## Step 4: Create Invitation
```ruby
invitation = EventInvitation.find_or_create_by!(
  event: event,
  vendor_contact: vendor_contact
)
puts "Invitation Token: #{invitation.invitation_token[0..10]}..."
```

## Step 5: Test URL Generation
```ruby
# Test the new methods
links = invitation.vendor_application_links

puts "\nGenerated Links:"
links.each do |link|
  puts "\nCategory: #{link[:name]}"
  puts "URL: #{link[:url]}"
end
```

**Expected Output:**
```
Generated Links:

Category: Artists
URL: https://www.voxxypresents.com/events/your-event-slug/1/apply?token=abc123...

Category: Vendors
URL: https://www.voxxypresents.com/events/your-event-slug/2/apply?token=abc123...
```

## Step 6: Send Test Email
```ruby
EventInvitationMailer.invitation_email(invitation).deliver_now
puts "✅ Email sent to: #{vendor_contact.email}"
```

## Step 7: Verify Email Content

Check your email inbox and verify:

- [ ] **Subject:** "Submissions Open for [Event Title]"
- [ ] **From:** Organization name
- [ ] **Body contains:** "Submit your work below:"
- [ ] **Category links visible:**
  - Artists - Apply Here (clickable)
  - Vendors - Apply Here (clickable)
- [ ] **No raw URLs displayed** (should show clean hyperlinked text)
- [ ] **Links have correct format:** `/events/{slug}/{id}/apply?token=...`

## Step 8: Click Links (Optional)

Click one of the category links in the email and verify:
- URL contains `?token=` parameter
- URL format is: `/events/{event-slug}/{vendor-app-id}/apply?token={token}`
- Page loads (even if form doesn't pre-fill yet - that's Phase 2)

---

## ✅ Acceptance Criteria

**Phase 1 is complete when:**

1. Email sends successfully ✓
2. Email displays category names as clickable text (not raw URLs) ✓
3. Each category has its own unique URL ✓
4. URLs include invitation token: `?token=abc123...` ✓
5. Clicking links navigates to correct application page ✓

---

## 🐛 Troubleshooting

**No vendor applications found:**
```ruby
# Create test vendor applications
event.vendor_applications.create!(
  name: "Artists",
  description: "For visual artists, painters, sculptors",
  status: "active",
  booth_price: 100
)

event.vendor_applications.create!(
  name: "Vendors",
  description: "For table vendors, merchandise sellers",
  status: "active",
  booth_price: 75
)
```

**Email not sending:**
- Check SendGrid API key: `ENV['VoxxyKeyAPI']`
- Check Sidekiq is running: `bundle exec sidekiq`
- Check email queue: `Sidekiq::Queue.new('email_delivery').size`

**Links not appearing:**
```ruby
# Debug in console
invitation = EventInvitation.last
puts invitation.vendor_application_links.inspect
```
