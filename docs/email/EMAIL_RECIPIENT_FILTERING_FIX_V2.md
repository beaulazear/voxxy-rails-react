# Email Recipient Filtering - Fix Plan

**Date:** January 18, 2026
**Status:** 📋 NOT STARTED - Documented for Later Implementation
**Priority:** P1 - High (Affects email targeting accuracy)
**Estimated Time:** 4-5 hours

---

## 🎯 Requirements (Confirmed)

Based on user requirements, emails should target:

1. **Application Deadline Emails** → Invited contacts who NEVER applied
   - Example: Invited 10 contacts, only 6 applied → Email goes to 4 who didn't apply
   - Match by: `event_invitations.vendor_contact.email` NOT IN `registrations.email`

2. **Payment Reminder Emails** → Approved vendors who are NOT paid
   - Filter: `status = 'approved' AND payment_status IN ('pending', 'overdue')`
   - ✅ **Already working correctly!**

3. **Event Countdown Emails** → Only vendors who PAID
   - Filter: `status IN ('approved', 'confirmed') AND payment_status IN ('confirmed', 'paid')`
   - ❌ Currently missing payment_status filter

---

## 🐛 Current Bugs

### BUG 1: Application Deadline Emails Target Wrong Recipients

**File:** `app/models/scheduled_email.rb` (Lines 42-48)

**Current Problematic Code:**
```ruby
def calculate_current_recipient_count
  return 0 unless event

  # Special handling for announcement emails - they go to invited vendor contacts, not registrations
  if is_announcement_email?
    return event.event_invitations.count  # ❌ Returns ALL invitations
  end
  # ...
end
```

**Problem:**
- Returns count of ALL invitations (even those who already applied)
- Should return count of invitations whose email is NOT in registrations

**Impact:**
- "1 Day Before Application Deadline" emails go to ALL invited contacts
- Includes people who already applied
- Wrong recipient count displayed in UI

---

### BUG 2: Event Countdown Emails Don't Filter by Payment

**File:** `db/seeds/email_campaign_templates.rb` (Lines 261, 307, 341)

**Current Configuration:**
```ruby
# 1 Day Before Event
filter_criteria: { statuses: [ 'approved', 'confirmed' ] }  # ❌ Missing payment_status

# Day of Event
filter_criteria: { statuses: [ 'approved', 'confirmed' ] }  # ❌ Missing payment_status

# Day After Event - Thank You
filter_criteria: { statuses: [ 'approved', 'confirmed' ] }  # ❌ Missing payment_status
```

**Problem:**
- Event countdown emails go to ALL approved/confirmed vendors
- Includes vendors who haven't paid yet
- Thank you email goes to vendors who never participated

**Impact:**
- Confusion for approved-but-unpaid vendors getting event reminders
- Unpaid vendors get thank you emails

---

## ✅ What's Already Working

**Payment Reminders** are correctly configured:
```ruby
filter_criteria: {
  statuses: [ 'approved' ],
  payment_status: [ 'pending', 'overdue' ]
}
```

**RecipientFilterService** correctly:
- ✅ Filters by status
- ✅ Filters by payment_status
- ✅ Combines filters with AND logic
- ✅ Has backward compatibility for singular/plural keys

---

## 🛠️ Implementation Plan

### STEP 1: Add "Invited But Didn't Apply" Logic

**File:** `app/services/recipient_filter_service.rb`

**Add new method (around line 100):**
```ruby
# Find emails that were invited but never submitted an application
def invited_not_applied_emails
  # Get all invited contact emails
  invited_emails = event.event_invitations
    .joins(:vendor_contact)
    .pluck('vendor_contacts.email')
    .map(&:downcase)
    .uniq

  # Get all emails that have applied (have registrations)
  applied_emails = event.registrations
    .pluck(:email)
    .map(&:downcase)
    .uniq

  # Return emails that were invited but never applied
  invited_emails - applied_emails
end

# Count of invitations without applications
def invited_not_applied_count
  invited_not_applied_emails.count
end

# Get vendor contacts who were invited but didn't apply
def invited_not_applied_contacts
  not_applied_emails = invited_not_applied_emails

  VendorContact.joins(:event_invitations)
    .where(event_invitations: { event_id: event.id })
    .where('LOWER(vendor_contacts.email) IN (?)', not_applied_emails)
    .distinct
end
```

---

### STEP 2: Update ScheduledEmail Model

**File:** `app/models/scheduled_email.rb`

