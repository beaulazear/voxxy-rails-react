# Voxxy Email System - Visual Diagrams

## 1. Email Data Model Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    Organization                                 │
│                                                                 │
│  ├─ has_many :email_campaign_templates                         │
│  └─ has_many :email_unsubscribes (org-level)                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              EmailCampaignTemplate                              │
│              (Template Container)                               │
│                                                                 │
│  Fields:                                                        │
│  - template_type: system or user                               │
│  - is_default: true/false                                      │
│  - name: "Pancake & Booze 30-Email Sequence"                   │
│  - email_count: 30 (counter cache)                             │
│                                                                 │
│  ├─ has_many :email_template_items (max 40)                   │
│  ├─ has_many :scheduled_emails                                │
│  └─ has_many :events (using this template)                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              EmailTemplateItem                                  │
│              (Individual Email Definition)                      │
│                                                                 │
│  Fields:                                                        │
│  - name: "Application Received"                                │
│  - category: "application_updates"                             │
│  - position: 1-40 (order in template)                          │
│  - trigger_type: "on_application_submit"                       │
│  - subject_template: "Your application to {{event_title}}"     │
│  - body_template: "<html>...</html>"                           │
│  - enabled_by_default: true                                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Event                                        │
│              (Email Campaign Container)                         │
│                                                                 │
│  - belongs_to :email_campaign_template                         │
│  - has_many :scheduled_emails                                  │
│  - has_many :email_deliveries                                  │
│  - has_many :email_unsubscribes (event-level)                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ├────────────────────────────┐
                            │                            │
                            ▼                            ▼
        ┌──────────────────────────────┐    ┌──────────────────────────────┐
        │     ScheduledEmail           │    │   EventInvitation            │
        │  (Email Instance for Event)  │    │  (Pre-invited Contacts)      │
        │                              │    │                              │
        │  - scheduled_for: datetime   │    │  - status: pending/sent      │
        │  - status: scheduled/sent    │    │  - invitation_url            │
        │  - filter_criteria: {...}    │    │  - sent_at, responded_at     │
        │  - recipient_count: N        │    │                              │
        │  - sent_at: datetime         │    │  belongs_to :vendor_contact  │
        │  - error_message             │    │  has_many :email_deliveries  │
        │                              │    │                              │
        │  belongs_to :email_template_ │    └──────────────────────────────┘
        │            item              │                 │
        │  has_many :email_deliveries  │                 │
        └──────────────────────────────┘                 │
                    │                                    │
                    ├────────────────────────────────────┤
                    │                                    │
                    ▼                                    ▼
        ┌──────────────────────────────┐    ┌──────────────────────────────┐
        │    Registration              │    │   EmailDelivery              │
        │  (Vendor Application)        │    │  (Delivery Tracking)         │
        │                              │    │                              │
        │  - email: string             │    │  - sendgrid_message_id (PK)  │
        │  - status: pending/approved  │    │  - recipient_email           │
        │  - email_unsubscribed: bool  │    │  - status: queued/delivered/ │
        │  - vendor_category: string   │    │           bounced/dropped    │
        │                              │    │  - bounce_type: hard/soft    │
        │  has_many :email_deliveries  │    │  - sent_at, delivered_at     │
        │                              │    │  - bounced_at, dropped_at    │
        └──────────────────────────────┘    │  - opened_at, clicked_at     │
                                            │  - retry_count: int          │
                                            │  - next_retry_at: datetime   │
                                            │                              │
                                            │  links to:                   │
                                            │  - scheduled_email           │
                                            │  - registration (or NULL)    │
                                            │  - event_invitation (or NULL)│
                                            └──────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                  EmailUnsubscribe                               │
│            (3-Tier Unsubscribe Management)                      │
│                                                                 │
│  - email: string (unique key)                                  │
│  - scope: "global" | "organization" | "event"                  │
│  - event_id: (if scope = "event")                              │
│  - organization_id: (if scope = "organization")                │
│  - unsubscribed_at: datetime                                   │
│  - unsubscribe_source: "user_action" | "sendgrid_webhook"     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Email Sending Flow (Scheduler + Workers)

