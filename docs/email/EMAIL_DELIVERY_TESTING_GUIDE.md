# Email Delivery Tracking - Testing Guide

**Date:** January 18, 2026
**Purpose:** Verify recipients count stability and undelivered/unsubscribed email tracking

---

## 🎯 What Was Fixed

### Fix #1: Recipient Count Stability
- **Issue:** Recipients count changed when vendor status changed after email was sent
- **Fix:** Persisted `recipient_count` is now returned for sent emails instead of recalculating dynamically

### Fix #2: Undelivered & Unsubscribed Counts
- **Issue:** Frontend showed hardcoded `0` for undelivered/unsubscribed counts
- **Fix:** Backend now aggregates delivery statuses and frontend displays real counts

---

## 🧪 Testing Checklist

### Test 1: Verify SendGrid Webhook is Working

**Purpose:** Ensure delivery statuses are being tracked

```bash
# SSH into production/staging
rails console
```

```ruby
# Check if webhooks are updating delivery statuses
delivery_statuses = EmailDelivery.group(:status).count
puts "Delivery Status Breakdown:"
puts delivery_statuses.inspect

# Expected output (if webhooks working):
# {"sent"=>50, "delivered"=>180, "bounced"=>5, "dropped"=>2, "unsubscribed"=>1}

# Problem indicator:
# {"sent"=>238}  # <-- All stuck at "sent" means webhooks not working
```

**If all stuck at "sent":**
- Webhooks are not configured or not reaching your server
- See `docs/email/SENDGRID_WEBHOOK_SETUP.md` for configuration

---

### Test 2: Check Recipient Count Stability

**Purpose:** Verify sent emails show fixed recipient count

```ruby
# Find a sent email
sent_email = ScheduledEmail.find_by(status: 'sent')

# Check persisted vs dynamic count
puts "Persisted count (database): #{sent_email[:recipient_count]}"
puts "recipient_count method: #{sent_email.recipient_count}"
puts "Actual deliveries: #{sent_email.email_deliveries.count}"

# ✅ These should all match (or be very close)
# ❌ If recipient_count method is different, the fix didn't apply
```

**Change a registration status:**

```ruby
# Get the event for this email
event = sent_email.event

# Find a registration that was included in the email
registration = event.registrations.first

puts "Original status: #{registration.status}"

# Change the status
registration.update!(status: 'rejected')

# Check if recipient_count changed
puts "Recipient count after status change: #{sent_email.reload.recipient_count}"
puts "Expected (should be same): #{sent_email[:recipient_count]}"

# ✅ PASS: recipient_count stays the same
# ❌ FAIL: recipient_count changes (fix didn't work)
```

---

### Test 3: Check Delivery Counts in Backend

**Purpose:** Verify aggregation methods work

```ruby
# Find a sent email with deliveries
sent_email = ScheduledEmail.includes(:email_deliveries).find_by(status: 'sent')

puts "\n=== Testing Delivery Count Methods ==="
puts "Total sent: #{sent_email.recipient_count}"
puts "Delivered: #{sent_email.delivered_count}"
puts "Undelivered: #{sent_email.undelivered_count}"
puts "Unsubscribed: #{sent_email.unsubscribed_count}"
puts "Delivery rate: #{sent_email.delivery_rate}%"

puts "\n=== Full Breakdown ==="
puts sent_email.delivery_counts.inspect

# Expected output:
# {
#   total_sent: 50,
#   delivered: 45,
#   bounced: 3,
#   dropped: 1,
#   unsubscribed: 1,
#   pending: 0
# }
```

---

### Test 4: Check API Response Includes Counts

**Purpose:** Verify controller returns delivery data

```bash
# Test the API endpoint (replace with real event slug)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://www.voxxyai.com/api/v1/presents/events/YOUR-EVENT-SLUG/scheduled_emails \
  | jq '.[] | {name, recipient_count, undelivered_count, unsubscribed_count, delivery_counts}'
```

**Expected JSON response:**
```json
{
  "name": "3 Days Before Event Reminder",
  "recipient_count": 50,
  "undelivered_count": 4,
  "unsubscribed_count": 1,
  "delivery_counts": {
    "total_sent": 50,
    "delivered": 45,
    "bounced": 3,
    "dropped": 1,
    "unsubscribed": 1,
    "pending": 0
  }
}
```

**If fields are missing or null:**
- Backend changes didn't deploy
- Re-deploy the backend

---

### Test 5: Frontend Display Test

**Purpose:** Verify UI shows real counts

