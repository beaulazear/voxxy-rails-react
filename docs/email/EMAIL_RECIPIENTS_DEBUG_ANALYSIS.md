# Email Recipients & Delivery Tracking - Debug Analysis

**Date:** January 18, 2026
**Issue:** Recipients count changing after vendor approval & Undelivered emails not displaying

---

## 🔍 Issues Identified

### Issue #1: Recipient Count Changes When Vendor Status Changes

**Symptom:** When a vendor is approved (status changes from `pending` to `approved`), the recipient count for invitation/announcement emails changes.

**Root Cause:**

The `ScheduledEmail#recipient_count` method has two different representations:

1. **Dynamic Method (calculated on-the-fly)** - `app/models/scheduled_email.rb:29-70`
   ```ruby
   def recipient_count
     recipients = event.registrations.where(email_unsubscribed: false)

     # Apply filter_criteria
     if filter_criteria["status"].present?
       recipients = recipients.where(status: filter_criteria["status"])
     end

     recipients.count
   end
   ```

2. **Persisted Column** - Stored in database when email is sent
   ```ruby
   # app/services/email_sender_service.rb:36-41
   scheduled_email.update!(
     status: "sent",
     sent_at: Time.current,
     recipient_count: sent_count  # <-- Persisted value
   )
   ```

**The Problem:**

- **BEFORE email is sent:** The `recipient_count` method calculates dynamically based on CURRENT registration statuses
- **AFTER email is sent:** The `recipient_count` column stores the ACTUAL number of recipients who received the email
- **Issue:** For unsent/scheduled emails, the count recalculates every time based on current filters, so approving a vendor changes the count

**Example Scenario:**
1. Create event with invitation email (filter: `status: ["pending"]`)
2. Invitation email shows `recipient_count = 10` (10 pending vendors)
3. Approve 5 vendors (status changes to `approved`)
4. Invitation email now shows `recipient_count = 5` (only pending vendors match filter)
5. **User sees:** "Recipients changed from 10 to 5" ❌

**Expected Behavior:**
- Once an email is sent, the recipient count should be FIXED (the persisted value)
- For scheduled/unsent emails, showing dynamic count is actually useful for planning
- The issue is likely that the persisted value isn't being used properly after sending

---

### Issue #2: Undelivered & Unsubscribed Counts Not Displayed

**Symptom:** Frontend shows `0` for undelivered and unsubscribed counts regardless of actual SendGrid delivery status.

**Root Cause:**

Frontend has placeholder TODOs and isn't fetching delivery data:

**Frontend:** `EmailRow.tsx:130-132`
```typescript
// Calculate undelivered and unsubscribed counts (placeholder for now)
const undeliveredCount = 0; // TODO: Get from email.email_deliveries
const unsubscribedCount = 0; // TODO: Get from email.email_deliveries
```

**Backend:** Scheduled emails endpoint doesn't include aggregated delivery counts

The backend DOES track delivery status in `email_deliveries` table via SendGrid webhooks, but:
1. The scheduled emails API endpoint doesn't include delivery aggregations
2. The frontend doesn't fetch `email_deliveries` data
3. The frontend doesn't calculate counts from delivery data

**What's Working:**
- ✅ SendGrid webhook receives delivery events
- ✅ `EmailDeliveryProcessorJob` updates `email_deliveries` table
- ✅ Individual deliveries tracked with status (delivered, bounced, dropped, unsubscribed)

**What's NOT Working:**
- ❌ No aggregation of delivery statuses (count by status)
- ❌ Frontend doesn't request delivery data
- ❌ UI shows hardcoded zeros

---

## 🔧 Proposed Fixes

### Fix #1: Clarify Recipient Count Behavior

**Option A: Use Persisted Value After Sending (Recommended)**

Modify `ScheduledEmail#recipient_count` to prefer persisted value after email is sent:

```ruby
def recipient_count
  # If email already sent, use the persisted value (actual recipients)
  return self[:recipient_count] if status == "sent" && self[:recipient_count].present?

  # Otherwise, calculate dynamically (for planning purposes)
  calculate_current_recipient_count
end

def calculate_current_recipient_count
  # Existing dynamic calculation logic
  # [current lines 31-70]
end
```

