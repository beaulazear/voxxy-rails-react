# Webhook Diagnostic Needed - CRITICAL

**Date:** January 28, 2026
**Reporter:** Courtney (Product)
**Priority:** HIGH - Blocking Feb 3rd confidence
**Status:** Needs Developer Investigation

---

## Issue Description

**Problem:** SendGrid webhooks are NOT updating EmailDelivery records when emails are dropped/bounced.

**Evidence:**
- Email sent to typo address (non-existent email)
- SendGrid dashboard shows status: **"Dropped"**
- Voxxy database shows status: **"sent"** (incorrect!)
- No webhook received or EmailDelivery record not updated

**Impact:**
- We have ZERO visibility into email failures
- Producers don't know if emails failed
- Cannot debug delivery issues
- Risk of silent failures on Feb 3rd

---

## What We Know

### Timeline
- **When:** Last 24 hours (Jan 27-28, 2026)
- **Environment:** Production/Staging (unclear which)
- **Test Type:** Manual testing with intentionally bad email

### Expected Behavior
```
1. Email sent to bad@invalid.com
2. SendGrid attempts delivery → fails (no such mailbox)
3. SendGrid sends webhook to /webhooks/sendgrid
4. EmailDeliveryProcessorJob processes webhook
5. EmailDelivery record updated:
   - status: "dropped" or "bounced"
   - bounce_reason: "mailbox does not exist"
   - dropped_at: timestamp
```

### Actual Behavior
```
1. Email sent to bad@invalid.com ✓
2. SendGrid attempts delivery → fails ✓
3. SendGrid shows "Dropped" in dashboard ✓
4. Webhook ??? (unknown if sent/received)
5. EmailDelivery record NOT updated:
   - status: "sent" ❌ (should be "dropped")
   - bounce_reason: nil ❌
   - dropped_at: nil ❌
```

---

## Diagnostic Steps for Developer

### Step 1: Check Recent EmailDelivery Records

Run this in **Rails console** (production or staging, whichever was tested):

```ruby
# Find recent EmailDelivery records
recent = EmailDelivery.where("created_at > ?", 24.hours.ago)

puts "=== EmailDelivery Status Report ==="
puts "Total recent deliveries: #{recent.count}"

# Check status distribution
statuses = recent.group(:status).count
puts "\nStatus breakdown:"
statuses.each { |status, count| puts "  #{status}: #{count}" }

# Find any that are stuck in "sent" status (webhook not received)
stuck = recent.where(status: 'sent', delivered_at: nil)
  .where("created_at < ?", 10.minutes.ago)

if stuck.any?
  puts "\n⚠️  #{stuck.count} emails stuck in 'sent' status (no webhook received):"
  stuck.limit(10).each do |d|
    puts "\n  Email: #{d.recipient_email}"
    puts "  Created: #{d.created_at}"
    puts "  SendGrid ID: #{d.sendgrid_message_id}"
    puts "  Scheduled Email: #{d.scheduled_email&.name || 'N/A'}"
  end
else
  puts "\n✓ No emails stuck in 'sent' status"
end

# Find any bounced/dropped (webhook DID work)
failed = recent.where(status: ['bounced', 'dropped', 'failed'])

if failed.any?
  puts "\n❌ #{failed.count} failed deliveries (webhook received):"
  failed.limit(10).each do |d|
    puts "\n  Email: #{d.recipient_email}"
    puts "  Status: #{d.status}"
    puts "  Reason: #{d.bounce_reason || 'unknown'}"
    puts "  Failed at: #{d.bounced_at || d.dropped_at || 'unknown'}"
  end
else
  puts "\n⚠️  No bounced/dropped emails found (either all successful OR webhooks not working)"
end

# Find the specific test email if we know the address
# REPLACE with actual test email address
test_email = "bad@invalid.com"  # UPDATE THIS

test_delivery = EmailDelivery.where("recipient_email ILIKE ?", "%#{test_email}%")
  .order(created_at: :desc).first

if test_delivery
  puts "\n=== Test Email Details ==="
  puts "Recipient: #{test_delivery.recipient_email}"
  puts "Status: #{test_delivery.status}"
  puts "SendGrid ID: #{test_delivery.sendgrid_message_id}"
  puts "Created: #{test_delivery.created_at}"
  puts "Delivered: #{test_delivery.delivered_at || 'N/A'}"
  puts "Bounced: #{test_delivery.bounced_at || 'N/A'}"
  puts "Dropped: #{test_delivery.dropped_at || 'N/A'}"
  puts "Bounce reason: #{test_delivery.bounce_reason || 'N/A'}"
else
  puts "\n⚠️  Could not find test email delivery record"
end
```

**Expected Output:**
- If webhooks working: Should show emails in "bounced" or "dropped" status
- If webhooks broken: All emails stuck in "sent" status

---

### Step 2: Check Webhook Endpoint

```ruby
# Verify webhook route exists
Rails.application.routes.routes.find { |r| r.path.spec.to_s.include?('webhooks/sendgrid') }
# Should return: POST /webhooks/sendgrid

# Check recent webhook logs
# (If logging configured)
```

