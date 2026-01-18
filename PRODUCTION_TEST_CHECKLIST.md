# Production Test Checklist - Post Merge Verification

**Date:** January 18, 2026
**Changes Deployed:**
- Email webhook invitation bounce tracking fix
- EventPortalsController inheritance fix
- Schema merge (email deliveries + event portals)

---

## 🎯 Critical Features to Test

### ✅ 1. Email Webhook Integration (Core Feature)

**Test:** Verify SendGrid webhooks are being received and processed

**In Production Rails Console:**
```ruby
# Check recent webhook activity (last hour)
recent_deliveries = EmailDelivery.where("created_at > ?", 1.hour.ago)
puts "📊 Recent email deliveries: #{recent_deliveries.count}"

# Show breakdown by status
recent_deliveries.group(:status).count.each do |status, count|
  puts "  #{status}: #{count}"
end

# Check if webhook is processing events
latest = EmailDelivery.last
if latest
  puts "\n✅ Latest delivery:"
  puts "  Email: #{latest.recipient_email}"
  puts "  Status: #{latest.status}"
  puts "  Created: #{latest.created_at}"
  puts "  SendGrid ID: #{latest.sendgrid_message_id}"
else
  puts "⚠️ No email deliveries found"
end
```

**Expected Result:**
- Should see recent deliveries (if emails were sent recently)
- Statuses should include: sent, delivered, bounced, dropped (depending on what happened)
- ✅ PASS if you see EmailDelivery records with recent timestamps

---

### ✅ 2. Scheduled Email Delivery Tracking

**Test:** Verify scheduled emails still create delivery records

**In Production Rails Console:**
```ruby
# Find a recent scheduled email that was sent
sent_email = ScheduledEmail.where(status: 'sent').order(sent_at: :desc).first

if sent_email
  puts "📧 Scheduled Email: #{sent_email.name}"
  puts "   Sent at: #{sent_email.sent_at}"
  puts "   Recipient count: #{sent_email.recipient_count}"

  # Check if delivery records exist
  delivery_count = sent_email.email_deliveries.count
  puts "   Delivery records: #{delivery_count}"

  if delivery_count > 0
    puts "\n   📊 Delivery breakdown:"
    sent_email.email_deliveries.group(:status).count.each do |status, count|
      puts "      #{status}: #{count}"
    end
    puts "\n✅ PASS: Scheduled emails are creating delivery records"
  else
    puts "\n❌ FAIL: No delivery records for sent email"
  end
else
  puts "⚠️ No sent scheduled emails found (may not be an issue if none sent recently)"
end
```

**Expected Result:**
- Sent scheduled emails should have EmailDelivery records
- ✅ PASS if delivery_count > 0

---

### ✅ 3. Invitation Bounce Tracking (NEW FEATURE)

**Test:** Verify invitations create delivery records via webhook

**In Production Rails Console:**
```ruby
# Check for invitation deliveries (created by webhook)
invitation_deliveries = EmailDelivery.where(scheduled_email_id: nil)
  .where("created_at > ?", 1.day.ago)

puts "📨 Invitation email deliveries (last 24h): #{invitation_deliveries.count}"

if invitation_deliveries.any?
  puts "\n✅ Invitation tracking is working!"
  puts "\nBreakdown:"
  invitation_deliveries.group(:status).count.each do |status, count|
    puts "  #{status}: #{count}"
  end

  # Show a sample
  sample = invitation_deliveries.first
  puts "\n📬 Sample invitation delivery:"
  puts "  Email: #{sample.recipient_email}"
  puts "  Status: #{sample.status}"
  puts "  Event ID: #{sample.event_id}"
  puts "  Created: #{sample.created_at}"
else
  puts "\n⚠️ No invitation deliveries found"
  puts "   This is OK if no invitations were sent in last 24 hours"
  puts "   To test: Send a new invitation and check webhook logs"
end
```

**Expected Result:**
- If invitations were sent recently, should see EmailDelivery records WITHOUT scheduled_email_id
- ✅ PASS if invitation deliveries exist (when invitations were sent)
- ⚠️ INCONCLUSIVE if no invitations sent recently (not a failure)

**Manual Test (if needed):**
```ruby
# Send a test invitation to yourself
event = Event.where(published: true).first
contact = VendorContact.create!(
  organization: event.organization,
  email: "YOUR_EMAIL@example.com",
  name: "Test Contact - DELETE ME"
)
invitation = EventInvitation.create!(event: event, vendor_contact: contact)
EventInvitationMailer.invitation_email(invitation).deliver_now

puts "✅ Test invitation sent to #{contact.email}"
puts "⏳ Wait 1-2 minutes for webhook to fire"
puts "Then check: EmailDelivery.find_by(recipient_email: '#{contact.email}')"
```