**Benefits:**
- Preserves historical accuracy ("10 vendors were emailed")
- Dynamic count still available for scheduling/planning
- Clear distinction between "will receive" vs "did receive"

**Option B: Add Separate Methods**

```ruby
def actual_recipient_count
  # Number who actually received email (persisted)
  self[:recipient_count] || 0
end

def current_recipient_count
  # Number who would receive if sent now (dynamic)
  calculate_current_recipient_count
end
```

**Frontend can show both:**
- "Sent to: 10 vendors"
- "Currently would match: 5 vendors" (if filters changed)

---

### Fix #2: Add Delivery Status Aggregation

**Backend Changes:**

1. **Add method to `ScheduledEmail` model:**

```ruby
# app/models/scheduled_email.rb

def delivery_counts
  return {} unless status == "sent"

  {
    total_sent: self[:recipient_count] || 0,
    delivered: email_deliveries.where(status: "delivered").count,
    bounced: email_deliveries.where(status: "bounced").count,
    dropped: email_deliveries.where(status: "dropped").count,
    unsubscribed: email_deliveries.where(status: "unsubscribed").count,
    pending: email_deliveries.where(status: ["queued", "sent"]).count
  }
end

def undelivered_count
  return 0 unless status == "sent"
  email_deliveries.where(status: ["bounced", "dropped"]).count
end

def unsubscribed_count
  return 0 unless status == "sent"
  email_deliveries.where(status: "unsubscribed").count
end
```

2. **Update controller to include delivery counts:**

```ruby
# app/controllers/api/v1/presents/scheduled_emails_controller.rb

def index
  @scheduled_emails = @event.scheduled_emails
    .includes(:email_deliveries) # Eager load for efficiency
    .by_schedule

  emails_json = @scheduled_emails.map do |email|
    email.as_json.merge(
      delivery_counts: email.delivery_counts,
      undelivered_count: email.undelivered_count,
      unsubscribed_count: email.unsubscribed_count
    )
  end

  render json: emails_json
end
```

**Frontend Changes:**

1. **Update TypeScript interface:**

```typescript
// src/types/email.ts

export interface ScheduledEmail {
  // ... existing fields

  // Add delivery tracking
  delivery_counts?: {
    total_sent: number;
    delivered: number;
    bounced: number;
    dropped: number;
    unsubscribed: number;
    pending: number;
  };
  undelivered_count?: number;
  unsubscribed_count?: number;
}
```

2. **Update EmailRow component:**

```typescript
// src/components/producer/Email/EmailRow.tsx

// Replace lines 130-132:
const undeliveredCount = email.undelivered_count || 0;
const unsubscribedCount = email.unsubscribed_count || 0;

// Optional: Add tooltip with detailed breakdown
const deliveryCounts = email.delivery_counts;
const deliveryTooltip = deliveryCounts ? `
  Delivered: ${deliveryCounts.delivered}
  Bounced: ${deliveryCounts.bounced}
  Dropped: ${deliveryCounts.dropped}
  Pending: ${deliveryCounts.pending}
` : '';
```

---

## 📊 SendGrid Webhook Flow (Verification)

Let's verify the webhook flow is working:

1. **Email Sent** → `EmailSenderService` creates `EmailDelivery` record
   - `status: "sent"`
   - `sendgrid_message_id: "abc123"`

2. **SendGrid Delivers** → Webhook fires with event:
   ```json
   { "event": "delivered", "sg_message_id": "abc123", ... }
   ```

3. **Webhook Endpoint** → `/api/v1/webhooks/sendgrid` receives event
   - Enqueues `EmailDeliveryProcessorJob`

4. **Background Job** → Processes event
   - Finds `EmailDelivery` by `sendgrid_message_id`
   - Updates `status: "delivered"`
   - Sets `delivered_at` timestamp

5. **Database Updated** ✅
   - But... frontend doesn't see it because counts aren't aggregated

---

## 🧪 Testing Plan

### Test #1: Verify Webhook Processing