1. **Open Email Automation Tab in browser**
   - Navigate to an event with sent emails
   - Open Command Center → Email Automation tab

2. **Check columns:**
   - Recipients column should show actual count (e.g., "50")
   - Undelivered column should show real count (not "0" if there are bounces)
   - Unsubscribed column should show real count (not "0" if there are unsubscribes)

3. **Hover over undelivered/unsubscribed counts:**
   - Should see tooltip with full breakdown:
     ```
     Delivery Status:
     ✓ Delivered: 45
     ✕ Bounced: 3
     ⊘ Dropped: 1
     ⊗ Unsubscribed: 1
     ⋯ Pending: 0
     Total Sent: 50
     ```

4. **Visual indicators:**
   - Undelivered count > 0 should show in **red**
   - Unsubscribed count > 0 should show in **yellow**

---

### Test 6: Status Change Scenario (End-to-End)

**Purpose:** Verify recipient count doesn't change after status updates

**Steps:**

1. **Create test event with invitation email**

```ruby
# Create event
event = Event.create!(
  title: "Test Market",
  slug: "test-market-#{Time.now.to_i}",
  organization_id: Organization.first.id,
  event_date: 30.days.from_now,
  application_deadline: 15.days.from_now
)

# Create some test registrations (pending status)
5.times do |i|
  Registration.create!(
    event: event,
    name: "Vendor #{i+1}",
    email: "vendor#{i+1}@example.com",
    business_name: "Business #{i+1}",
    vendor_category: "Food",
    status: "pending"
  )
end
```

2. **Create and send an invitation email**

```ruby
# Create scheduled email with pending filter
scheduled_email = ScheduledEmail.create!(
  event: event,
  name: "Application Invitation",
  subject_template: "You're invited!",
  body_template: "<p>Apply now!</p>",
  trigger_type: "on_application_open",
  scheduled_for: Time.current,
  filter_criteria: { "status" => ["pending"] },
  status: "scheduled"
)

# Check initial count
puts "Initial recipient count: #{scheduled_email.recipient_count}"
# Expected: 5 (all pending)

# Send the email
service = EmailSenderService.new(scheduled_email)
service.send_to_recipients

# Reload to get persisted count
scheduled_email.reload
puts "After sending (persisted): #{scheduled_email.recipient_count}"
# Expected: 5
```

3. **Change registration statuses**

```ruby
# Approve some vendors
event.registrations.limit(3).each do |reg|
  reg.update!(status: "approved")
end

# Reload and check count again
scheduled_email.reload
puts "After status changes: #{scheduled_email.recipient_count}"
# Expected: 5 (should NOT change!)

# Verify dynamic calculation would be different
puts "Dynamic calculation (if we called it): #{scheduled_email.calculate_current_recipient_count}"
# Expected: 2 (only pending vendors)
```

