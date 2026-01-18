# Email Filtering Fixes - Testing Guide

**Created:** January 17, 2026
**Purpose:** Test invitation count stability and payment reminder filtering
**Location:** `/Users/beaulazear/Desktop/voxxy-rails/docs/EMAIL_FILTERING_TEST_GUIDE.md`
**Optimized for:** Render Shell (no `bundle exec` or `cd` needed)

---

## 🔧 **Environment Setup**

This guide is optimized for **Render Shell**. All commands use `rails runner` without `bundle exec`.

**To access Render Shell:**
1. Go to your Render dashboard
2. Navigate to your Rails service
3. Click "Shell" tab
4. Paste commands directly

⚠️ **IMPORTANT:** This test will send **REAL EMAIL INVITATIONS** to:
- beau09946@gmail.com
- beaulazear@gmail.com

Make sure you have access to these inboxes to verify the emails arrive!

---

## 🚀 Quick Start - One Command Setup (Render Shell)

**For Render Shell:** Copy and paste this entire command:

```bash
rails runner "
# ============================================================
# ONE-COMMAND TEST EVENT SETUP
# ============================================================

puts '🧹 Cleaning up old test events...'
Event.where('title LIKE ?', '%TEST EMAIL%').destroy_all

puts '👤 Finding/creating test organization...'
org = Organization.find_or_create_by!(
  name: 'Test Email Org',
  slug: 'test-email-org'
) do |o|
  o.user = User.first
  o.email = 'testorg@voxxyai.com'
end

puts '📅 Creating test event...'
event = Event.create!(
  title: 'TEST EMAIL FILTERING EVENT',
  slug: \"test-email-#{Time.now.to_i}\",
  event_date: 30.days.from_now,
  application_deadline: 15.days.from_now,
  payment_deadline: 20.days.from_now,
  organization: org,
  published: true
)

puts '📝 Creating vendor application...'
vendor_app = VendorApplication.create!(
  event: event,
  name: 'Vendor Application',
  categories: ['Food', 'Art', 'Music'],
  booth_price: 100.00,
  status: 'active'
)

puts '👥 Creating vendor contacts (REAL EMAILS - will receive invitations)...'
contact1 = VendorContact.find_or_create_by!(
  organization: org,
  email: 'beau09946@gmail.com'
) do |c|
  c.name = 'Beau Lazear (Gmail 1)'
  c.business_name = 'Test Business 1'
  c.contact_type = 'vendor'
  c.status = 'new'
end

contact2 = VendorContact.find_or_create_by!(
  organization: org,
  email: 'beaulazear@gmail.com'
) do |c|
  c.name = 'Beau Lazear (Gmail 2)'
  c.business_name = 'Test Business 2'
  c.contact_type = 'vendor'
  c.status = 'new'
end

puts '✉️ Creating and sending invitations (EMAILS WILL BE SENT)...'
inv1 = EventInvitation.create!(event: event, vendor_contact: contact1)
inv2 = EventInvitation.create!(event: event, vendor_contact: contact2)

# Send actual invitation emails via EventInvitationMailer
EventInvitationMailer.invitation_email(inv1).deliver_now
EventInvitationMailer.invitation_email(inv2).deliver_now

inv1.mark_as_sent!
inv2.mark_as_sent!

puts '📧 Invitation emails sent to:'
puts '  - beau09946@gmail.com'
puts '  - beaulazear@gmail.com'

puts '📋 Creating test registrations...'
# Registration 1: Approved, unpaid (should get payment reminders)
reg1 = event.registrations.create!(
  name: 'Approved Unpaid Vendor',
  email: 'approved-unpaid@test.com',
  business_name: 'Unpaid Co',
  vendor_category: 'Food',
  status: 'approved',
  payment_status: 'pending',
  vendor_application: vendor_app
)

# Registration 2: Approved, paid (should NOT get payment reminders)
reg2 = event.registrations.create!(
  name: 'Approved Paid Vendor',
  email: 'approved-paid@test.com',
  business_name: 'Paid Co',
  vendor_category: 'Art',
  status: 'approved',
  payment_status: 'confirmed',
  payment_confirmed_at: Time.current,
  vendor_application: vendor_app
)

# Registration 3: Pending (should NOT get payment reminders)
reg3 = event.registrations.create!(
  name: 'Pending Vendor',
  email: 'pending@test.com',
  business_name: 'Pending Co',
  vendor_category: 'Music',
  status: 'pending',
  payment_status: 'pending',
  vendor_application: vendor_app
)

# Registration 4: Approved, overdue (should get payment reminders)
reg4 = event.registrations.create!(
  name: 'Overdue Vendor',
  email: 'overdue@test.com',
  business_name: 'Overdue Co',
  vendor_category: 'Food',
  status: 'approved',
  payment_status: 'overdue',
  vendor_application: vendor_app
)

puts \"\"
puts '✅ Test event created successfully!'
puts \"\"
puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts '📊 EVENT SUMMARY'
puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts \"Event ID: #{event.id}\"
puts \"Event Slug: #{event.slug}\"
puts \"Event Title: #{event.title}\"
puts \"\"
puts \"Total Invitations: #{event.event_invitations.count}\"
puts \"Sent Invitations: #{event.event_invitations.where.not(sent_at: nil).count}\"
puts \"Invitation Recipients:\"
puts \"  - beau09946@gmail.com\"
puts \"  - beaulazear@gmail.com\"
puts \"\"
puts \"Total Registrations: #{event.registrations.count}\"
puts \"Approved Unpaid: #{event.registrations.where(status: 'approved', payment_status: ['pending', 'overdue']).count}\"
puts \"Approved Paid: #{event.registrations.where(status: 'approved', payment_status: ['confirmed', 'paid']).count}\"
puts \"Pending: #{event.registrations.where(status: 'pending').count}\"
puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts \"\"
puts '📧 CHECK YOUR INBOX: Invitation emails have been sent!'
puts '📝 To test, run:'
puts \"  Event.find(#{event.id})\"
"
```