```ruby
# Rails console
event = Event.last
scheduled_email = event.scheduled_emails.sent.first

# Check deliveries exist
puts "Total deliveries: #{scheduled_email.email_deliveries.count}"
puts "Delivered: #{scheduled_email.email_deliveries.where(status: 'delivered').count}"
puts "Bounced: #{scheduled_email.email_deliveries.where(status: 'bounced').count}"
puts "Pending: #{scheduled_email.email_deliveries.where(status: ['queued', 'sent']).count}"

# Sample some records
scheduled_email.email_deliveries.limit(5).each do |delivery|
  puts "#{delivery.recipient_email}: #{delivery.status} (#{delivery.delivered_at || 'not delivered'})"
end
```

**Expected:** Should see actual delivery statuses if webhooks are working

### Test #2: Check for "Undelivered" Emails

```ruby
# Find emails with delivery failures
EmailDelivery.where(status: ['bounced', 'dropped']).each do |delivery|
  puts "FAILED: #{delivery.recipient_email} - #{delivery.bounce_reason || delivery.drop_reason}"
  puts "  Email: #{delivery.scheduled_email.name}"
  puts "  Status: #{delivery.status}"
end
```

**Expected:** Should find bounced/dropped emails (if any exist)

### Test #3: Recipient Count Consistency

```ruby
scheduled_email = ScheduledEmail.find_by(status: 'sent')

# Compare dynamic vs persisted
puts "Persisted count: #{scheduled_email[:recipient_count]}"
puts "Dynamic count: #{scheduled_email.recipient_count}"
puts "Actual deliveries: #{scheduled_email.email_deliveries.count}"

# These should match!
```

**Expected:** All three numbers should be equal for sent emails

---

## 🚨 Potential Issues to Check

### Issue: SendGrid Webhook Not Configured

**Symptom:** All `email_deliveries` have status `"sent"` but never update to `"delivered"`

**Check:**
```ruby
# Should see mixed statuses if webhooks working
EmailDelivery.group(:status).count
# Expected: { "sent" => X, "delivered" => Y, "bounced" => Z }
# Problem: { "sent" => 100 } (all stuck at "sent")
```

**Fix:** Configure SendGrid webhook (see `docs/email/SENDGRID_WEBHOOK_SETUP.md`)

### Issue: SendGrid Message ID Mismatch

**Symptom:** Webhooks firing but deliveries not updating

**Check:**
```ruby
# Check if message IDs are being captured
EmailDelivery.where(sendgrid_message_id: nil).count  # Should be 0
EmailDelivery.where(sendgrid_message_id: 'unknown-%').count  # Should be 0
```

**Fix:** Ensure `X-Message-Id` header is extracted from SendGrid response

### Issue: Background Jobs Not Processing

**Symptom:** Webhooks received but `EmailDeliveryProcessorJob` not running

**Check:**
```bash
# Check Sidekiq queue
rails console
> require 'sidekiq/api'
> Sidekiq::Queue.new('email_webhooks').size  # Should be 0 (processed)
> Sidekiq::RetrySet.new.size  # Check for failed jobs
```

**Fix:** Ensure Sidekiq is running and `email_webhooks` queue is configured

---

## 📝 Implementation Checklist

- [ ] Add `delivery_counts`, `undelivered_count`, `unsubscribed_count` methods to `ScheduledEmail` model
- [ ] Update `scheduled_emails#index` controller to include delivery counts
- [ ] Update TypeScript `ScheduledEmail` interface with delivery fields
- [ ] Update `EmailRow` component to display actual counts (remove TODOs)
- [ ] Fix `recipient_count` method to use persisted value after sending
- [ ] Test in Rails console to verify delivery tracking works
- [ ] Test in frontend to verify counts display correctly
- [ ] Document the distinction between "planned recipients" vs "actual recipients"

---

## 🎯 Expected Outcomes

After implementing fixes:

1. **Recipient Count Stability:**
   - ✅ Sent emails show fixed recipient count (who actually received it)
   - ✅ Scheduled emails show current count (who would receive if sent now)
   - ✅ Status changes don't retroactively alter sent email counts

2. **Delivery Tracking:**
   - ✅ Undelivered count shows bounced + dropped emails
   - ✅ Unsubscribed count shows who opted out
   - ✅ Delivery status updates in real-time via SendGrid webhooks

3. **User Experience:**
   - ✅ Producer can see which emails failed to deliver
   - ✅ Producer can track unsubscribe rates
   - ✅ Historical data is preserved accurately

---

**Next Steps:** Implement fixes and test with real SendGrid data.
