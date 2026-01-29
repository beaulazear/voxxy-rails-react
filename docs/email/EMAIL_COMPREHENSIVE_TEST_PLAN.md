# Email System - Comprehensive Test Plan

**Date:** January 28, 2026
**Purpose:** Validate email automation system before Feb 3rd launch
**Estimated Time:** 4-6 hours for complete test suite
**Target:** 95% confidence in system stability

---

## Test Philosophy

### What is Testing?

Testing is **systematically verifying** that your system behaves correctly under various conditions, including:
- ✅ **Happy path** - Normal, expected usage
- ⚠️ **Edge cases** - Unusual but valid scenarios
- ❌ **Failure modes** - How system handles errors

### Why Test?

1. **Prevent bugs before production** - Find issues early
2. **Build confidence** - Know your system works
3. **Document behavior** - Tests show how system should work
4. **Enable refactoring** - Change code safely
5. **Reduce debugging time** - Issues caught early are easier to fix

### Types of Tests

```
Unit Tests (Fast, Isolated)
  └─> Test individual methods/functions
  └─> Example: "Does EmailVariableResolver replace [eventName]?"

Integration Tests (Medium, Multiple Components)
  └─> Test how services work together
  └─> Example: "Does EmailSenderService create EmailDelivery records?"

End-to-End Tests (Slow, Complete Flow)
  └─> Test entire user journey
  └─> Example: "When event created → emails scheduled → sent → tracked"

Manual Tests (Exploratory)
  └─> Human validation in real environment
  └─> Example: "Send real email, check inbox"
```

### Test Coverage Goals

- **Critical Path:** 100% (email sending must work)
- **Edge Cases:** 80% (most unusual scenarios covered)
- **Error Handling:** 90% (failures handled gracefully)
- **Integration:** 70% (services work together)

---

## Pre-Test Setup

### Environment Preparation

**1. Staging Environment Required**
```bash
# Ensure staging database is up-to-date
heroku run rails db:migrate -a voxxy-staging
heroku run rails db:seed -a voxxy-staging

# Verify Sidekiq is running
heroku ps -a voxxy-staging | grep worker

# Check Redis connection
heroku run rails runner 'puts "Redis: #{Redis.new.ping}"' -a voxxy-staging
```

**2. SendGrid Configuration**
```bash
# Verify API key exists
heroku config:get VoxxyKeyAPI -a voxxy-staging

# Check SendGrid activity (last 7 days)
# Go to: https://app.sendgrid.com/email_activity

# Verify webhook configured
# Go to: https://app.sendgrid.com/settings/mail_settings
# Should point to: https://staging.voxxypresents.com/webhooks/sendgrid
```

**3. Test Data Setup**
```bash
# Create test event
heroku run rails runner "$(cat <<'EOF'
  org = Organization.first || Organization.create!(
    name: 'Test Organization',
    email: 'test@voxxypresents.com'
  )

  event = Event.create!(
    title: 'Email Test Event',
    slug: 'email-test-jan-28',
    organization: org,
    event_date: 7.days.from_now,
    application_deadline: 5.days.from_now,
    payment_deadline: 3.days.from_now,
    status: 'published'
  )

  puts "✓ Created test event: #{event.slug} (ID: #{event.id})"
EOF
)" -a voxxy-staging
```

**4. Monitoring Setup**
```bash
# Open monitoring windows
# Window 1: Sidekiq dashboard
open https://staging.voxxypresents.com/sidekiq

# Window 2: Rails logs (real-time)
heroku logs --tail -a voxxy-staging | grep -i email

# Window 3: SendGrid activity
open https://app.sendgrid.com/email_activity
```

---

## Test Suite 1: Scheduled Email Creation

### Purpose
Verify that creating an event automatically generates 7 scheduled emails with correct data.

### Test Steps

**Test 1.1: Event Creation Generates Emails**
```bash
# Create event via Rails console
heroku run rails console -a voxxy-staging

# In console:
event = Event.create!(
  title: "Test Event - Email Generation",
  slug: "test-email-gen-#{Time.now.to_i}",
  organization: Organization.first,
  event_date: 10.days.from_now,
  application_deadline: 5.days.from_now,
  payment_deadline: 3.days.from_now,
  status: 'published'
)

# Verify emails created
emails = event.scheduled_emails.order(:position)
puts "Generated #{emails.count} emails (expected: 7)"

# Check each email
emails.each do |email|
  puts "#{email.position}. #{email.name}"
  puts "   Category: #{email.email_template_item&.category}"
  puts "   Scheduled: #{email.scheduled_for}"
  puts "   Status: #{email.status}"
end
```

