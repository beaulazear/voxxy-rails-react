# Security Audit Technical Documentation - Voxxy Presents

This document provides technical answers for the security contractor's initial audit questions regarding the Voxxy Presents email automation system.

---

## Infrastructure & Delivery

### Email Service Provider (ESP)

**Provider:** SendGrid

- **Gem:** `sendgrid-ruby` version `~> 6.7.0`
- **API Key Location:** `ENV["VoxxyKeyAPI"]`
- **Implementation:** `app/services/email_sender_service.rb`

The system sends emails via SendGrid's v3 Mail Send API with:
- Custom tracking args for webhook correlation (`scheduled_email_id`, `event_id`, `registration_id`)
- HTML content type
- Personalization support for recipient names
- Delivery tracking via `X-Message-Id` response header

**Webhook Integration:** SendGrid webhooks are received at `/api/v1/webhooks/sendgrid` and processed by `EmailDeliveryProcessorJob` for delivery status updates (delivered, bounced, dropped, deferred, unsubscribe, spamreport).

---

### Scheduling Logic

**Task Runner:** Sidekiq with Sidekiq-Cron

**Configuration File:** `config/sidekiq_schedule.yml`

| Job | Frequency | Queue | Purpose |
|-----|-----------|-------|---------|
| `EmailSenderWorker` | Every 5 minutes | `email_delivery` | Checks for scheduled emails with `scheduled_for <= Time.current` and sends them |
| `EmailRetryScannerJob` | Every 30 minutes | `email_delivery` | Scans for soft-bounced emails that need retry |

**Redis Configuration:** `ENV["REDIS_URL"]` (defaults to `redis://localhost:6379/0`)

**Workers/Jobs:**
- `app/workers/email_sender_worker.rb` - Main cron worker for sending scheduled emails
- `app/workers/email_delivery_processor_job.rb` - Processes SendGrid webhook events
- `app/workers/email_retry_job.rb` - Handles individual email retries with exponential backoff (1hr, 4hr, 24hr)

---

### Environment Limits

**Application-Level Rate Limiting (Rack-Attack):**

| Endpoint | Limit | Period |
|----------|-------|--------|
| General API (per IP) | 300 requests | 1 hour |
| Authenticated users | 500 requests | 1 hour |
| Login attempts | 10 attempts | 15 minutes |
| OpenAI endpoints | 50 requests | 1 hour |

**Email-Specific Limits:**
- **No application-level daily sending limits are configured**
- SendGrid account tier limits apply (check SendGrid dashboard for actual limits)
- Retry mechanism has `max_retries: 3` per email delivery (stored in `email_deliveries` table)

**Template Position Limit:**
- Email template items are constrained to positions 1-40 via database check constraint: `position >= 1 AND position <= 40`

**Recipient Limits:**
- No explicit recipient limits per email campaign in the current implementation
- `recipient_count` is tracked per `scheduled_email` but not enforced

---

## Data & Logic

### Database Schema

**All tables already exist.** The email automation system has the following schema:

#### `email_campaign_templates`
```
id, template_type, organization_id, name, description, is_default, email_count, events_count, timestamps
- Indexes: organization_id, (organization_id + name unique), (template_type + is_default)
```

#### `email_template_items`
```
id, email_campaign_template_id, name, description, category, position,
subject_template, body_template, trigger_type, trigger_value, trigger_time,
filter_criteria (JSONB), enabled_by_default, timestamps
- Check constraint: position between 1-40
- Indexes: category, (campaign_template_id + position), filter_criteria (GIN)
```

#### `scheduled_emails`
```
id, event_id, email_campaign_template_id, email_template_item_id, name,
subject_template, body_template, trigger_type, trigger_value, trigger_time,
scheduled_for, filter_criteria (JSONB), status (default: "scheduled"),
sent_at, recipient_count, error_message, timestamps
- Indexes: email_campaign_template_id, email_template_item_id,
           (event_id + status), (status + scheduled_for), filter_criteria (GIN)
```

#### `email_deliveries` (sent_history equivalent)
```
id, scheduled_email_id, event_id, registration_id, sendgrid_message_id (unique),
recipient_email, status (default: "queued"), bounce_type, bounce_reason,
drop_reason, sent_at, delivered_at, bounced_at, dropped_at, unsubscribed_at,
retry_count (default: 0), next_retry_at, max_retries (default: 3), timestamps
- Indexes: sendgrid_message_id (unique), scheduled_email_id, event_id,
           (event_id + status), registration_id, (registration_id + status),
           next_retry_at (partial - where not null)
```

---

### Dynamic Fields (Variable Tags)

**Already implemented** in `app/services/email_variable_resolver.rb`

**Syntax:** Bracket notation `[variableName]` (not double curly braces)

#### Event Variables
| Tag | Description |
|-----|-------------|
| `[eventName]` | Event title |
| `[eventDate]` | Formatted event date (e.g., "Friday, January 10, 2026") |
| `[eventTime]` | Event start time |
| `[eventLocation]` | Event location/address |
| `[eventVenue]` | Event venue name |
| `[eventDescription]` | Event description |
| `[applicationDeadline]` | Application deadline date |
| `[boothPrice]` | Booth/vendor price (formatted as "$X") |
| `[paymentDueDate]` | Payment due date |
| `[organizationName]` | Organization name |
| `[organizationEmail]` | Organization contact email |