**Replace lines 42-83 with:**
```ruby
def calculate_current_recipient_count
  return 0 unless event

  # Special handling: Application deadline emails target invitations without registrations
  if is_application_deadline_email?
    filter_service = RecipientFilterService.new(event, filter_criteria || {})
    return filter_service.invited_not_applied_count
  end

  # All other emails use standard registration filtering
  filter_service = RecipientFilterService.new(event, filter_criteria || {})
  filter_service.recipient_count
end
```

**Add new method (around line 140):**
```ruby
# Check if this is an application deadline email
def is_application_deadline_email?
  # Check by trigger type
  return true if trigger_type == "days_before_deadline"

  # Check by name pattern
  name.downcase.include?("application deadline")
end
```

**Update existing method (line 141-147):**
```ruby
# Check if this is an announcement email (goes to invited contacts, not registrations)
def is_announcement_email?
  # Only for immediate announcement emails (NOT deadline emails)
  trigger_type == "on_application_open"
end
```

---

### STEP 3: Update EmailSenderService

**File:** `app/services/email_sender_service.rb`

**Update `send_to_recipients` method (around line 14-46):**
```ruby
def send_to_recipients
  # Special handling: Application deadline emails target invitations without registrations
  if scheduled_email.is_application_deadline_email?
    return send_to_invited_not_applied
  end

  # Standard behavior for registration-based emails
  filter_service = RecipientFilterService.new(event, scheduled_email.filter_criteria)
  recipients = filter_service.filter_recipients

  if recipients.empty?
    Rails.logger.info("No recipients match filter criteria for scheduled email ##{scheduled_email.id}")
    return { sent: 0, failed: 0 }
  end

  sent_count = 0
  failed_count = 0

  recipients.each do |registration|
    begin
      send_to_registration(registration)
      sent_count += 1
    rescue => e
      Rails.logger.error("Failed to send email to #{registration.email}: #{e.message}")
      failed_count += 1
    end
  end

  scheduled_email.update!(
    status: "sent",
    sent_at: Time.current,
    recipient_count: sent_count
  )

  { sent: sent_count, failed: failed_count }
end
```

**Add new method (around line 83):**
```ruby
# Send application deadline emails to invited contacts who haven't applied
def send_to_invited_not_applied
  filter_service = RecipientFilterService.new(event, scheduled_email.filter_criteria)
  contacts = filter_service.invited_not_applied_contacts

  if contacts.empty?
    Rails.logger.info("No invited-not-applied contacts for scheduled email ##{scheduled_email.id}")
    return { sent: 0, failed: 0 }
  end

  sent_count = 0
  failed_count = 0

  contacts.each do |contact|
    begin
      send_to_contact(contact)
      sent_count += 1
    rescue => e
      Rails.logger.error("Failed to send email to #{contact.email}: #{e.message}")
      failed_count += 1
    end
  end

  scheduled_email.update!(
    status: "sent",
    sent_at: Time.current,
    recipient_count: sent_count
  )

  Rails.logger.info("✓ Sent scheduled email ##{scheduled_email.id} to #{sent_count} invited-not-applied contacts")

  { sent: sent_count, failed: failed_count }
end

# Send email to a vendor contact (for application deadline emails)
def send_to_contact(contact)
  # Resolve variables (note: no registration context available)
  resolver = EmailVariableResolver.new(event, nil) # Pass nil for registration
  subject = resolver.resolve(scheduled_email.subject_template)
  body = resolver.resolve(scheduled_email.body_template)

  # Send via SendGrid
  response = send_via_sendgrid(
    to_email: contact.email,
    to_name: contact.name,
    subject: subject,
    body: body,
    scheduled_email_id: scheduled_email.id,
    event_id: event.id,
    registration_id: nil # No registration for invited-not-applied contacts
  )

  # Note: We still create EmailDelivery records even without registration_id
  # for tracking purposes (allow registration_id to be nullable)
  create_delivery_record_for_contact(contact, response)

  response
end
```

**Update `send_via_sendgrid` method (line 86-135) to handle nil registration_id:**
```ruby
def send_via_sendgrid(to_email:, to_name:, subject:, body:, scheduled_email_id:, event_id:, registration_id:)
  mail = SendGrid::Mail.new

  # ... existing code ...

  # CRITICAL: Add custom tracking args
  personalization.add_custom_arg(SendGrid::CustomArg.new(
    key: "scheduled_email_id",
    value: scheduled_email_id.to_s
  ))
  personalization.add_custom_arg(SendGrid::CustomArg.new(
    key: "event_id",
    value: event_id.to_s
  ))

  # Registration ID may be nil for application deadline emails
  if registration_id
    personalization.add_custom_arg(SendGrid::CustomArg.new(
      key: "registration_id",
      value: registration_id.to_s
    ))
  end

  # ... rest of existing code ...
end
```

