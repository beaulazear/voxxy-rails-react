# Voxxy Email System - Quick Reference Guide

## File Locations

### Models (Email-related)
- `/app/models/email_campaign_template.rb` - Template containers
- `/app/models/email_template_item.rb` - Individual email definitions
- `/app/models/scheduled_email.rb` - Scheduled instances for events
- `/app/models/email_delivery.rb` - Delivery tracking and webhooks
- `/app/models/email_unsubscribe.rb` - Unsubscribe management

### Mailers
- `/app/mailers/event_invitation_mailer.rb` - Send invitations to vendor contacts
- `/app/mailers/application_mailer.rb` - Base mailer class
- `/app/mailers/admin_mailer.rb` - Admin notifications

### Workers (Background Jobs)
- `/app/workers/email_sender_worker.rb` - Scheduler (runs every 5 min)
- `/app/workers/email_delivery_processor_job.rb` - Webhook processor
- `/app/workers/email_retry_job.rb` - Retry soft bounces (scheduled)
- `/app/workers/email_retry_scanner_job.rb` - Retry scanner (runs every 30 min)

### Services
- `/app/services/email_sender_service.rb` - Send to registrations
- `/app/services/invitation_reminder_service.rb` - Send to invitations
- `/app/services/email_schedule_calculator.rb` - Calculate send times
- `/app/services/scheduled_email_generator.rb` - Generate schedules from templates
- `/app/services/email_variable_resolver.rb` - Resolve {{variables}} for registrations
- `/app/services/invitation_variable_resolver.rb` - Resolve {{variables}} for invitations
- `/app/services/recipient_filter_service.rb` - Filter recipients by criteria
- `/app/services/email_campaign_template_cloner.rb` - Clone templates

### Controllers
- `/app/controllers/api/v1/presents/scheduled_emails_controller.rb` - Main email API
- `/app/controllers/api/v1/presents/email_campaign_templates_controller.rb` - Template management
- `/app/controllers/api/v1/presents/email_template_items_controller.rb` - Email item management
- `/app/controllers/api/v1/presents/email_notifications_controller.rb` - Event notifications
- `/app/controllers/api/v1/presents/email_tests_controller.rb` - Testing tools

### Configuration
- `/config/initializers/sidekiq.rb` - Redis & Sidekiq setup
- `/config/sidekiq_schedule.yml` - Cron job schedule

### Documentation
- `EMAIL_SYSTEM_COMPREHENSIVE_ANALYSIS.md` - Full system analysis
- `EMAIL_SYSTEM_DIAGRAMS.md` - Visual diagrams

---

## Key Concepts

### 1. Three-Layer Architecture

**Layer 1: Template** (EmailTemplateItem)
- Reusable email definition
- Contains: subject, body, trigger type, category
- Shared across events

**Layer 2: Scheduled Email** (ScheduledEmail)
- Instance of a template for a specific event
- Contains: scheduled_for time, recipient_count, status
- One per event per template item

**Layer 3: Delivery** (EmailDelivery)
- Individual email to one recipient
- Contains: status, bounce info, timestamps
- Tracked via SendGrid webhooks

### 2. Two Recipient Systems

**Registration-Based** (most emails)
- Recipients: Vendors who applied (Registration model)
- Service: EmailSenderService
- Status: approved, confirmed, pending, rejected, waitlist

**Invitation-Based** (event_announcements)
- Recipients: Pre-invited contacts (EventInvitation → VendorContact)
- Service: InvitationReminderService
- Routing: Category = "event_announcements"

### 3. Three-Tier Unsubscribe

- **Global**: Email never receives any emails from anyone
- **Organization**: Email never receives from org (any event)
- **Event**: Email never receives from specific event

---

## Common Tasks

### View All Scheduled Emails for Event
```ruby
event.scheduled_emails.includes(:email_template_item, :email_deliveries)
```

### Check Delivery Status for Sent Email
```ruby
scheduled_email.delivery_counts
# => { total_sent: 120, delivered: 115, bounced: 3, dropped: 1, unsubscribed: 1, pending: 0 }
```

### Find Overdue Scheduled Emails
```ruby
ScheduledEmail.scheduled.where("scheduled_for < ?", 10.minutes.ago)
```