```
┌─────────────────────────────────────────────────────────────────┐
│                   EmailSenderWorker                             │
│              (Cron: Every 5 minutes)                            │
│                                                                 │
│  1. Find ScheduledEmails with:                                 │
│     - status = 'scheduled'                                     │
│     - scheduled_for <= NOW()                                   │
│     - scheduled_for >= 7 days ago                              │
│                                                                 │
│  2. Route by category:                                         │
└─────────────────────────────────────────────────────────────────┘
        │                                           │
        ├─ "event_announcements" ─────────────────┤
        │                                           │
        ▼                                           ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│   InvitationReminderService      │  │   EmailSenderService             │
│                                  │  │                                  │
│  Recipients:                     │  │  Recipients:                     │
│  EventInvitations →              │  │  Registrations                   │
│  VendorContacts                  │  │  (vendors who applied)           │
│                                  │  │                                  │
│  Flow:                           │  │  Flow:                           │
│  1. Filter invitations           │  │  1. Filter registrations         │
│  2. Resolve variables            │  │  2. Resolve variables            │
│  3. Send via EventInvitation     │  │  3. Send via SendGrid            │
│     Mailer (SMTP)                │  │  4. Create EmailDelivery records │
│  4. Create EmailDelivery records │  │  5. Update ScheduledEmail status │
│  5. Update ScheduledEmail status │  │                                  │
└──────────────────────────────────┘  └──────────────────────────────────┘
        │                                           │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
          ┌───────────────────────────────┐
          │  ScheduledEmail Status        │
          │  Updated to: "sent"           │
          │  with recipient_count        │
          └───────────────────────────────┘
                          │
                          ▼
          ┌───────────────────────────────┐
          │  EmailDelivery Records        │
          │  Created for each recipient   │
          │  status = "queued"            │
          └───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SendGrid API                                 │
│              (Send emails to recipients)                        │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SendGrid Webhooks                              │
│          (Async event notifications)                            │
│                                                                 │
│  Events:                                                        │
│  - delivered:    Email successfully delivered                  │
│  - bounce:       Email bounced (hard or soft)                  │
│  - dropped:      Email dropped by SendGrid                     │
│  - deferred:     Temporary delivery failure                    │
│  - unsubscribe:  User clicked unsubscribe link                 │
│  - spamreport:   User marked as spam                           │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│            EmailDeliveryProcessorJob                            │
│         (Webhook Event Handler - Triggered)                     │
│                                                                 │
│  For each event:                                               │
│  1. Find EmailDelivery by sendgrid_message_id                  │
│  2. Handle event type:                                         │
│     - delivered → update status = "delivered"                  │
│     - bounce → determine type, schedule retry if soft          │
│     - dropped → update status = "dropped"                      │
│     - deferred → log only                                      │
│     - unsubscribe → create EmailUnsubscribe record             │
└─────────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
    ┌────────┐     ┌────────────┐    ┌──────────────┐
    │Delivered│     │Bounce(soft)│    │Unsubscribed  │
    │         │     │            │    │              │
    │Status:  │     │Status: bounced   │Status: unsub │
    │delivered│     │Type: soft        │Create record:│
    └────────┘     │                  │- EmailUnsubscr
                   │Schedule retry:    │ibe           │
                   │EmailRetryJob      └──────────────┘
                   │  (exponential backoff)
                   │  1h → 4h → 24h
                   └────────────────┘
                           │
                           ▼
                   ┌───────────────────┐
                   │  EmailRetryJob    │
                   │ (Scheduled retry) │
                   │                   │
                   │ Calls:            │
                   │ EmailSenderService│
                   │ .retry_delivery   │
                   └───────────────────┘
```

---

## 3. Event Creation to Email Sending Timeline