---

## 🧪 Test Scenarios

After running the setup command above, use these commands to test the fixes:

### **Test 1: Invitation Count Remains Stable** ✅

**What we're testing:** The invitation `sent_count` should stay at 3 even when invitation statuses change.

```bash
rails runner "
event = Event.find_by(title: 'TEST EMAIL FILTERING EVENT')

puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts '🧪 TEST 1: INVITATION COUNT STABILITY'
puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts ''

puts '📊 Initial State (all invitations sent):'
puts \"  Total invitations: #{event.event_invitations.count}\"
puts \"  Sent count (new method): #{event.event_invitations.where.not(sent_at: nil).count}\"
puts \"  Sent count (old method): #{event.event_invitations.sent.count}\"
puts ''

puts '👁️ Simulating: User views invitation #1...'
inv1 = event.event_invitations.first
inv1.mark_as_viewed!
puts \"  Invitation #1 status: #{inv1.status}\"
puts ''

puts '📊 After viewing:'
puts \"  Sent count (new method): #{event.event_invitations.where.not(sent_at: nil).count}\"
puts \"  Sent count (old method): #{event.event_invitations.sent.count}\"
puts ''

puts '✅ Simulating: User accepts invitation #2...'
inv2 = event.event_invitations.second
inv2.accept!
puts \"  Invitation #2 status: #{inv2.status}\"
puts ''

puts '📊 After acceptance:'
puts \"  Sent count (new method): #{event.event_invitations.where.not(sent_at: nil).count}\"
puts \"  Sent count (old method): #{event.event_invitations.sent.count}\"
puts ''

puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts '✅ EXPECTED RESULT:'
puts '   - New method should always return 3'
puts '   - Old method would return 1 (incorrect)'
puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
"
```

**Expected Output:**
```
Initial State:
  Total invitations: 2
  Sent count (new method): 2 ✅
  Sent count (old method): 2

After viewing:
  Sent count (new method): 2 ✅ (STABLE!)
  Sent count (old method): 1 ❌ (CHANGED!)

After acceptance:
  Sent count (new method): 2 ✅ (STILL STABLE!)
  Sent count (old method): 0 ❌ (CHANGED AGAIN!)
```

---

### **Test 2: Payment Reminders Only to Unpaid Vendors** ✅

**What we're testing:** Payment reminder emails should only go to approved vendors with pending/overdue payment status.

