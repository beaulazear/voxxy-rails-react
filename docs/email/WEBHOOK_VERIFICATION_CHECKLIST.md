# Webhook Verification Checklist ✅

**Date:** January 18, 2026
**Status:** Webhook Working - Now Verify Job Processing

---

## ✅ Webhook Configuration - VERIFIED

**Logs confirm:**
```
Started POST "/api/v1/webhooks/sendgrid" for 162.159.115.40 at 2026-01-18 20:06:47 +0000
SendGrid webhook: Enqueued 11 events for processing
Completed 200 OK in 15ms
```

**SendGrid Configuration:**
- **Webhook URL**: `https://www.heyvoxxy.com/api/v1/webhooks/sendgrid` ✅
- **Status**: Active ✅
- **Events**: delivered, bounce, dropped, deferred, unsubscribe, spam ✅
- **Test Integration**: Successful (11 events) ✅

---

## 🔍 Next Step: Verify Job Processing

The webhook is receiving events, but we need to confirm **EmailDeliveryProcessorJob** is processing them with the new invitation tracking code.

### Check Sidekiq Logs

Look for logs from EmailDeliveryProcessorJob processing the test events:

```bash
# In production logs, search for:
grep "EmailDeliveryProcessorJob" production.log

# Should see lines like:
# "Processing delivered event for delivery #123"
# "Processing bounce event for delivery #456"
# "No delivery record found for SendGrid message: xyz" (expected for test events)
```

### What to Look For

**For Test Events (no EmailDelivery records exist):**
```
INFO -- : No delivery record found for SendGrid message: 14c5d75ce93.dfd.64b469.filter0001.16648.5515E0B88.0
```
This is **EXPECTED** because the test events don't match any real emails you sent.

**For Real Events (from actual emails):**
```
INFO -- : Processing delivered event for delivery #123
INFO -- : ✓ Email delivered to vendor@example.com
```

---

## 🧪 Test with Real Invitation Email

To verify invitation bounce tracking works:

### Option 1: Send Test Invitation to Bounce Address

```ruby
# In Rails console (production)
event = Event.last

# Create test contact with bounce address
contact = VendorContact.create!(
  organization: event.organization,
  email: "bounce@simulator.amazonses.com",
  name: "Test Bounce Contact"
)

# Create invitation
invitation = EventInvitation.create!(
  event: event,
  vendor_contact: contact
)

# Send invitation
EventInvitationMailer.invitation_email(invitation).deliver_now

puts "✅ Invitation sent to #{contact.email}"
puts "⏳ Waiting for SendGrid webhook (1-2 minutes)..."
```

**After 1-2 minutes, check:**

```ruby
# Look for EmailDelivery record created by webhook
delivery = EmailDelivery.find_by(recipient_email: "bounce@simulator.amazonses.com")

if delivery
  puts "✅ WEBHOOK WORKING!"
  puts "Status: #{delivery.status}"
  puts "Bounce type: #{delivery.bounce_type}" if delivery.bounced?
  puts "Bounce reason: #{delivery.bounce_reason}" if delivery.bounced?
else
  puts "❌ No delivery record found - check logs"
end
```

### Option 2: Check Existing Bounced Invitation

If you already have a bounced invitation (from before):

```ruby
# Find the invitation that bounced
contact = VendorContact.find_by(email: "THE_EMAIL_THAT_BOUNCED")

# Check if EmailDelivery record exists
delivery = EmailDelivery.find_by(recipient_email: contact.email)

if delivery
  puts "✅ Found delivery record!"
  puts "Status: #{delivery.status}"
  puts "Created at: #{delivery.created_at}"
else
  puts "⚠️ No record - this bounce happened BEFORE our fix"
  puts "   The fix will work for NEW invitations going forward"
end
```

---

## 📋 Expected Behavior After Fix

### Before Deployment (Old Behavior):
1. Invitation sent → Bounces
2. SendGrid webhook fires
3. EmailDeliveryProcessorJob runs
4. Looks for EmailDelivery record → NOT FOUND ❌
5. Logs: "No delivery record found for SendGrid message"
6. Bounce NOT tracked

### After Deployment (New Behavior):
1. Invitation sent → Bounces
2. SendGrid webhook fires
3. EmailDeliveryProcessorJob runs
4. Checks: Is this an invitation? (via unique_args) → YES ✅
5. Creates EmailDelivery record on-the-fly
6. Updates status to 'bounced'
7. Logs: "Creating delivery record for invitation email"
8. Bounce TRACKED ✅