**Expected Results:**
```
✓ 7 emails created
✓ Position 1-7 assigned
✓ Categories correct:
  - Position 1-2: "event_announcements"
  - Position 3-7: "vendor_emails"
✓ Scheduled dates calculated correctly
✓ All status = "scheduled"
✓ All enabled = true
```

**Test 1.2: Email Template Data Validation**
```ruby
# Check each email has required data
event.scheduled_emails.each do |email|
  puts "\n=== #{email.name} ==="

  # Check email_template_item exists
  if email.email_template_item.nil?
    puts "❌ FAIL: No email_template_item!"
  else
    puts "✓ Template Item: #{email.email_template_item.name}"
  end

  # Check category
  if email.email_template_item&.category.blank?
    puts "❌ FAIL: Category is blank!"
  else
    puts "✓ Category: #{email.email_template_item.category}"
  end

  # Check subject/body templates
  if email.subject_template.blank?
    puts "❌ FAIL: Subject template is blank!"
  else
    puts "✓ Subject: #{email.subject_template[0..50]}..."
  end

  if email.body_template.blank?
    puts "❌ FAIL: Body template is blank!"
  else
    puts "✓ Body: #{email.body_template[0..50]}..."
  end

  # Check trigger data
  puts "✓ Trigger: #{email.trigger_type} (value: #{email.trigger_value})"
end
```

**Expected Results:**
```
✓ All emails have email_template_item
✓ All categories are non-blank
✓ All subject templates populated
✓ All body templates populated
✓ All trigger types valid
```

---

## Test Suite 2: Category-Based Routing

### Purpose
Verify that emails route to correct service based on category (NEW CODE - HIGH RISK).

### Test Setup
```ruby
event = Event.find_by(slug: 'test-email-gen-...')  # Use event from Test 1

# Get one email from each category
announcement_email = event.scheduled_emails.joins(:email_template_item)
  .where(email_template_items: { category: 'event_announcements' }).first

vendor_email = event.scheduled_emails.joins(:email_template_item)
  .where(email_template_items: { category: 'vendor_emails' }).first
```

**Test 2.1: Routing Logic Validation**
```ruby
# Mock the routing logic from EmailSenderWorker
def determine_service(scheduled_email)
  category = scheduled_email.email_template_item&.category

  if category == "event_announcements"
    "InvitationReminderService"
  else
    "EmailSenderService"
  end
end

# Test announcement email routes correctly
result = determine_service(announcement_email)
if result == "InvitationReminderService"
  puts "✓ Announcement email routes to InvitationReminderService"
else
  puts "❌ FAIL: Announcement routed to #{result}"
end

# Test vendor email routes correctly
result = determine_service(vendor_email)
if result == "EmailSenderService"
  puts "✓ Vendor email routes to EmailSenderService"
else
  puts "❌ FAIL: Vendor email routed to #{result}"
end
```

**Test 2.2: Nil Category Handling**
```ruby
# Create email with nil category (edge case)
bad_email = ScheduledEmail.create!(
  event: event,
  name: "Test - Nil Category",
  scheduled_for: 1.hour.from_now,
  status: "scheduled",
  email_template_item: nil  # No template item
)

# Check routing behavior
category = bad_email.email_template_item&.category
puts "Category: #{category.inspect}"  # Should be nil

if category.nil?
  puts "⚠️  WARNING: Nil category defaults to EmailSenderService"
  puts "    This might send to wrong recipients!"
end

# Clean up
bad_email.destroy
```

**Expected Results:**
```
✓ "event_announcements" → InvitationReminderService
✓ "vendor_emails" → EmailSenderService
✓ Other categories → EmailSenderService (default)
⚠️  Nil category behavior documented
```

---

## Test Suite 3: Recipient Filtering

### Purpose
Verify recipients are correctly filtered based on status, unsubscribe, etc.

### Test Setup
```ruby
event = Event.find_by(slug: 'test-email-gen-...')

# Create test registrations with different statuses
registrations = [
  { email: 'approved@test.com', status: 'approved', vendor_fee_paid: true },
  { email: 'pending@test.com', status: 'pending', vendor_fee_paid: false },
  { email: 'rejected@test.com', status: 'rejected', vendor_fee_paid: false },
  { email: 'waitlist@test.com', status: 'waitlist', vendor_fee_paid: false },
  { email: 'paid@test.com', status: 'approved', vendor_fee_paid: true }
]

registrations.each do |attrs|
  Registration.create!(
    event: event,
    name: attrs[:email].split('@').first.titleize,
    business_name: "Business #{attrs[:email]}",
    vendor_category: 'Art',
    **attrs
  )
end

puts "✓ Created #{registrations.count} test registrations"
```

