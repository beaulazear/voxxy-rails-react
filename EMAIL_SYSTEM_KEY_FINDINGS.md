# Voxxy Presents Email System - Key Findings & Quick Reference

## Core Architecture Summary

**Technology Stack**:
- **Email Provider**: SendGrid (API-based, with webhook tracking)
- **Background Jobs**: Sidekiq + Sidekiq-Cron (5-min email checker, 30-min retry scanner)
- **Scheduling**: Time-based (EmailScheduleCalculator) + Event-based (direct calls)
- **Database**: PostgreSQL with JSONB for filter criteria
- **Max Emails per Template**: 40

---

## Critical Code Paths

### Email Sending Flow
1. **EmailSenderWorker** (5-min cron) checks `ScheduledEmail.where(status: scheduled, scheduled_for <= now)`
2. Routes by category:
   - `"event_announcements"` → **InvitationReminderService** (to EventInvitations)
   - Everything else → **EmailSenderService** (to Registrations)
3. Service filters recipients → resolves variables → calls SendGrid API
4. Creates **EmailDelivery** record with `sendgrid_message_id` (CRITICAL for webhook matching)
5. Updates `ScheduledEmail.status = 'sent'` only if >= 1 successful

### Webhook Processing
1. **SendgridWebhooksController** receives event, enqueues **EmailDeliveryProcessorJob**
2. Job looks up **EmailDelivery** by `sendgrid_message_id`
3. Updates status (delivered/bounced/dropped/unsubscribed)
4. Soft bounces: schedules retry with exponential backoff (1h, 4h, 24h)
5. Unsubscribes: creates **EmailUnsubscribe** record + updates Registration

---

## File Locations Quick Reference

| What | File | Lines |
|------|------|-------|
| Core Email Models | `app/models/email_delivery.rb`, `scheduled_email.rb`, `email_campaign_template.rb` | 50-250 |
| Email Services | `app/services/email_sender_service.rb`, `invitation_reminder_service.rb` | 100-250 |
| Variable Resolution | `app/services/email_variable_resolver.rb`, `invitation_variable_resolver.rb` | 50-280 |
| Worker/Jobs | `app/workers/email_sender_worker.rb`, `email_delivery_processor_job.rb` | 50-100 |
| Controllers | `app/controllers/api/v1/presents/scheduled_emails_controller.rb`, `sendgrid_webhooks_controller.rb` | 150-300 |
| Transactional Emails | `app/services/registration_email_service.rb` | 1200+ |
| Configuration | `config/sidekiq_schedule.yml` | 20-40 |
| Migrations | `db/migrate/202601*` | 30-50 each |

---

## Key Database Records

### ScheduledEmail
```
event_id: Which event
email_template_item_id: Template source
status: 'scheduled', 'paused', 'sent', 'failed', 'cancelled'
scheduled_for: UTC time to send
recipient_count: Persisted after send (immutable for accuracy)
filter_criteria: JSONB {"status": ["approved"], "vendor_category": ["Food"]}
subject_template, body_template: Can be edited before send
```

### EmailDelivery
```
scheduled_email_id: Which email was sent
sendgrid_message_id: SendGrid's unique ID (for webhook matching)
recipient_email: Who received it
status: 'queued', 'sent', 'delivered', 'bounced', 'dropped', 'unsubscribed'
sent_at, delivered_at, bounced_at: Timestamps from webhooks
bounce_type: 'soft' or 'hard'
retry_count, next_retry_at: For retry tracking
```

### EmailUnsubscribe
```
email: Email address
scope: 'event', 'organization', or 'global'
event_id/organization_id: If scoped
unsubscribed_at: When created
unsubscribe_source: 'sendgrid_webhook', 'user_action', 'admin_action'
```

---

## Email Template Variables

### For Registrations (EmailVariableResolver)
```
[eventName] [eventDate] [eventTime] [eventLocation] [eventVenue]
[firstName] [lastName] [fullName] [businessName] [email]
[vendorCategory] [boothNumber] [boothPrice] [installDate] [installTime]
[applicationDeadline] [paymentDueDate] [organizationName] [organizationEmail]
[unsubscribeLink] [eventLink] [dashboardLink] [categoryPaymentLink]
```

### For Vendor Contacts (InvitationVariableResolver)
```
[eventName] [eventDate] [eventTime] [eventLocation] [eventVenue]
[firstName] [lastName] [fullName] [businessName] [email]
[boothPrice] [installDate] [installTime] [categoryList]
[applicationDeadline] [paymentDueDate] [organizationName]
[unsubscribeLink] [eventLink] [invitationLink]
```