```bash
rails runner "
event = Event.find_by(title: 'TEST EMAIL FILTERING EVENT')

puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts '🧪 TEST 2: PAYMENT REMINDER FILTERING'
puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts ''

puts '📊 All Registrations:'
event.registrations.each do |reg|
  puts \"  - #{reg.name}: status=#{reg.status}, payment=#{reg.payment_status}\"
end
puts ''

puts '🔍 Testing OLD filter (status only):'
old_filter = { 'status' => ['approved'] }
old_service = RecipientFilterService.new(event, old_filter)
puts \"  Recipients: #{old_service.recipient_count}\"
old_service.filter_recipients.each do |reg|
  puts \"    ❌ #{reg.email} (payment: #{reg.payment_status})\"
end
puts ''

puts '🔍 Testing NEW filter (status + payment_status):'
new_filter = {
  'statuses' => ['approved'],
  'payment_status' => ['pending', 'overdue']
}
new_service = RecipientFilterService.new(event, new_filter)
puts \"  Recipients: #{new_service.recipient_count}\"
new_service.filter_recipients.each do |reg|
  puts \"    ✅ #{reg.email} (payment: #{reg.payment_status})\"
end
puts ''

puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts '✅ EXPECTED RESULT:'
puts '   - OLD filter: 3 recipients (includes paid vendor ❌)'
puts '   - NEW filter: 2 recipients (only unpaid ✅)'
puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
"
```

**Expected Output:**
```
Testing OLD filter:
  Recipients: 3
    ❌ approved-unpaid@test.com (payment: pending)
    ❌ approved-paid@test.com (payment: confirmed)  ← WRONG!
    ❌ overdue@test.com (payment: overdue)

Testing NEW filter:
  Recipients: 2
    ✅ approved-unpaid@test.com (payment: pending)
    ✅ overdue@test.com (payment: overdue)
```

---

### **Test 3: Backward Compatibility (Singular Keys)** ✅

**What we're testing:** RecipientFilterService should accept both `"status"` (singular) and `"statuses"` (plural).

```bash
rails runner "
event = Event.find_by(title: 'TEST EMAIL FILTERING EVENT')

puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts '🧪 TEST 3: BACKWARD COMPATIBILITY'
puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts ''

puts '🔍 Testing with SINGULAR key (\"status\"):'
singular_filter = { 'status' => ['approved'] }
singular_service = RecipientFilterService.new(event, singular_filter)
puts \"  Recipients: #{singular_service.recipient_count}\"
puts ''

puts '🔍 Testing with PLURAL key (\"statuses\"):'
plural_filter = { 'statuses' => ['approved'] }
plural_service = RecipientFilterService.new(event, plural_filter)
puts \"  Recipients: #{plural_service.recipient_count}\"
puts ''

puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts '✅ EXPECTED RESULT:'
puts '   - Both should return the same count (3 approved vendors)'
puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
"
```

---

### **Test 4: API Response Verification** ✅

**What we're testing:** The API endpoint returns the correct `sent_count` using the new method.

```bash
rails runner "
event = Event.find_by(title: 'TEST EMAIL FILTERING EVENT')

puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts '🧪 TEST 4: API RESPONSE (sent_count)'
puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts ''

puts '📊 Calculating metadata (simulating API controller):'
meta = {
  total_count: event.event_invitations.count,
  pending_count: event.event_invitations.pending.count,
  sent_count: event.event_invitations.where.not(sent_at: nil).count,
  viewed_count: event.event_invitations.viewed.count,
  accepted_count: event.event_invitations.accepted.count,
  declined_count: event.event_invitations.declined.count,
  expired_count: event.event_invitations.expired.count
}

puts \"  total_count: #{meta[:total_count]}\"
puts \"  pending_count: #{meta[:pending_count]}\"
puts \"  sent_count: #{meta[:sent_count]}\"
puts \"  viewed_count: #{meta[:viewed_count]}\"
puts \"  accepted_count: #{meta[:accepted_count]}\"
puts \"  declined_count: #{meta[:declined_count]}\"
puts \"  expired_count: #{meta[:expired_count]}\"
puts ''

puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
puts '✅ EXPECTED RESULT:'
puts '   - sent_count should equal total_count (2)'
puts '   - Even if some invitations were viewed/accepted'
puts '   - Emails were sent to beau09946@gmail.com and beaulazear@gmail.com'
puts '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
"
```

---

## 🧹 Cleanup Commands