#### Vendor/Registration Variables
| Tag | Description |
|-----|-------------|
| `[firstName]` | Vendor first name (parsed from full name) |
| `[lastName]` | Vendor last name (parsed from full name) |
| `[fullName]` | Vendor full name |
| `[businessName]` | Business name |
| `[email]` | Vendor email |
| `[vendorCategory]` | Vendor category (Food, Art, etc.) |
| `[boothNumber]` | Assigned booth number (defaults to "TBD") |
| `[applicationDate]` | Date application was submitted |

#### Vendor Application Variables
| Tag | Description |
|-----|-------------|
| `[installDate]` | Setup/install date |
| `[installTime]` | Setup/install time range |
| `[installStartTime]` | Setup start time |
| `[installEndTime]` | Setup end time |
| `[paymentLink]` | Payment link URL |

#### Special Variables
| Tag | Description |
|-----|-------------|
| `[unsubscribeLink]` | Unsubscribe URL with token |
| `[eventLink]` | Public event page URL |
| `[bulletinLink]` | Public event bulletin page (alias for eventLink) |
| `[dashboardLink]` | Vendor dashboard URL |

---

## User Interface (UI)

### Current Component Library

**No WYSIWYG editor is currently installed.**

The frontend stack includes:
- **React:** 18.3.1
- **UI Framework:** Ant Design 5.21.6
- **Additional UI:** Bootstrap 5.3.3, React-Bootstrap 2.10.9
- **Styling:** Styled Components 6.1.13
- **Icons:** Lucide React 0.487.0, React-Icons 5.5.0

**Recommendation for WYSIWYG:**
Since Ant Design is already in use, consider:
1. **React-Quill** - Popular, lightweight, easy to integrate
2. **TipTap** - Modern, extensible, excellent for custom variable insertion
3. **Ant Design's built-in Input.TextArea** with custom variable insertion buttons (simpler approach)

---

### Trigger Points (Event Date Change)

**Current Implementation:** Event date change email recalculation is handled in the **Email Service layer**, not the Event Management layer.

**Location:** `app/services/scheduled_email_generator.rb`

**Methods:**
```ruby
# Regenerate all scheduled emails (deletes existing, creates new)
generator = ScheduledEmailGenerator.new(event)
generator.regenerate

# Update only scheduled times (preserves email records)
generator.update_scheduled_times
```

**Current Trigger:**
- **NOT automatically triggered** by Event model callbacks
- Invoked manually via rake task: `rails email_automation:regenerate[event-slug]`
- Can be called programmatically when event dates are updated

**Recommendation:**
Add an `after_update` callback in `app/models/event.rb` to automatically trigger recalculation when `event_date` or `application_deadline` changes:

```ruby
# Potential implementation location: app/models/event.rb
after_update :recalculate_scheduled_emails, if: :event_dates_changed?

private

def event_dates_changed?
  saved_change_to_event_date? || saved_change_to_application_deadline?
end

def recalculate_scheduled_emails
  ScheduledEmailGenerator.new(self).update_scheduled_times
end
```

**Current Architecture Decision:**
The trigger should live in the **Event model** (Event Management layer) because:
1. It's the source of truth for date changes
2. Keeps email scheduling logic encapsulated in the service but triggered appropriately
3. Avoids polling or separate monitoring systems

---

## Additional Security Considerations

### Authentication & Authorization
- JWT-based authentication (stored in `Rails.application.credentials.secret_key_base`)
- Role-based access: `consumer`, `venue_owner`, `vendor`, `admin`
- Admin users bypass rate limiting

### Email Security
- Unsubscribe mechanism via token-based URLs
- `email_unsubscribed` flag on registrations respected before sending
- SendGrid webhook signature verification should be implemented (check `api/v1/webhooks/sendgrid_controller.rb`)

### Data Protection
- Sensitive data in environment variables (`VoxxyKeyAPI`, `REDIS_URL`)
- Rails credentials for secrets
- No PII logged in email delivery records (only email addresses, which are required for functionality)

---

## File References

| Component | Location |
|-----------|----------|
| Email Sender Service | `app/services/email_sender_service.rb` |
| Variable Resolver | `app/services/email_variable_resolver.rb` |
| Schedule Calculator | `app/services/email_schedule_calculator.rb` |
| Scheduled Email Generator | `app/services/scheduled_email_generator.rb` |
| Email Delivery Processor | `app/workers/email_delivery_processor_job.rb` |
| Email Sender Worker | `app/workers/email_sender_worker.rb` |
| SendGrid Webhook Controller | `app/controllers/api/v1/webhooks/sendgrid_controller.rb` |
| Sidekiq Config | `config/initializers/sidekiq.rb` |
| Cron Schedule | `config/sidekiq_schedule.yml` |
| Rate Limiting | `config/initializers/rack_attack.rb` |
| Event Model | `app/models/event.rb` |
| Database Schema | `db/schema.rb` |

---

*Document generated for security audit - January 2026*