```
STEP 1: Event Created
┌─────────────────────────────────┐
│ Event.create(...)               │
│ - event_date: Future            │
│ - application_deadline: Future  │
│ - organization assigned         │
└─────────────────────────────────┘
        │
        │ after_create callback
        ▼
┌─────────────────────────────────┐
│ assign_email_template_and_       │
│ generate_emails                 │
│                                 │
│ 1. Assign default template      │
│ 2. Call ScheduledEmailGenerator │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ ScheduledEmailGenerator         │
│                                 │
│ For each enabled EmailTemplate  │
│ Item:                           │
│ 1. Calculate schedule time      │
│ 2. Skip callback-triggered      │
│ 3. Create ScheduledEmail record │
│ 4. Status = "scheduled"         │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│         Database: ScheduledEmail Records            │
│                                                     │
│  Email 1: "30 Days Before Event"                   │
│  - scheduled_for: NOW - 30 days                    │
│  - status: "scheduled"                             │
│                                                     │
│  Email 2: "7 Days Before Event"                    │
│  - scheduled_for: NOW - 7 days                     │
│  - status: "scheduled"                             │
│                                                     │
│  Email 3: "1 Day Before Event"                     │
│  - scheduled_for: NOW - 1 day                      │
│  - status: "scheduled"                             │
│  ...                                               │
└─────────────────────────────────────────────────────┘
        │
        ▼
        (Time passes...)
        │
        ▼
STEP 2: EmailSenderWorker Runs (every 5 mins)
┌─────────────────────────────────────────────────────┐
│ EmailSenderWorker.perform                           │
│                                                     │
│ SELECT FROM scheduled_emails WHERE                 │
│   status = 'scheduled' AND                         │
│   scheduled_for <= NOW() AND                       │
│   scheduled_for >= 7 days ago                      │
│                                                     │
│ Returns:                                           │
│ - Email 1 (time to send!)                         │
│ - Email 2                                          │
│ - Email 3                                          │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ For each ready email:                               │
│                                                     │
│ 1. Get recipients                                  │
│    - event_announcements → EventInvitations        │
│    - others → Registrations                        │
│                                                     │
│ 2. Filter by criteria                              │
│    - status, category, exclude_status              │
│                                                     │
│ 3. For each recipient:                             │
│    - Resolve variables ({{name}}, {{date}}, etc)   │
│    - Send via SendGrid                             │
│    - Create EmailDelivery record (status: queued)  │
│                                                     │
│ 4. Update ScheduledEmail:                          │
│    - status = "sent"                               │
│    - sent_at = NOW()                               │
│    - recipient_count = N                           │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│   SendGrid Processes & Delivers Emails              │
│                                                     │
│   Status changes over time:                        │
│   queued → sent → delivered → [opened] → [clicked] │
│   or                                               │
│   queued → bounced/dropped → [retry] → delivered   │
└─────────────────────────────────────────────────────┘
        │
        ▼
STEP 3: Webhooks Update Delivery Status
┌─────────────────────────────────────────────────────┐
│ SendGrid sends webhook events to:                   │
│ POST /api/v1/webhooks/sendgrid                      │
│                                                     │
│ Payload example:                                   │
│ {                                                  │
│   "event": "delivered",                            │
│   "sg_message_id": "abc123xyz...",                 │
│   "email": "vendor@example.com",                   │
│   "timestamp": 1234567890,                         │
│   "unique_args": {                                 │
│     "event_id": "42",                              │
│     "scheduled_email_id": "99"                     │
│   }                                                │
│ }                                                  │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ EmailDeliveryProcessorJob (async worker)            │
│                                                     │
│ 1. Find EmailDelivery by sendgrid_message_id       │
│ 2. Handle event:                                   │
│    - delivered: status = "delivered"               │
│    - bounce: check type, schedule retry if soft    │
│    - dropped: status = "dropped"                   │
│    - unsubscribe: create EmailUnsubscribe record   │
│                                                     │
│ 3. Update EmailDelivery record in database        │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ Final State: ScheduledEmail & EmailDeliveries       │
│                                                     │
│ ScheduledEmail:                                    │
│ - status: "sent"                                   │
│ - recipient_count: 125                             │
│ - sent_at: 2026-02-15 10:30:00                     │
│                                                    │
│ EmailDelivery records (125 total):                 │
│ - 120 status: "delivered"                          │
│ - 3 status: "bounced" (soft, scheduled for retry)  │
│ - 1 status: "dropped"                              │
│ - 1 status: "unsubscribed"                         │
│                                                    │
│ ScheduledEmail#delivery_rate = 96% (120/125)      │
└─────────────────────────────────────────────────────┘
```

---

## 4. Two Email Routing Paths

```
EmailSenderWorker decides route based on email_template_item.category:

SCENARIO A: category = "event_announcements"
┌──────────────────────────────────┐
│ InvitationReminderService        │
│ (sends to EventInvitations)       │
│                                  │
│ Recipients:                      │
│ EventInvitation.all              │
│  -> filter_invitation_recipients │
│  -> vendor_contact.email         │
│                                  │
│ Example: "Application Deadline   │
│ Reminder - 3 Days Away"          │
│                                  │
│ Sent via: EventInvitationMailer  │
└──────────────────────────────────┘


SCENARIO B: category = "payment_reminders", etc.
┌──────────────────────────────────┐
│ EmailSenderService               │
│ (sends to Registrations)         │
│                                  │
│ Recipients:                      │
│ Event.registrations.all          │
│  -> apply filters (status, etc)  │
│  -> registration.email           │
│                                  │
│ Example: "Payment Due in 7 Days" │
│                                  │
│ Sent via: ApplicationMailer      │
└──────────────────────────────────┘
```

---

## 5. Unsubscribe Management (3-Tier System)

