# 📧 Email Automation System - Complete Implementation Guide

**Platform:** Voxxy Presents
**Last Updated:** January 17, 2026
**Purpose:** Comprehensive reference for the automated email campaign system

**⚠️ Important:** As of January 17, 2026, the system uses 7 scheduled emails (not 16). See [EMAIL_SYSTEM_FIXES_JANUARY_17_2026.md](./EMAIL_SYSTEM_FIXES_JANUARY_17_2026.md) for migration details.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Why Sidekiq? Understanding Background Jobs](#why-sidekiq-understanding-background-jobs)
3. [Architecture & Data Flow](#architecture--data-flow)
4. [Database Schema Deep Dive](#database-schema-deep-dive)
5. [Core Components Explained](#core-components-explained)
6. [How Email Sending Works](#how-email-sending-works)
7. [How Delivery Tracking Works](#how-delivery-tracking-works)
8. [Template System Explained](#template-system-explained)
9. [Common Workflows](#common-workflows)
10. [Configuration & Setup](#configuration--setup)
11. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
12. [Future Enhancements](#future-enhancements)

---

## System Overview

### What Does This System Do?

The email automation system allows event producers to:

1. **Create reusable email campaigns** - Collections of 7 automated scheduled emails
2. **Schedule emails throughout the event lifecycle** - Application reminders, payment deadlines, event day logistics, post-event thank you
3. **Send personalized emails automatically** - Emails sent at the right time to the right vendors with personalized content
4. **Track email delivery in real-time** - Know exactly when emails are delivered, bounced, or failed
5. **Automatically retry failed emails** - Soft bounces (temporary failures) are automatically retried

### The Problem This Solves

**Before:** Event producers manually sent emails to vendors at each stage:
- "Applications are open" emails
- "Deadline approaching" reminders
- Payment reminders
- Event logistics
- Thank you emails

**Manual process issues:**
- Time-consuming (20+ emails per event)
- Inconsistent (forget to send important emails)
- Not personalized (generic mass emails)
- No delivery tracking (don't know if emails were received)
- No retry logic (bounced emails lost forever)

**After (with automation):**
- 7 editable emails scheduled automatically when event is created
- Sent at optimal times based on event dates (in Eastern timezone)
- Fully personalized with vendor and event details
- Real-time delivery tracking
- Automatic retries for soft bounces
- Reusable templates for future events

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EMAIL CAMPAIGN                            │
│  (Template: Collection of 7 emails)                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT CREATED                                 │
│  Producer creates event, system assigns default template        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│              SCHEDULED EMAILS GENERATED                          │
│  7 emails created with calculated send times (EST)              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│               SIDEKIQ WORKER (every 5 min)                       │
│  Checks for emails ready to send                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                EMAIL SENDER SERVICE                              │
│  Sends via SendGrid with tracking                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│               SENDGRID DELIVERS EMAIL                            │
│  Email sent to vendor's inbox                                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│            SENDGRID WEBHOOK EVENT                                │
│  Reports delivery status (delivered/bounced/etc)                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│         SIDEKIQ WORKER PROCESSES EVENT                           │
│  Updates delivery status, schedules retries if needed           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why Sidekiq? Understanding Background Jobs

### What is Sidekiq?

**Sidekiq** is a **background job processing framework** for Ruby/Rails applications. Think of it as a separate worker that handles time-consuming tasks outside of your normal web request cycle.

### The Problem Without Sidekiq

Imagine this scenario **without** background jobs:

**User clicks "Send Email" button:**
1. Rails receives HTTP request
2. Rails connects to SendGrid API (2-5 seconds)
3. Sends email to 100 vendors (200-500 seconds = 3-8 minutes!)
4. User's browser waits... and waits... and times out ❌

**User clicks "Unsubscribe" link in email:**
1. SendGrid sends webhook to your server
2. Your server processes the event (0.5-2 seconds)
3. SendGrid expects response within 10 seconds or marks webhook as failed
4. If you're processing 100 events synchronously, webhooks time out ❌

**Problems:**
- ❌ Slow HTTP responses (users wait, browsers timeout)
- ❌ Webhooks fail due to timeouts
- ❌ Server uses all resources on slow tasks (other requests blocked)
- ❌ If server crashes mid-send, emails are lost (no retry)
- ❌ Can't schedule tasks for the future

### The Solution: Background Jobs with Sidekiq

With Sidekiq, we **separate slow/scheduled tasks from HTTP requests**:

**User clicks "Send Email" button:**
1. Rails receives HTTP request
2. Rails enqueues job: "Send emails to 100 vendors" (0.01 seconds)
3. Immediately returns success to user ✅
4. Sidekiq worker picks up job in background and sends emails

**SendGrid webhook arrives:**
1. Rails receives webhook
2. Rails enqueues job: "Process delivery event" (0.01 seconds)
3. Immediately returns 200 OK to SendGrid ✅
4. Sidekiq worker processes event in background

**Benefits:**
- ✅ Fast HTTP responses (< 100ms)
- ✅ Webhooks never timeout
- ✅ Server resources freed for other requests
- ✅ Built-in retry logic (if job fails, Sidekiq retries automatically)
- ✅ Schedule tasks for the future (send email in 5 minutes)
- ✅ Recurring jobs (check for emails every 5 minutes)

### How Sidekiq Works

#### 1. Redis (The Queue)

Sidekiq uses **Redis** as a job queue:

```
┌────────────────┐
│  Rails App     │  ← Enqueues jobs
└───────┬────────┘
        │
        ↓
┌────────────────┐
│  Redis Queue   │  ← Stores jobs
└───────┬────────┘
        │
        ↓
┌────────────────┐
│ Sidekiq Worker │  ← Processes jobs
└────────────────┘
```

**Redis** is an in-memory data store (think: super-fast database in RAM). Jobs are added to Redis queues, and Sidekiq workers pull jobs from queues and execute them.

**Why Redis?**
- Extremely fast (in-memory)
- Persistent (survives server restarts)
- Atomic operations (no race conditions)
- Supports priority queues

#### 2. Job Queues

We use different queues for different job types:

```ruby
# High priority - webhook events
sidekiq_options queue: :email_webhooks

# Normal priority - email sending
sidekiq_options queue: :email_delivery

# Low priority - cleanup tasks
sidekiq_options queue: :default
```

**Queue Processing Order:**
1. `:email_webhooks` - Processed first (webhooks are time-sensitive)
2. `:email_delivery` - Processed second
3. `:default` - Processed last

#### 3. Job Lifecycle

```
1. ENQUEUE
   Rails: EmailDeliveryProcessorJob.perform_async(event_data)
   ↓
   Redis: { class: 'EmailDeliveryProcessorJob', args: [event_data], queue: 'email_webhooks' }

2. FETCH
   Sidekiq worker checks Redis for jobs
   ↓
   Finds job in :email_webhooks queue

3. EXECUTE
   Worker calls: EmailDeliveryProcessorJob.new.perform(event_data)
   ↓
   Job processes event, updates database

4. COMPLETE/RETRY
   If successful: Remove from queue ✅
   If failed: Retry with exponential backoff (1min, 2min, 4min...)
```

#### 4. Retries & Error Handling

Sidekiq has **built-in retry logic**:

```ruby
# Job fails due to network error
sidekiq_options retry: 3  # Retry up to 3 times

# Retry schedule (exponential backoff):
# Attempt 1: Immediately
# Attempt 2: 1 minute later
# Attempt 3: 4 minutes later
# Attempt 4: 16 minutes later
# If still fails: Moves to "Dead" queue for manual review
```

**Our configuration:**
- `EmailDeliveryProcessorJob`: 3 retries (webhook events)
- `EmailRetryJob`: 2 retries (email resends)
- `EmailSenderWorker`: 2 retries (scheduled email checker)

### Sidekiq-Cron (Recurring Jobs)

**Sidekiq-Cron** is an extension that adds **cron-like scheduling**:

```yaml
# config/sidekiq_schedule.yml
email_sender_worker:
  cron: "*/5 * * * *"  # Every 5 minutes
  class: "EmailSenderWorker"
```

**How it works:**
1. Sidekiq-Cron runs on the Sidekiq server
2. Every minute, it checks the schedule
3. If a job is due, it enqueues the job
4. Sidekiq worker picks up and executes the job

**Our recurring jobs:**
- `EmailSenderWorker`: Every 5 minutes - Checks for scheduled emails ready to send
- `EmailRetryScannerJob`: Every 30 minutes - Checks for emails pending retry

**Why recurring jobs?**
- Scheduled emails don't need exact-second precision (5-minute intervals are fine)
- Resilient to server restarts (cron reschedules on startup)
- No need for external cron daemon

### Sidekiq Web UI

Sidekiq includes a **web dashboard** for monitoring:

```ruby
# config/routes.rb
require 'sidekiq/web'
mount Sidekiq::Web => '/admin/sidekiq'  # Only accessible to admins
```

**Dashboard shows:**
- ✅ Jobs processed (today, this week, all time)
- ⏳ Jobs queued (by queue)
- 🔄 Jobs in progress
- ❌ Failed jobs (with retry schedule)
- 💀 Dead jobs (failed after max retries)
- 📊 Real-time graphs
- 🔍 Job details (arguments, error messages, backtrace)

**Access:** `https://www.voxxyai.com/admin/sidekiq` (admin login required)

### Why Sidekiq vs Alternatives?

**Other background job options:**
- **ActiveJob + Delayed Job** - Built into Rails, but slower (uses SQL)
- **Resque** - Similar to Sidekiq, but slower (forks new process per job)
- **Sucker Punch** - In-process threads, but loses jobs on server restart

**Why Sidekiq wins:**
- ✅ **Fast** - Uses threads, not forked processes (10x faster than Resque)
- ✅ **Efficient** - Can handle 1000s of jobs with minimal memory
- ✅ **Persistent** - Jobs stored in Redis (survives server restarts)
- ✅ **Mature** - Industry standard, battle-tested
- ✅ **Great monitoring** - Web UI included
- ✅ **Active development** - Regular updates, excellent documentation

---

## Architecture & Data Flow

### Database Tables

We created 4 new tables for the email system:

```
email_campaign_templates      (Templates = Collections of emails)
  ↓ has_many
email_template_items          (Individual emails within templates)
  ↓ copied to
scheduled_emails              (Event-specific email instances)
  ↓ tracks
email_deliveries              (Delivery tracking for each recipient)
```

### Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: TEMPLATE CREATION (One-Time Setup)                     │
└─────────────────────────────────────────────────────────────────┘

1. Platform seeds DEFAULT template
   EmailCampaignTemplate (id: 1, name: "Default Event Campaign")
   ↓
   16 EmailTemplateItems (positions 1-16)
   - "Applications Now Open"
   - "Deadline Approaching"
   - "Payment Reminder"
   - ... etc

2. Producer optionally creates CUSTOM template
   Clone default template → Modify emails → Save as "My Summer Market Campaign"

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: EVENT CREATION & EMAIL GENERATION                      │
└─────────────────────────────────────────────────────────────────┘

3. Producer creates event
   POST /api/v1/presents/organizations/:org/events
   {
     title: "Summer Market 2025",
     event_date: "2025-06-15",
     application_deadline: "2025-05-30",
     email_campaign_template_id: 1  // Uses default or custom
   }

4. Event model: after_create callback
   ScheduledEmailGenerator.generate_for_event(event, template)
   ↓
   Creates 16 ScheduledEmail records
   - Copies subject/body from EmailTemplateItem
   - Calculates scheduled_for based on trigger_type
   - Status: "scheduled"

   Example:
   ScheduledEmail #501
   - name: "Applications Now Open"
   - scheduled_for: 2025-04-30 09:00:00  (30 days before deadline)
   - subject_template: "{{event_title}} Applications Are Open!"
   - body_template: "<p>Hi {{vendor_name}},...</p>"
   - status: "scheduled"

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: AUTOMATED EMAIL SENDING                                │
└─────────────────────────────────────────────────────────────────┘

5. EmailSenderWorker (Sidekiq-Cron, every 5 minutes)
   ┌─────────────────────────────────────────┐
   │ Find emails where:                      │
   │ - status = 'scheduled'                  │
   │ - scheduled_for <= Time.current         │
   │ - scheduled_for >= 7.days.ago           │
   └─────────────────────────────────────────┘
   ↓
   Found: ScheduledEmail #501 ready to send!

6. EmailSenderService.new(scheduled_email).send_to_recipients
   ┌─────────────────────────────────────────┐
   │ Step 1: Filter recipients               │
   │ RecipientFilterService.filter_recipients│
   │ (filters by status, category, etc.)     │
   └─────────────────────────────────────────┘
   ↓
   Found: 50 vendors match filter criteria

   ┌─────────────────────────────────────────┐
   │ Step 2: Send to each vendor             │
   │ For each registration:                  │
   │   - Skip if unsubscribed                │
   │   - Resolve variables                   │
   │   - Send via SendGrid                   │
   │   - Create EmailDelivery record         │
   └─────────────────────────────────────────┘
   ↓
   Sent: 50 emails

7. EmailSenderService.send_to_registration(registration)
   ┌─────────────────────────────────────────┐
   │ Step 2a: Resolve variables              │
   │ EmailVariableResolver.resolve()         │
   │                                         │
   │ Subject: "{{event_title}} Applications │
   │           Are Open!"                    │
   │ Becomes: "Summer Market 2025            │
   │           Applications Are Open!"       │
   │                                         │
   │ Body: "Hi {{vendor_name}},..."          │
   │ Becomes: "Hi John Doe,..."              │
   └─────────────────────────────────────────┘
   ↓
   ┌─────────────────────────────────────────┐
   │ Step 2b: Send via SendGrid API          │
   │                                         │
   │ POST https://api.sendgrid.com/v3/mail/send│
   │ {                                       │
   │   from: "events@voxxyai.com",           │
   │   to: "john@example.com",               │
   │   subject: "Summer Market 2025...",     │
   │   html: "<p>Hi John Doe,...</p>",       │
   │   custom_args: {                        │
   │     scheduled_email_id: 501,            │
   │     event_id: 123,                      │
   │     registration_id: 789                │
   │   }                                     │
   │ }                                       │
   └─────────────────────────────────────────┘
   ↓
   SendGrid returns: 202 Accepted, message_id: "abc123xyz"

   ┌─────────────────────────────────────────┐
   │ Step 2c: Create delivery record         │
   │                                         │
   │ EmailDelivery.create!(                  │
   │   scheduled_email_id: 501,              │
   │   event_id: 123,                        │
   │   registration_id: 789,                 │
   │   sendgrid_message_id: "abc123xyz",     │
   │   recipient_email: "john@example.com",  │
   │   status: 'sent',                       │
   │   sent_at: Time.current                 │
   │ )                                       │
   └─────────────────────────────────────────┘

8. Update ScheduledEmail status
   scheduled_email.update!(
     status: 'sent',
     sent_at: Time.current,
     recipient_count: 50
   )

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: DELIVERY TRACKING (Real-Time via Webhook)              │
└─────────────────────────────────────────────────────────────────┘

9. SendGrid delivers email (seconds to minutes later)
   Email arrives in john@example.com inbox ✅

10. SendGrid webhook fires
    POST https://www.voxxyai.com/api/v1/webhooks/sendgrid
    [
      {
        "event": "delivered",
        "email": "john@example.com",
        "timestamp": 1640995200,
        "sg_message_id": "abc123xyz"
      }
    ]

11. Webhooks::SendgridController receives event
    ┌─────────────────────────────────────────┐
    │ def create                              │
    │   events = parse_events                 │
    │   events.each do |event|                │
    │     EmailDeliveryProcessorJob           │
    │       .perform_async(event.as_json)     │
    │   end                                   │
    │   render json: { queued: events.count } │
    │ end                                     │
    │                                         │
    │ Response time: ~50ms ⚡                  │
    └─────────────────────────────────────────┘
    ↓
    Returns: 200 OK to SendGrid (webhook won't retry)
    Enqueued: EmailDeliveryProcessorJob in Redis

12. Sidekiq worker picks up job (within seconds)
    EmailDeliveryProcessorJob.new.perform(event_data)
    ┌─────────────────────────────────────────┐
    │ Step 1: Find delivery record            │
    │ delivery = EmailDelivery.find_by(       │
    │   sendgrid_message_id: "abc123xyz"      │
    │ )                                       │
    └─────────────────────────────────────────┘
    ↓
    Found: EmailDelivery #1234

    ┌─────────────────────────────────────────┐
    │ Step 2: Update delivery status          │
    │ delivery.update!(                       │
    │   status: 'delivered',                  │
    │   delivered_at: Time.at(1640995200)     │
    │ )                                       │
    └─────────────────────────────────────────┘
    ✅ Done!

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: RETRY LOGIC (If Email Bounces)                         │
└─────────────────────────────────────────────────────────────────┘

13. Alternative scenario: Email bounces (soft bounce)
    SendGrid webhook:
    {
      "event": "bounce",
      "sg_message_id": "abc123xyz",
      "bounce_classification": "soft",
      "reason": "Mailbox full"
    }

14. EmailDeliveryProcessorJob processes bounce
    ┌─────────────────────────────────────────┐
    │ determine_bounce_type(event)            │
    │ → "soft" (temporary failure)            │
    │                                         │
    │ delivery.update!(                       │
    │   status: 'bounced',                    │
    │   bounce_type: 'soft',                  │
    │   bounce_reason: 'Mailbox full'         │
    │ )                                       │
    │                                         │
    │ schedule_retry(delivery) if retryable?  │
    └─────────────────────────────────────────┘
    ↓
    ┌─────────────────────────────────────────┐
    │ schedule_retry(delivery)                │
    │                                         │
    │ retry_count = 1                         │
    │ next_retry = 1.hour.from_now            │
    │                                         │
    │ delivery.update!(                       │
    │   retry_count: 1,                       │
    │   next_retry_at: 1.hour.from_now        │
    │ )                                       │
    │                                         │
    │ EmailRetryJob.perform_in(1.hour, delivery.id)│
    └─────────────────────────────────────────┘

15. One hour later: EmailRetryJob executes
    ┌─────────────────────────────────────────┐
    │ EmailRetryJob.perform(delivery_id)      │
    │                                         │
    │ delivery = EmailDelivery.find(delivery_id)│
    │                                         │
    │ # Resend the email                      │
    │ EmailSenderService.retry_delivery(delivery)│
    │                                         │
    │ # Clear retry timestamp                 │
    │ delivery.update!(next_retry_at: nil)    │
    └─────────────────────────────────────────┘
    ↓
    Email resent! If it delivers: status → 'delivered' ✅
    If it bounces again: retry_count → 2, schedule retry in 4 hours
    After 3 retries: status → 'dropped' (permanently failed)
```

---

## Database Schema Deep Dive

### 1. email_campaign_templates

**Purpose:** Master collections of emails (templates)

**Key Concepts:**
- A **template** is a **collection** of up to 40 emails
- **System templates** (1): Created by platform, read-only for users
- **User templates** (unlimited): Created by producers, fully customizable

**Fields:**
```ruby
id                    # Primary key
template_type         # 'system' or 'user'
organization_id       # NULL for system, organization ID for user templates
name                  # "Default Event Campaign", "My Summer Market Campaign"
description           # Optional description
is_default            # true for system default (only one)
email_count           # Counter cache: how many emails in this template
events_count          # Counter cache: how many events use this template
created_at, updated_at
```

**Validations:**
- `name` must be present and unique per organization
- Only one system template can have `is_default = true`
- System templates cannot be modified/deleted by users

**Example Records:**
```ruby
# System default
EmailCampaignTemplate.create!(
  template_type: 'system',
  organization_id: nil,
  name: 'Default Event Campaign',
  is_default: true,
  email_count: 16
)

# User custom
EmailCampaignTemplate.create!(
  template_type: 'user',
  organization_id: 5,
  name: 'My Summer Market Campaign',
  is_default: false,
  email_count: 18
)
```

---

### 2. email_template_items

**Purpose:** Individual emails within a template collection

**Key Concepts:**
- Each template has **up to 40** email items
- Emails are **ordered by position** (1-40)
- Contains email **content templates** with variables like `{{event_title}}`
- Defines **trigger logic** (when to send)
- Defines **recipient filters** (who to send to)

**Fields:**
```ruby
id                          # Primary key
email_campaign_template_id  # Belongs to template
name                        # "Applications Now Open"
description                 # Optional description
category                    # 'pre_event', 'event_day', 'post_event', 'application', etc.
position                    # Order within template (1-40)

# Email content (with variables)
subject_template            # "{{event_title}} Applications Are Open!"
body_template               # "<p>Hi {{vendor_name}},...</p>" (HTML)

# Trigger logic (when to send)
trigger_type                # 'days_before_event', 'days_before_deadline', etc.
trigger_value               # Number of days offset (e.g., 7)
trigger_time                # Time of day (e.g., '09:00')

# Recipient filtering
filter_criteria             # JSONB: { "status": ["approved"], "vendor_category": ["Food"] }

# Defaults
enabled_by_default          # true = auto-scheduled when event created

created_at, updated_at
```

**Trigger Types:**
```ruby
# Relative to event date
'days_before_event'         # X days before event_date
'days_after_event'          # X days after event_date
'on_event_date'             # On event_date at trigger_time

# Relative to application deadline
'days_before_deadline'      # X days before application_deadline
'on_application_open'       # When application opens

# Action-triggered
'on_application_submit'     # When vendor submits application
'on_approval'               # When application approved
'days_before_payment_deadline'  # X days before payment due
'on_payment_deadline'       # When payment is due
```

**Filter Criteria (JSONB):**
```json
{
  "status": ["approved", "confirmed"],
  "exclude_status": ["rejected", "waitlist"],
  "vendor_category": ["Food", "Art"],
  "location_city": ["Atlanta"]
}
```

**Example Record:**
```ruby
EmailTemplateItem.create!(
  email_campaign_template_id: 1,
  name: "Applications Now Open",
  category: "application",
  position: 1,
  subject_template: "{{event_title}} Vendor Applications Are Now Open!",
  body_template: "<p>Hi {{vendor_name}},</p><p>We're excited to announce...</p>",
  trigger_type: "days_before_deadline",
  trigger_value: 30,
  trigger_time: "09:00",
  filter_criteria: {},  # Send to all
  enabled_by_default: true
)
```

---

### 3. scheduled_emails

**Purpose:** Event-specific email instances (actual emails to be sent)

**Key Concepts:**
- **Generated** when event is created (copied from template items)
- **Customizable** per event (producer can edit subject, body, timing)
- **Scheduled** based on calculated send time
- Tracks **send status** (scheduled, paused, sent, failed, cancelled)

**Fields:**
```ruby
id                          # Primary key
event_id                    # Belongs to event
email_campaign_template_id  # Which template it came from
email_template_item_id      # Which template item it was copied from

# Email details (customizable per event)
name                        # "Applications Now Open"
subject_template            # Can be edited from template
body_template               # Can be edited from template

# Scheduling (customizable per event)
trigger_type                # Can override template
trigger_value               # Can override template
trigger_time                # Can override template
scheduled_for               # COMPUTED: When to actually send (UTC timestamp)

# Recipient filtering (customizable per event)
filter_criteria             # JSONB, can override template

# Status tracking
status                      # 'scheduled', 'paused', 'sent', 'failed', 'cancelled'
sent_at                     # Timestamp when sent
recipient_count             # How many recipients received this email
error_message               # If status='failed'

created_at, updated_at
```

**Status Flow:**
```
scheduled  →  paused  →  scheduled  →  sent  ✅
           →  cancelled  ❌
           →  failed  →  retry  →  sent  ✅
```

**Example Record:**
```ruby
ScheduledEmail.create!(
  event_id: 123,
  email_campaign_template_id: 1,
  email_template_item_id: 1,
  name: "Applications Now Open",
  subject_template: "Summer Market 2025 Vendor Applications Are Now Open!",
  body_template: "<p>Hi {{vendor_name}},</p>...",
  trigger_type: "days_before_deadline",
  trigger_value: 30,
  trigger_time: "09:00",
  scheduled_for: "2025-04-30 09:00:00 UTC",  # Calculated by EmailScheduleCalculator
  filter_criteria: {},
  status: "scheduled"
)
```

---

### 4. email_deliveries

**Purpose:** Track delivery status for each email sent to each recipient

**Key Concepts:**
- **One record per email sent** to each recipient
- Updated in **real-time** via SendGrid webhook
- Tracks **delivery lifecycle** (sent → delivered/bounced/dropped)
- Supports **automatic retries** for soft bounces

**Fields:**
```ruby
id                      # Primary key
scheduled_email_id      # Which scheduled email
event_id                # Which event
registration_id         # Which vendor received it

# SendGrid tracking
sendgrid_message_id     # UNIQUE - from SendGrid response (for webhook correlation)
recipient_email         # Vendor's email address

# Delivery status
status                  # 'queued', 'sent', 'delivered', 'bounced', 'dropped', 'unsubscribed'

# Bounce details
bounce_type             # 'soft' or 'hard'
bounce_reason           # "Mailbox full", "User unknown", etc.
drop_reason             # Why SendGrid refused to send

# Timestamps (from SendGrid webhook)
sent_at
delivered_at
bounced_at
dropped_at
unsubscribed_at

# Retry logic
retry_count             # How many times we've retried (0-3)
next_retry_at           # When to retry next (NULL if not retrying)
max_retries             # Max retry attempts (default: 3)

created_at, updated_at
```

**Status Values:**
```ruby
'queued'        # Created, not yet sent
'sent'          # Sent to SendGrid, awaiting delivery
'delivered'     # ✅ Successfully delivered to inbox
'bounced'       # ❌ Bounced (hard or soft)
'dropped'       # ⊘ SendGrid refused to send
'unsubscribed'  # ⊗ User clicked unsubscribe
```

**Bounce Types:**
```ruby
'hard'  # Permanent failure (invalid email, domain doesn't exist)
        # → Do NOT retry

'soft'  # Temporary failure (mailbox full, server down)
        # → Retry with exponential backoff
```

**Example Record:**
```ruby
# Initially created when email sent
EmailDelivery.create!(
  scheduled_email_id: 501,
  event_id: 123,
  registration_id: 789,
  sendgrid_message_id: "abc123xyz.filterdrecv-123-456",
  recipient_email: "john@example.com",
  status: 'sent',
  sent_at: Time.current,
  retry_count: 0,
  max_retries: 3
)

# Updated by webhook when delivered
delivery.update!(
  status: 'delivered',
  delivered_at: Time.at(1640995200)
)

# Or if bounced (soft)
delivery.update!(
  status: 'bounced',
  bounce_type: 'soft',
  bounce_reason: 'Mailbox full',
  bounced_at: Time.current,
  retry_count: 1,
  next_retry_at: 1.hour.from_now
)
```

---

## Core Components Explained

### 1. EmailSenderService

**File:** `app/services/email_sender_service.rb`

**Purpose:** Core service that sends emails via SendGrid with tracking

**Responsibilities:**
1. Filter recipients based on criteria
2. Resolve template variables for each recipient
3. Send emails via SendGrid API
4. Inject tracking IDs into SendGrid custom args
5. Create EmailDelivery records for tracking

**Key Methods:**

#### `send_to_recipients`
Sends email to all matching recipients for a scheduled email.

```ruby
service = EmailSenderService.new(scheduled_email)
result = service.send_to_recipients
# Returns: { sent: 50, failed: 2 }
```

**Flow:**
1. Use `RecipientFilterService` to find matching vendors
2. For each vendor: call `send_to_registration`
3. Update `scheduled_email.status = 'sent'`
4. Return send statistics

#### `send_to_registration(registration)`
Sends email to a single vendor.

```ruby
service.send_to_registration(registration)
```

**Flow:**
1. Skip if `registration.email_unsubscribed?`
2. Resolve variables in subject and body
3. Call `send_via_sendgrid` with resolved content
4. Create `EmailDelivery` record with SendGrid message ID

#### `send_via_sendgrid` (private)
Low-level SendGrid API integration.

**Critical: Custom Tracking Args**
```ruby
personalization.add_custom_arg(SendGrid::CustomArg.new(
  key: 'scheduled_email_id',
  value: scheduled_email_id.to_s
))
personalization.add_custom_arg(SendGrid::CustomArg.new(
  key: 'event_id',
  value: event_id.to_s
))
personalization.add_custom_arg(SendGrid::CustomArg.new(
  key: 'registration_id',
  value: registration_id.to_s
))
```

**Why?** When SendGrid webhook fires, we need to know:
- Which scheduled email this was
- Which event it belongs to
- Which vendor received it

SendGrid **preserves** these custom args and sends them back in webhook events!

---

### 2. EmailScheduleCalculator

**File:** `app/services/email_schedule_calculator.rb`

**Purpose:** Calculate when an email should be sent based on trigger logic

**Why separate service?**
- Complex date/time calculation logic
- Multiple trigger types to handle
- Reusable across different contexts
- Easier to test in isolation

**Key Method:**

```ruby
EmailScheduleCalculator.calculate(
  trigger_type: 'days_before_event',
  trigger_value: 7,
  event_date: Date.parse('2025-06-15'),
  application_deadline: Date.parse('2025-05-30'),
  trigger_time: Time.parse('09:00')
)
# Returns: 2025-06-08 09:00:00 UTC
```

**Supported Trigger Types:**

```ruby
case trigger_type
when 'days_before_event'
  event_date - trigger_value.days + trigger_time

when 'days_after_event'
  event_date + trigger_value.days + trigger_time

when 'on_event_date'
  event_date + trigger_time

when 'days_before_deadline'
  application_deadline - trigger_value.days + trigger_time

when 'on_application_open'
  Time.current  # Send immediately

when 'on_application_submit'
  Time.current  # Send when action happens

when 'on_approval'
  Time.current

when 'days_before_payment_deadline'
  payment_deadline - trigger_value.days + trigger_time

when 'on_payment_deadline'
  payment_deadline + trigger_time
end
```

**Edge Cases Handled:**
- Past dates (skip email if scheduled in the past)
- Missing dates (gracefully skip if event_date nil)
- Timezone conversion (always returns UTC)

---

### 3. RecipientFilterService

**File:** `app/services/recipient_filter_service.rb`

**Purpose:** Filter event registrations based on JSONB criteria

**Why important?**
- Not all emails should go to all vendors
- Payment reminders → only approved vendors
- Event logistics → only confirmed vendors
- Waitlist notifications → only waitlisted vendors

**Key Method:**

```ruby
RecipientFilterService.filter_recipients(
  event: event,
  filter_criteria: {
    "status" => ["approved", "confirmed"],
    "exclude_status" => ["rejected", "waitlist"],
    "vendor_category" => ["Food"]
  }
)
# Returns: ActiveRecord::Relation of matching registrations
```

**Filtering Logic:**

```ruby
# Start with all registrations for event
scope = event.registrations

# Filter by status (include)
if filter_criteria['status'].present?
  scope = scope.where(status: filter_criteria['status'])
end

# Filter by status (exclude)
if filter_criteria['exclude_status'].present?
  scope = scope.where.not(status: filter_criteria['exclude_status'])
end

# Filter by vendor category
if filter_criteria['vendor_category'].present?
  scope = scope.where(vendor_category: filter_criteria['vendor_category'])
end

# ALWAYS exclude unsubscribed users (unless explicitly disabled)
unless filter_criteria['include_unsubscribed']
  scope = scope.where(email_unsubscribed: [false, nil])
end

scope
```

**Use Cases:**

```ruby
# Payment reminder (only approved vendors)
{
  "status": ["approved"],
  "exclude_status": ["rejected", "waitlist"]
}

# Event logistics (only confirmed/paid vendors)
{
  "status": ["confirmed"]
}

# Waitlist notification (only waitlisted vendors)
{
  "status": ["waitlist"]
}

# Category-specific email (only food vendors in Atlanta)
{
  "status": ["approved"],
  "vendor_category": ["Food"],
  "location_city": ["Atlanta"]
}
```

---

### 4. EmailVariableResolver

**File:** `app/services/email_variable_resolver.rb`

**Purpose:** Replace `{{variables}}` with actual data

**Available Variables:**

#### Event Variables
```ruby
{{event_title}}           → "Summer Market 2025"
{{event_date}}            → "June 15, 2025"
{{event_time}}            → "10:00 AM - 6:00 PM"
{{event_location}}        → "Piedmont Park, Atlanta, GA"
{{event_description}}     → Full event description
{{event_url}}             → "https://voxxypresents.com/events/summer-market-2025"
{{application_deadline}}  → "May 30, 2025"
{{booth_price}}           → "150.00"
```

#### Registration Variables (per recipient)
```ruby
{{vendor_name}}           → "John Doe"
{{business_name}}         → "John's Tacos"
{{vendor_category}}       → "Food"
{{application_status}}    → "approved"
{{ticket_code}}           → "ABC123"
{{booth_number}}          → "A-12" (if assigned)
```

#### Organization Variables
```ruby
{{organization_name}}     → "Voxxy Presents"
{{organization_email}}    → "events@voxxyai.com"
{{organization_website}}  → "https://voxxypresents.com"
{{organization_instagram}}→ "@voxxypresents"
{{organization_phone}}    → "404-555-1234"
```

#### Special Variables
```ruby
{{unsubscribe_link}}      → "https://voxxypresents.com/unsubscribe?token=..."
{{event_link}}            → Full URL to event page
{{tracking_url}}          → Full URL to track application
```

**Usage:**

```ruby
resolver = EmailVariableResolver.new(event, registration)

subject = resolver.resolve("{{event_title}} - Payment Due for {{vendor_name}}")
# → "Summer Market 2025 - Payment Due for John Doe"

body = resolver.resolve("<p>Hi {{vendor_name}},</p><p>Your booth at {{event_title}} costs ${{booth_price}}.</p>")
# → "<p>Hi John Doe,</p><p>Your booth at Summer Market 2025 costs $150.00.</p>"
```

**Graceful Handling:**
- Missing fields → empty string (doesn't crash)
- Date formatting → US format (June 15, 2025)
- Currency formatting → 2 decimal places

---

### 5. ScheduledEmailGenerator

**File:** `app/services/scheduled_email_generator.rb`

**Purpose:** Generate scheduled emails when event is created

**Called By:** Event model `after_create` callback

**Key Method:**

```ruby
ScheduledEmailGenerator.generate_for_event(event, template)
```

**Flow:**

```ruby
# 1. Fetch all email template items
template_items = template.email_template_items.enabled.order(:position)

# 2. For each template item
template_items.each do |item|
  # Calculate when to send
  scheduled_for = EmailScheduleCalculator.calculate(
    trigger_type: item.trigger_type,
    trigger_value: item.trigger_value,
    event_date: event.event_date,
    application_deadline: event.application_deadline,
    trigger_time: item.trigger_time
  )

  # Skip if in the past (event created late)
  next if scheduled_for < Time.current

  # Create scheduled email
  ScheduledEmail.create!(
    event: event,
    email_campaign_template: template,
    email_template_item: item,
    name: item.name,
    subject_template: item.subject_template,
    body_template: item.body_template,
    trigger_type: item.trigger_type,
    trigger_value: item.trigger_value,
    trigger_time: item.trigger_time,
    scheduled_for: scheduled_for,
    filter_criteria: item.filter_criteria,
    status: item.enabled_by_default ? 'scheduled' : 'paused'
  )
end
```

**Smart Features:**
- **Skip past emails** - If event created late, don't schedule emails in the past
- **Selective generation** - Can generate only specific categories/positions
- **Regenerate** - Can delete and recreate all emails
- **Update scheduled times** - When event dates change, recalculate send times

---

### 6. EmailCampaignTemplateCloner

**File:** `app/services/email_campaign_template_cloner.rb`

**Purpose:** Clone templates to create custom versions

**Use Cases:**
1. User wants to customize default template
2. User wants to reuse a successful template from past event

**Key Method:**

```ruby
EmailCampaignTemplateCloner.clone(
  source_template: EmailCampaignTemplate.find(1),
  organization: current_organization,
  new_name: "My Custom Summer Campaign"
)
```

**Flow:**

```ruby
# 1. Create new template
new_template = EmailCampaignTemplate.create!(
  template_type: 'user',
  organization: organization,
  name: new_name,
  description: source_template.description
)

# 2. Clone all email items
source_template.email_template_items.each do |item|
  new_template.email_template_items.create!(
    name: item.name,
    description: item.description,
    category: item.category,
    position: item.position,
    subject_template: item.subject_template,
    body_template: item.body_template,
    trigger_type: item.trigger_type,
    trigger_value: item.trigger_value,
    trigger_time: item.trigger_time,
    filter_criteria: item.filter_criteria,
    enabled_by_default: item.enabled_by_default
  )
end

new_template
```

---

### 7. EmailDeliveryProcessorJob

**File:** `app/workers/email_delivery_processor_job.rb`

**Purpose:** Process SendGrid webhook events in background

**Queue:** `:email_webhooks` (high priority)
**Retries:** 3

**Why background job?**
- ❌ Without: Webhook processing takes 0.5-2 seconds per event
  - 100 events = 50-200 seconds
  - SendGrid times out after 10 seconds
- ✅ With: Webhook returns in < 100ms
  - Events processed asynchronously
  - No timeouts

**Key Method:**

```ruby
EmailDeliveryProcessorJob.perform_async(event_data)
```

**Event Processing:**

```ruby
def perform(event_data)
  event_type = event_data['event']
  sg_message_id = extract_message_id(event_data)

  # Find delivery record
  delivery = EmailDelivery.find_by(sendgrid_message_id: sg_message_id)
  return unless delivery

  case event_type
  when 'delivered'
    handle_delivered(delivery, event_data)
  when 'bounce'
    handle_bounce(delivery, event_data)
  when 'dropped'
    handle_dropped(delivery, event_data)
  when 'deferred'
    handle_deferred(delivery, event_data)
  when 'unsubscribe', 'spamreport'
    handle_unsubscribe(delivery, event_data)
  end
end
```

**Bounce Type Detection:**

```ruby
def determine_bounce_type(event)
  classification = event['bounce_classification']
  reason = event['reason'].to_s.downcase

  # Hard bounce indicators
  if classification == 'hard' ||
     reason.include?('does not exist') ||
     reason.include?('invalid') ||
     reason.include?('unknown user')
    'hard'
  else
    'soft'
  end
end
```

**Retry Scheduling:**

```ruby
def schedule_retry(delivery)
  return if delivery.retry_count >= delivery.max_retries

  # Exponential backoff
  retry_delays = [1.hour, 4.hours, 24.hours]
  next_delay = retry_delays[delivery.retry_count] || 24.hours

  delivery.update!(
    retry_count: delivery.retry_count + 1,
    next_retry_at: next_delay.from_now
  )

  # Schedule retry job
  EmailRetryJob.perform_in(next_delay, delivery.id)
end
```

---

### 8. EmailRetryJob

**File:** `app/workers/email_retry_job.rb`

**Purpose:** Retry sending soft-bounced emails

**Queue:** `:email_delivery`
**Retries:** 2

**Trigger:** Scheduled by `EmailDeliveryProcessorJob` when soft bounce occurs

**Key Method:**

```ruby
EmailRetryJob.perform_in(1.hour, delivery_id)
```

**Flow:**

```ruby
def perform(delivery_id)
  delivery = EmailDelivery.find_by(id: delivery_id)
  return unless delivery

  # Don't retry if already delivered or unsubscribed
  return if delivery.status.in?(['delivered', 'unsubscribed'])

  # Don't retry if max retries exceeded
  return unless delivery.retryable?

  # Resend the email
  EmailSenderService.retry_delivery(delivery)

  # Clear retry timestamp
  delivery.update(next_retry_at: nil)
rescue => e
  # If this was the last retry, mark as permanently failed
  if delivery.retry_count >= delivery.max_retries
    delivery.update(
      status: 'dropped',
      drop_reason: "Max retries exceeded: #{e.message}"
    )
  end

  raise e  # Re-raise for Sidekiq retry logic
end
```

**Retry Schedule:**

| Attempt | Delay | Total Time |
|---------|-------|------------|
| 1 (initial send) | 0 | 0 |
| 2 (first retry) | 1 hour | 1 hour |
| 3 (second retry) | 4 hours | 5 hours |
| 4 (third retry) | 24 hours | 29 hours |
| Failed permanently | - | - |

**Why exponential backoff?**
- Temporary issues (mailbox full) often resolve quickly
- Server outages may take hours to fix
- Avoids hammering failing servers

---

### 9. EmailSenderWorker

**File:** `app/workers/email_sender_worker.rb`

**Purpose:** Recurring job that checks for scheduled emails ready to send

**Schedule:** Every 5 minutes (Sidekiq-Cron)
**Queue:** `:email_delivery`
**Retries:** 2

**Why recurring job instead of scheduled jobs?**
- ✅ Resilient to server restarts (reschedules on startup)
- ✅ No need to schedule individual send jobs
- ✅ Batch processing is more efficient
- ✅ Easier to monitor (one job vs thousands)

**Key Method:**

```ruby
# Runs every 5 minutes
EmailSenderWorker.perform_async
```

**Flow:**

```ruby
def perform
  # Find emails ready to send
  ready_emails = ScheduledEmail
    .where(status: 'scheduled')
    .where('scheduled_for <= ?', Time.current)
    .where('scheduled_for >= ?', 7.days.ago)  # Skip very old emails
    .includes(:event, event: :organization)
    .order(scheduled_for: :asc)

  return if ready_emails.empty?

  ready_emails.each do |scheduled_email|
    begin
      service = EmailSenderService.new(scheduled_email)
      service.send_to_recipients
    rescue => e
      # Mark as failed
      scheduled_email.update(
        status: 'failed',
        error_message: e.message
      )
    end
  end
end
```

**Performance:**
- Average: 10-20 emails per run
- Processing time: 2-5 seconds per 10 emails
- Impact: Minimal (runs in background)

**Why 5-minute intervals?**
- Emails don't need exact-second precision
- Reduces server load
- Allows batching of multiple emails
- Good balance between timeliness and efficiency

---

### 10. EmailRetryScannerJob

**File:** `app/workers/email_retry_scanner_job.rb`

**Purpose:** Backup scanner for pending retries (in case webhook-based retry failed)

**Schedule:** Every 30 minutes (Sidekiq-Cron)
**Queue:** `:email_delivery`
**Retries:** 1

**Why needed?**
- SendGrid webhooks can fail
- Retry jobs can crash
- Network issues can prevent job enqueueing
- This is a safety net

**Key Method:**

```ruby
# Runs every 30 minutes
EmailRetryScannerJob.perform_async
```

**Flow:**

```ruby
def perform
  # Find deliveries that should have been retried
  pending_retries = EmailDelivery
    .pending_retry
    .where('next_retry_at <= ?', Time.current)

  return if pending_retries.empty?

  pending_retries.each do |delivery|
    # Enqueue the retry job
    EmailRetryJob.perform_async(delivery.id)
  end
end
```

**Scope: `pending_retry`**
```ruby
scope :pending_retry, -> {
  where('next_retry_at IS NOT NULL AND next_retry_at <= ?', Time.current)
}
```

---

## How Email Sending Works

### Complete End-to-End Flow

Let's walk through a complete example: **Sending a "Payment Reminder" email**

#### Setup

**Event:**
- Title: "Summer Market 2025"
- Event Date: June 15, 2025
- Application Deadline: May 30, 2025
- Template: Default Event Campaign

**Scheduled Email:**
- Name: "Payment Reminder - 3 Days Before Due"
- Trigger: 3 days before payment deadline
- Scheduled For: June 9, 2025 at 9:00 AM
- Recipients: Approved vendors only

**Vendors:**
- 100 vendors applied
- 50 approved
- 30 rejected
- 20 waitlisted

---

#### Step-by-Step Execution

**June 9, 2025 - 9:03 AM: EmailSenderWorker runs**

```ruby
# 1. Worker finds scheduled emails ready to send
ready_emails = ScheduledEmail.where(
  status: 'scheduled',
  scheduled_for: ..Time.current
)
# Finds: Payment Reminder email (scheduled for 9:00 AM)

# 2. Worker calls EmailSenderService
service = EmailSenderService.new(scheduled_email)
service.send_to_recipients
```

**EmailSenderService.send_to_recipients:**

```ruby
# 3. Filter recipients
recipients = RecipientFilterService.filter_recipients(
  event: event,
  filter_criteria: { "status" => ["approved"] }
)
# Returns: 50 approved vendors (excludes rejected/waitlisted)

# 4. Send to each recipient
sent = 0
failed = 0

recipients.each do |registration|
  begin
    send_to_registration(registration)
    sent += 1
  rescue => e
    failed += 1
  end
end

# sent: 50, failed: 0

# 5. Mark scheduled email as sent
scheduled_email.update!(
  status: 'sent',
  sent_at: Time.current,
  recipient_count: 50
)
```

**EmailSenderService.send_to_registration (for one vendor):**

```ruby
registration = {
  name: "John Doe",
  email: "john@tacos.com",
  business_name: "John's Tacos",
  vendor_category: "Food"
}

# 6. Skip if unsubscribed
return if registration.email_unsubscribed?  # false

# 7. Resolve variables
subject = EmailVariableResolver.resolve(
  template: "{{event_title}} - Payment Due in 3 Days",
  event: event,
  registration: registration
)
# Result: "Summer Market 2025 - Payment Due in 3 Days"

body = EmailVariableResolver.resolve(
  template: "<p>Hi {{vendor_name}},</p><p>Your payment of ${{booth_price}} is due in 3 days...</p>",
  event: event,
  registration: registration
)
# Result: "<p>Hi John Doe,</p><p>Your payment of $150.00 is due in 3 days...</p>"

# 8. Send via SendGrid
response = send_via_sendgrid(
  to_email: "john@tacos.com",
  to_name: "John Doe",
  subject: "Summer Market 2025 - Payment Due in 3 Days",
  body: "<p>Hi John Doe,</p>...",
  scheduled_email_id: 501,
  event_id: 123,
  registration_id: 789
)
```

**SendGrid API Call:**

```ruby
# 9. Construct SendGrid payload
mail = SendGrid::Mail.new
mail.from = SendGrid::Email.new(email: "events@voxxyai.com", name: "Voxxy Presents")
mail.subject = "Summer Market 2025 - Payment Due in 3 Days"

personalization = SendGrid::Personalization.new
personalization.add_to(SendGrid::Email.new(email: "john@tacos.com", name: "John Doe"))

# CRITICAL: Custom tracking args
personalization.add_custom_arg(SendGrid::CustomArg.new(
  key: 'scheduled_email_id',
  value: '501'
))
personalization.add_custom_arg(SendGrid::CustomArg.new(
  key: 'event_id',
  value: '123'
))
personalization.add_custom_arg(SendGrid::CustomArg.new(
  key: 'registration_id',
  value: '789'
))

mail.add_personalization(personalization)
mail.add_content(SendGrid::Content.new(
  type: 'text/html',
  value: "<p>Hi John Doe,</p>..."
))

# 10. Send to SendGrid
sg = SendGrid::API.new(api_key: ENV['VoxxyKeyAPI'])
response = sg.client.mail._('send').post(request_body: mail.to_json)

# Response: 202 Accepted
# Headers: X-Message-Id: "abc123xyz.filterdrecv-p3las2-f5dc09c8d-6slrv-37"
```

**Create Delivery Record:**

```ruby
# 11. Extract SendGrid message ID
message_id = response.headers['X-Message-Id']
# "abc123xyz.filterdrecv-p3las2-f5dc09c8d-6slrv-37"

# 12. Create EmailDelivery record
EmailDelivery.create!(
  scheduled_email_id: 501,
  event_id: 123,
  registration_id: 789,
  sendgrid_message_id: message_id,
  recipient_email: "john@tacos.com",
  status: 'sent',
  sent_at: Time.current
)
```

**Repeat for all 50 vendors...**

---

#### Summary

**What happened:**
1. ✅ EmailSenderWorker found 1 email ready to send
2. ✅ EmailSenderService filtered to 50 approved vendors
3. ✅ Sent 50 personalized emails via SendGrid
4. ✅ Created 50 EmailDelivery records for tracking
5. ✅ Marked ScheduledEmail as sent

**Time:** ~30 seconds total for 50 emails

**Next:** SendGrid delivers emails, webhooks fire, statuses update

---

## How Delivery Tracking Works

### Complete Webhook Flow

Continuing from the email sending example above...

#### Minutes Later: Email Delivered

**SendGrid delivers email to john@tacos.com**
- Email arrives in inbox ✅
- SendGrid fires webhook to our server

---

#### Webhook Event Received

**POST https://www.voxxyai.com/api/v1/webhooks/sendgrid**

**Payload:**
```json
[
  {
    "email": "john@tacos.com",
    "event": "delivered",
    "timestamp": 1717930800,
    "smtp-id": "<abc123xyz@sendgrid.net>",
    "sg_message_id": "abc123xyz.filterdrecv-p3las2-f5dc09c8d-6slrv-37",
    "custom_args": {
      "scheduled_email_id": "501",
      "event_id": "123",
      "registration_id": "789"
    }
  }
]
```

---

#### Webhook Controller

**File:** `app/controllers/api/v1/webhooks/sendgrid_controller.rb`

```ruby
def create
  events = parse_events  # Parse JSON payload

  # Enqueue background job for each event (FAST!)
  events.each do |event|
    EmailDeliveryProcessorJob.perform_async(event.as_json)
  end

  render json: { queued: events.count }, status: :ok
end
# Response time: ~50ms ⚡
```

**Why so fast?**
- No database queries
- No processing
- Just enqueue and return
- SendGrid webhook won't timeout

---

#### Background Job Processes Event

**Sidekiq picks up EmailDeliveryProcessorJob** (within seconds)

```ruby
def perform(event_data)
  event_type = event_data['event']  # "delivered"
  sg_message_id = event_data['sg_message_id']  # "abc123xyz..."

  # 1. Find delivery record by SendGrid message ID
  delivery = EmailDelivery.find_by(sendgrid_message_id: sg_message_id)

  unless delivery
    Rails.logger.info("No delivery found for #{sg_message_id}")
    return
  end

  # 2. Handle the event
  handle_delivered(delivery, event_data)
end
```

**handle_delivered:**

```ruby
def handle_delivered(delivery, event)
  delivery.update!(
    status: 'delivered',
    delivered_at: Time.at(event['timestamp'])
  )

  Rails.logger.info("✓ Email delivered to #{delivery.recipient_email}")
end
```

**Result:**
```ruby
EmailDelivery.find_by(recipient_email: "john@tacos.com")
# {
#   status: 'delivered',
#   delivered_at: '2025-06-09 09:05:23 UTC',
#   sent_at: '2025-06-09 09:03:15 UTC'
# }
```

---

### Alternative Scenario: Soft Bounce

**What if the email bounced?**

**Webhook Event:**
```json
{
  "email": "john@tacos.com",
  "event": "bounce",
  "sg_message_id": "abc123xyz...",
  "bounce_classification": "soft",
  "reason": "Mailbox is full",
  "type": "blocked"
}
```

**EmailDeliveryProcessorJob.handle_bounce:**

```ruby
def handle_bounce(delivery, event)
  # Determine bounce type
  bounce_type = determine_bounce_type(event)  # "soft"

  # Update delivery
  delivery.update!(
    status: 'bounced',
    bounce_type: 'soft',
    bounce_reason: 'Mailbox is full',
    bounced_at: Time.at(event['timestamp'])
  )

  # Schedule retry if retryable
  if delivery.retryable?
    schedule_retry(delivery)
  end
end
```

**schedule_retry:**

```ruby
def schedule_retry(delivery)
  # Exponential backoff
  retry_delays = [1.hour, 4.hours, 24.hours]
  next_delay = retry_delays[delivery.retry_count]  # 1.hour (first retry)

  # Update delivery
  delivery.update!(
    retry_count: 1,
    next_retry_at: 1.hour.from_now
  )

  # Schedule retry job
  EmailRetryJob.perform_in(1.hour, delivery.id)

  Rails.logger.info("↻ Retry #1 scheduled for #{delivery.next_retry_at}")
end
```

**Result:**
```ruby
EmailDelivery.find_by(recipient_email: "john@tacos.com")
# {
#   status: 'bounced',
#   bounce_type: 'soft',
#   bounce_reason: 'Mailbox is full',
#   bounced_at: '2025-06-09 09:05:23 UTC',
#   retry_count: 1,
#   next_retry_at: '2025-06-09 10:05:23 UTC'  # 1 hour later
# }
```

---

#### One Hour Later: Retry

**EmailRetryJob executes:**

```ruby
def perform(delivery_id)
  delivery = EmailDelivery.find(delivery_id)

  # Don't retry if already delivered
  return if delivery.status == 'delivered'

  # Resend the email
  EmailSenderService.retry_delivery(delivery)

  # Clear retry timestamp
  delivery.update!(next_retry_at: nil)

  Rails.logger.info("↻ Email retry sent for delivery ##{delivery.id}")
end
```

**EmailSenderService.retry_delivery:**

```ruby
def self.retry_delivery(delivery)
  service = new(delivery.scheduled_email)
  service.send_to_registration(delivery.registration)
end
```

**Result:**
- New email sent to SendGrid
- New EmailDelivery record created (or existing one updated)
- If delivered this time: status → 'delivered' ✅
- If bounced again: retry_count → 2, next_retry_at → 4 hours from now
- After 3 retries: status → 'dropped' (permanently failed)

---

### Tracking Across All Vendors

**Producer Dashboard View:**

```
Scheduled Email: "Payment Reminder - 3 Days Before Due"
Status: Sent to 50 recipients

Delivery Status Breakdown:
✅ Delivered: 45 (90%)
🔄 Retrying: 3 (6%)
✗ Bounced (hard): 2 (4%)

Individual Deliveries:
┌────────────────────┬────────────────┬────────────┬──────────┐
│ Vendor             │ Email          │ Status     │ Details  │
├────────────────────┼────────────────┼────────────┼──────────┤
│ John Doe           │ john@tacos.com │ ✅ Delivered│ 9:05 AM  │
│ Jane Smith         │ jane@art.com   │ ✅ Delivered│ 9:06 AM  │
│ Bob's BBQ          │ bob@bbq.com    │ 🔄 Retrying│ Retry #1 │
│ Alice's Crafts     │ alice@bad.com  │ ✗ Bounced  │ Invalid  │
└────────────────────┴────────────────┴────────────┴──────────┘
```

**Query:**
```ruby
scheduled_email = ScheduledEmail.find(501)
deliveries = scheduled_email.email_deliveries.includes(:registration)

deliveries.group(:status).count
# {
#   'delivered' => 45,
#   'bounced' => 5,
#   'sent' => 3  # Awaiting webhook
# }
```

---

## Template System Explained

### What is a Template?

A **template** is a **complete email campaign** - a named collection of up to 40 individual emails that work together to communicate with vendors throughout an event lifecycle.

**Think of it like:**
- A **playbook** for event communication
- A **blueprint** that can be reused
- A **collection** of automated emails, not a single email

### Three-Layer System

```
Layer 1: EMAIL CAMPAIGN TEMPLATE (The Collection)
   ↓
Layer 2: EMAIL TEMPLATE ITEMS (Individual Emails)
   ↓
Layer 3: SCHEDULED EMAILS (Event-Specific Instances)
```

---

### Layer 1: Email Campaign Templates

**Purpose:** Named collections of emails

**Types:**
1. **System Template** (1): "Default Event Campaign"
   - Created by platform (seed data)
   - Read-only for users (can't delete or modify)
   - Contains 16 pre-written emails

2. **User Templates** (unlimited): Custom campaigns
   - Created by producers
   - Fully customizable
   - Can be deleted

**Example Templates:**

```
Default Event Campaign (System)
├─ 16 emails
├─ Used by: 50 events
└─ Created: Platform seed

My Summer Market Campaign (User)
├─ 18 emails
├─ Used by: 5 events
└─ Created: Organization #5

Atlanta Food Festival Campaign (User)
├─ 22 emails
├─ Used by: 3 events
└─ Created: Organization #5
```

---

### Layer 2: Email Template Items

**Purpose:** Individual emails within a template

**Example: "Default Event Campaign" Template**

```
Position 1: "Applications Now Open"
   Trigger: 30 days before deadline at 9:00 AM
   Recipients: All
   Subject: "{{event_title}} Vendor Applications Are Now Open!"

Position 2: "10 Weeks Before Deadline"
   Trigger: 70 days before deadline at 10:00 AM
   Recipients: All
   Subject: "Save the Date: {{event_title}}"

Position 3: "Application Deadline Approaching"
   Trigger: 7 days before deadline at 9:00 AM
   Recipients: Pending applicants only
   Subject: "Only {{days_remaining}} Days Left to Apply!"

Position 4: "Payment Details"
   Trigger: On approval (immediate)
   Recipients: Approved vendors
   Subject: "You're Accepted! Payment Details for {{event_title}}"

...
Position 16: "Thank You - Day After Event"
   Trigger: 1 day after event at 10:00 AM
   Recipients: Confirmed vendors
   Subject: "Thank You for Making {{event_title}} Amazing!"
```

---

### Layer 3: Scheduled Emails

**Purpose:** Event-specific email instances

**Generated When:** Event is created

**Example: Event "Summer Market 2025" Created**

Producer creates event:
- Title: "Summer Market 2025"
- Event Date: June 15, 2025
- Application Deadline: May 30, 2025
- Template Selected: "Default Event Campaign"

System generates 16 scheduled emails:

```
ScheduledEmail #1
   Name: "Applications Now Open"
   Scheduled For: April 30, 2025 at 9:00 AM (30 days before May 30)
   Subject: "Summer Market 2025 Vendor Applications Are Now Open!"
   Status: scheduled

ScheduledEmail #2
   Name: "10 Weeks Before Deadline"
   Scheduled For: March 21, 2025 at 10:00 AM (70 days before May 30)
   Subject: "Save the Date: Summer Market 2025"
   Status: scheduled

ScheduledEmail #3
   Name: "Application Deadline Approaching"
   Scheduled For: May 23, 2025 at 9:00 AM (7 days before May 30)
   Subject: "Only 7 Days Left to Apply!"
   Status: scheduled

... (13 more)
```

**Producer can customize each email:**
- Edit subject/body for this event only
- Change timing
- Pause or delete
- Add/remove recipients

---

### Template Workflow

#### 1. Creating a Custom Template

**Scenario:** Producer wants to reuse a successful email campaign

**Steps:**

```ruby
# 1. Clone default template
POST /api/v1/presents/email_campaign_templates
{
  source_template_id: 1,  # Default template
  name: "My Summer Market Campaign",
  description: "Customized for summer food markets"
}

# 2. System clones all 16 emails
EmailCampaignTemplateCloner.clone(...)
# Creates: Template #45 with 16 email items (copied from default)

# 3. Producer edits emails
PATCH /api/v1/presents/email_template_items/205
{
  subject_template: "{{event_title}} - Apply Now for Atlanta's Best Market!",
  trigger_value: 45  # Change from 30 days to 45 days before deadline
}

# 4. Producer adds a new email
POST /api/v1/presents/email_campaign_templates/45/emails
{
  name: "Atlanta Food Vendors - Special Announcement",
  position: 17,
  subject_template: "Calling All Atlanta Food Vendors!",
  trigger_type: "days_before_deadline",
  trigger_value: 60
}

# Now template has 17 emails
```

---

#### 2. Using a Template for a New Event

**Scenario:** Producer creates event, selects custom template

**Steps:**

```ruby
# 1. Create event with template selection
POST /api/v1/presents/organizations/5/events
{
  title: "Atlanta Summer Market 2025",
  event_date: "2025-07-20",
  application_deadline: "2025-06-15",
  email_campaign_template_id: 45  # Use custom template
}

# 2. System generates scheduled emails
Event after_create callback:
  ScheduledEmailGenerator.generate_for_event(event, template)

# 3. Creates 17 scheduled emails (from 17 template items)
ScheduledEmail records created:
  - Email 1: Scheduled for April 6, 2025 (45 days before June 15)
  - Email 2: Scheduled for March 16, 2025 (70 days before June 15)
  - Email 17: Scheduled for April 16, 2025 (60 days before June 15)
  - ... etc
```

---

#### 3. Saving Event's Emails as New Template

**Scenario:** Producer customized emails for event, wants to save for future use

**Steps:**

```ruby
# 1. Producer edits emails for this event
# (Changes subjects, bodies, timing, adds/removes emails)

# 2. Producer clicks "Save as Template"
POST /api/v1/presents/events/123/save_as_template
{
  name: "My Atlanta Events Campaign",
  description: "Perfect for Atlanta food events"
}

# 3. System creates new template from event's scheduled emails
# Reverse process: ScheduledEmail → EmailTemplateItem
EmailCampaignTemplate.create!(
  template_type: 'user',
  organization_id: 5,
  name: "My Atlanta Events Campaign"
)

event.scheduled_emails.each do |scheduled_email|
  EmailTemplateItem.create!(
    email_campaign_template: new_template,
    name: scheduled_email.name,
    subject_template: scheduled_email.subject_template,
    body_template: scheduled_email.body_template,
    trigger_type: scheduled_email.trigger_type,
    trigger_value: scheduled_email.trigger_value,
    ...
  )
end

# 4. New template available for future events
```

---

### Template Benefits

**For Producers:**
- ✅ Reuse successful email campaigns
- ✅ Consistent communication across events
- ✅ Save time (no recreating emails)
- ✅ Build a library of campaigns for different event types

**For Platform:**
- ✅ Standardized best practices (default template)
- ✅ Easier onboarding (pre-written emails)
- ✅ Scalability (unlimited custom templates)
- ✅ Templates can be shared (future feature)

---

## Common Workflows

### Workflow 1: Producer Creates Event

**User Action:** Producer creates a new event

**Steps:**
1. Producer fills out event form
2. Selects email template (default or custom)
3. Clicks "Create Event"

**Backend:**
```ruby
# EventsController#create
def create
  @event = @organization.events.create!(event_params)
  render json: @event, status: :created
end

# Event model after_create callback
def assign_email_template_and_generate_emails
  # Use selected template or default
  template = email_campaign_template || EmailCampaignTemplate.default_template

  # Generate scheduled emails
  ScheduledEmailGenerator.new(self).generate(template)
end
```

**Result:**
- Event created ✅
- 11-16 scheduled emails created (depending on event dates)
- Emails scheduled at calculated times
- All emails status: 'scheduled'

---

### Workflow 2: Automated Email Sending

**Trigger:** Time reaches scheduled send time

**Steps:**
1. EmailSenderWorker runs (every 5 minutes)
2. Finds scheduled emails where `scheduled_for <= Time.current`
3. For each email: Send to matching recipients
4. Update status to 'sent'

**Backend:**
```ruby
# EmailSenderWorker (Sidekiq-Cron)
def perform
  ScheduledEmail
    .where(status: 'scheduled', scheduled_for: ..Time.current)
    .each do |email|
      EmailSenderService.new(email).send_to_recipients
    end
end
```

**Result:**
- Emails sent to all matching vendors ✅
- EmailDelivery records created for tracking
- ScheduledEmail status: 'sent'

---

### Workflow 3: Delivery Tracking

**Trigger:** SendGrid delivers email

**Steps:**
1. SendGrid delivers email to vendor's inbox
2. SendGrid fires webhook to `/api/v1/webhooks/sendgrid`
3. Webhook controller enqueues EmailDeliveryProcessorJob
4. Background job updates EmailDelivery status

**Backend:**
```ruby
# Webhook Controller
def create
  events.each do |event|
    EmailDeliveryProcessorJob.perform_async(event.as_json)
  end
end

# Background Job
def perform(event_data)
  delivery = EmailDelivery.find_by(sendgrid_message_id: event_data['sg_message_id'])
  delivery.update!(status: 'delivered', delivered_at: Time.at(event_data['timestamp']))
end
```

**Result:**
- EmailDelivery status updated in real-time ✅
- Producer sees delivery status in dashboard
- If bounced: Retry scheduled automatically

---

### Workflow 4: Soft Bounce Retry

**Trigger:** Email bounces (soft bounce)

**Steps:**
1. SendGrid webhook reports bounce
2. EmailDeliveryProcessorJob determines bounce type
3. If soft bounce: Schedule retry
4. EmailRetryJob executes after delay
5. Email resent

**Backend:**
```ruby
# EmailDeliveryProcessorJob
def handle_bounce(delivery, event)
  bounce_type = determine_bounce_type(event)  # 'soft'

  delivery.update!(
    status: 'bounced',
    bounce_type: 'soft',
    bounce_reason: event['reason']
  )

  schedule_retry(delivery) if delivery.retryable?
end

def schedule_retry(delivery)
  delivery.update!(
    retry_count: delivery.retry_count + 1,
    next_retry_at: 1.hour.from_now
  )

  EmailRetryJob.perform_in(1.hour, delivery.id)
end

# 1 hour later...
# EmailRetryJob
def perform(delivery_id)
  delivery = EmailDelivery.find(delivery_id)
  EmailSenderService.retry_delivery(delivery)
end
```

**Result:**
- Email automatically retried ✅
- Up to 3 retry attempts
- If still fails: Marked as permanently failed

---

### Workflow 5: Producer Pauses Email

**User Action:** Producer wants to pause a scheduled email

**Steps:**
1. Producer views scheduled emails for event
2. Clicks "Pause" on an email
3. Email won't be sent

**Backend:**
```ruby
# ScheduledEmailsController#pause
def pause
  @scheduled_email.update(status: 'paused')
  render json: { message: "Email paused" }
end
```

**Result:**
- ScheduledEmail status: 'paused' ✅
- EmailSenderWorker skips paused emails
- Can be resumed later

---

### Workflow 6: Producer Sends Email Immediately

**User Action:** Producer clicks "Send Now" on a scheduled email

**Steps:**
1. Producer clicks "Send Now" button
2. Email sent immediately to all matching recipients
3. Status updated to 'sent'

**Backend:**
```ruby
# ScheduledEmailsController#send_now
def send_now
  service = EmailSenderService.new(@scheduled_email)
  result = service.send_to_recipients

  render json: {
    message: "Email sent successfully",
    sent_count: result[:sent],
    failed_count: result[:failed]
  }
end
```

**Result:**
- Email sent immediately (bypasses schedule) ✅
- Delivery tracking works normally
- Status: 'sent'

---

## Configuration & Setup

### Requirements

**Software:**
- Ruby 3.x
- Rails 7.2+
- Redis 6.x+ (for Sidekiq)
- PostgreSQL 14+ (for JSONB support)

**Gems:**
```ruby
# Gemfile
gem 'sidekiq'           # Background jobs
gem 'sidekiq-cron'      # Recurring jobs
gem 'sendgrid-ruby'     # Email API
gem 'redis'             # Sidekiq queue
```

**Environment Variables:**
```bash
REDIS_URL=redis://localhost:6379/0
VoxxyKeyAPI=<sendgrid_api_key>
SENDER_EMAIL=hello@voxxypresents.com
```

---

### Installation Steps

#### 1. Install Gems

```bash
bundle add sidekiq sidekiq-cron sendgrid-ruby redis
bundle install
```

#### 2. Run Migrations

```bash
rails db:migrate
```

**Migrations created:**
- `email_campaign_templates`
- `email_template_items`
- `scheduled_emails`
- `email_deliveries`
- Add `email_campaign_template_id` to `events`
- Add `email_unsubscribed` to `registrations`

#### 3. Seed Default Template

```bash
rails db:seed
```

Creates:
- 1 system template: "Default Event Campaign"
- 16 email template items

#### 4. Configure Sidekiq

Already done! Files created:
- `config/initializers/sidekiq.rb` - Loads schedule
- `config/sidekiq_schedule.yml` - Cron jobs

#### 5. Start Sidekiq

```bash
# Development
bundle exec sidekiq

# Production (with systemd or similar)
bundle exec sidekiq -e production -C config/sidekiq.yml
```

#### 6. Configure SendGrid Webhook

See `SENDGRID_WEBHOOK_SETUP.md` for detailed instructions.

**Quick setup:**
1. Go to SendGrid → Event Webhook
2. Create new webhook
3. URL: `https://www.voxxyai.com/api/v1/webhooks/sendgrid`
4. Events: delivered, bounce, dropped, deferred, unsubscribe, spam
5. Activate webhook

---

### Production Deployment

#### Server Setup

**1. Install Redis:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**2. Configure Sidekiq Service:**

`/etc/systemd/system/sidekiq.service`:
```ini
[Unit]
Description=Sidekiq Background Jobs
After=syslog.target network.target

[Service]
Type=simple
WorkingDirectory=/var/www/voxxy-rails
ExecStart=/usr/local/bin/bundle exec sidekiq -e production -C config/sidekiq.yml
User=deploy
Group=deploy
UMask=0002

Restart=always
RestartSec=1

StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=sidekiq

[Install]
WantedBy=multi-user.target
```

**3. Start Sidekiq:**
```bash
sudo systemctl enable sidekiq
sudo systemctl start sidekiq
sudo systemctl status sidekiq
```

---

### Monitoring

#### Sidekiq Web UI

```ruby
# config/routes.rb
require 'sidekiq/web'

authenticate :user, ->(user) { user.admin? } do
  mount Sidekiq::Web => '/admin/sidekiq'
end
```

**Access:** `https://www.voxxyai.com/admin/sidekiq`

**Dashboard shows:**
- Jobs processed
- Queue sizes
- Failed jobs
- Retries
- Real-time stats

#### Logs

```bash
# Development
tail -f log/development.log | grep -E "(EmailSender|EmailDelivery)"

# Production
tail -f log/sidekiq.log
```

#### Database Queries

```ruby
# Check scheduled emails ready to send
ScheduledEmail.where(status: 'scheduled', scheduled_for: ..Time.current).count

# Check delivery success rate
EmailDelivery.group(:status).count

# Check pending retries
EmailDelivery.pending_retry.count

# Check failed jobs
Sidekiq::RetrySet.new.size
Sidekiq::DeadSet.new.size
```

---

## Monitoring & Troubleshooting

### Common Issues

#### Issue 1: Emails Not Sending

**Symptoms:**
- Scheduled emails remain status: 'scheduled'
- No emails being sent

**Diagnosis:**
```ruby
# Check if EmailSenderWorker is running
Sidekiq::Cron::Job.all.find { |j| j.name == 'email_sender_worker' }&.status
# Should return "enabled"

# Check if Sidekiq is running
ps aux | grep sidekiq

# Check scheduled emails
ScheduledEmail.where(status: 'scheduled', scheduled_for: ..Time.current)
```

**Solutions:**
1. **Sidekiq not running:**
   ```bash
   bundle exec sidekiq
   ```

2. **Cron job not loaded:**
   ```bash
   # Restart Sidekiq server to reload schedule
   sudo systemctl restart sidekiq
   ```

3. **Redis not running:**
   ```bash
   sudo systemctl start redis-server
   ```

4. **Manual trigger:**
   ```ruby
   # Rails console
   EmailSenderWorker.new.perform
   ```

---

#### Issue 2: Webhook Events Not Processing

**Symptoms:**
- Emails sent but delivery status stays 'sent'
- No 'delivered' or 'bounced' statuses

**Diagnosis:**
```ruby
# Check if webhook jobs are enqueued
Sidekiq::Queue.new('email_webhooks').size

# Check SendGrid webhook activity
# (Go to SendGrid dashboard → Event Webhook → Statistics)
```

**Solutions:**
1. **Webhook not configured:**
   - See `SENDGRID_WEBHOOK_SETUP.md`
   - Verify webhook URL is correct
   - Verify webhook is active

2. **Webhook URL incorrect:**
   - Should be: `https://www.voxxyai.com/api/v1/webhooks/sendgrid`
   - Test with SendGrid "Test Your Integration"

3. **Jobs failing:**
   ```ruby
   # Check failed jobs
   Sidekiq::RetrySet.new.each { |job| puts job.display_args }

   # Retry failed jobs
   Sidekiq::RetrySet.new.retry_all
   ```

---

#### Issue 3: Soft Bounces Not Retrying

**Symptoms:**
- Emails bounced (soft) but no retries scheduled
- `next_retry_at` is nil

**Diagnosis:**
```ruby
# Check soft bounces
EmailDelivery.where(bounce_type: 'soft')

# Check if retries exceeded
deliveries = EmailDelivery.where(bounce_type: 'soft')
deliveries.each { |d| puts "#{d.id}: retry_count=#{d.retry_count}, max=#{d.max_retries}" }
```

**Solutions:**
1. **Max retries exceeded:**
   - Email failed 3 times, won't retry again
   - Check `bounce_reason` to understand why

2. **Retry job not enqueued:**
   ```ruby
   # Manually trigger retry
   delivery = EmailDelivery.find(<id>)
   EmailRetryJob.perform_async(delivery.id)
   ```

3. **EmailRetryScannerJob not running:**
   ```ruby
   # Check cron job status
   Sidekiq::Cron::Job.all.find { |j| j.name == 'email_retry_scanner' }&.status

   # Manually run
   EmailRetryScannerJob.new.perform
   ```

---

#### Issue 4: SendGrid API Errors

**Symptoms:**
- Emails fail to send
- ScheduledEmail status: 'failed'
- Error: "SendGrid API error: 401 Unauthorized"

**Diagnosis:**
```ruby
# Check environment variable
ENV['VoxxyKeyAPI']
# Should return SendGrid API key

# Check ScheduledEmail errors
ScheduledEmail.where(status: 'failed').pluck(:error_message)
```

**Solutions:**
1. **Invalid API key:**
   - Verify SendGrid API key is correct
   - Regenerate key if needed

2. **API key not set:**
   ```bash
   # Set in environment
   export VoxxyKeyAPI=<your_key>

   # Or add to .env file
   echo "VoxxyKeyAPI=<your_key>" >> .env
   ```

3. **Rate limit exceeded:**
   - SendGrid has daily sending limits
   - Check SendGrid dashboard for usage

---

### Performance Monitoring

#### Email Send Performance

```ruby
# Average emails sent per day
EmailDelivery.where('sent_at > ?', 7.days.ago).group_by_day(:sent_at).count

# Average delivery time (sent → delivered)
deliveries = EmailDelivery.where.not(delivered_at: nil)
avg_delivery_time = deliveries.average('EXTRACT(EPOCH FROM (delivered_at - sent_at))')
# Returns seconds
```

#### Bounce Rate

```ruby
# Overall bounce rate
total = EmailDelivery.count
bounced = EmailDelivery.where(status: 'bounced').count
bounce_rate = (bounced.to_f / total * 100).round(2)
# Should be < 5%

# Hard bounce rate (permanent failures)
hard_bounces = EmailDelivery.where(bounce_type: 'hard').count
hard_bounce_rate = (hard_bounces.to_f / total * 100).round(2)
# Should be < 1%
```

#### Retry Success Rate

```ruby
# How many soft bounces eventually delivered?
soft_bounces = EmailDelivery.where(bounce_type: 'soft')
eventually_delivered = soft_bounces.where(status: 'delivered').count
retry_success_rate = (eventually_delivered.to_f / soft_bounces.count * 100).round(2)
# Target: > 50%
```

---

## Future Enhancements

### Phase 2 Features

**1. Email Open/Click Tracking**
- Enable SendGrid 'open' and 'click' webhook events
- Track email engagement metrics
- Dashboard showing open rates per email

**2. Advanced Email Editor (WYSIWYG)**
- TipTap rich text editor
- "Insert Field" dropdown buttons
- Visual preview with resolved variables
- Template library

**3. Email Performance Analytics**
- Per-email delivery rates
- Per-template success rates
- Best sending times analysis
- A/B testing support

**4. Real-Time Delivery Updates**
- Action Cable integration
- Live status updates in UI
- Push notifications for failures

---

### Phase 3 Features

**1. AI-Powered Features**
- Email content suggestions
- Optimal send time recommendations
- Subject line A/B testing
- Spam score checking

**2. Advanced Segmentation**
- Custom filter builder UI
- Saved recipient segments
- Tag-based filtering
- Vendor scoring

**3. Email Scheduling Improvements**
- Custom time zones per event
- Smart scheduling (avoid weekends)
- Send time optimization
- Batch send throttling

**4. Template Marketplace**
- Share templates between organizations
- Community templates
- Premium templates
- Template analytics

---

## Summary

### What We Built

**Database:**
- 4 new tables (templates, items, scheduled, deliveries)
- 2 updated tables (events, registrations)

**Background Jobs:**
- 4 Sidekiq workers
- 2 recurring cron jobs
- Webhook processing
- Automatic retries

**Services:**
- EmailSenderService (SendGrid integration)
- EmailScheduleCalculator (date calculations)
- RecipientFilterService (recipient filtering)
- EmailVariableResolver (variable substitution)
- ScheduledEmailGenerator (email generation)
- EmailCampaignTemplateCloner (template cloning)

**Controllers:**
- EmailCampaignTemplatesController
- EmailTemplateItemsController
- ScheduledEmailsController
- Webhooks::SendgridController

**Configuration:**
- Sidekiq-Cron schedule
- SendGrid webhook integration

---

### Why This Architecture?

**Separation of Concerns:**
- Templates (reusable blueprints)
- Scheduled Emails (event-specific instances)
- Background Jobs (async processing)
- Services (business logic)

**Benefits:**
- ✅ Scalable (handles 1000s of emails)
- ✅ Reliable (automatic retries)
- ✅ Performant (background processing)
- ✅ Flexible (fully customizable)
- ✅ Trackable (real-time delivery status)

**Trade-offs:**
- More complex than synchronous system
- Requires Redis
- Requires Sidekiq running
- Webhook dependency (but with backup scanner)

---

### Key Takeaways

1. **Sidekiq = Background Job Processing**
   - Keeps HTTP responses fast
   - Handles retries automatically
   - Scales efficiently

2. **Templates = Email Campaign Collections**
   - Up to 40 emails per template
   - Reusable across events
   - Fully customizable

3. **Webhooks = Real-Time Tracking**
   - SendGrid reports delivery status
   - Processed asynchronously
   - Enables automatic retries

4. **Soft Bounces = Temporary Failures**
   - Automatically retried (1hr, 4hr, 24hr)
   - Improves delivery rates
   - Reduces permanent failures

5. **Variables = Personalization**
   - `{{event_title}}`, `{{vendor_name}}`, etc.
   - Resolved per recipient
   - Makes emails feel personal

---

**For Future Reference:** When working on this system, always remember:
- Background jobs keep things fast
- Templates are collections, not single emails
- Webhooks update delivery status in real-time
- Soft bounces retry automatically
- Everything is trackable and monitorable

---

**Last Updated:** January 4, 2026
**Author:** Voxxy Platform Team
**Questions?** Refer to individual component documentation or check Sidekiq Web UI