**Update `create_delivery_record` method (line 137-157) to handle nil registration:**
```ruby
def create_delivery_record(registration, response)
  message_id = response.headers["X-Message-Id"]

  unless message_id
    Rails.logger.warn("No X-Message-Id in SendGrid response - delivery tracking may fail")
    message_id = "unknown-#{SecureRandom.hex(8)}"
  end

  EmailDelivery.create!(
    scheduled_email: scheduled_email,
    event: event,
    registration: registration,
    sendgrid_message_id: message_id,
    recipient_email: registration.email,
    status: "sent",
    sent_at: Time.current
  )
rescue ActiveRecord::RecordInvalid => e
  Rails.logger.error("Failed to create delivery record: #{e.message}")
end

def create_delivery_record_for_contact(contact, response)
  message_id = response.headers["X-Message-Id"]

  unless message_id
    Rails.logger.warn("No X-Message-Id in SendGrid response - delivery tracking may fail")
    message_id = "unknown-#{SecureRandom.hex(8)}"
  end

  # Note: registration_id is nil for application deadline emails
  EmailDelivery.create!(
    scheduled_email: scheduled_email,
    event: event,
    registration: nil,  # No registration for invited-not-applied contacts
    sendgrid_message_id: message_id,
    recipient_email: contact.email,
    status: "sent",
    sent_at: Time.current
  )
rescue ActiveRecord::RecordInvalid => e
  Rails.logger.error("Failed to create delivery record: #{e.message}")
end
```

---

### STEP 4: Update Email Template Seeds

**File:** `db/seeds/email_campaign_templates.rb`

**Update line ~261 (1 Day Before Event):**
```ruby
{
  name: "1 Day Before Event",
  description: "Final reminder sent to confirmed vendors the day before the event",
  category: "pre_event",
  position: 5,
  subject_template: "Tomorrow: {{event_title}}",
  body_template: "<p>Hi {{vendor_name}},</p><p>Just a friendly reminder that <strong>{{event_title}}</strong> is tomorrow!</p><p><strong>Event Details:</strong><br>📅 Date: {{event_date}}<br>🕐 Time: {{event_time}}<br>📍 Location: {{event_location}}</p><p>We're looking forward to seeing you there!</p><p>Best,<br>{{organization_name}}</p>",
  trigger_type: "days_before_event",
  trigger_value: 1,
  trigger_time: "09:00",
  filter_criteria: {
    statuses: [ 'approved', 'confirmed' ],
    payment_status: [ 'confirmed', 'paid' ]  # ← ADD THIS LINE
  },
  enabled_by_default: true
}
```

**Update line ~307 (Day of Event):**
```ruby
{
  name: "Day of Event",
  description: "Morning-of reminder with final details",
  category: "event_day",
  position: 6,
  subject_template: "Today: {{event_title}}",
  body_template: "<p>Hi {{vendor_name}},</p><p><strong>{{event_title}}</strong> is today!</p><p><strong>Event Details:</strong><br>📅 Today: {{event_date}}<br>🕐 Time: {{event_time}}<br>📍 Location: {{event_location}}</p><p>Have a great event!</p><p>Best,<br>{{organization_name}}</p>",
  trigger_type: "on_event_date",
  trigger_value: nil,
  trigger_time: "08:00",
  filter_criteria: {
    statuses: [ 'approved', 'confirmed' ],
    payment_status: [ 'confirmed', 'paid' ]  # ← ADD THIS LINE
  },
  enabled_by_default: true
}
```

**Update line ~341 (Day After Event - Thank You):**
```ruby
{
  name: "Day After Event - Thank You",
  description: "Thank you email sent the day after the event",
  category: "post_event",
  position: 7,
  subject_template: "Thank You for Being Part of {{event_title}}!",
  body_template: "<p>Hi {{vendor_name}},</p><p>Thank you for participating in <strong>{{event_title}}</strong>! We hope you had a great experience.</p><p>We appreciate your contribution to making this event a success.</p><p>Looking forward to working with you again!</p><p>Best,<br>{{organization_name}}</p>",
  trigger_type: "days_after_event",
  trigger_value: 1,
  trigger_time: "10:00",
  filter_criteria: {
    statuses: [ 'approved', 'confirmed' ],
    payment_status: [ 'confirmed', 'paid' ]  # ← ADD THIS LINE
  },
  enabled_by_default: true
}
```