**Test 3.1: Status Filtering**
```ruby
# Get a payment deadline email (should only send to approved+unpaid)
email = event.scheduled_emails.find_by(name: '3 Days Before Payment Deadline')

# Get filter criteria
filter_criteria = email.email_template_item.filter_criteria || {}
puts "Filter criteria: #{filter_criteria.inspect}"

# Apply filtering manually
service = RecipientFilterService.new(
  event: event,
  filter_criteria: filter_criteria
)

recipients = service.filter_recipients
puts "\nFiltered recipients:"
recipients.each do |reg|
  puts "  - #{reg.email} (#{reg.status}, paid: #{reg.vendor_fee_paid})"
end

# Verify filtering
expected_statuses = filter_criteria['statuses'] || []
puts "\nExpected statuses: #{expected_statuses.inspect}"

recipients.each do |reg|
  if expected_statuses.include?(reg.status)
    puts "✓ #{reg.email} - status OK"
  else
    puts "❌ FAIL: #{reg.email} has wrong status (#{reg.status})"
  end
end
```

**Test 3.2: Unsubscribe Filtering**
```ruby
# Create unsubscribe record
unsub_email = 'approved@test.com'
EmailUnsubscribe.create!(
  email: unsub_email,
  event: event,
  scope: 'event'
)

puts "✓ Created unsubscribe for #{unsub_email}"

# Filter recipients again
recipients = service.filter_recipients

# Verify unsubscribed email excluded
if recipients.any? { |r| r.email == unsub_email }
  puts "❌ FAIL: Unsubscribed email #{unsub_email} still in recipients!"
else
  puts "✓ Unsubscribed email #{unsub_email} correctly excluded"
end

# Clean up
EmailUnsubscribe.where(email: unsub_email).destroy_all
```

**Test 3.3: Invitation Filtering**
```ruby
# Create vendor contact and invitation
vendor_contact = VendorContact.create!(
  organization: event.organization,
  name: 'Test Vendor',
  email: 'invited@test.com',
  business_name: 'Invited Business'
)

invitation = EventInvitation.create!(
  event: event,
  vendor_contact: vendor_contact,
  status: 'invited'
)

puts "✓ Created invitation for #{vendor_contact.email}"

# Get announcement email (sends to invitations)
announcement = event.scheduled_emails.joins(:email_template_item)
  .where(email_template_items: { category: 'event_announcements' }).first

# Check if invitation would be included
service = InvitationReminderService.new(announcement)
recipients = service.send(:get_recipients)  # Call private method for testing

if recipients.any? { |inv| inv.vendor_contact.email == 'invited@test.com' }
  puts "✓ Invited contact included in announcement email"
else
  puts "❌ FAIL: Invited contact not found in recipients"
end
```

**Expected Results:**
```
✓ Filtering respects status criteria
✓ Unsubscribed emails excluded
✓ Invited contacts included in announcements
✓ Applied vendors excluded from invitations
```

---

## Test Suite 4: Variable Resolution

### Purpose
Verify template variables are correctly replaced with actual data.

### Test Setup
```ruby
event = Event.find_by(slug: 'test-email-gen-...')
registration = event.registrations.first

# Update event with real data
event.update!(
  title: 'Amazing Art Market',
  event_date: Date.parse('2026-02-15'),
  application_deadline: Date.parse('2026-02-05'),
  payment_deadline: Date.parse('2026-02-10'),
  venue: 'Brooklyn Museum',
  location: '200 Eastern Pkwy, Brooklyn, NY'
)

# Update registration
registration.update!(
  name: 'Jane Smith',
  business_name: 'Jane\'s Artworks',
  email: 'jane@artworks.com',
  vendor_category: 'Jewelry'
)
```

**Test 4.1: Event Variables**
```ruby
resolver = EmailVariableResolver.new(event, registration)

template = "Event: [eventName] on [eventDate] at [eventVenue], [eventLocation]"
resolved = resolver.resolve(template)

puts "Template: #{template}"
puts "Resolved: #{resolved}"

# Verify replacements
expected = "Event: Amazing Art Market on Saturday, February 15, 2026 at Brooklyn Museum, 200 Eastern Pkwy, Brooklyn, NY"

if resolved == expected
  puts "✓ Event variables resolved correctly"
else
  puts "❌ FAIL: Expected: #{expected}"
  puts "        Got:      #{resolved}"
end
```

**Test 4.2: Vendor Variables**
```ruby
template = "Hi [greetingName], your category is [vendorCategory]"
resolved = resolver.resolve(template)

puts "Template: #{template}"
puts "Resolved: #{resolved}"

expected = "Hi Jane's Artworks, your category is Jewelry"

if resolved == expected
  puts "✓ Vendor variables resolved correctly"
else
  puts "❌ FAIL: Expected: #{expected}"
  puts "        Got:      #{resolved}"
end
```