### Retry Failed Deliveries
```ruby
failed_email = EmailDelivery.where(status: "bounced", bounce_type: "soft")
failed_email.each { |d| EmailRetryJob.perform_async(d.id) }
```

### Check if Email is Unsubscribed
```ruby
EmailUnsubscribe.unsubscribed_from_event?("user@example.com", event)
```

### Manually Create Scheduled Email
```ruby
ScheduledEmail.create!(
  event: event,
  email_template_item: template_item,
  scheduled_for: 3.days.from_now,
  name: "Custom Email",
  subject_template: "Hello {{vendor_name}}",
  body_template: "<html>...</html>",
  status: "scheduled"
)
```

---

## Database Queries

### Find Emails Ready to Send (every 5 min)
```sql
SELECT * FROM scheduled_emails 
WHERE status = 'scheduled' 
  AND scheduled_for <= NOW()
  AND scheduled_for >= (NOW() - INTERVAL '7 days')
ORDER BY scheduled_for ASC;
```

### Check Delivery Rate for Email
```sql
SELECT 
  se.id, se.name, se.recipient_count,
  COUNT(CASE WHEN ed.status = 'delivered' THEN 1 END) as delivered,
  ROUND(100.0 * COUNT(CASE WHEN ed.status = 'delivered' THEN 1 END) / se.recipient_count, 1) as delivery_rate
FROM scheduled_emails se
LEFT JOIN email_deliveries ed ON se.id = ed.scheduled_email_id
GROUP BY se.id, se.name, se.recipient_count;
```

### Find Bounced Emails for Retry
```sql
SELECT * FROM email_deliveries
WHERE status = 'bounced' 
  AND bounce_type = 'soft'
  AND retry_count < 3
  AND next_retry_at IS NOT NULL
ORDER BY next_retry_at ASC;
```

### List Unsubscribed Users by Scope
```sql
-- Global unsubscribes
SELECT COUNT(*) FROM email_unsubscribes WHERE scope = 'global';

-- Organization unsubscribes
SELECT COUNT(*) FROM email_unsubscribes 
WHERE scope = 'organization' AND organization_id = ?;

-- Event unsubscribes
SELECT COUNT(*) FROM email_unsubscribes 
WHERE scope = 'event' AND event_id = ?;
```

---

## API Endpoints

### List Scheduled Emails
```
GET /api/v1/presents/events/:event_id/scheduled_emails
GET /api/v1/presents/events/:event_id/scheduled_emails?status=sent
GET /api/v1/presents/events/:event_id/scheduled_emails?category=payment_reminders
```

### Generate Emails from Template
```
POST /api/v1/presents/events/:event_id/scheduled_emails/generate
POST /api/v1/presents/events/:event_id/scheduled_emails/generate?category=payment_reminders
```

### Get Email Details with Deliveries
```
GET /api/v1/presents/events/:event_id/scheduled_emails/:id
```

### Send Email Now
```
POST /api/v1/presents/events/:event_id/scheduled_emails/:id/send_now
```

### Preview Email (resolve variables)
```
GET /api/v1/presents/events/:event_id/scheduled_emails/:id/preview
```

### Retry Failed Deliveries
```
POST /api/v1/presents/events/:event_id/scheduled_emails/:id/retry_failed
```

### List Recipients Who Would Receive Email
```
GET /api/v1/presents/events/:event_id/scheduled_emails/:id/recipients
```

### Pause/Resume Email
```
POST /api/v1/presents/events/:event_id/scheduled_emails/:id/pause
POST /api/v1/presents/events/:event_id/scheduled_emails/:id/resume
```

---

## Configuration & Environment

### Required Environment Variables
```env
# SendGrid API
VoxxyKeyAPI=your_sendgrid_api_key

# Redis (for Sidekiq)
REDIS_URL=redis://localhost:6379/0

# Webhook Endpoint (SendGrid points here)
# Usually: https://yourdomain.com/api/v1/webhooks/sendgrid
```

### Sidekiq Cron Schedule
```yaml
email_sender_worker:
  cron: "*/5 * * * *"  # Every 5 minutes

email_retry_scanner:
  cron: "*/30 * * * *"  # Every 30 minutes
```

---

## Debugging Checklist

