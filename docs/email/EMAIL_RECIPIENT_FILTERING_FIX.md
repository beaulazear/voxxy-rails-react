# Email Recipient Filtering Fix - Implementation Plan

**Created:** January 17, 2026
**Status:** 🔴 Not Started
**Priority:** P0 (Critical - Production Bug)
**Assignee:** Engineering Team
**Estimated Time:** 4-6 hours

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current System Architecture](#current-system-architecture)
3. [Problems Identified](#problems-identified)
4. [Root Cause Analysis](#root-cause-analysis)
5. [Proposed Solution](#proposed-solution)
6. [Implementation Plan](#implementation-plan)
7. [Testing Strategy](#testing-strategy)
8. [Rollout Plan](#rollout-plan)
9. [Success Metrics](#success-metrics)
10. [Appendix](#appendix)

---

## Executive Summary

### The Problem
Our email system has two critical filtering bugs that are causing incorrect recipient targeting:

1. **Announcement emails** (application deadline reminders) are being sent to **invited vendor contacts** instead of **actual applicants**
2. **Payment reminder emails** are being sent to **all approved vendors**, including those who have already paid

### The Impact
- ✉️ Incorrect recipients receiving irrelevant emails
- 😤 Poor user experience (paid vendors getting "URGENT: Payment Due" emails)
- 📊 Inaccurate recipient counts in Command Center UI
- 🚨 Potential spam complaints and deliverability issues

### The Solution
- Fix `ScheduledEmail#recipient_count` to use registrations for announcements
- Add `payment_status` filtering to payment reminder emails
- Standardize filter criteria keys across the codebase
- Ensure RecipientFilterService properly applies all filters

### Timeline
- **Phase 1:** Backend fixes (2-3 hours)
- **Phase 2:** Testing & validation (1-2 hours)
- **Phase 3:** Deployment & monitoring (1 hour)

---

## Current System Architecture

### Email System Overview

Voxxy Presents uses **two separate email systems**:

#### System 1: Scheduled Automated Emails (7 emails)
```
Location: db/seeds/email_campaign_templates.rb
Trigger: Time-based (days before deadline, payment due, event date)
Recipients: Filtered registrations based on criteria
Delivery: EmailSenderWorker (runs every 5 minutes)
Tracking: email_deliveries table with SendGrid webhooks
```

#### System 2: Transactional Service Emails (10 emails)
```
Location: app/services/registration_email_service.rb, app/mailers/event_invitation_mailer.rb
Trigger: Action-based (application submitted, status changed)
Recipients: Specific registration or user
Delivery: Immediate (synchronous)
Tracking: SendGrid categories only
```

### Key Components

#### 1. RecipientFilterService (`app/services/recipient_filter_service.rb`)
**Purpose:** Filters registrations based on criteria from email templates

**Current Filter Methods:**
```ruby
- filter_by_status(scope)           # Filters by registration status (approved, pending, etc.)
- filter_by_vendor_category(scope)  # Filters by category (Food, Art, etc.)
- filter_by_payment_status(scope)   # Filters by payment status (pending, paid, confirmed)
- filter_by_application_status(scope) # Filters by application status
- exclude_unsubscribed(scope)       # Excludes email_unsubscribed=true (always on)
```

**Filter Criteria Format (JSONB):**
```ruby
{
  "statuses": ["approved", "confirmed"],          # Note: plural "statuses"
  "vendor_categories": ["Food", "Beverage"],
  "payment_status": "pending",                    # Note: singular
  "exclude_unsubscribed": true
}
```

#### 2. ScheduledEmail Model (`app/models/scheduled_email.rb`)
**Purpose:** Represents a scheduled email instance for an event

**Key Method:**
```ruby
def recipient_count
  # Problem area - line 33-35
  if is_announcement_email?
    return event.event_invitations.count  # ❌ BUG: Wrong recipients!
  end

  # Start with registrations
  recipients = event.registrations.where(email_unsubscribed: false)

  # Apply filter_criteria
  if filter_criteria["status"].present?
    recipients = recipients.where(status: filter_criteria["status"])
  end
  # ... more filtering

  recipients.count
end
```

#### 3. EmailSenderService (`app/services/email_sender_service.rb`)
**Purpose:** Sends emails via SendGrid with variable resolution and tracking

**Key Flow:**
```ruby
def send_to_recipients
  filter_service = RecipientFilterService.new(event, scheduled_email.filter_criteria)
  recipients = filter_service.filter_recipients  # Get filtered registrations

  recipients.each do |registration|
    send_to_registration(registration)
  end
end
```

#### 4. Registration Model (`app/models/registration.rb`)
**Purpose:** Represents a vendor application or event registration

**Key Fields:**
```ruby
status: "pending" | "approved" | "rejected" | "waitlist" | "confirmed" | "cancelled"
payment_status: "pending" | "paid" | "confirmed" | "overdue"
payment_confirmed_at: DateTime (nullable)
email_unsubscribed: Boolean (default: false)
```

**Status Lifecycle:**
```
pending → approved → confirmed (after payment)
        ↓
        rejected / waitlist
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   EMAIL SENDING FLOW                            │
└─────────────────────────────────────────────────────────────────┘

1. EmailSenderWorker (every 5 minutes)
   ↓
2. Find pending scheduled_emails (scheduled_for <= now)
   ↓
3. EmailSenderService.new(scheduled_email)
   ↓
4. RecipientFilterService.new(event, filter_criteria)
   ↓
5. filter_recipients → Returns ActiveRecord::Relation
   │
   ├── Apply status filter (if present)
   ├── Apply vendor_category filter (if present)
   ├── Apply payment_status filter (if present)  ← CURRENTLY NOT WORKING
   └── Exclude unsubscribed (always on)
   ↓
6. For each registration:
   ├── EmailVariableResolver.resolve(subject, body)
   ├── Send via SendGrid API
   └── Create EmailDelivery record (status: "sent")
   ↓
7. Update scheduled_email (status: "sent", recipient_count: X)
   ↓
8. SendGrid webhook → EmailDeliveryProcessorJob → Update delivery status
```

---

## Problems Identified

### Problem 1: Announcement Emails Sent to Wrong Recipients

**Location:** `app/models/scheduled_email.rb:33-35`

**Current Code:**
```ruby
def recipient_count
  if is_announcement_email?
    return event.event_invitations.count  # ❌ WRONG!
  end

  # ... rest of method
end
```

**What's Happening:**
- "1 Day Before Application Deadline" email (position 1)
- "Application Deadline Day" email (position 2)
- Both are flagged as "announcement emails"
- Method returns `event.event_invitations.count`

**The Issue:**
```
event_invitations = Vendor contacts you INVITED from your Network/CRM
                    (EventInvitation records created when producer sends invites)

registrations = Vendors who ACTUALLY APPLIED to your event
                (Registration records created when vendor submits application)
```

**Example Scenario:**
```
Event: "Summer Market 2025"
- Producer invites 50 vendor contacts from Network → 50 event_invitations
- 20 vendors apply → 20 registrations
- Producer approves 15 vendors → 15 registrations with status="approved"

CURRENT BEHAVIOR (WRONG):
- "1 Day Before Deadline" email recipient_count = 50 (invited contacts)
- Email is sent to all 50 invited contacts
- Even if they already applied, they get the email again

EXPECTED BEHAVIOR:
- Should be sent to registrations who are "pending" (haven't been approved yet)
- Or vendors who haven't applied at all (but how do we track them?)
```

**Why This is Critical:**
- ❌ Invited contacts who never applied are getting "Last Chance to Apply" emails
- ❌ Recipients who already applied and got approved are getting reminder emails
- ❌ UI shows wrong recipient count (Command Center displays inaccurate data)
- ❌ Potential spam complaints

---

### Problem 2: Payment Reminders Sent to Paid Vendors

**Location:** `db/seeds/email_campaign_templates.rb:142, 174`

**Current Filter Criteria:**
```ruby
# Payment reminder email #1 (1 day before payment due)
filter_criteria: { status: ['approved'] }

# Payment reminder email #2 (payment due today)
filter_criteria: { status: ['approved'] }
```

**The Issue:**
The filter only checks `status: 'approved'` but does NOT check `payment_status`.

**Registration Status Lifecycle:**
```
1. Vendor applies → status: "pending", payment_status: "pending"
2. Producer approves → status: "approved", payment_status: "pending"
3. Vendor pays → status: "approved", payment_status: "confirmed", payment_confirmed_at: DateTime
   OR
3. Producer confirms payment → status: "approved", payment_status: "confirmed"
```

**Current Behavior (WRONG):**
```ruby
# All approved vendors, regardless of payment status
recipients = event.registrations.where(status: 'approved')

# This includes:
# - Vendor A: status="approved", payment_status="pending"       ✅ Should get reminder
# - Vendor B: status="approved", payment_status="confirmed"     ❌ Should NOT get reminder
# - Vendor C: status="approved", payment_status="paid"          ❌ Should NOT get reminder
```

**Example Scenario:**
```
Event: "Fall Fest 2025"
- 30 vendors approved
- 20 vendors paid (payment_status: "confirmed")
- 10 vendors haven't paid (payment_status: "pending")

CURRENT BEHAVIOR (WRONG):
- "Payment Due Tomorrow" email sent to all 30 approved vendors
- 20 vendors who already paid get "URGENT: Pay now!" emails
- Confusing and unprofessional

EXPECTED BEHAVIOR:
- Should ONLY send to 10 vendors with payment_status: "pending" or "overdue"
```

**Why This is Critical:**
- 😤 Poor user experience (paid vendors getting "URGENT: Payment Due" emails)
- 📞 Support burden (vendors emailing/calling to say "I already paid!")
- 💰 Possible refund requests due to confusion
- 📉 Damages brand trust

---

### Problem 3: Filter Criteria Key Mismatch

**Location:** Multiple files

**The Mismatch:**

**Seed file uses:**
```ruby
# db/seeds/email_campaign_templates.rb
filter_criteria: { status: ['approved', 'confirmed'] }  # Singular "status"
```

**RecipientFilterService expects:**
```ruby
# app/services/recipient_filter_service.rb:66
def filter_by_status(scope)
  statuses = filter_criteria["statuses"] || filter_criteria[:statuses]  # Plural "statuses"
  return scope unless statuses.present?

  scope.where(status: statuses)
end
```

**Result:**
- The filter reads `filter_criteria["statuses"]` (plural)
- But seed file provides `filter_criteria["status"]` (singular)
- Filter returns `nil` and does nothing!
- **ALL registrations pass through** (except unsubscribed)

**Testing This:**
```ruby
# In Rails console
scheduled_email = ScheduledEmail.find(X)
scheduled_email.filter_criteria
# => { "status" => ["approved", "confirmed"] }

filter_service = RecipientFilterService.new(event, scheduled_email.filter_criteria)
filter_service.filter_recipients
# Returns ALL registrations (filter isn't applied!)
```

**Why This is Critical:**
- 🚨 Payment reminder emails sent to EVERYONE (pending, rejected, waitlist, all statuses)
- 🚨 Event countdown emails sent to vendors who were rejected
- 🚨 Complete breakdown of recipient targeting

---

## Root Cause Analysis

### Why Did This Happen?

#### 1. Announcement Email Recipients Bug

**Root Cause:**
The `is_announcement_email?` method was designed for the **original "Event Announcement (immediate)"** email that was supposed to go to invited contacts when an event is created. However, this logic was incorrectly applied to **"Application Deadline Reminder"** emails, which should target actual applicants.

**Code History:**
```ruby
# Original intent (correct):
# "Event Announcement" email on event creation → Send to event_invitations (invited contacts)

# Unintended consequence (incorrect):
# "1 Day Before Deadline" reminder → Also flagged as announcement → Wrong recipients
```

**Detection Method:**
```ruby
def is_announcement_email?
  return true if trigger_type == "on_application_open"

  # This catches ANY email with "announcement" in the name!
  name.downcase.include?("announcement") || name.downcase.include?("immediate")
end
```

The email template seed file has:
- Position 1: "1 Day Before Application Deadline" → category: `'event_announcements'`
- Position 2: "Application Deadline Day" → category: `'event_announcements'`

Both are categorized as "announcements" so they match the method!

---

#### 2. Payment Status Filtering Bug

**Root Cause:**
The payment reminder email templates were created with incomplete filter criteria. The developer only specified `status: ['approved']` without considering that approved vendors may have already paid.

**Why It Was Missed:**

1. **Lack of test data:** During development, no registrations had `payment_status: "confirmed"`
2. **Missing test coverage:** No spec testing payment reminder filters
3. **Incomplete requirements:** Original spec didn't explicitly state "exclude paid vendors"

**Schema Evidence:**
```ruby
# The payment_status field exists and is indexed!
t.string "payment_status", default: "pending"
t.datetime "payment_confirmed_at"
t.index ["payment_status"], name: "index_registrations_on_payment_status"
```

But the seed file doesn't use it:
```ruby
filter_criteria: { status: ['approved'] }  # Missing payment_status!
```

---

#### 3. Filter Key Mismatch Bug

**Root Cause:**
Inconsistent naming convention between the seed file and the service.

**Timeline:**
1. RecipientFilterService was written first with `statuses` (plural)
2. Seed file was written later with `status` (singular)
3. No integration test to verify filter criteria actually work
4. Service has fallback for symbol keys (`:statuses`) but not string keys (`"status"`)

**Evidence:**
```ruby
# Service tries both symbol and string versions of "statuses" (plural)
statuses = filter_criteria["statuses"] || filter_criteria[:statuses]

# But seed file provides "status" (singular)
filter_criteria: { status: ['approved'] }

# Fallback doesn't catch the singular version!
```

---

## Proposed Solution

### Solution Overview

We will fix all three problems with a coordinated set of changes:

1. **Fix announcement email recipients** - Use registrations, not invitations
2. **Add payment status filtering** - Exclude paid/confirmed vendors from payment reminders
3. **Standardize filter keys** - Use `statuses` (plural) everywhere and add backward compatibility

---

### Solution 1: Fix Announcement Email Recipients

#### Approach A: Send to Pending Applicants Only (Recommended)

**Logic:**
"Application deadline reminders should go to vendors who have applied but haven't been approved/rejected yet."

**Implementation:**
```ruby
# app/models/scheduled_email.rb

def recipient_count
  return 0 unless event

  # Special handling for announcement emails
  if is_announcement_email?
    # Announcement/deadline reminder emails go to registrations who are still pending
    return event.registrations
                .where(email_unsubscribed: false)
                .where(status: 'pending')  # Only vendors awaiting review
                .count
  end

  # ... rest of existing logic
end
```

**Pros:**
- ✅ Sends only to vendors who actually applied
- ✅ Excludes approved vendors (they're already in)
- ✅ Excludes rejected vendors (they can't apply again)
- ✅ Most logical interpretation of "application deadline reminder"

**Cons:**
- ⚠️ Doesn't remind people who haven't applied yet (but we don't have their emails)

---

#### Approach B: Send to All Registrations (Alternative)

**Logic:**
"Send to everyone who has any relationship with the event (applied or invited)."

**Implementation:**
```ruby
def recipient_count
  if is_announcement_email?
    # Send to ALL registrations regardless of status
    return event.registrations
                .where(email_unsubscribed: false)
                .count
  end
  # ...
end
```

**Pros:**
- ✅ Simple logic
- ✅ Catches everyone

**Cons:**
- ❌ Sends to approved vendors (already confirmed)
- ❌ Sends to rejected vendors (can't apply)

---

#### Approach C: Remove Special Handling (Alternative)

**Logic:**
"Let the filter_criteria determine recipients for ALL emails, including announcements."

**Implementation:**
```ruby
def recipient_count
  return 0 unless event

  # Remove special handling - let filter_criteria work
  # if is_announcement_email?
  #   return event.event_invitations.count  # DELETE THIS
  # end

  recipients = event.registrations.where(email_unsubscribed: false)

  # Apply filter criteria (this will use the seed file's filters)
  if filter_criteria.present?
    # ... existing filtering logic
  end

  recipients.count
end
```

**Pros:**
- ✅ Consistent with all other emails
- ✅ Respects filter_criteria from seed file
- ✅ Easier to maintain

**Cons:**
- ⚠️ Requires updating seed file to add explicit filters for announcement emails

---

**Recommended Approach:** **Approach C** (Remove special handling)

**Rationale:**
- Most flexible - producers can control recipients via filter_criteria
- Consistent with other emails
- Easier to debug and maintain
- Allows future customization per event

**Required Changes:**
1. Remove special handling from `ScheduledEmail#recipient_count`
2. Update seed file to specify correct filters for announcement emails
3. Update EmailSenderService to respect filters for all email types

---

### Solution 2: Add Payment Status Filtering

#### Implementation

**Step 1: Update Seed File**

```ruby
# db/seeds/email_campaign_templates.rb

# Payment reminder #1 (1 day before due)
create_email(template, {
  name: '1 Day Before Payment Due',
  position: 3,
  category: 'payment_reminders',
  subject_template: 'Reminder: Payment Due Tomorrow - [eventName]',
  body_template: <<~HTML,
    # ... existing template
  HTML
  trigger_type: 'days_before_payment_deadline',
  trigger_value: 1,
  trigger_time: '10:00',
  filter_criteria: {
    statuses: ['approved'],                      # Changed to plural
    payment_status: ['pending', 'overdue']       # NEW: Only unpaid vendors
  },
  enabled_by_default: true
})

# Payment reminder #2 (due today)
create_email(template, {
  name: 'Payment Due Today',
  position: 4,
  category: 'payment_reminders',
  subject_template: 'URGENT: Payment Due Today - [eventName]',
  body_template: <<~HTML,
    # ... existing template
  HTML
  trigger_type: 'on_payment_deadline',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: {
    statuses: ['approved'],                      # Changed to plural
    payment_status: ['pending', 'overdue']       # NEW: Only unpaid vendors
  },
  enabled_by_default: true
})
```

**Step 2: Update RecipientFilterService**

The service already has the `filter_by_payment_status` method, but we need to ensure it accepts array format:

```ruby
# app/services/recipient_filter_service.rb

def filter_by_payment_status(scope)
  payment_statuses = filter_criteria["payment_status"] || filter_criteria[:payment_status]
  return scope unless payment_statuses.present?

  # Handle both single value and array
  statuses_array = Array(payment_statuses)

  scope.where(payment_status: statuses_array)
end
```

---

### Solution 3: Standardize Filter Keys

#### Implementation

**Step 1: Update RecipientFilterService to Accept Both Keys**

```ruby
# app/services/recipient_filter_service.rb

def filter_by_status(scope)
  # Accept both "status" (singular) and "statuses" (plural)
  statuses = filter_criteria["statuses"] ||
             filter_criteria[:statuses] ||
             filter_criteria["status"] ||    # NEW: Backward compatibility
             filter_criteria[:status]        # NEW: Backward compatibility

  return scope unless statuses.present?

  # Handle both single value and array
  statuses_array = Array(statuses)

  scope.where(status: statuses_array)
end

def filter_by_vendor_category(scope)
  # Accept both forms
  categories = filter_criteria["vendor_categories"] ||
               filter_criteria[:vendor_categories] ||
               filter_criteria["vendor_category"] ||   # NEW
               filter_criteria[:vendor_category]       # NEW

  return scope unless categories.present?

  categories_array = Array(categories)

  scope.where(vendor_category: categories_array)
end

def filter_by_payment_status(scope)
  # Accept both forms
  payment_statuses = filter_criteria["payment_status"] ||
                     filter_criteria[:payment_status] ||
                     filter_criteria["payment_statuses"] ||  # NEW
                     filter_criteria[:payment_statuses]      # NEW

  return scope unless payment_statuses.present?

  statuses_array = Array(payment_statuses)

  scope.where(payment_status: statuses_array)
end
```

**Step 2: Standardize Seed File to Use Plural Keys**

```ruby
# db/seeds/email_campaign_templates.rb

# Use "statuses" (plural) everywhere
filter_criteria: {
  statuses: ['approved', 'confirmed'],          # Plural
  vendor_categories: ['Food', 'Beverage'],      # Plural
  payment_status: ['pending', 'overdue']        # Keep singular (field name)
}
```

**Step 3: Update Documentation**

```ruby
# Add clear documentation to RecipientFilterService

# Filter criteria format:
#   {
#     "statuses": ["approved", "pending"],           # Registration status (plural)
#     "vendor_categories": ["Food", "Beverage"],     # Vendor categories (plural)
#     "payment_status": ["pending", "overdue"],      # Payment status (singular, but accepts array)
#     "exclude_unsubscribed": true                   # Boolean
#   }
#
# Backward compatibility:
#   - Accepts "status" (singular) as alias for "statuses"
#   - Accepts "vendor_category" (singular) as alias for "vendor_categories"
#   - All fields accept both string keys and symbol keys
```

---

## Implementation Plan

### Phase 1: Backend Fixes (2-3 hours)

#### Task 1.1: Fix ScheduledEmail Model ✅ **Priority: P0**

**File:** `app/models/scheduled_email.rb`

**Changes:**
- [ ] Remove special handling for announcement emails (lines 33-35)
- [ ] Let filter_criteria control recipients for ALL email types
- [ ] Update `recipient_count` method to use standard filtering
- [ ] Add comments explaining the change

**Code Changes:**
```ruby
# BEFORE (lines 29-70):
def recipient_count
  return 0 unless event

  # Special handling for announcement emails
  if is_announcement_email?
    return event.event_invitations.count  # ❌ DELETE THIS BLOCK
  end

  recipients = event.registrations.where(email_unsubscribed: false)

  # Apply filter criteria if present
  if filter_criteria.present?
    if filter_criteria["status"].present?
      recipients = recipients.where(status: filter_criteria["status"])
    end
    # ... more filters
  end

  recipients.count
end

# AFTER:
def recipient_count
  return 0 unless event

  # Use RecipientFilterService for consistent filtering
  filter_service = RecipientFilterService.new(event, filter_criteria || {})
  filter_service.recipient_count
end
```

**Testing:**
```ruby
# Create test event with registrations
event = Event.create!(title: "Test Event", ...)
event.registrations.create!(name: "Vendor A", email: "a@test.com", status: "pending")
event.registrations.create!(name: "Vendor B", email: "b@test.com", status: "approved")

# Create scheduled email with filter
scheduled_email = ScheduledEmail.create!(
  event: event,
  name: "Test Email",
  filter_criteria: { "statuses": ["pending"] }
)

# Should return 1 (only pending registration)
scheduled_email.recipient_count  # => 1
```

**Estimated Time:** 30 minutes

---

#### Task 1.2: Update RecipientFilterService ✅ **Priority: P0**

**File:** `app/services/recipient_filter_service.rb`

**Changes:**
- [ ] Add backward compatibility for singular keys (`status`, `vendor_category`)
- [ ] Handle array and single value formats
- [ ] Add comprehensive documentation
- [ ] Add validation/error handling

**Code Changes:**
```ruby
def filter_by_status(scope)
  # Accept both singular and plural forms
  statuses = filter_criteria["statuses"] ||
             filter_criteria[:statuses] ||
             filter_criteria["status"] ||
             filter_criteria[:status]

  return scope unless statuses.present?

  # Convert to array if single value
  statuses_array = Array(statuses)

  # Validate status values
  valid_statuses = %w[pending confirmed cancelled approved rejected waitlist]
  invalid = statuses_array - valid_statuses
  if invalid.any?
    Rails.logger.warn("Invalid status values in filter: #{invalid.join(', ')}")
  end

  scope.where(status: statuses_array & valid_statuses)
end

def filter_by_payment_status(scope)
  payment_statuses = filter_criteria["payment_status"] ||
                     filter_criteria[:payment_status] ||
                     filter_criteria["payment_statuses"] ||
                     filter_criteria[:payment_statuses]

  return scope unless payment_statuses.present?

  statuses_array = Array(payment_statuses)

  # Validate payment status values
  valid_statuses = %w[pending paid confirmed overdue]
  invalid = statuses_array - valid_statuses
  if invalid.any?
    Rails.logger.warn("Invalid payment_status values in filter: #{invalid.join(', ')}")
  end

  scope.where(payment_status: statuses_array & valid_statuses)
end

def filter_by_vendor_category(scope)
  categories = filter_criteria["vendor_categories"] ||
               filter_criteria[:vendor_categories] ||
               filter_criteria["vendor_category"] ||
               filter_criteria[:vendor_category]

  return scope unless categories.present?

  categories_array = Array(categories)

  scope.where(vendor_category: categories_array)
end
```

**Testing:**
```ruby
# Test backward compatibility
event = Event.create!(...)
registration = event.registrations.create!(status: "approved", payment_status: "pending")

# Test singular key (old format)
service = RecipientFilterService.new(event, { "status" => ["approved"] })
expect(service.recipient_count).to eq(1)

# Test plural key (new format)
service = RecipientFilterService.new(event, { "statuses" => ["approved"] })
expect(service.recipient_count).to eq(1)

# Test payment_status filtering
service = RecipientFilterService.new(event, {
  "statuses" => ["approved"],
  "payment_status" => ["pending"]
})
expect(service.recipient_count).to eq(1)

# Test multiple filters combined
registration2 = event.registrations.create!(status: "approved", payment_status: "confirmed")
service = RecipientFilterService.new(event, {
  "statuses" => ["approved"],
  "payment_status" => ["pending"]
})
expect(service.recipient_count).to eq(1)  # Should only include pending payment
```

**Estimated Time:** 45 minutes

---

#### Task 1.3: Update Email Seed File ✅ **Priority: P0**

**File:** `db/seeds/email_campaign_templates.rb`

**Changes:**
- [ ] Change all `status` keys to `statuses` (plural)
- [ ] Add `payment_status` filtering to payment reminder emails
- [ ] Add explicit `statuses` filters to announcement emails
- [ ] Test seed file execution

**Code Changes:**
```ruby
# Lines 46-76: Announcement Email #1
create_email(template, {
  name: '1 Day Before Application Deadline',
  position: 1,
  category: 'event_announcements',
  subject_template: "Last Chance: [eventName] Applications Close Tomorrow",
  body_template: <<~HTML,
    # ... existing template
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 1,
  trigger_time: '09:00',
  filter_criteria: {
    statuses: ['pending']  # NEW: Only send to vendors awaiting review
  },
  enabled_by_default: true
})

# Lines 78-106: Announcement Email #2
create_email(template, {
  name: 'Application Deadline Day',
  position: 2,
  category: 'event_announcements',
  subject_template: 'URGENT: [eventName] Applications Close Today',
  body_template: <<~HTML,
    # ... existing template
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: {
    statuses: ['pending']  # NEW: Only send to vendors awaiting review
  },
  enabled_by_default: true
})

# Lines 116-144: Payment Reminder #1
create_email(template, {
  name: '1 Day Before Payment Due',
  position: 3,
  category: 'payment_reminders',
  subject_template: 'Reminder: Payment Due Tomorrow - [eventName]',
  body_template: <<~HTML,
    # ... existing template
  HTML
  trigger_type: 'days_before_payment_deadline',
  trigger_value: 1,
  trigger_time: '10:00',
  filter_criteria: {
    statuses: ['approved'],                    # Changed to plural
    payment_status: ['pending', 'overdue']     # NEW: Only unpaid vendors
  },
  enabled_by_default: true
})

# Lines 146-176: Payment Reminder #2
create_email(template, {
  name: 'Payment Due Today',
  position: 4,
  category: 'payment_reminders',
  subject_template: 'URGENT: Payment Due Today - [eventName]',
  body_template: <<~HTML,
    # ... existing template
  HTML
  trigger_type: 'on_payment_deadline',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: {
    statuses: ['approved'],                    # Changed to plural
    payment_status: ['pending', 'overdue']     # NEW: Only unpaid vendors
  },
  enabled_by_default: true
})

# Lines 186-234: Event countdown emails
create_email(template, {
  name: '1 Day Before Event',
  position: 5,
  category: 'event_countdown',
  subject_template: 'Tomorrow: [eventName] Final Details',
  body_template: <<~HTML,
    # ... existing template
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 1,
  trigger_time: '17:00',
  filter_criteria: {
    statuses: ['approved', 'confirmed'],       # Changed to plural
    payment_status: ['confirmed', 'paid']      # NEW: Only paid vendors
  },
  enabled_by_default: true
})

create_email(template, {
  name: 'Day of Event',
  position: 6,
  category: 'event_countdown',
  subject_template: 'Today: [eventName]',
  body_template: <<~HTML,
    # ... existing template
  HTML
  trigger_type: 'on_event_date',
  trigger_value: 0,
  trigger_time: '07:00',
  filter_criteria: {
    statuses: ['approved', 'confirmed'],       # Changed to plural
    payment_status: ['confirmed', 'paid']      # NEW: Only paid vendors
  },
  enabled_by_default: true
})

create_email(template, {
  name: 'Day After Event - Thank You',
  position: 7,
  category: 'post_event',
  subject_template: 'Thank You for Participating in [eventName]',
  body_template: <<~HTML,
    # ... existing template
  HTML
  trigger_type: 'days_after_event',
  trigger_value: 1,
  trigger_time: '10:00',
  filter_criteria: {
    statuses: ['approved', 'confirmed'],       # Changed to plural
    payment_status: ['confirmed', 'paid']      # NEW: Only vendors who actually participated
  },
  enabled_by_default: true
})
```

**Deployment Steps:**
```bash
# 1. Backup existing templates (optional but recommended)
rails runner "EmailCampaignTemplate.all.each { |t| puts t.to_json }" > backup_templates.json

# 2. Delete existing default template (if regenerating)
rails runner "EmailCampaignTemplate.where(is_default: true).destroy_all"

# 3. Run seed file
rails runner db/seeds/email_campaign_templates.rb

# 4. Verify templates created
rails runner "puts EmailCampaignTemplate.count; EmailTemplateItem.all.each { |e| puts e.filter_criteria }"

# 5. Regenerate scheduled emails for existing events
rails email_automation:regenerate
```

**Testing:**
```bash
# After running seed, check filter criteria
rails console
> template = EmailCampaignTemplate.find_by(is_default: true)
> template.email_template_items.each do |item|
>   puts "#{item.name}: #{item.filter_criteria}"
> end

# Expected output:
# 1 Day Before Application Deadline: {"statuses"=>["pending"]}
# Application Deadline Day: {"statuses"=>["pending"]}
# 1 Day Before Payment Due: {"statuses"=>["approved"], "payment_status"=>["pending", "overdue"]}
# Payment Due Today: {"statuses"=>["approved"], "payment_status"=>["pending", "overdue"]}
# 1 Day Before Event: {"statuses"=>["approved", "confirmed"], "payment_status"=>["confirmed", "paid"]}
# Day of Event: {"statuses"=>["approved", "confirmed"], "payment_status"=>["confirmed", "paid"]}
# Day After Event: {"statuses"=>["approved", "confirmed"], "payment_status"=>["confirmed", "paid"]}
```

**Estimated Time:** 1 hour

---

#### Task 1.4: Add Rake Task for Updating Existing Events ✅ **Priority: P1**

**File:** `lib/tasks/email_automation.rake`

**Purpose:** Update filter_criteria for existing scheduled_emails in the database

**Code:**
```ruby
# lib/tasks/email_automation.rake

namespace :email_automation do
  desc "Update filter criteria for existing scheduled emails"
  task update_filters: :environment do
    puts "Updating filter_criteria for existing scheduled emails..."

    updated_count = 0
    skipped_count = 0

    ScheduledEmail.where(status: ['scheduled', 'paused']).find_each do |email|
      old_criteria = email.filter_criteria
      new_criteria = old_criteria.deep_dup

      # Convert "status" to "statuses"
      if new_criteria["status"].present?
        new_criteria["statuses"] = new_criteria.delete("status")
      end

      # Add payment_status filtering for payment reminder emails
      if email.name.downcase.include?("payment")
        new_criteria["payment_status"] ||= ["pending", "overdue"]
      end

      # Add statuses filtering for announcement emails
      if email.category == "event_announcements"
        new_criteria["statuses"] ||= ["pending"]
      end

      # Add payment_status to event countdown emails
      if email.category == "event_countdown"
        new_criteria["payment_status"] ||= ["confirmed", "paid"]
      end

      if new_criteria != old_criteria
        email.update!(filter_criteria: new_criteria)
        puts "✓ Updated: #{email.name} (ID: #{email.id})"
        updated_count += 1
      else
        skipped_count += 1
      end
    end

    puts "\nDone!"
    puts "Updated: #{updated_count}"
    puts "Skipped: #{skipped_count}"
  end
end
```

**Usage:**
```bash
# Update existing events
rails email_automation:update_filters

# Then regenerate scheduled emails from templates
rails email_automation:regenerate
```

**Estimated Time:** 30 minutes

---

### Phase 2: Testing & Validation (1-2 hours)

#### Task 2.1: Write RSpec Tests ✅ **Priority: P1**

**File:** `spec/services/recipient_filter_service_spec.rb`

**Test Cases:**
```ruby
require 'rails_helper'

RSpec.describe RecipientFilterService do
  let(:event) { create(:event) }

  describe '#filter_recipients' do
    context 'with status filtering' do
      it 'filters by statuses (plural key)' do
        create(:registration, event: event, status: 'approved')
        create(:registration, event: event, status: 'pending')

        service = RecipientFilterService.new(event, { "statuses" => ["approved"] })
        expect(service.recipient_count).to eq(1)
      end

      it 'filters by status (singular key - backward compatibility)' do
        create(:registration, event: event, status: 'approved')
        create(:registration, event: event, status: 'pending')

        service = RecipientFilterService.new(event, { "status" => ["approved"] })
        expect(service.recipient_count).to eq(1)
      end
    end

    context 'with payment_status filtering' do
      it 'filters by payment_status' do
        create(:registration, event: event, status: 'approved', payment_status: 'pending')
        create(:registration, event: event, status: 'approved', payment_status: 'confirmed')

        service = RecipientFilterService.new(event, {
          "statuses" => ["approved"],
          "payment_status" => ["pending"]
        })
        expect(service.recipient_count).to eq(1)
      end

      it 'filters by multiple payment statuses' do
        create(:registration, event: event, status: 'approved', payment_status: 'pending')
        create(:registration, event: event, status: 'approved', payment_status: 'overdue')
        create(:registration, event: event, status: 'approved', payment_status: 'confirmed')

        service = RecipientFilterService.new(event, {
          "statuses" => ["approved"],
          "payment_status" => ["pending", "overdue"]
        })
        expect(service.recipient_count).to eq(2)
      end
    end

    context 'with combined filters' do
      it 'applies status AND payment_status filters' do
        create(:registration, event: event, status: 'approved', payment_status: 'pending')
        create(:registration, event: event, status: 'approved', payment_status: 'confirmed')
        create(:registration, event: event, status: 'pending', payment_status: 'pending')

        service = RecipientFilterService.new(event, {
          "statuses" => ["approved"],
          "payment_status" => ["pending"]
        })
        expect(service.recipient_count).to eq(1)
      end
    end

    context 'excluding unsubscribed' do
      it 'always excludes email_unsubscribed=true' do
        create(:registration, event: event, status: 'approved', email_unsubscribed: false)
        create(:registration, event: event, status: 'approved', email_unsubscribed: true)

        service = RecipientFilterService.new(event, { "statuses" => ["approved"] })
        expect(service.recipient_count).to eq(1)
      end
    end
  end
end
```

**File:** `spec/models/scheduled_email_spec.rb`

```ruby
require 'rails_helper'

RSpec.describe ScheduledEmail do
  describe '#recipient_count' do
    let(:event) { create(:event) }

    it 'uses RecipientFilterService for counting' do
      create(:registration, event: event, status: 'pending')
      create(:registration, event: event, status: 'approved')

      email = create(:scheduled_email,
        event: event,
        filter_criteria: { "statuses" => ["pending"] }
      )

      expect(email.recipient_count).to eq(1)
    end

    it 'respects payment_status filters' do
      create(:registration, event: event, status: 'approved', payment_status: 'pending')
      create(:registration, event: event, status: 'approved', payment_status: 'confirmed')

      email = create(:scheduled_email,
        event: event,
        filter_criteria: {
          "statuses" => ["approved"],
          "payment_status" => ["pending"]
        }
      )

      expect(email.recipient_count).to eq(1)
    end

    it 'returns 0 for announcement emails with no registrations' do
      email = create(:scheduled_email,
        event: event,
        name: "1 Day Before Application Deadline",
        category: "event_announcements",
        filter_criteria: { "statuses" => ["pending"] }
      )

      expect(email.recipient_count).to eq(0)
    end
  end
end
```

**Run Tests:**
```bash
# Run all email-related specs
bundle exec rspec spec/services/recipient_filter_service_spec.rb
bundle exec rspec spec/models/scheduled_email_spec.rb
bundle exec rspec spec/services/email_sender_service_spec.rb

# Run full test suite
bundle exec rspec
```

**Estimated Time:** 1 hour

---

#### Task 2.2: Manual Testing in Rails Console ✅ **Priority: P1**

**Test Script:**
```ruby
# 1. Create test event
event = Event.create!(
  title: "Test Market",
  event_date: 30.days.from_now,
  application_deadline: 15.days.from_now,
  payment_deadline: 20.days.from_now,
  organization: Organization.first
)

# 2. Create test registrations with various states
vendor_a = event.registrations.create!(
  name: "Vendor A",
  email: "vendor_a@test.com",
  business_name: "A's Tacos",
  vendor_category: "Food",
  status: "pending",
  payment_status: "pending",
  vendor_application: event.active_vendor_application
)

vendor_b = event.registrations.create!(
  name: "Vendor B",
  email: "vendor_b@test.com",
  business_name: "B's Art",
  vendor_category: "Art",
  status: "approved",
  payment_status: "pending",
  vendor_application: event.active_vendor_application
)

vendor_c = event.registrations.create!(
  name: "Vendor C",
  email: "vendor_c@test.com",
  business_name: "C's Crafts",
  vendor_category: "Crafts",
  status: "approved",
  payment_status: "confirmed",
  payment_confirmed_at: Time.current,
  vendor_application: event.active_vendor_application
)

vendor_d = event.registrations.create!(
  name: "Vendor D",
  email: "vendor_d@test.com",
  business_name: "D's Food Truck",
  vendor_category: "Food",
  status: "rejected",
  payment_status: "pending",
  vendor_application: event.active_vendor_application
)

# 3. Test announcement email filtering
puts "\n=== Test 1: Announcement Email (Should target pending only) ==="
announcement_filter = { "statuses" => ["pending"] }
service = RecipientFilterService.new(event, announcement_filter)
puts "Expected: 1 recipient (Vendor A)"
puts "Actual: #{service.recipient_count} recipients"
puts "Emails: #{service.recipient_emails.join(', ')}"
# Should output: vendor_a@test.com

# 4. Test payment reminder filtering
puts "\n=== Test 2: Payment Reminder (Should target approved + unpaid) ==="
payment_filter = {
  "statuses" => ["approved"],
  "payment_status" => ["pending", "overdue"]
}
service = RecipientFilterService.new(event, payment_filter)
puts "Expected: 1 recipient (Vendor B)"
puts "Actual: #{service.recipient_count} recipients"
puts "Emails: #{service.recipient_emails.join(', ')}"
# Should output: vendor_b@test.com

# 5. Test event countdown filtering
puts "\n=== Test 3: Event Countdown (Should target approved + paid) ==="
countdown_filter = {
  "statuses" => ["approved"],
  "payment_status" => ["confirmed", "paid"]
}
service = RecipientFilterService.new(event, countdown_filter)
puts "Expected: 1 recipient (Vendor C)"
puts "Actual: #{service.recipient_count} recipients"
puts "Emails: #{service.recipient_emails.join(', ')}"
# Should output: vendor_c@test.com

# 6. Test backward compatibility (singular key)
puts "\n=== Test 4: Backward Compatibility (singular 'status') ==="
old_format_filter = { "status" => ["approved"] }
service = RecipientFilterService.new(event, old_format_filter)
puts "Expected: 2 recipients (Vendor B, C)"
puts "Actual: #{service.recipient_count} recipients"
puts "Emails: #{service.recipient_emails.join(', ')}"
# Should output: vendor_b@test.com, vendor_c@test.com

# 7. Test unsubscribe exclusion
puts "\n=== Test 5: Unsubscribe Exclusion ==="
vendor_b.update!(email_unsubscribed: true)
service = RecipientFilterService.new(event, payment_filter)
puts "Expected: 0 recipients (Vendor B unsubscribed)"
puts "Actual: #{service.recipient_count} recipients"
# Should output: 0

# Clean up
event.destroy
puts "\n✓ Test event cleaned up"
```

**Expected Results:**
```
=== Test 1: Announcement Email (Should target pending only) ===
Expected: 1 recipient (Vendor A)
Actual: 1 recipients
Emails: vendor_a@test.com

=== Test 2: Payment Reminder (Should target approved + unpaid) ===
Expected: 1 recipient (Vendor B)
Actual: 1 recipients
Emails: vendor_b@test.com

=== Test 3: Event Countdown (Should target approved + paid) ===
Expected: 1 recipient (Vendor C)
Actual: 1 recipients
Emails: vendor_c@test.com

=== Test 4: Backward Compatibility (singular 'status') ===
Expected: 2 recipients (Vendor B, C)
Actual: 2 recipients
Emails: vendor_b@test.com, vendor_c@test.com

=== Test 5: Unsubscribe Exclusion ===
Expected: 0 recipients (Vendor B unsubscribed)
Actual: 0 recipients

✓ Test event cleaned up
```

**Estimated Time:** 30 minutes

---

#### Task 2.3: Test Scheduled Email Generation ✅ **Priority: P1**

**Test Script:**
```ruby
# 1. Ensure default template exists
template = EmailCampaignTemplate.find_by(is_default: true)
unless template
  puts "Creating default template..."
  load Rails.root.join('db/seeds/email_campaign_templates.rb')
  template = EmailCampaignTemplate.find_by(is_default: true)
end

puts "Template items: #{template.email_template_items.count}"
template.email_template_items.each do |item|
  puts "  #{item.name}: #{item.filter_criteria}"
end

# 2. Create test event
event = Event.create!(
  title: "Test Event for Emails",
  event_date: 30.days.from_now,
  application_deadline: 15.days.from_now,
  payment_deadline: 20.days.from_now,
  organization: Organization.first
)

# 3. Generate scheduled emails
generator = ScheduledEmailGenerator.new(event, template)
result = generator.generate_all

puts "\nGenerated #{result[:created]} scheduled emails"
puts "Errors: #{result[:errors]}" if result[:errors].any?

# 4. Check each scheduled email
event.scheduled_emails.order(:position).each do |email|
  puts "\n#{email.name}:"
  puts "  Filter: #{email.filter_criteria}"
  puts "  Scheduled for: #{email.scheduled_for}"
  puts "  Recipients: #{email.recipient_count}"
end

# 5. Add registrations and verify counts
event.registrations.create!(
  name: "Pending Vendor",
  email: "pending@test.com",
  business_name: "Pending Co",
  vendor_category: "Food",
  status: "pending",
  payment_status: "pending",
  vendor_application: event.active_vendor_application
)

event.registrations.create!(
  name: "Approved Unpaid Vendor",
  email: "approved@test.com",
  business_name: "Approved Co",
  vendor_category: "Food",
  status: "approved",
  payment_status: "pending",
  vendor_application: event.active_vendor_application
)

event.registrations.create!(
  name: "Approved Paid Vendor",
  email: "paid@test.com",
  business_name: "Paid Co",
  vendor_category: "Food",
  status: "approved",
  payment_status: "confirmed",
  vendor_application: event.active_vendor_application
)

puts "\n=== After adding registrations ==="
event.scheduled_emails.order(:position).each do |email|
  puts "\n#{email.name}:"
  puts "  Recipients: #{email.recipient_count}"

  # Show who would receive this email
  filter_service = RecipientFilterService.new(event, email.filter_criteria)
  recipients = filter_service.filter_recipients
  recipients.each do |reg|
    puts "    - #{reg.name} (#{reg.email}) | status: #{reg.status}, payment: #{reg.payment_status}"
  end
end

# Expected output:
# 1 Day Before Application Deadline: 1 recipient (Pending Vendor)
# Application Deadline Day: 1 recipient (Pending Vendor)
# 1 Day Before Payment Due: 1 recipient (Approved Unpaid Vendor)
# Payment Due Today: 1 recipient (Approved Unpaid Vendor)
# 1 Day Before Event: 1 recipient (Approved Paid Vendor)
# Day of Event: 1 recipient (Approved Paid Vendor)
# Day After Event: 1 recipient (Approved Paid Vendor)

# Clean up
event.destroy
puts "\n✓ Test event cleaned up"
```

**Estimated Time:** 30 minutes

---

### Phase 3: Deployment & Monitoring (1 hour)

#### Task 3.1: Deploy to Staging ✅ **Priority: P0**

**Pre-Deployment Checklist:**
- [ ] All tests passing locally
- [ ] Code reviewed and approved
- [ ] Migration plan documented
- [ ] Rollback plan documented

**Deployment Steps:**

```bash
# 1. Create deployment branch
git checkout -b fix/email-recipient-filtering
git add -A
git commit -m "Fix email recipient filtering bugs

- Remove special handling for announcement emails
- Add payment_status filtering to payment reminders
- Add backward compatibility for singular filter keys
- Update seed file with correct filter criteria
- Add comprehensive tests

Fixes: Wrong recipients for announcement emails
Fixes: Paid vendors receiving payment reminders
Fixes: Filter criteria key mismatch"

git push origin fix/email-recipient-filtering

# 2. Deploy to staging
# (Follow your deployment process - Render, Heroku, etc.)

# 3. Run migrations and seeds on staging
heroku run rails db:migrate -a voxxy-rails-staging
heroku run rails runner db/seeds/email_campaign_templates.rb -a voxxy-rails-staging

# 4. Update existing events on staging
heroku run rails email_automation:update_filters -a voxxy-rails-staging
heroku run rails email_automation:regenerate -a voxxy-rails-staging
```

**Verification on Staging:**
```bash
# Check that templates were created correctly
heroku run rails console -a voxxy-rails-staging

> template = EmailCampaignTemplate.find_by(is_default: true)
> template.email_template_items.each { |e| puts "#{e.name}: #{e.filter_criteria}" }

# Check that scheduled emails have correct filters
> ScheduledEmail.first(10).each { |e| puts "#{e.name}: #{e.filter_criteria}" }

# Test recipient counting
> event = Event.last
> event.scheduled_emails.each do |email|
>   puts "#{email.name}: #{email.recipient_count} recipients"
> end
```

**Estimated Time:** 30 minutes

---

#### Task 3.2: Monitor & Validate ✅ **Priority: P0**

**Monitoring Checklist:**
- [ ] Check EmailSenderWorker logs for errors
- [ ] Verify recipient counts are correct in Command Center
- [ ] Confirm no duplicate emails being sent
- [ ] Check SendGrid activity for unexpected volume changes

**Monitoring Commands:**
```bash
# Watch worker logs
heroku logs --tail -a voxxy-rails-staging | grep EmailSenderWorker

# Check for errors
heroku logs --tail -a voxxy-rails-staging | grep ERROR

# Check email delivery records
heroku run rails console -a voxxy-rails-staging
> EmailDelivery.where(created_at: 1.hour.ago..Time.current).count
> EmailDelivery.where(created_at: 1.hour.ago..Time.current).group(:status).count
```

**SendGrid Dashboard:**
- Check "Activity Feed" for recent sends
- Verify recipient counts match expectations
- Check for bounce spikes or spam reports

**Rollback Plan:**
```bash
# If issues found, rollback immediately
git revert HEAD
git push origin fix/email-recipient-filtering

# Redeploy previous version
# (Follow your deployment process)

# Restore old seed data (if needed)
heroku run rails runner "EmailCampaignTemplate.where(is_default: true).destroy_all" -a voxxy-rails-staging
# Then restore from backup_templates.json
```

**Estimated Time:** 30 minutes

---

#### Task 3.3: Deploy to Production ✅ **Priority: P0**

**Pre-Production Checklist:**
- [ ] Staging tested for at least 24 hours
- [ ] No errors in staging logs
- [ ] Recipient counts verified accurate
- [ ] No spam complaints on SendGrid
- [ ] Team approval obtained

**Production Deployment:**
```bash
# 1. Merge to main
git checkout main
git merge fix/email-recipient-filtering
git push origin main

# 2. Deploy to production
# (Follow your deployment process)

# 3. Run migrations and seeds
heroku run rails db:migrate -a voxxy-rails-production
heroku run rails runner db/seeds/email_campaign_templates.rb -a voxxy-rails-production

# 4. Update existing events
heroku run rails email_automation:update_filters -a voxxy-rails-production
heroku run rails email_automation:regenerate -a voxxy-rails-production

# 5. Verify
heroku run rails console -a voxxy-rails-production
> EmailCampaignTemplate.count
> EmailTemplateItem.count
> ScheduledEmail.scheduled.count
```

**Post-Deployment Monitoring:**
- Monitor for 48 hours
- Check SendGrid for volume changes
- Watch for user complaints
- Verify Command Center UI shows correct counts

**Estimated Time:** 30 minutes

---

## Testing Strategy

### Unit Tests

**Target:** RecipientFilterService, ScheduledEmail model

**Coverage:**
- Filter by status (singular and plural keys)
- Filter by payment_status
- Filter by vendor_category
- Combined filters (status + payment_status)
- Unsubscribe exclusion
- Empty filter criteria
- Invalid filter values

**Files:**
- `spec/services/recipient_filter_service_spec.rb`
- `spec/models/scheduled_email_spec.rb`

---

### Integration Tests

**Target:** EmailSenderService with RecipientFilterService

**Coverage:**
- Send to filtered recipients
- Skip unsubscribed users
- Create delivery records
- Handle SendGrid errors

**Files:**
- `spec/services/email_sender_service_spec.rb`

---

### System Tests

**Target:** End-to-end email workflow

**Scenarios:**

**Scenario 1: Payment Reminder Email**
```
Given: Event with 3 approved vendors (2 paid, 1 unpaid)
When: Payment reminder scheduled email triggers
Then: Only 1 email sent (to unpaid vendor)
```

**Scenario 2: Announcement Email**
```
Given: Event with 2 pending, 2 approved registrations
When: Announcement email triggers
Then: Only 2 emails sent (to pending vendors)
```

**Scenario 3: Event Countdown Email**
```
Given: Event with 2 approved vendors (1 paid, 1 unpaid)
When: Event countdown email triggers
Then: Only 1 email sent (to paid vendor)
```

**Files:**
- `spec/system/email_automation_spec.rb`

---

### Manual Testing

**Test in Rails Console:**
- Create test event
- Add registrations with various statuses
- Generate scheduled emails
- Verify recipient counts
- Test actual sending (in development)

---

## Rollout Plan

### Phase 1: Staging Deployment (Day 1)
- Deploy code changes
- Run migrations and seeds
- Update existing scheduled emails
- Monitor for 24 hours

### Phase 2: Production Deployment (Day 2-3)
- Deploy to production during low-traffic window
- Update existing events
- Monitor closely for 48 hours

### Phase 3: Monitoring & Iteration (Day 4-7)
- Continue monitoring SendGrid metrics
- Check Command Center UI accuracy
- Gather producer feedback
- Address any issues

---

## Success Metrics

### Correctness Metrics
- ✅ Announcement emails sent only to pending registrations
- ✅ Payment reminders sent only to unpaid vendors
- ✅ Event countdown emails sent only to paid vendors
- ✅ No emails sent to unsubscribed users

### Performance Metrics
- ✅ Recipient count accuracy: 100%
- ✅ Filter execution time: < 100ms per event
- ✅ Email sending time: < 5s per batch

### User Experience Metrics
- ✅ Zero spam complaints related to wrong recipients
- ✅ Reduced support tickets about irrelevant emails
- ✅ Producer feedback: "recipient counts are now accurate"

### SendGrid Metrics
- ✅ Bounce rate unchanged (should not increase)
- ✅ Spam rate unchanged (should not increase)
- ✅ Delivery rate maintained (> 95%)

---

## Appendix

### A. Filter Criteria Reference

**Standard Format:**
```ruby
{
  "statuses": ["pending", "approved", "confirmed", "rejected", "waitlist", "cancelled"],
  "vendor_categories": ["Food", "Beverage", "Art", "Crafts", "Music", "Entertainment"],
  "payment_status": ["pending", "paid", "confirmed", "overdue"],
  "exclude_unsubscribed": true  # Default: true
}
```

**Backward Compatible Format:**
```ruby
{
  "status": ["approved"],           # Singular (old format)
  "vendor_category": ["Food"],      # Singular (old format)
  "payment_status": "pending"       # Single value (converted to array)
}
```

---

### B. Email Categories & Target Recipients

| Email | Category | Target Recipients |
|-------|----------|------------------|
| 1 Day Before Application Deadline | event_announcements | `status: pending` |
| Application Deadline Day | event_announcements | `status: pending` |
| 1 Day Before Payment Due | payment_reminders | `status: approved, payment_status: [pending, overdue]` |
| Payment Due Today | payment_reminders | `status: approved, payment_status: [pending, overdue]` |
| 1 Day Before Event | event_countdown | `status: [approved, confirmed], payment_status: [paid, confirmed]` |
| Day of Event | event_countdown | `status: [approved, confirmed], payment_status: [paid, confirmed]` |
| Day After Event | post_event | `status: [approved, confirmed], payment_status: [paid, confirmed]` |

---

### C. Registration Status Lifecycle

```
┌──────────────────────────────────────────────────────┐
│           REGISTRATION STATUS FLOW                   │
└──────────────────────────────────────────────────────┘

1. Vendor submits application
   → status: "pending"
   → payment_status: "pending"

2. Producer reviews application
   ├─ APPROVE → status: "approved", payment_status: "pending"
   ├─ REJECT  → status: "rejected", payment_status: "pending"
   └─ WAITLIST → status: "waitlist", payment_status: "pending"

3. Vendor pays (if approved)
   → status: "approved"
   → payment_status: "confirmed"
   → payment_confirmed_at: DateTime

4. Event day arrives
   → status: "confirmed" (optional)
   → payment_status: "confirmed"

5. Post-event
   → status: "confirmed"
   → payment_status: "confirmed"
```

---

### D. Troubleshooting Guide

**Issue:** Recipient count shows 0

**Possible Causes:**
- No registrations match filter criteria
- All registrations are unsubscribed
- Filter criteria has typo (e.g., "statu**e**s" instead of "statu**s**es")
- Event has no registrations yet

**Debug:**
```ruby
event = Event.find(X)
scheduled_email = event.scheduled_emails.find(Y)

# Check filter criteria
puts scheduled_email.filter_criteria

# Check registrations
puts "Total registrations: #{event.registrations.count}"
puts "Unsubscribed: #{event.registrations.where(email_unsubscribed: true).count}"

# Test filter service
service = RecipientFilterService.new(event, scheduled_email.filter_criteria)
puts "Filtered count: #{service.recipient_count}"
puts "Filtered emails: #{service.recipient_emails.join(', ')}"
```

---

**Issue:** Payment reminder sent to paid vendors

**Possible Causes:**
- Filter criteria missing `payment_status`
- Registration has wrong payment_status value
- Seed file not updated

**Debug:**
```ruby
event = Event.find(X)
payment_email = event.scheduled_emails.find_by(name: "Payment Due Today")

# Check filter
puts payment_email.filter_criteria
# Should include: "payment_status"=>["pending", "overdue"]

# Check registrations
event.registrations.where(status: 'approved').each do |reg|
  puts "#{reg.email}: status=#{reg.status}, payment=#{reg.payment_status}"
end
```

---

**Issue:** Announcement emails sent to approved vendors

**Possible Causes:**
- Filter criteria missing or incorrect
- Special handling still in ScheduledEmail model

**Debug:**
```ruby
event = Event.find(X)
announcement_email = event.scheduled_emails.find_by(name: "1 Day Before Application Deadline")

# Check filter
puts announcement_email.filter_criteria
# Should be: {"statuses"=>["pending"]}

# Check for special handling (should NOT exist)
puts announcement_email.is_announcement_email?
# Should return false (or method shouldn't affect recipient_count)
```

---

### E. Related Documentation

- [Email Automation System Guide](/docs/EMAIL_AUTOMATION_SYSTEM_GUIDE.md)
- [Email Master Reference](/docs/VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md)
- [SendGrid Webhook Setup](/docs/SENDGRID_WEBHOOK_SETUP.md)
- [RecipientFilterService API](/app/services/recipient_filter_service.rb)

---

## Progress Tracking

### Overall Status: 🔴 Not Started

**Phase 1: Backend Fixes** - 🔴 Not Started
- [ ] Task 1.1: Fix ScheduledEmail Model
- [ ] Task 1.2: Update RecipientFilterService
- [ ] Task 1.3: Update Email Seed File
- [ ] Task 1.4: Add Rake Task

**Phase 2: Testing** - 🔴 Not Started
- [ ] Task 2.1: Write RSpec Tests
- [ ] Task 2.2: Manual Testing
- [ ] Task 2.3: Test Email Generation

**Phase 3: Deployment** - 🔴 Not Started
- [ ] Task 3.1: Deploy to Staging
- [ ] Task 3.2: Monitor & Validate
- [ ] Task 3.3: Deploy to Production

---

**Last Updated:** January 17, 2026
**Document Version:** 1.0
**Next Review:** After Phase 1 completion