**Test 4.3: Greeting Name Fallback**
```ruby
# Test businessName → firstName → "there" fallback

# Scenario 1: Has business name
reg1 = Registration.new(business_name: 'Test Business', name: 'John Doe')
resolver1 = EmailVariableResolver.new(event, reg1)
result1 = resolver1.resolve("[greetingName]")

if result1 == 'Test Business'
  puts "✓ Scenario 1: Business name used"
else
  puts "❌ FAIL: Expected 'Test Business', got '#{result1}'"
end

# Scenario 2: No business name, has first name
reg2 = Registration.new(business_name: nil, name: 'John Doe')
resolver2 = EmailVariableResolver.new(event, reg2)
result2 = resolver2.resolve("[greetingName]")

if result2 == 'John'
  puts "✓ Scenario 2: First name used as fallback"
else
  puts "❌ FAIL: Expected 'John', got '#{result2}'"
end

# Scenario 3: No business name, no name
reg3 = Registration.new(business_name: nil, name: nil)
resolver3 = EmailVariableResolver.new(event, reg3)
result3 = resolver3.resolve("[greetingName]")

if result3 == 'there'
  puts "✓ Scenario 3: 'there' used as ultimate fallback"
else
  puts "❌ FAIL: Expected 'there', got '#{result3}'"
end
```

**Test 4.4: Link Variables**
```ruby
template = "Apply: [eventLink] | Dashboard: [dashboardLink]"
resolved = resolver.resolve(template)

puts "Resolved: #{resolved}"

# Verify links are valid URLs
if resolved.include?('http') && resolved.include?(event.slug)
  puts "✓ Links resolved correctly"
else
  puts "❌ FAIL: Links not valid"
end
```

**Expected Results:**
```
✓ [eventName] → Event title
✓ [eventDate] → Formatted date
✓ [eventVenue] → Venue name
✓ [greetingName] → Business name (or fallback)
✓ [vendorCategory] → Category
✓ [eventLink] → Public event page URL
✓ [dashboardLink] → Vendor portal URL
```

---

## Test Suite 5: Email Sending (Critical Path)

### Purpose
Verify emails actually send via SendGrid and create delivery records.

**⚠️ WARNING:** This test sends REAL emails. Use test email addresses only!

### Test Setup
```ruby
event = Event.find_by(slug: 'test-email-gen-...')

# Create test registration with YOUR email
test_email = 'your-email+test@example.com'  # CHANGE THIS!

registration = Registration.create!(
  event: event,
  name: 'Test User',
  email: test_email,
  business_name: 'Test Business',
  vendor_category: 'Art',
  status: 'approved',
  vendor_fee_paid: false
)

puts "✓ Created registration: #{test_email}"
```

**Test 5.1: Manual Send via Service**
```ruby
# Get a simple email to send
email = event.scheduled_emails.find_by(name: 'Payment Confirmed')

# Manually trigger send
service = EmailSenderService.new(email)
result = service.send_to_recipients

puts "Send result:"
puts "  Sent: #{result[:sent]}"
puts "  Failed: #{result[:failed]}"
puts "  Last error: #{result[:last_error]}"

# Verify email status updated
email.reload

if email.status == 'sent'
  puts "✓ Email status updated to 'sent'"
else
  puts "❌ FAIL: Email status is '#{email.status}'"
end

# Check EmailDelivery record created
delivery = EmailDelivery.find_by(
  scheduled_email: email,
  recipient_email: test_email
)

if delivery
  puts "✓ EmailDelivery record created (ID: #{delivery.id})"
  puts "  Status: #{delivery.status}"
  puts "  SendGrid ID: #{delivery.sendgrid_message_id}"
else
  puts "❌ FAIL: No EmailDelivery record found"
end

# Check your inbox
puts "\n📧 Check your inbox: #{test_email}"
puts "   Subject should be: Payment confirmed - #{event.title}"
```

**Test 5.2: Verify Email Content**
```
Manual step: Check email in inbox

✓ Subject line correct
✓ Greeting shows business name
✓ Event details present (name, date, venue)
✓ Links work (click dashboard link)
✓ Unsubscribe link present
✓ "Powered by Voxxy Presents" in footer
✓ No [variables] left unreplaced
✓ HTML renders correctly (no broken styling)
```

**Test 5.3: SendGrid Webhook Tracking**
```ruby
# Wait for webhook to arrive (can take 1-5 minutes)
puts "Waiting for SendGrid webhook..."
sleep 10

# Check delivery record updated
delivery.reload

puts "Delivery status: #{delivery.status}"
puts "Delivered at: #{delivery.delivered_at}"
puts "Opened: #{delivery.opened}"

# If still "sent", webhook hasn't arrived yet
if delivery.status == 'sent'
  puts "⏳ Webhook not received yet (normal, can take 1-5 min)"
  puts "   Check again in a few minutes"
end

# Check SendGrid activity dashboard
puts "\n📊 Verify in SendGrid:"
puts "   https://app.sendgrid.com/email_activity"
puts "   Search for: #{test_email}"
```