---

## 🔍 Troubleshooting

### Issue: Webhook receiving events but jobs not processing

**Check Sidekiq is running:**
```bash
# On production server
ps aux | grep sidekiq
# Should see: sidekiq 7.3.9
```

**Check Redis connection:**
```bash
redis-cli ping
# Should return: PONG
```

**Check Sidekiq queue:**
```ruby
# Rails console
require 'sidekiq/api'

# Check queue sizes
Sidekiq::Queue.new('email_webhooks').size  # Should be 0 if processing
Sidekiq::Stats.new.processed  # Total jobs processed
Sidekiq::Stats.new.failed     # Failed jobs

# View recent failed jobs
Sidekiq::RetrySet.new.first(5).each do |job|
  puts "Failed: #{job.klass} - #{job.error_message}"
end
```

### Issue: Jobs processing but not creating EmailDelivery records

**Check EmailDeliveryProcessorJob logs:**
```bash
grep "EmailDeliveryProcessorJob" production.log | tail -20
```

**Look for these specific messages:**
- ✅ `"Creating delivery record for invitation email"` → Invitation tracking working
- ✅ `"Processing bounce event for delivery #123"` → Event processing working
- ⚠️ `"No delivery record found"` → Expected for test events OR old invitations

### Issue: unique_args not being sent with invitations

**Verify EventInvitationMailer has custom args:**
```ruby
# Rails console
invitation = EventInvitation.last
mail = EventInvitationMailer.invitation_email(invitation)

# Check X-SMTPAPI header
puts mail.header['X-SMTPAPI'].value
# Should output:
# {"unique_args":{"event_id":"123","event_invitation_id":"456","email_type":"invitation"}}
```

---

## ✅ Deployment Checklist

- [x] Code deployed to production
- [x] SendGrid webhook configured (`www.heyvoxxy.com/api/v1/webhooks/sendgrid`)
- [x] Webhook test successful (11 events received)
- [x] Webhook controller returning 200 OK
- [ ] EmailDeliveryProcessorJob processing events (verify in logs)
- [ ] Send test invitation to bounce address
- [ ] Verify EmailDelivery record created for invitation bounce
- [ ] Check frontend displays undelivered count correctly

---

## 📊 Monitoring

### Daily Checks

```ruby
# Rails console - run daily to monitor email health

# Total emails sent today
today = Date.today
deliveries = EmailDelivery.where('sent_at >= ?', today.beginning_of_day)

puts "📧 Email Stats for #{today}"
puts "Total sent: #{deliveries.count}"
puts "Delivered: #{deliveries.where(status: 'delivered').count}"
puts "Bounced: #{deliveries.where(status: 'bounced').count}"
puts "Dropped: #{deliveries.where(status: 'dropped').count}"
puts "Pending: #{deliveries.where(status: ['sent', 'queued']).count}"

# Bounce rate
bounce_rate = (deliveries.where(status: 'bounced').count.to_f / deliveries.count * 100).round(2)
puts "Bounce rate: #{bounce_rate}%"
puts "⚠️ High bounce rate!" if bounce_rate > 5.0
```

### Weekly Checks

1. **SendGrid Webhook Statistics**
   - Go to SendGrid → Event Webhook → Your webhook
   - Check "Event Statistics" tab
   - Verify webhook success rate > 99%

2. **Sidekiq Queue Health**
   - Visit `/sidekiq` dashboard
   - Check `email_webhooks` queue is processing
   - Check failed jobs count is low

3. **Email Delivery Rates**
   - Review bounce rates
   - Check unsubscribe rates
   - Monitor spam reports

---

## 🎯 Success Criteria

Your webhook integration is fully working when:

- ✅ Webhook receives all SendGrid events (delivered, bounce, dropped, etc.)
- ✅ EmailDeliveryProcessorJob processes events without errors
- ✅ EmailDelivery records created for scheduled emails
- ✅ EmailDelivery records created for invitation emails (NEW)
- ✅ Bounces tracked and displayed in frontend
- ✅ Undelivered count accurate for both scheduled + invitation emails
- ✅ Frontend shows delivery status breakdown on hover

---

**Next Action:** Run test invitation to bounce address and verify tracking works!