**✅ PASS:** `recipient_count` stays at 5 (historical accuracy)
**❌ FAIL:** `recipient_count` changes to 2 (fix didn't work)

---

## 🐛 Common Issues & Solutions

### Issue: All delivery statuses stuck at "sent"

**Symptom:**
```ruby
EmailDelivery.group(:status).count
# => {"sent"=>500}  # All "sent", none "delivered"
```

**Cause:** SendGrid webhook not configured or not reaching server

**Solutions:**
1. Check webhook is active in SendGrid dashboard
2. Verify webhook URL is correct: `https://www.voxxyai.com/api/v1/webhooks/sendgrid`
3. Test webhook using SendGrid's "Test Your Integration" button
4. Check Rails logs for webhook events: `grep "SendGrid webhook" log/production.log`
5. Verify Sidekiq is processing jobs: `Sidekiq::Queue.new('email_webhooks').size`

**Docs:** `docs/email/SENDGRID_WEBHOOK_SETUP.md`

---

### Issue: Frontend shows 0 for undelivered/unsubscribed

**Symptom:** UI always shows "0" even though backend has data

**Cause:** Frontend not updated or API not returning data

**Debug:**
1. Check API response includes fields:
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     https://www.voxxyai.com/api/v1/presents/events/EVENT-SLUG/scheduled_emails \
     | jq '.[] | {undelivered_count, unsubscribed_count}'
   ```

2. If API returns `null`: Backend not deployed
3. If API returns numbers but UI shows 0: Frontend not deployed or TypeScript errors

**Solutions:**
- Re-deploy backend if API missing fields
- Re-deploy frontend if API has fields but UI doesn't show them
- Check browser console for JavaScript errors

---

### Issue: Recipient count changes after status update

**Symptom:** Sent email shows different recipient count after approving vendors

**Cause:** Fix didn't apply or email status not "sent"

**Debug:**
```ruby
email = ScheduledEmail.find(EMAIL_ID)

# Check email status
puts "Status: #{email.status}"  # Should be "sent"

# Check if persisted value exists
puts "Persisted count: #{email[:recipient_count]}"  # Should be a number

# Check method behavior
puts "Method returns: #{email.recipient_count}"  # Should match persisted

# If they don't match:
puts "Code issue - check scheduled_email.rb recipient_count method"
```

**Solutions:**
- Verify email status is "sent"
- Check `email[:recipient_count]` is not null
- Review `app/models/scheduled_email.rb` recipient_count method
- Ensure backend deployed with fix

---

### Issue: Delivery counts are all zero

**Symptom:** `delivery_counts` returns zeros even though emails were sent

**Cause:** No `email_deliveries` records exist

**Debug:**
```ruby
email = ScheduledEmail.find(EMAIL_ID)

puts "Email status: #{email.status}"
puts "Deliveries count: #{email.email_deliveries.count}"

# If count is 0:
puts "No delivery records - emails may not have been sent via EmailSenderService"
```

**Root causes:**
1. Email sent via different method (not `EmailSenderService`)
2. `create_delivery_record` failed silently
3. Database records deleted

**Solutions:**
- Verify emails sent via `EmailSenderService.send_to_recipients`
- Check logs for delivery record creation errors
- Re-send test email and verify delivery record created

---

## 📊 Production Verification

After deploying to production:

### 1. Check Recent Deliveries

```ruby
# Production console
recent_deliveries = EmailDelivery.where('created_at > ?', 24.hours.ago)

puts "Deliveries in last 24h: #{recent_deliveries.count}"
puts "Status breakdown:"
puts recent_deliveries.group(:status).count.inspect

# Should see variety of statuses if webhooks working
```

### 2. Check Delivery Rates

```ruby
# Find events with sent emails
recent_events = Event.where('created_at > ?', 7.days.ago)

recent_events.each do |event|
  sent_emails = event.scheduled_emails.where(status: 'sent')

  sent_emails.each do |email|
    puts "\nEvent: #{event.title}"
    puts "Email: #{email.name}"
    puts "Sent to: #{email.recipient_count}"
    puts "Delivered: #{email.delivered_count} (#{email.delivery_rate}%)"
    puts "Bounced: #{email.delivery_counts[:bounced]}"
    puts "Dropped: #{email.delivery_counts[:dropped]}"
  end
end
```

### 3. Monitor for Issues

```ruby
# Find emails with high bounce rates
ScheduledEmail.where(status: 'sent').each do |email|
  next if email.recipient_count.zero?

  bounce_rate = (email.delivery_counts[:bounced].to_f / email.recipient_count * 100).round(1)

  if bounce_rate > 5.0
    puts "⚠️ HIGH BOUNCE RATE: #{email.event.title} - #{email.name}"
    puts "   Sent: #{email.recipient_count}, Bounced: #{email.delivery_counts[:bounced]} (#{bounce_rate}%)"
  end
end
```

---

## ✅ Success Criteria

All tests pass when:

1. **Recipient Count Stability:**
   - ✅ Sent emails show fixed recipient count
   - ✅ Status changes don't affect sent email counts
   - ✅ Scheduled emails show dynamic count (for planning)

2. **Delivery Tracking:**
   - ✅ SendGrid webhook updates delivery statuses
   - ✅ Backend methods return accurate counts
   - ✅ API includes delivery data in responses
   - ✅ Frontend displays real counts (not zeros)

3. **Visual Indicators:**
   - ✅ Undelivered count shows in red if > 0
   - ✅ Unsubscribed count shows in yellow if > 0
   - ✅ Tooltips show detailed breakdown

4. **Historical Accuracy:**
   - ✅ Sent email metrics are preserved
   - ✅ No retroactive changes to past campaigns

---

## 🎉 Post-Deployment Checklist

- [ ] Deploy backend to staging
- [ ] Run Test #1-6 in staging
- [ ] Verify webhooks working in staging
- [ ] Deploy frontend to staging
- [ ] Test UI in staging browser
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Run production verification checks
- [ ] Monitor for 24 hours
- [ ] Update team on new metrics availability

---

**Next Steps:** Run tests in console and verify everything works as expected.