### Emails Not Sending?
1. Check ScheduledEmail status is "scheduled" (not paused/cancelled)
2. Verify scheduled_for is <= NOW()
3. Verify email_template_item exists and has category
4. Check event has email_campaign_template assigned
5. Verify recipients exist and aren't all unsubscribed
6. Check Sidekiq is running: `ps aux | grep sidekiq`
7. Check Sidekiq logs: `bundle exec sidekiq --tail`

### Low Delivery Rate?
1. Check bounce reason: `email_delivery.bounce_reason`
2. Verify SendGrid domain is verified
3. Check SPF/DKIM records are correct
4. Look for "dropped" emails: likely spam filter or auth issues
5. Check organization's reply_to_email is valid

### Emails Retried Too Many Times?
1. Check if sender email is correct
2. Check bounce_type is "soft" (hard bounces won't retry)
3. Verify recipient server is responding
4. Check retry_count < max_retries (3)

### Missing Delivery Records?
1. Verify SendGrid webhook is configured and active
2. Check webhook endpoint is reachable and responding 200
3. Look for EmailDelivery records with status "queued" (not updated by webhook)
4. EmailDeliveryProcessorJob has fallback for invitation emails

---

## Performance Tips

### Optimize Email List Queries
```ruby
# GOOD: Eager load associations
emails = event.scheduled_emails.includes(:email_template_item, :email_deliveries)

# BAD: Will cause N+1 queries
emails = event.scheduled_emails.each { |e| e.email_template_item.name }
```

### Filter Large Delivery Lists
```ruby
# Use scopes for fast filtering
EmailDelivery.failed.soft_bounces.pending_retry
```

### Batch Process Retries
```ruby
# Process in chunks to avoid memory issues
EmailDelivery.soft_bounces.pending_retry.find_each do |delivery|
  EmailRetryJob.perform_async(delivery.id)
end
```

---

## Testing Email System

### Send Test Email from Console
```ruby
# Generate test event
event = Event.create!(title: "Test Event", ...)

# Generate test emails
ScheduledEmailGenerator.new(event).generate

# Send immediately
se = event.scheduled_emails.first
EmailSenderService.new(se).send_to_recipients
```

### Check Email Content
```ruby
se = ScheduledEmail.find(1)
resolver = EmailVariableResolver.new(se.event, se.event.registrations.first)
puts resolver.resolve(se.subject_template)
puts resolver.resolve(se.body_template)
```

### Preview Email via API
```bash
curl -X GET http://localhost:3000/api/v1/presents/events/123/scheduled_emails/456/preview
```

---

## Recent Fixes & Updates

**Latest Commit**: a54d7333 - fix email template copy

### Recent Issues Fixed:
1. **Template Copy Typos** - Fixed email template text issues
2. **Mail Sequence Selection** - Updated controller to support custom mail sequences
3. **Social Links** - Fixed Instagram/TikTok profile links in vendor emails
4. **Webhook Monitoring** - Added SendGrid webhook event tracking
5. **Template Standardization** - Simplified and consistent email template copy

### Recent Features Added:
1. **30-Email Sequence** - Pancake & Booze pilot (Feb 2026)
2. **Email History API** - View sent email history for registrations & invitations
3. **SendGrid Webhook Monitoring** - Full delivery tracking
4. **Delivery Analytics** - Track opens, clicks, bounces

---

## Admin Scripts

Located in `/lib/scripts/`:

### Retry Failed Emails
```bash
# Preview
rails runner lib/scripts/email_retry.rb --event=summer-market-2026 --status=failed --dry-run

# Execute
rails runner lib/scripts/email_retry.rb --event=summer-market-2026 --status=failed
```

### Options:
- `--event=SLUG` - Event slug (required)
- `--emails=LIST` - Specific emails (comma-separated)
- `--status=STATUS` - bounced, dropped, failed
- `--type=TYPE` - invitation, scheduled, all
- `--dry-run` - Preview without sending

---

## Monitoring & Alerts

### Check System Health
```ruby
# Emails ready to send
ScheduledEmail.pending.count

# Pending retries
EmailDelivery.pending_retry.count

# Bounce rate
EmailDelivery.where(status: "bounced").count / EmailDelivery.count.to_f * 100
```

### Sidekiq Dashboard
Visit: `http://localhost:3000/sidekiq`
- View queued jobs
- Monitor worker performance
- Check for failed jobs

### SendGrid Dashboard
- Monitor delivery events
- Check bounce rates
- Review suppression lists
- Verify webhook status