### Delete Test Event
```bash
rails runner "Event.where('title LIKE ?', '%TEST EMAIL%').destroy_all; puts '✅ Test events deleted'"
```

### Delete Test Vendor Contacts (including real email addresses)
```bash
rails runner "VendorContact.where(email: ['beau09946@gmail.com', 'beaulazear@gmail.com']).or(VendorContact.where('email LIKE ?', '%@test.com')).destroy_all; puts '✅ Test vendor contacts deleted'"
```

### Delete Test Organization
```bash
rails runner "Organization.find_by(slug: 'test-email-org')&.destroy; puts '✅ Test organization deleted'"
```

### Complete Cleanup (All Test Data)
```bash
rails runner "Event.where('title LIKE ?', '%TEST EMAIL%').destroy_all; VendorContact.where(email: ['beau09946@gmail.com', 'beaulazear@gmail.com']).or(VendorContact.where('email LIKE ?', '%@test.com')).destroy_all; Organization.find_by(slug: 'test-email-org')&.destroy; puts '✅ All test data deleted'"
```

---

## 📋 Manual Step-by-Step (For Understanding)

If you want to create the test event manually step-by-step:

### Step 1: Create Organization
```ruby
org = Organization.find_or_create_by!(name: 'Test Org', slug: 'test-org') do |o|
  o.user = User.first
  o.email = 'testorg@voxxyai.com'
end
```

### Step 2: Create Event
```ruby
event = Event.create!(
  title: 'Test Event',
  slug: "test-event-#{Time.now.to_i}",
  event_date: 30.days.from_now,
  application_deadline: 15.days.from_now,
  payment_deadline: 20.days.from_now,
  organization: org,
  published: true
)
```

### Step 3: Create Vendor Application
```ruby
vendor_app = VendorApplication.create!(
  event: event,
  name: 'Vendor Application',
  categories: ['Food', 'Art', 'Music'],
  booth_price: 100.00,
  status: 'active'
)
```

### Step 4: Create Vendor Contacts
```ruby
contact1 = VendorContact.create!(
  organization: org,
  name: 'Contact 1',
  email: 'contact1@test.com',
  business_name: 'Business 1',
  contact_type: 'vendor',
  status: 'new'
)

contact2 = VendorContact.create!(
  organization: org,
  name: 'Contact 2',
  email: 'contact2@test.com',
  business_name: 'Business 2',
  contact_type: 'vendor',
  status: 'new'
)
```

### Step 5: Create and Send Invitations
```ruby
inv1 = EventInvitation.create!(event: event, vendor_contact: contact1)
inv2 = EventInvitation.create!(event: event, vendor_contact: contact2)

inv1.mark_as_sent!
inv2.mark_as_sent!
```

### Step 6: Create Test Registrations
```ruby
# Approved, unpaid
event.registrations.create!(
  name: 'Vendor A',
  email: 'vendora@test.com',
  business_name: 'A Co',
  vendor_category: 'Food',
  status: 'approved',
  payment_status: 'pending',
  vendor_application: vendor_app
)

# Approved, paid
event.registrations.create!(
  name: 'Vendor B',
  email: 'vendorb@test.com',
  business_name: 'B Co',
  vendor_category: 'Art',
  status: 'approved',
  payment_status: 'confirmed',
  vendor_application: vendor_app
)
```

---

## 🎯 Quick Verification Checklist

After running tests, verify:

- [ ] Invitation `sent_count` stays at 3 even after viewing/accepting
- [ ] Payment reminders only go to 2 vendors (unpaid ones)
- [ ] Singular key `"status"` still works (backward compatible)
- [ ] API returns correct `sent_count` in metadata

---

## 🐛 Troubleshooting

### Issue: "Event not found"
**Solution:** Make sure you ran the setup command first, or check the event title matches exactly.

### Issue: "Organization user cannot be nil"
**Solution:** Make sure you have at least one user in the database:
```ruby
User.first || User.create!(
  email: 'test@voxxyai.com',
  name: 'Test User',
  password: 'password123',
  role: 'venue_owner'
)
```

### Issue: Counts don't match expected
**Solution:** Check if there are existing test events:
```ruby
Event.where('title LIKE ?', '%TEST EMAIL%').count
```
Run cleanup command and try again.

---

## 📝 Notes