**Manual Check:**
1. Go to SendGrid dashboard: https://app.sendgrid.com/settings/mail_settings
2. Click "Event Webhook" or "Inbound Parse"
3. Verify webhook URL points to:
   - **Staging:** `https://staging-api.voxxypresents.com/webhooks/sendgrid`
   - **Production:** `https://api.voxxypresents.com/webhooks/sendgrid`
4. Check "Enabled" is ON
5. Check which events are selected (should include: delivered, bounced, dropped, opened, clicked)

---

### Step 3: Check Heroku Logs for Webhook Activity

```bash
# Search for webhook activity in last 24 hours
heroku logs --tail -a voxxy-rails-production | grep -i "webhook"

# Look for:
# - POST /webhooks/sendgrid
# - EmailDeliveryProcessorJob
# - Any errors in webhook processing
```

**What to look for:**
```
✓ GOOD: POST /webhooks/sendgrid (200 OK)
✓ GOOD: EmailDeliveryProcessorJob - Processing webhook for message_id: xyz
❌ BAD: POST /webhooks/sendgrid (401 Unauthorized)
❌ BAD: POST /webhooks/sendgrid (500 Internal Server Error)
❌ BAD: No webhook logs at all
```

---

### Step 4: Test Webhook Manually

Create a test email delivery and simulate webhook:

```ruby
# In Rails console
event = Event.first
scheduled_email = event.scheduled_emails.first

# Create test delivery
delivery = EmailDelivery.create!(
  recipient_email: 'test-webhook@example.com',
  scheduled_email: scheduled_email,
  sendgrid_message_id: 'test-' + SecureRandom.hex(10),
  status: 'sent'
)

puts "Created test delivery: #{delivery.id}"

# Manually trigger webhook processing
# (Simulates SendGrid webhook)
EmailDeliveryProcessorJob.perform_now(
  'email' => 'test-webhook@example.com',
  'event' => 'dropped',
  'reason' => 'Invalid',
  'sg_message_id' => delivery.sendgrid_message_id,
  'timestamp' => Time.current.to_i
)

# Check if delivery updated
delivery.reload
puts "Status after webhook: #{delivery.status}"
puts "Bounce reason: #{delivery.bounce_reason}"

# Expected: status = "dropped", bounce_reason = "Invalid"
```

---

## Possible Root Causes

### Theory 1: Webhook URL Misconfigured
- SendGrid sending to wrong URL
- URL changed but SendGrid not updated
- Webhook disabled in SendGrid settings

**Fix:** Update SendGrid webhook URL and re-enable

---

### Theory 2: Webhook Authentication Failing
- SendGrid signature verification failing
- Missing authentication header
- Webhook controller rejecting requests

**Fix:** Check webhook controller authentication logic

---

### Theory 3: Job Queue Issue
- EmailDeliveryProcessorJob not processing
- Sidekiq worker not running
- Job failing silently

**Fix:** Check Sidekiq dashboard, verify workers running

---

### Theory 4: Database Lookup Failing
- 3-tier lookup strategy not finding EmailDelivery record
- sendgrid_message_id mismatch
- Timing issue (webhook arrives before record created)

**Fix:** Improve lookup logic, add logging

---

### Theory 5: Webhook Events Not Subscribed
- SendGrid only sending "delivered" events
- "Bounced" and "Dropped" events not enabled

**Fix:** Enable all event types in SendGrid settings

---

## Success Criteria

**Webhooks are working if:**
- ✅ EmailDelivery records update from "sent" → "delivered" within 5 minutes
- ✅ Bad email addresses show status "bounced" or "dropped"
- ✅ bounce_reason field populated with error details
- ✅ Webhook logs show POST requests to /webhooks/sendgrid
- ✅ No emails stuck in "sent" status for >10 minutes

**Webhooks are broken if:**
- ❌ All emails remain in "sent" status forever
- ❌ No webhook POST requests in logs
- ❌ SendGrid dashboard shows "Dropped" but our database shows "sent"
- ❌ EmailDeliveryProcessorJob not running

---

## Recommended Fix Priority

**For Feb 3rd Success:**
1. ✅ **HIGH:** Verify webhook URL configured correctly in SendGrid
2. ✅ **HIGH:** Run diagnostic query to confirm scope of issue
3. ✅ **HIGH:** Check Sidekiq workers processing EmailDeliveryProcessorJob
4. ✅ **MEDIUM:** Test webhook manually to isolate issue
5. ✅ **MEDIUM:** Add better logging to webhook controller

**Post-Feb 3rd:**
- Improve webhook error handling
- Add retry logic for failed lookups
- Add monitoring/alerting for stuck emails

---

## Questions to Answer

1. **Is this production or staging?**
2. **How many emails are affected?** (Run query above)
3. **When did this start?** (Always broken or recent regression?)
4. **Are ANY webhooks working?** (Check for "delivered" status updates)
5. **Is Sidekiq running?** (Check heroku ps)

---

## Contact

**Reporter:** Courtney (Product Lead)
**For Questions:** Tag in GitHub issue or Slack

---

**Next Steps:**
1. Developer runs diagnostic query
2. Posts results as comment in GitHub PR
3. We assess severity and fix urgency
4. Implement fix + test
5. Verify in production before Feb 3rd

---

**Created:** January 28, 2026
**Updated:** January 28, 2026