**Expected Results:**
```
✓ result[:sent] = 1
✓ result[:failed] = 0
✓ Email status updated to "sent"
✓ EmailDelivery record created
✓ sendgrid_message_id populated
✓ Email received in inbox
✓ Content renders correctly
✓ Webhook updates delivery status (within 5 min)
```

---

## Test Suite 6: Worker Automation

### Purpose
Verify EmailSenderWorker picks up scheduled emails and sends them.

### Test Setup
```ruby
event = Event.find_by(slug: 'test-email-gen-...')

# Create email scheduled for NOW
email = event.scheduled_emails.create!(
  name: 'Test - Worker Automation',
  subject_template: 'Worker Test - [eventName]',
  body_template: '<p>Hi [greetingName], this is a test.</p>',
  scheduled_for: 1.minute.ago,  # In the past = should send now
  status: 'scheduled',
  enabled: true,
  email_template_item: EmailTemplateItem.where(category: 'vendor_emails').first
)

puts "✓ Created email scheduled for: #{email.scheduled_for}"
puts "  Email ID: #{email.id}"
```

**Test 6.1: Manual Worker Trigger**
```ruby
# Manually run worker
EmailSenderWorker.new.perform

puts "Worker executed"

# Check email status
email.reload

if email.status == 'sent'
  puts "✓ Email sent by worker"
  puts "  Sent at: #{email.sent_at}"
  puts "  Recipients: #{email.recipient_count}"
else
  puts "❌ FAIL: Email still #{email.status}"
  puts "  Error: #{email.error_message}"
end
```

**Test 6.2: Sidekiq Queue Test**
```ruby
# Add email to Sidekiq queue
EmailSenderWorker.perform_async

puts "✓ Job added to Sidekiq queue"

# Check Sidekiq stats
require 'sidekiq/api'
stats = Sidekiq::Stats.new

puts "Sidekiq stats:"
puts "  Processed: #{stats.processed}"
puts "  Failed: #{stats.failed}"
puts "  Queues: #{stats.queues}"

queue = Sidekiq::Queue.new('email_delivery')
puts "  Email queue size: #{queue.size}"

# Wait for job to process
puts "\nWaiting for Sidekiq..."
sleep 5

# Check email sent
email.reload
if email.status == 'sent'
  puts "✓ Email sent via Sidekiq worker"
else
  puts "❌ FAIL: Email not sent"
end
```

**Expected Results:**
```
✓ Worker picks up emails where scheduled_for <= now
✓ Email status updated to "sent"
✓ Recipients counted correctly
✓ Sidekiq queue processes jobs
✓ No errors in Sidekiq logs
```

---

## Test Suite 7: Edge Cases

### Purpose
Test unusual scenarios that could cause failures.

**Test 7.1: Event with Zero Registrations**
```ruby
# Create event with no registrations
empty_event = Event.create!(
  title: 'Empty Event',
  slug: "empty-#{Time.now.to_i}",
  organization: Organization.first,
  event_date: 7.days.from_now,
  application_deadline: 5.days.from_now
)

puts "✓ Created event with 0 registrations"

# Get a vendor email
email = empty_event.scheduled_emails.where.not(
  email_template_items: { category: 'event_announcements' }
).first

# Try to send
service = EmailSenderService.new(email)
result = service.send_to_recipients

puts "Result: sent=#{result[:sent]}, failed=#{result[:failed]}"

email.reload
puts "Status: #{email.status}"
puts "Recipients: #{email.recipient_count}"
puts "Error: #{email.error_message}"

# Expected: marked "sent" with 0 recipients, no error
if email.status == 'sent' && email.recipient_count == 0
  puts "✓ Zero recipients handled gracefully"
else
  puts "❌ FAIL: Unexpected status or count"
end
```

**Test 7.2: Event with Zero Invitations**
```ruby
# Get announcement email (sends to invitations)
announcement = empty_event.scheduled_emails.joins(:email_template_item)
  .where(email_template_items: { category: 'event_announcements' }).first

# Try to send
service = InvitationReminderService.new(announcement)
result = service.send_to_recipients

puts "Result: sent=#{result[:sent]}, failed=#{result[:failed]}"

announcement.reload
puts "Status: #{announcement.status}"
puts "Recipients: #{announcement.recipient_count}"

if announcement.status == 'sent' && announcement.recipient_count == 0
  puts "✓ Zero invitations handled gracefully"
else
  puts "❌ FAIL: Unexpected behavior"
end
```