- ⚠️ **REAL EMAILS** are sent to beau09946@gmail.com and beaulazear@gmail.com
- Test registrations use `@test.com` email addresses (no real emails sent)
- Event title contains "TEST EMAIL" for easy cleanup
- Vendor contacts are reused if they already exist (find_or_create_by)
- Organization is reused if it already exists
- Check your Gmail inbox after running the setup command!

---

## 🎯 **Quick Reference for Render Shell**

### Most Common Commands (Copy & Paste)

**Create test event (sends REAL emails to your inbox):**
```bash
rails runner "Event.where('title LIKE ?', '%TEST EMAIL%').destroy_all; org = Organization.find_or_create_by!(name: 'Test Email Org', slug: 'test-email-org') { |o| o.user = User.first; o.email = 'testorg@voxxyai.com' }; event = Event.create!(title: 'TEST EMAIL FILTERING EVENT', slug: \"test-email-#{Time.now.to_i}\", event_date: 30.days.from_now, application_deadline: 15.days.from_now, payment_deadline: 20.days.from_now, organization: org, published: true); vendor_app = VendorApplication.create!(event: event, name: 'Vendor Application', categories: ['Food', 'Art', 'Music'], booth_price: 100.00, status: 'active'); contact1 = VendorContact.find_or_create_by!(organization: org, email: 'beau09946@gmail.com') { |c| c.name = 'Beau Lazear (Gmail 1)'; c.business_name = 'Test Business 1'; c.contact_type = 'vendor'; c.status = 'new' }; contact2 = VendorContact.find_or_create_by!(organization: org, email: 'beaulazear@gmail.com') { |c| c.name = 'Beau Lazear (Gmail 2)'; c.business_name = 'Test Business 2'; c.contact_type = 'vendor'; c.status = 'new' }; inv1 = EventInvitation.create!(event: event, vendor_contact: contact1); inv2 = EventInvitation.create!(event: event, vendor_contact: contact2); EventInvitationMailer.invitation_email(inv1).deliver_now; EventInvitationMailer.invitation_email(inv2).deliver_now; inv1.mark_as_sent!; inv2.mark_as_sent!; event.registrations.create!(name: 'Approved Unpaid', email: 'unpaid@test.com', business_name: 'Unpaid Co', vendor_category: 'Food', status: 'approved', payment_status: 'pending', vendor_application: vendor_app); event.registrations.create!(name: 'Approved Paid', email: 'paid@test.com', business_name: 'Paid Co', vendor_category: 'Art', status: 'approved', payment_status: 'confirmed', vendor_application: vendor_app); puts \"Event created: #{event.slug}\"; puts '📧 Invitation emails sent to beau09946@gmail.com and beaulazear@gmail.com'"
```

**Quick test (invitation count):**
```bash
rails runner "event = Event.find_by(title: 'TEST EMAIL FILTERING EVENT'); puts \"Sent count (new): #{event.event_invitations.where.not(sent_at: nil).count}\"; puts \"Sent count (old): #{event.event_invitations.sent.count}\"; event.event_invitations.first.mark_as_viewed!; puts \"After viewing - Sent count (new): #{event.event_invitations.where.not(sent_at: nil).count}\"; puts \"After viewing - Sent count (old): #{event.event_invitations.sent.count}\""
```

**Quick test (payment filtering):**
```bash
rails runner "event = Event.find_by(title: 'TEST EMAIL FILTERING EVENT'); service = RecipientFilterService.new(event, {'statuses' => ['approved'], 'payment_status' => ['pending', 'overdue']}); puts \"Payment reminder recipients: #{service.recipient_count}\"; service.filter_recipients.each { |r| puts \"  - #{r.email} (payment: #{r.payment_status})\" }"
```

**Cleanup:**
```bash
rails runner "Event.where('title LIKE ?', '%TEST EMAIL%').destroy_all; VendorContact.where(email: ['beau09946@gmail.com', 'beaulazear@gmail.com']).or(VendorContact.where('email LIKE ?', '%@test.com')).destroy_all; puts '✅ Cleaned up'"
```

---

**Last Updated:** January 18, 2026
**Note:** This test sends REAL invitation emails to beau09946@gmail.com and beaulazear@gmail.com
**Related Files:**
- `/app/controllers/api/v1/presents/event_invitations_controller.rb`
- `/app/services/recipient_filter_service.rb`
- `/db/seeds/email_campaign_templates.rb`