---

### ✅ 4. Presents API Endpoints

**Test:** Verify main Presents endpoints still work

**Using curl or Postman:**

```bash
# Test 1: Get events list (should work - public endpoint)
curl https://heyvoxxy.com/api/v1/presents/events

# Expected: JSON array of events (or empty array)
```

```bash
# Test 2: Get organizations list (should work - public endpoint)
curl https://heyvoxxy.com/api/v1/presents/organizations

# Expected: JSON array of organizations
```

```bash
# Test 3: Get a specific event (public)
curl https://heyvoxxy.com/api/v1/presents/events/YOUR_EVENT_SLUG

# Expected: JSON object with event details
```

**Expected Result:**
- All endpoints return JSON (not 500 errors)
- ✅ PASS if you get valid JSON responses

---

### ✅ 5. Production Logs Check

**In Render Dashboard:**

```bash
# Check for errors in last hour
grep "ERROR" production.log | tail -20

# Check for webhook activity
grep "SendGrid webhook" production.log | tail -10

# Check for email delivery processing
grep "EmailDeliveryProcessorJob" production.log | tail -10

# Check for any ArgumentError (the error we just fixed)
grep "ArgumentError" production.log | tail -5
```

**Expected Result:**
- Should see "SendGrid webhook: Enqueued X events" messages
- Should NOT see "check_presents_access has not been defined" errors
- May see "No delivery record found" for old emails (that's OK)
- ✅ PASS if no ArgumentError about check_presents_access

---

### ✅ 6. Frontend Email Dashboard

**Test in Browser:**

1. Go to Voxxy Presents frontend
2. Navigate to an Event → Emails tab
3. Check if email list loads
4. Look at the "Undelivered" and "Unsubscribed" columns

**Expected Result:**
- Email list loads without errors
- Undelivered/Unsubscribed counts show real numbers (not 0 if bounces occurred)
- ✅ PASS if dashboard loads and shows data

---

## 🚨 Failure Scenarios & Fixes

### If Webhook Integration Broken

**Symptoms:**
- No recent EmailDelivery records
- Logs show: "No delivery record found for SendGrid message"

**Check:**
1. Verify SendGrid webhook URL is still correct: `https://heyvoxxy.com/api/v1/webhooks/sendgrid`
2. Check Sidekiq is running: `ps aux | grep sidekiq`
3. Check Redis is accessible

### If Scheduled Emails Not Tracking

**Symptoms:**
- Scheduled emails sent but no EmailDelivery records

**Check:**
1. Look for errors in EmailSenderService
2. Verify SendGrid API key is set: `ENV['VoxxyKeyAPI']`
3. Check for migration issues with email_deliveries table

### If Invitation Tracking Not Working

**Symptoms:**
- Invitations sent but webhook doesn't create EmailDelivery records

**Check:**
1. Verify EventInvitationMailer is sending custom args:
   ```ruby
   invitation = EventInvitation.last
   mail = EventInvitationMailer.invitation_email(invitation)
   puts mail.header['X-SMTPAPI'].value
   # Should show: {"unique_args":{...}}
   ```

2. Check webhook processing logs:
   ```bash
   grep "event_invitation_id" production.log | tail -10
   ```

### If Presents API Returns 500 Errors

**Symptoms:**
- API endpoints returning 500 errors
- Logs show: "check_presents_access has not been defined"

**Fix:**
- This means the EventPortalsController fix didn't deploy correctly
- Verify `EventPortalsController < BaseController` (not ApplicationController)
- Redeploy if needed

---

## 📊 Test Results Summary

After running all tests, fill this out:

| Test | Status | Notes |
|------|--------|-------|
| 1. Webhook Integration | ⬜ PASS / ⬜ FAIL / ⬜ N/A |  |
| 2. Scheduled Email Tracking | ⬜ PASS / ⬜ FAIL |  |
| 3. Invitation Bounce Tracking | ⬜ PASS / ⬜ FAIL / ⬜ N/A |  |
| 4. Presents API Endpoints | ⬜ PASS / ⬜ FAIL |  |
| 5. Production Logs | ⬜ PASS / ⬜ FAIL |  |
| 6. Frontend Dashboard | ⬜ PASS / ⬜ FAIL |  |

---

## ✅ All Clear Checklist

- [ ] No "check_presents_access" errors in logs
- [ ] Webhook is receiving SendGrid events
- [ ] EmailDelivery records are being created
- [ ] Scheduled emails create delivery records
- [ ] Invitations create delivery records (if any sent)
- [ ] Presents API endpoints return valid JSON
- [ ] Frontend email dashboard loads

**If all checked: 🎉 Production is healthy!**

---

## 🆘 Need Help?

If any test fails, grab the error messages and let me know. I can help debug!