```
┌──────────────────────────────────────────────────────────┐
│                   EmailUnsubscribe                       │
│                                                          │
│  scope: [ "global" | "organization" | "event" ]        │
└──────────────────────────────────────────────────────────┘
        │
        ├─────────────────┬──────────────────┬──────────────────┐
        ▼                 ▼                  ▼                  ▼
┌──────────────────┐┌──────────────────┐┌──────────────────┐┌──────────────────┐
│     GLOBAL       ││  ORGANIZATION    ││      EVENT       ││   REGISTRATION   │
│  Unsubscribe    ││  Unsubscribe     ││  Unsubscribe    ││  (Legacy)         │
│                 ││                  ││                 ││                   │
│ effect: User    ││ effect: User     ││ effect: User    ││ effect: User      │
│ gets NO emails  ││ gets NO emails   ││ gets NO emails  ││ doesn't receive   │
│ from ANYONE     ││ from this org    ││ from this event ││ emails for THIS   │
│                 ││ (any event)      ││ ONLY            ││ event ONLY        │
│                 ││                  ││                 ││                   │
│ Created by:     ││ Created by:      ││ Created by:     ││ Created by:       │
│ - User unsubscr││ - Admin action   ││ - User unsubscr││ - Admin/API       │
│   link          ││ - SendGrid webh  ││   link          ││ - Registration    │
│ - SendGrid      ││   ook           ││ - User event     ││   preference      │
│   webhook       ││                  ││   preference    ││                   │
│                 ││                  ││                 ││                   │
│ example:        ││ example:         ││ example:        ││ example:          │
│ jane@email.com  ││ jane@email.com   ││ jane@email.com  ││ jane@email.com    │
│ unsubscribed    ││ unsubscribed     ││ unsubscribed    ││ registration.     │
│ from everything ││ from VenueXYZ    ││ from "Summer    ││ email_unsubscri   │
│                 ││                  ││ Market 2026"    ││ bed: true          │
└──────────────────┘└──────────────────┘└──────────────────┘└──────────────────┘


Lookup Query (Check if user should receive email):
┌─────────────────────────────────────────────────────────┐
│ EmailUnsubscribe.unsubscribed_from_event?(email, event) │
│                                                         │
│ Returns TRUE if:                                        │
│ - scope='global' AND email matches, OR                 │
│ - scope='organization' AND org_id matches, OR          │
│ - scope='event' AND event_id matches                   │
│                                                         │
│ Otherwise returns FALSE (can send)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Database Schema Hierarchy

```
organizations (1)
    │
    ├─ email_campaign_templates (many)
    │   └─ email_template_items (many, max 40 per template)
    │
    ├─ events (many)
    │   ├─ belongs_to email_campaign_template
    │   │
    │   ├─ scheduled_emails (many)
    │   │   └─ belongs_to email_template_item
    │   │       └─ email_deliveries (many)
    │   │
    │   ├─ registrations (many)
    │   │   └─ email_deliveries (many)
    │   │
    │   ├─ event_invitations (many)
    │   │   └─ email_deliveries (many)
    │   │
    │   └─ email_unsubscribes (many, scope='event')
    │
    └─ email_unsubscribes (many, scope='organization')


Key Constraints:
- EmailDelivery must have either:
  - scheduled_email_id (for scheduled emails), OR
  - event_invitation_id (for invitations)
  - NOT both registration_id AND event_invitation_id together

- ScheduledEmail must have:
  - email_template_item (with category)
  - scheduled_for datetime
```

---

## 7. Bounce & Retry Flow

```
EMAIL BOUNCES
        │
        ▼
┌──────────────────────────────┐
│ EmailDeliveryProcessorJob    │
│ receives "bounce" event      │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Determine Bounce Type:       │
│                              │
│ HARD BOUNCE?                 │
│ (invalid email,              │
│  domain doesn't exist)       │
│ → status = "bounced"         │
│ → NO RETRY                   │
│                              │
│ SOFT BOUNCE?                 │
│ (mailbox full,               │
│  server down, etc)           │
│ → status = "bounced"         │
│ → bounce_type = "soft"       │
│ → SCHEDULE RETRY             │
└──────────────────────────────┘
        │
        ├─────────────────┬─────────────────┐
        │ (hard)          │ (soft)          │
        ▼                 ▼                 ▼
    NO RETRY         RETRY 1          RETRY 2          RETRY 3
                     (1 hour)         (4 hours)        (24 hours)
                         │                 │                │
                         ▼                 ▼                ▼
                  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
                  │EmailRetry   │  │EmailRetry   │  │EmailRetry   │
                  │Job 1        │  │Job 2        │  │Job 3        │
                  └─────────────┘  └─────────────┘  └─────────────┘
                         │                 │                │
                         ▼                 ▼                ▼
                    [Success?]         [Success?]     [Success?]
                      /  \              /  \             /  \
                     Y    N            Y    N           Y    N
                    /      \          /      \         /      \
                [Done]  [Retry 2]  [Done]  [Retry 3] [Done]  [Fail]
                                                              │
                                                              ▼
                                                       ┌──────────────┐
                                                       │ Mark as      │
                                                       │ "dropped"    │
                                                       │ (permanent)  │
                                                       └──────────────┘
```