---

### STEP 5: Create Migration to Allow Nullable registration_id

**File:** `db/migrate/YYYYMMDDHHMMSS_allow_null_registration_in_email_deliveries.rb`

```ruby
class AllowNullRegistrationInEmailDeliveries < ActiveRecord::Migration[7.2]
  def change
    change_column_null :email_deliveries, :registration_id, true
  end
end
```

**Rationale:** Application deadline emails go to contacts without registrations, so `registration_id` needs to be nullable in `email_deliveries` table.

---

### STEP 6: Update Existing Scheduled Emails

**File:** `lib/tasks/fix_event_email_filters.rake`

```ruby
namespace :email do
  desc "Add payment status filters to existing event countdown emails"
  task add_payment_filters: :environment do
    puts "🔧 Updating existing event countdown emails with payment filters..."

    # Find event countdown emails
    email_patterns = [
      "%Day Before Event%",
      "%Day of Event%",
      "%Day After Event%",
      "%Thank You%"
    ]

    updated_count = 0

    email_patterns.each do |pattern|
      emails = ScheduledEmail.where("name LIKE ?", pattern)
        .where(status: ['scheduled', 'paused'])

      emails.each do |email|
        criteria = email.filter_criteria || {}

        # Add payment_status filter if not already present
        unless criteria['payment_status'].present? || criteria[:payment_status].present?
          criteria['payment_status'] = ['confirmed', 'paid']
          email.update!(filter_criteria: criteria)
          updated_count += 1
          puts "  ✅ Updated: #{email.name} (Event ##{email.event_id})"
        end
      end
    end

    puts ""
    puts "📊 Summary:"
    puts "   Updated #{updated_count} scheduled emails"
    puts ""
    puts "✅ Done!"
  end
end
```

**Run after deployment:**
```bash
bundle exec rake email:add_payment_filters
```

---

## 🧪 Testing Plan

### Test 1: Application Deadline Email Targeting

**Setup:**
```ruby
# Create test event
event = Event.create!(title: "Test Event", organization: org, event_date: 30.days.from_now, application_deadline: 15.days.from_now)

# Create 10 invitations
10.times do |i|
  contact = VendorContact.create!(organization: org, email: "vendor#{i}@test.com", name: "Vendor #{i}")
  EventInvitation.create!(event: event, vendor_contact: contact)
end

# Create 6 registrations (6 applied, 4 didn't)
6.times do |i|
  event.registrations.create!(email: "vendor#{i}@test.com", name: "Vendor #{i}", status: 'pending')
end

# Generate scheduled emails
event.generate_scheduled_emails_from_template!

# Find application deadline email
deadline_email = event.scheduled_emails.find_by(name: "1 Day Before Application Deadline")
```

**Expected Result:**
```ruby
deadline_email.recipient_count
# => 4 (only vendor4-9 who were invited but didn't apply)

filter_service = RecipientFilterService.new(event, deadline_email.filter_criteria)
filter_service.invited_not_applied_emails
# => ["vendor6@test.com", "vendor7@test.com", "vendor8@test.com", "vendor9@test.com"]
```

---

### Test 2: Payment Reminder Targeting

**Setup:**
```ruby
event = Event.last

# Create mix of registrations
event.registrations.create!(email: "approved-unpaid@test.com", status: 'approved', payment_status: 'pending')
event.registrations.create!(email: "approved-paid@test.com", status: 'approved', payment_status: 'confirmed')
event.registrations.create!(email: "pending@test.com", status: 'pending', payment_status: 'pending')

payment_email = event.scheduled_emails.find_by(name: "Payment Reminder #1")
```

**Expected Result:**
```ruby
payment_email.recipient_count
# => 1 (only approved-unpaid@test.com)

filter_service = RecipientFilterService.new(event, payment_email.filter_criteria)
filter_service.filter_recipients.pluck(:email)
# => ["approved-unpaid@test.com"]
```

---

### Test 3: Event Countdown Targeting (After Fix)

**Setup:**
```ruby
event = Event.last

# Create mix of registrations
event.registrations.create!(email: "approved-paid@test.com", status: 'approved', payment_status: 'confirmed')
event.registrations.create!(email: "approved-unpaid@test.com", status: 'approved', payment_status: 'pending')
event.registrations.create!(email: "confirmed-paid@test.com", status: 'confirmed', payment_status: 'confirmed')

event_day_email = event.scheduled_emails.find_by(name: "Day of Event")
```