**Test 7.3: Email with Nil Template Item**
```ruby
# Create email without template item
broken_email = ScheduledEmail.create!(
  event: empty_event,
  name: 'Broken - No Template',
  scheduled_for: Time.current,
  status: 'scheduled',
  email_template_item: nil  # Missing!
)

# Try to send via worker
EmailSenderWorker.new.perform

broken_email.reload
puts "Status: #{broken_email.status}"
puts "Error: #{broken_email.error_message}"

# Expected: marked "failed" with error message
if broken_email.status == 'failed'
  puts "✓ Nil template item caught and marked failed"
else
  puts "❌ FAIL: Should have failed but status is '#{broken_email.status}'"
end

# Clean up
broken_email.destroy
```

**Test 7.4: Email with Blank Category**
```ruby
# Create template item with blank category
bad_template = EmailTemplateItem.create!(
  email_campaign_template: EmailCampaignTemplate.first,
  name: 'Bad Template',
  category: '',  # Blank!
  subject_template: 'Test',
  body_template: 'Test',
  trigger_type: 'days_before_event',
  trigger_value: 1
)

bad_email = ScheduledEmail.create!(
  event: empty_event,
  name: 'Bad Category',
  scheduled_for: Time.current,
  status: 'scheduled',
  email_template_item: bad_template
)

# Try to send
EmailSenderWorker.new.perform

bad_email.reload
puts "Status: #{bad_email.status}"
puts "Routed to: #{bad_email.email_template_item.category.blank? ? 'default (EmailSenderService)' : 'InvitationReminderService'}"

# Clean up
bad_email.destroy
bad_template.destroy
```

**Test 7.5: Email Scheduled in the Past**
```ruby
# Create email scheduled 2 days ago
old_email = empty_event.scheduled_emails.create!(
  name: 'Old Email',
  scheduled_for: 2.days.ago,
  status: 'scheduled',
  subject_template: 'Old Email',
  body_template: 'Test',
  email_template_item: EmailTemplateItem.first
)

# Should send immediately
EmailSenderWorker.new.perform

old_email.reload
if old_email.status == 'sent'
  puts "✓ Past email sent immediately"
else
  puts "❌ FAIL: Past email not sent"
end
```

**Test 7.6: All Recipients Filtered Out**
```ruby
# Create event with only rejected registrations
filtered_event = Event.create!(
  title: 'Filtered Event',
  slug: "filtered-#{Time.now.to_i}",
  organization: Organization.first,
  event_date: 7.days.from_now
)

# Create only rejected registrations
3.times do |i|
  Registration.create!(
    event: filtered_event,
    email: "rejected#{i}@test.com",
    name: "Rejected #{i}",
    status: 'rejected',
    vendor_category: 'Art'
  )
end

# Get email that only sends to approved
email = filtered_event.scheduled_emails.create!(
  name: 'Approved Only',
  scheduled_for: Time.current,
  status: 'scheduled',
  subject_template: 'Test',
  body_template: 'Test',
  email_template_item: EmailTemplateItem.create!(
    email_campaign_template: EmailCampaignTemplate.first,
    name: 'Approved Test',
    category: 'vendor_emails',
    subject_template: 'Test',
    body_template: 'Test',
    trigger_type: 'days_before_event',
    trigger_value: 1,
    filter_criteria: { statuses: ['approved'] }
  )
)

# Try to send
service = EmailSenderService.new(email)
result = service.send_to_recipients

email.reload
puts "Status: #{email.status}"
puts "Recipients: #{email.recipient_count}"
puts "Error: #{email.error_message}"

if email.recipient_count == 0 && email.status == 'sent'
  puts "✓ All filtered out handled gracefully"
else
  puts "❌ FAIL: Unexpected behavior"
end
```

**Expected Results:**
```
✓ Zero registrations → sent with 0 recipients
✓ Zero invitations → sent with 0 recipients
✓ Nil template item → failed with error
✓ Blank category → defaults to EmailSenderService
✓ Past scheduled date → sends immediately
✓ All filtered out → sent with 0 recipients
```

---

## Test Suite 8: Error Handling

### Purpose
Verify system handles errors gracefully.

**Test 8.1: Invalid SendGrid API Key**
```ruby
# Temporarily break API key
original_key = ENV['VoxxyKeyAPI']
ENV['VoxxyKeyAPI'] = 'invalid-key-test'

email = event.scheduled_emails.first
service = EmailSenderService.new(email)

begin
  result = service.send_to_recipients
  puts "Result: #{result.inspect}"
rescue => e
  puts "✓ Error caught: #{e.message}"
end

email.reload
if email.status == 'failed'
  puts "✓ Email marked failed"
  puts "  Error: #{email.error_message}"
else
  puts "❌ FAIL: Email not marked failed"
end

# Restore key
ENV['VoxxyKeyAPI'] = original_key
```

