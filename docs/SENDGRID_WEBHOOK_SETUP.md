# SendGrid Webhook Setup Guide

**Purpose:** Configure SendGrid to send real-time email delivery events to your Rails backend for tracking.

---

## Overview

When emails are sent via SendGrid, they report back delivery status through webhook events:
- ✓ **Delivered** - Email successfully delivered
- ✗ **Bounced** - Email bounced (hard or soft)
- ⊘ **Dropped** - SendGrid refused to send
- ⏳ **Deferred** - Temporary delivery failure
- ⊗ **Unsubscribe** - User clicked unsubscribe
- 🚫 **Spam Report** - User marked as spam

Our system processes these events in real-time to update email delivery status.

---

## Production Setup

### Step 1: Get Your Webhook URL

**Production URL:**
```
https://www.voxxyai.com/api/v1/webhooks/sendgrid
```

**Staging URL:**
```
https://staging.voxxyai.com/api/v1/webhooks/sendgrid
```

### Step 2: Configure SendGrid Webhook

1. Log in to [SendGrid](https://app.sendgrid.com/)
2. Navigate to **Settings** → **Mail Settings** → **Event Webhook**
3. Click **Create New Webhook**

**Configuration:**

| Field | Value |
|-------|-------|
| **Friendly Name** | Voxxy Presents Production |
| **Post URL** | `https://www.voxxyai.com/api/v1/webhooks/sendgrid` |
| **Security** | OAuth (recommended) or None |

**Events to Enable:**
- ✅ Delivered
- ✅ Bounce
- ✅ Dropped
- ✅ Deferred
- ✅ Unsubscribe
- ✅ Spam Report

**Events NOT Needed (Phase 1):**
- ⬜ Processed (internal SendGrid status)
- ⬜ Open (requires tracking pixel - Phase 2)
- ⬜ Click (requires link tracking - Phase 2)

4. Click **Save**
5. Toggle webhook to **Active**

### Step 3: Test Your Webhook

SendGrid provides a built-in test feature:

1. Click **Test Your Integration** button
2. SendGrid will send sample events to your webhook
3. Check Rails logs to verify events received:

```bash
# SSH into production server
tail -f log/production.log | grep "SendGrid webhook"
```

Expected output:
```
SendGrid webhook: Enqueued 6 events for processing
```

### Step 4: Verify in Database

Check that EmailDeliveryProcessorJob processed the events:

```bash
# Rails console in production
rails c

# Check recent deliveries
EmailDelivery.order(created_at: :desc).limit(5)

# Check delivery statuses
EmailDelivery.group(:status).count
```

---

## Local Development Setup

### Step 1: Install ngrok

ngrok creates a secure tunnel to your localhost for webhook testing.

```bash
# Install ngrok (macOS)
brew install ngrok

# Or download from https://ngrok.com/download
```

### Step 2: Start ngrok Tunnel

```bash
# Start Rails on port 3000
bundle exec rails s

# In a new terminal, start ngrok
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123xyz.ngrok.io -> http://localhost:3000
```

### Step 3: Configure SendGrid for Development

1. Go to SendGrid Event Webhook settings
2. Create a new webhook named "Voxxy Dev (ngrok)"
3. Use your ngrok URL:
   ```
   https://abc123xyz.ngrok.io/api/v1/webhooks/sendgrid
   ```
4. Enable the same events as production
5. Save and activate

### Step 4: Test Locally

Send a test email and watch Rails logs:

```bash
# Terminal 1: Rails server
bundle exec rails s

# Terminal 2: Sidekiq (to process jobs)
bundle exec sidekiq

# Terminal 3: Watch logs
tail -f log/development.log | grep -E "(SendGrid|EmailDelivery)"
```

**Test in Rails console:**

```ruby
# Create a test event and scheduled email
event = Event.last
scheduled_email = event.scheduled_emails.first

# Send email to yourself
registration = Registration.create!(
  event: event,
  name: "Test User",
  email: "your-email@example.com",  # Use your real email
  business_name: "Test Business"
)

# Send the email
service = EmailSenderService.new(scheduled_email)
service.send_to_registration(registration)
```

Within 1-2 minutes, you should see:
1. Email delivered to your inbox
2. SendGrid webhook event received
3. EmailDeliveryProcessorJob processing event
4. EmailDelivery record updated to 'delivered'

---

## Webhook Security (Optional but Recommended)

### OAuth Verification

SendGrid can sign webhook requests to verify authenticity:

1. In SendGrid webhook settings, enable **OAuth**
2. SendGrid provides a **Verification Key**
3. Store in Rails credentials:

```bash
rails credentials:edit
```

Add:
```yaml
sendgrid:
  webhook_verification_key: "your-key-here"
```

4. Update webhook controller to verify signature:

```ruby
# app/controllers/api/v1/webhooks/sendgrid_controller.rb

before_action :verify_sendgrid_signature

private

def verify_sendgrid_signature
  public_key = Rails.application.credentials.dig(:sendgrid, :webhook_verification_key)
  return unless public_key # Skip if not configured

  signature = request.headers['X-Twilio-Email-Event-Webhook-Signature']
  timestamp = request.headers['X-Twilio-Email-Event-Webhook-Timestamp']

  # Verify signature matches
  # (Implementation depends on SendGrid SDK version)
end
```

---

## Monitoring & Troubleshooting

### Check Webhook Activity in SendGrid

1. Go to **Event Webhook** settings
2. Click on your webhook name
3. View **Event Statistics** to see:
   - Total events sent
   - Failed deliveries
   - Response times

### Common Issues

**❌ Webhook not receiving events**
- Check webhook is toggled **Active** in SendGrid
- Verify URL is correct and publicly accessible
- Check Rails logs for errors
- Test with SendGrid's "Test Your Integration"

**❌ Events received but not processed**
- Check Sidekiq is running: `bundle exec sidekiq`
- Check Redis is running: `redis-cli ping`
- Check Sidekiq logs: `tail -f log/sidekiq.log`
- Check failed jobs: `Sidekiq::RetrySet.new.size`

**❌ EmailDelivery records not created**
- Verify SendGrid message ID in webhook payload
- Check Rails logs for EmailDeliveryProcessorJob errors
- Verify EmailDelivery model validations passing

### View Failed Webhook Deliveries

SendGrid retries failed webhooks up to 3 times. View failures:

1. SendGrid → **Event Webhook** → Your webhook
2. Click **Failed Events** tab
3. See error details and retry status

### Manual Retry

If webhook fails and you have the event data:

```ruby
# Rails console
event_data = {
  'event' => 'delivered',
  'sg_message_id' => 'abc123xyz',
  'timestamp' => 1234567890,
  'email' => 'user@example.com'
}

EmailDeliveryProcessorJob.perform_async(event_data)
```

---

## Testing Checklist

- [ ] Webhook configured in SendGrid
- [ ] Webhook active (toggled on)
- [ ] All required events enabled (delivered, bounce, dropped, deferred, unsubscribe, spam)
- [ ] Webhook URL is correct
- [ ] Test integration button clicked
- [ ] Rails logs show "Enqueued X events"
- [ ] Sidekiq processing jobs
- [ ] EmailDelivery records created in database
- [ ] Delivery statuses updating correctly
- [ ] Soft bounces triggering retry scheduling
- [ ] Unsubscribe events marking users globally

---

## Production Deployment Checklist

Before launching email automation in production:

- [ ] SendGrid webhook configured for production URL
- [ ] Sidekiq running on production server
- [ ] Redis accessible to Sidekiq
- [ ] Sidekiq-Cron schedule loaded (check logs)
- [ ] EmailSenderWorker running every 5 minutes
- [ ] Test send to real email address
- [ ] Verify webhook events received and processed
- [ ] Monitor SendGrid webhook statistics
- [ ] Set up alerts for failed webhook deliveries
- [ ] Document webhook URL in team knowledge base

---

## Webhook Payload Examples

### Delivered Event
```json
{
  "event": "delivered",
  "email": "vendor@example.com",
  "timestamp": 1640995200,
  "smtp-id": "<abc123@example.com>",
  "sg_message_id": "abc123xyz.filterdrecv-123-456",
  "response": "250 OK"
}
```

### Bounce Event
```json
{
  "event": "bounce",
  "email": "vendor@example.com",
  "timestamp": 1640995200,
  "sg_message_id": "abc123xyz",
  "bounce_classification": "hard",
  "reason": "550 5.1.1 User unknown",
  "type": "bounce"
}
```

### Unsubscribe Event
```json
{
  "event": "unsubscribe",
  "email": "vendor@example.com",
  "timestamp": 1640995200,
  "sg_message_id": "abc123xyz"
}
```

---

## Next Steps

1. ✅ Configure SendGrid webhook (production + development)
2. ✅ Test with sample events
3. ✅ Send real test email and verify tracking
4. ✅ Monitor webhook statistics in SendGrid
5. ⏭️ Build frontend UI to display delivery status (Task 1.10)

---

**Last Updated:** January 2, 2026
**Task:** 1.7 - Email Delivery Tracking