**Expected Result:**
```ruby
event_day_email.recipient_count
# => 2 (approved-paid and confirmed-paid only)

filter_service = RecipientFilterService.new(event, event_day_email.filter_criteria)
filter_service.filter_recipients.pluck(:email).sort
# => ["approved-paid@test.com", "confirmed-paid@test.com"]
```

---

## 📋 Implementation Checklist

- [ ] **Step 1:** Add `invited_not_applied` methods to RecipientFilterService
- [ ] **Step 2:** Update ScheduledEmail#calculate_current_recipient_count
- [ ] **Step 3:** Update EmailSenderService to handle invited-not-applied
- [ ] **Step 4:** Add payment filters to email template seeds
- [ ] **Step 5:** Create migration to allow null registration_id
- [ ] **Step 6:** Create rake task to update existing emails
- [ ] **Step 7:** Run migration: `bundle exec rails db:migrate`
- [ ] **Step 8:** Update seeds: `bundle exec rails db:seed`
- [ ] **Step 9:** Run rake task: `bundle exec rake email:add_payment_filters`
- [ ] **Test 1:** Application deadline email targeting
- [ ] **Test 2:** Payment reminder targeting (verify still works)
- [ ] **Test 3:** Event countdown targeting (verify payment filter works)
- [ ] **Deploy to staging**
- [ ] **Test in staging with real data**
- [ ] **Deploy to production**

---

## ⚠️ Important Notes

### Note 1: EmailDelivery registration_id Nullable

The migration makes `registration_id` nullable in the `email_deliveries` table. This is necessary because application deadline emails go to vendor contacts who don't have registrations yet.

**Impact:**
- EmailDelivery records for application deadline emails will have `registration_id = nil`
- Webhook tracking will still work (uses `sendgrid_message_id`)
- Reports that group by registration may need to handle NULL values

### Note 2: Email Variable Resolution

Application deadline emails don't have a registration context, so some variables may not be available:
- ✅ Available: `{{event_title}}`, `{{event_date}}`, `{{organization_name}}`, etc.
- ❌ Not available: `{{booth_number}}`, `{{vendor_category}}` (from registration)
- ⚠️ Limited: `{{vendor_name}}` (from VendorContact, not Registration)

Make sure application deadline email templates only use event and organization variables!

### Note 3: Case-Insensitive Email Matching

The email matching uses `.downcase` to ensure case-insensitive comparison:
```ruby
invited_emails.map(&:downcase) - applied_emails.map(&:downcase)
```

This prevents issues where "Vendor@Test.com" doesn't match "vendor@test.com".

---

## 🔄 Rollback Plan

If issues arise after deployment:

### Rollback Step 1: Revert Seed File Changes
```bash
git revert <commit-hash>
bundle exec rails db:seed
```

### Rollback Step 2: Remove Payment Filters from Existing Emails
```bash
bundle exec rails runner "
  ScheduledEmail.where('name LIKE ?', '%Day%Event%').each do |email|
    criteria = email.filter_criteria
    criteria.delete('payment_status')
    criteria.delete(:payment_status)
    email.update!(filter_criteria: criteria)
  end
"
```

### Rollback Step 3: Revert Code Changes
```bash
git revert <commit-hash>
```

---

## 📊 Expected Outcomes

### Before Fix:
- ❌ Application deadline emails → ALL 10 invited contacts
- ✅ Payment reminders → 2 approved unpaid vendors (working)
- ❌ Event countdown → 8 approved/confirmed vendors (includes unpaid)

### After Fix:
- ✅ Application deadline emails → 4 invited-not-applied contacts
- ✅ Payment reminders → 2 approved unpaid vendors (still working)
- ✅ Event countdown → 5 approved/confirmed PAID vendors

### Recipient Count Changes:
- Application deadline: ~40% reduction (10 → 4 in test case)
- Payment reminders: No change (already correct)
- Event countdown: ~37% reduction (8 → 5 in test case, assuming 3 didn't pay)

---

## 🎯 Success Criteria

Implementation is successful when:

1. ✅ Application deadline emails only go to invited contacts who haven't applied
2. ✅ Payment reminders still work (only approved + unpaid)
3. ✅ Event countdown emails only go to vendors who paid
4. ✅ Recipient counts displayed in UI are accurate
5. ✅ No emails sent to wrong recipients
6. ✅ All tests pass

---

**Status:** Ready for implementation when time allows
**Estimated Effort:** 4-5 hours
**Risk Level:** Medium (affects email sending logic)
**Priority:** P1 - High (currently sending emails to wrong recipients)