**Test 8.2: Network Timeout Simulation**
```ruby
# This is hard to test without mocking
# Document expected behavior:
puts "Expected behavior for network timeout:"
puts "  1. Sidekiq retries job (default: 25 retries)"
puts "  2. After all retries failed → job moved to Dead queue"
puts "  3. Email remains in 'scheduled' status"
puts "  4. Manual intervention required"
```

**Test 8.3: Database Connection Loss**
```ruby
# Also hard to test without stopping database
puts "Expected behavior for database connection loss:"
puts "  1. ActiveRecord::ConnectionNotEstablished raised"
puts "  2. Sidekiq retries job"
puts "  3. Email not marked sent until database restored"
```

**Expected Results:**
```
✓ SendGrid errors caught and logged
✓ Email marked "failed" with error message
✓ System doesn't crash on errors
✓ Sidekiq retry logic works
```

---

## Test Suite 9: Performance & Load

### Purpose
Verify system handles realistic event sizes.

**Test 9.1: Event with 200 Registrations**
```ruby
# Create large event
large_event = Event.create!(
  title: 'Large Event - 200 Vendors',
  slug: "large-#{Time.now.to_i}",
  organization: Organization.first,
  event_date: 7.days.from_now,
  application_deadline: 5.days.from_now
)

# Create 200 registrations
puts "Creating 200 registrations..."
start_time = Time.current

200.times do |i|
  Registration.create!(
    event: large_event,
    email: "vendor#{i}@test.com",
    name: "Vendor #{i}",
    business_name: "Business #{i}",
    status: 'approved',
    vendor_category: ['Art', 'Food', 'Jewelry', 'Clothing'].sample
  )
end

end_time = Time.current
puts "✓ Created 200 registrations in #{(end_time - start_time).round(2)} seconds"

# Send email to all
email = large_event.scheduled_emails.first
service = EmailSenderService.new(email)

puts "\nSending email to 200 recipients..."
send_start = Time.current

result = service.send_to_recipients

send_end = Time.current
send_duration = (send_end - send_start).round(2)

puts "Send result:"
puts "  Duration: #{send_duration} seconds"
puts "  Sent: #{result[:sent]}"
puts "  Failed: #{result[:failed]}"
puts "  Rate: #{(result[:sent] / send_duration).round(1)} emails/second"

# Performance expectations
if send_duration < 60
  puts "✓ Sent 200 emails in under 1 minute"
elsif send_duration < 120
  puts "⚠️  Sent 200 emails in #{send_duration}s (acceptable but slow)"
else
  puts "❌ FAIL: Took >2 minutes to send 200 emails"
end

# Clean up
large_event.registrations.delete_all
large_event.destroy
```

**Expected Results:**
```
✓ 200 registrations created in <10 seconds
✓ 200 emails sent in <60 seconds
✓ No timeout errors
✓ No memory issues
✓ All EmailDelivery records created
```

---

## Test Suite 10: End-to-End Workflow

### Purpose
Test complete producer workflow from event creation to email tracking.

**Test 10.1: Complete Producer Journey**
```
1. Producer creates event
   └─> 7 emails auto-scheduled ✓

2. Producer invites 10 vendors
   └─> EventInvitation records created ✓

3. Application deadline approaching (1 day before)
   └─> EmailSenderWorker sends reminder to 10 invited contacts ✓
   └─> Emails delivered via SendGrid ✓
   └─> Webhooks update delivery status ✓

4. 5 vendors submit applications
   └─> Registration records created ✓
   └─> Confirmation emails sent ✓

5. Producer approves 4, rejects 1
   └─> Approval emails sent to 4 ✓
   └─> Rejection email sent to 1 ✓

6. Payment deadline approaching (3 days before)
   └─> Reminder sent to 4 approved vendors ✓

7. 3 vendors pay
   └─> vendor_fee_paid updated ✓
   └─> Payment confirmation emails sent ✓

8. Event day (1 day before)
   └─> Final reminder sent to 3 paid vendors ✓
   └─> NOT sent to unpaid vendor ✓

9. Producer checks email dashboard
   └─> Sees all sent emails ✓
   └─> Sees delivery statistics ✓
   └─> Sees failed sends (if any) ✓
```

**Manual Testing Steps:**
```bash
# Day 1: Event setup
1. Create event via UI
2. Verify 7 emails scheduled
3. Add 10 vendor contacts
4. Send invitations

# Day 2: Application deadline approaching
5. Manually trigger worker or wait for cron
6. Verify reminder emails sent
7. Check SendGrid dashboard

# Day 3: Applications received
8. Submit 5 applications via public form
9. Verify confirmation emails sent
10. Check inbox

# Day 4: Approvals
11. Approve 4, reject 1
12. Verify status emails sent
13. Check inbox for both

# Day 5: Payment deadline
14. Trigger payment reminder email
15. Verify only sent to approved vendors
16. Mark 3 as paid

# Day 6: Payment confirmations
17. Verify payment confirmation sent to 3
18. Check email content

# Day 7: Event reminder
19. Trigger event reminder
20. Verify only sent to paid vendors
21. Verify unpaid vendor excluded

# Day 8: Review
22. Check ScheduledEmail status (all sent)
23. Check EmailDelivery records
24. Review SendGrid activity
25. Verify no failed sends
```