**Note**: Vendor contact variables like [vendorCategory], [boothNumber], [applicationDate] are EMPTY (contact hasn't applied yet)

---

## Trigger Types

### Time-Based (Scheduled Automatically)
- `days_before_event` - Sends X days before event date
- `days_after_event` - Sends X days after event date
- `days_before_deadline` - Sends X days before application deadline
- `on_event_date` - Sends on event date at trigger_time
- `on_application_open` - Sends when applications open
- `days_before_payment_deadline` - Sends X days before payment due
- `on_payment_deadline` - Sends on payment due date

### Event-Based (Manual/Callback)
- `on_application_submit` - When vendor submits
- `on_approval` - When vendor approved
- `on_waitlist` - When vendor on waitlist
- `on_rejection` - When vendor rejected
- `on_payment_received` - When payment received

**Implementation**: Event-based triggers get `scheduled_for = 10.years.from_now` (placeholder), created as 'paused', triggered manually or by callback.

---

## Known Issues & Gaps

### Issue #1: Vendor Email Triggers Inconsistent
**Problem**: Vendor approval/rejection emails (RegistrationEmailService) are NOT routed through EmailSenderWorker, don't create ScheduledEmail records, have limited tracking.

**Current**: Called directly from controllers
```ruby
RegistrationEmailService.send_approval_email(registration)  # No tracking!
```

**Should Be**: Category-based routing like invitations
```ruby
EmailSenderWorker → Category: "vendor_notifications" → VendorNotificationService
```

**Impact on Pilot Test**: Vendor emails sent but invisible in scheduled_emails UI, no delivery metrics.

### Issue #2: HTML Sanitization Missing
**Problem**: `body_template` stored and sent as raw HTML, no XSS protection

**Risk**: If template contains `<script>` or user variables contain HTML
```ruby
template = "<h1>[firstName]</h1>"
# If firstName = "<img src=x onerror=alert(1)>", it's sent raw
```

**Mitigation**: Only admins create templates (current)
**Recommendation**: Use `Sanitize` gem if user-facing templates

### Issue #3: Variable Resolution Not Escaped
**Problem**: Variables inserted with `.gsub()`, no HTML escaping

**Example**: If registration.first_name contains HTML, it's rendered
```ruby
resolved.gsub("[firstName]", first_name)  # No escaping!
```

**Fix**: Use `CGI.escapeHTML(first_name)` or Rails `h()` helper

### Issue #4: Unsubscribe Email Case Sensitivity
**Problem**: Emails stored with original case but searched case-insensitive

**Current**: Mix of `LOWER(email)` in some places, case-sensitive in others

**Fix**: Normalize to lowercase on `EmailUnsubscribe.create` (before_validation callback)

### Issue #5: Webhook Race Condition
**Problem**: Fallback delivery record creation if webhook arrives before EmailDelivery

```ruby
# If webhook arrives BEFORE EmailDelivery created:
if delivery.nil?
  delivery = create_invitation_delivery(event_data, sg_message_id)  # Creates new!
end
```

**Risk**: Potential duplicate records if timing is right

**Current Mitigation**: `find_by(recipient_email)` checks for recent records first

---

## Delivery Status Tracking

### What Gets Tracked
- Every email sent to SendGrid creates **EmailDelivery** record (status='sent')
- SendGrid webhooks update status (delivered/bounced/dropped/unsubscribed)
- Soft bounces scheduled for retry with exponential backoff

### What's Missing
- Open/click tracking (SendGrid can provide, not integrated)
- Read receipts (not common for transactional emails)
- Delivery reports in admin dashboard (available via API but not exposed)

### Metrics Available
- `ScheduledEmail.delivery_counts` - Hash of delivery statuses
- `ScheduledEmail.delivery_rate` - Percentage delivered
- `ScheduledEmail.undelivered_count` - Bounced + Dropped
- `EmailDelivery` records queryable by status, recipient, date

---

## SendGrid Configuration

### API Setup
```env
VoxxyKeyAPI=<SendGrid API Key>
```

### Sender Configuration
- **From Address**: `noreply@voxxypresents.com` (verified)
- **From Name**: Customizable per organization
- **Reply-To**: `organization.reply_to_email` (allows replies)

### Webhook Endpoint
```
POST /api/v1/webhooks/sendgrid
```

**Events Handled**: delivered, bounce, dropped, deferred, unsubscribe, spamreport

**Custom Args Sent** (for webhook identification):
- `scheduled_email_id`
- `event_id`
- `registration_id` or `event_invitation_id`

---

## Recipient Filtering

### Filter Criteria (JSONB)
```json
{
  "status": ["approved", "pending"],
  "vendor_category": ["Food", "Beverage"],
  "payment_status": ["paid"],
  "exclude_unsubscribed": true
}
```

### Implementation (RecipientFilterService)
```ruby
scope = event.registrations
scope = scope.where(status: criteria["status"]) if criteria["status"].present?
scope = scope.where(vendor_category: criteria["vendor_category"])
scope = scope.where.not("email IN (SELECT email FROM email_unsubscribes WHERE ...)")
```

### Two-Tier Unsubscribe Check
1. **Old System** (backwards compat): `registration.email_unsubscribed` boolean
2. **New System** (preferred): `EmailUnsubscribe` with scope (event/organization/global)

---

## Sidekiq Schedule

### EmailSenderWorker (Every 5 minutes)
- Finds emails where `scheduled_for <= now` and `status = 'scheduled'`
- Routes to EmailSenderService or InvitationReminderService
- Updates status to 'sent' or 'failed'

### EmailRetryScannerJob (Every 30 minutes)
- Finds deliveries where `next_retry_at <= now`
- Enqueues EmailRetryJob for each

### Cron Configuration
```yaml
email_sender_worker:
  cron: "*/5 * * * *"
  class: EmailSenderWorker
  
email_retry_scanner:
  cron: "*/30 * * * *"
  class: EmailRetryScannerJob
```

---

## Timezone Handling

### Scheduling Calculation (EmailScheduleCalculator)
- **Database**: UTC
- **User Input**: Eastern Time (America/New_York)
- **Conversion**:
  ```ruby
  Time.use_zone("America/New_York") do
    Time.zone.local(date.year, date.month, date.day, hour, minute, 0)
  end
  # Automatically converted to UTC when saved
  ```

### Display
- UI shows UTC times (should be converted to user's timezone)

---

## Testing & Debugging

### Log Locations
- **Rails Log**: Check for "EmailSenderWorker", "Sending scheduled email", "EmailDeliveryProcessorJob"
- **Sidekiq Dashboard**: Monitor job queues, see failed jobs
- **SendGrid Console**: View email delivery in SendGrid dashboard (but behind API)

### Debug Queries
```ruby
# Find all emails for an event
ScheduledEmail.where(event_id: event_id).order(:scheduled_for)

# Check delivery status
EmailDelivery.where(scheduled_email_id: email_id).group(:status).count

# Find soft bounces pending retry
EmailDelivery.where(bounce_type: 'soft', status: 'bounced').where("next_retry_at <= ?", Time.current)

# Check unsubscribes
EmailUnsubscribe.unsubscribed_from_event?(email, event)
```

### Common Issues & Fixes
| Issue | Debug |
|-------|-------|
| Email not sending | Check if `scheduled_for <= now` and `status = 'scheduled'` |
| Wrong recipients | Check filter_criteria JSONB |
| Variable not resolving | Ensure variable name matches exactly: [eventName] not [EventName] |
| Webhook not processing | Check SendGrid API key in ENV, webhook endpoint accessible |
| Email undelivered | Check if recipient unsubscribed (EmailUnsubscribe or registration.email_unsubscribed) |

---

## Summary for Pilot Test Issues

Based on the codebase review, if pilot test emails had issues:

1. **Vendor Emails Not Visible**: Vendor approval/rejection emails are separate from scheduled_emails (not routed through EmailSenderWorker), so won't appear in the scheduled emails list

2. **Wrong Recipients**: Check `ScheduledEmail.filter_criteria` - may have had wrong status/category filters

3. **Emails Marked Unsubscribed**: Check `EmailUnsubscribe` and `Registration.email_unsubscribed` - emails matching those were excluded

4. **Zero Recipients**: Check `ScheduledEmail.calculate_current_recipient_count` - if returns 0, email marked failed

5. **Low Delivery Rate**: Check SendGrid's bounce rates - likely IP reputation or content issues

6. **Timing Issues**: Email sent at `scheduled_for` time but shown as sent later due to processing delay - check email worker logs

---

## Key Code Commits to Understand

Look at recent commits related to:
- Email template fixes (Feb 2026)
- Email unsubscribe implementation (Jan 2026)
- SendGrid domain verification (Feb 2026)
- Email system analysis docs (Feb 2025)

All documentation available in root: `EMAIL_SYSTEM_*.md`

---

**Generated**: February 21, 2026
**System**: Voxxy Presents API v1.0