**Expected Results:**
```
✓ All 7 email types sent at correct times
✓ Correct recipients for each email
✓ Filtering works (status, payment, unsubscribe)
✓ Variables resolved correctly
✓ Delivery tracking works
✓ No errors in logs
✓ Producer can see email history
```

---

## Post-Test Validation

### Checklist

After completing all test suites, verify:

**System Health:**
- [ ] No errors in Rails logs
- [ ] No failed Sidekiq jobs
- [ ] No dead jobs in Sidekiq
- [ ] SendGrid dashboard shows deliveries
- [ ] Webhook endpoint receiving events

**Data Integrity:**
- [ ] All ScheduledEmail records have status
- [ ] All sent emails have EmailDelivery records
- [ ] recipient_count matches actual sends
- [ ] No orphaned records

**Functionality:**
- [ ] Category routing works correctly
- [ ] Recipient filtering works
- [ ] Variable resolution works
- [ ] Email content renders correctly
- [ ] Unsubscribe links work
- [ ] Dashboard links work

**Edge Cases:**
- [ ] Zero recipients handled
- [ ] Nil values don't crash system
- [ ] Errors logged properly
- [ ] Failed emails marked failed

**Performance:**
- [ ] 200 emails send in <60 seconds
- [ ] No memory issues
- [ ] No database connection issues

---

## Test Results Documentation

### Template for Recording Results

```markdown
## Test Run: [Date/Time]
**Tester:** [Name]
**Environment:** Staging
**Duration:** [X hours]

### Suite 1: Scheduled Email Creation
- Test 1.1: ✅ PASS
- Test 1.2: ✅ PASS

### Suite 2: Category Routing
- Test 2.1: ✅ PASS
- Test 2.2: ⚠️  WARNING (nil category defaults to EmailSenderService)

### Suite 3: Recipient Filtering
- Test 3.1: ✅ PASS
- Test 3.2: ❌ FAIL - Unsubscribe filtering broken
  - Error: EmailUnsubscribe query timed out
  - Fix needed: Add database index

[Continue for all suites...]

### Summary
- Total tests: 45
- Passed: 40
- Failed: 3
- Warnings: 2

### Critical Issues Found
1. [Issue description]
   - Severity: High
   - Impact: [Description]
   - Fix required: Yes

### Recommendations
1. [Recommendation]
2. [Recommendation]

### Sign-off
- [ ] All critical issues resolved
- [ ] System ready for production
- [ ] Monitoring in place
```

---

## Continuous Testing Strategy

### Daily Testing (Jan 29 - Feb 2)

```bash
# Morning check (9am daily)
bundle exec rake email:monitor

# Afternoon test (2pm daily)
heroku run rails runner "$(cat <<'EOF'
  # Quick smoke test
  event = Event.where('event_date > ?', Date.today).first
  email = event.scheduled_emails.where(status: 'scheduled').first

  if email
    puts "Testing email: #{email.name}"
    service = EmailSenderService.new(email)
    result = service.send_to_recipients
    puts "Result: #{result.inspect}"
  else
    puts "No scheduled emails to test"
  end
EOF
)" -a voxxy-staging
```

### Feb 3rd Testing (Event Day)

```bash
# Every hour from 8am-8pm
while true; do
  echo "=== $(date) ==="
  bundle exec rake email:monitor
  sleep 3600  # 1 hour
done
```

---

## Conclusion

This comprehensive test plan covers:
- ✅ Unit testing (variables, filtering, routing)
- ✅ Integration testing (services working together)
- ✅ End-to-end testing (complete workflow)
- ✅ Edge cases (zero recipients, nil values, errors)
- ✅ Performance testing (200 emails)
- ✅ Manual validation (check inbox, UI)

**Estimated Time:**
- Full test suite: 4-6 hours
- Daily smoke tests: 30 minutes
- Feb 3rd monitoring: 2 hours

**Confidence Level After Testing:**
- Before: 75%
- After: 95%

**Next Steps:**
1. Run test suite Jan 29-30
2. Fix any issues found
3. Deploy fixes to staging
4. Re-test critical paths
5. Deploy to production Jan 31
6. Monitor Feb 1-3

---

**Document Prepared By:** Engineering Team
**Date:** January 28, 2026
**Version:** 1.0
