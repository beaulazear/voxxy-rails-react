# 📧 Email Automation System - Complete Documentation

**Last Updated:** January 7, 2026
**System Version:** v2.0 (Simplified 7-Email Template)
**Platform:** Rails 7.2.2 + React 18.3.1

---

## 📑 Table of Contents

1. [Overview & Quick Start](#overview--quick-start)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Components](#backend-components)
5. [Frontend Components](#frontend-components)
6. [Default Email Template](#default-email-template)
7. [Key Workflows](#key-workflows)
8. [Recent Changes](#recent-changes)
9. [Developer Reference](#developer-reference)

---

## 🎯 Overview & Quick Start

### What This System Does

The Email Automation System enables event producers to automatically send a sequence of emails to vendors throughout the event lifecycle. It provides:

- **7 pre-configured automated emails** (event announcements, payment reminders, event countdown)
- **Customizable email templates** per organization
- **SendGrid integration** for delivery and tracking
- **Webhook-based delivery status** (delivered, bounced, dropped, etc.)
- **React UI** for email management and previewing
- **Sidekiq background jobs** for automated sending

### Current State

- **Default Template:** 7 emails in 3 categories
- **Trigger Types:** Time-based (days before/after event) and callback-based (on approval, etc.)
- **Invitations:** Separate system, displayed as virtual email in UI
- **Status Tracking:** Scheduled → Sent → Delivered/Bounced/Dropped

### Quick Component Reference

| Component | Type | Location | Purpose |
|-----------|------|----------|---------|
| EmailCampaignTemplate | Model | `app/models/email_campaign_template.rb` | Email template collections |
| EmailTemplateItem | Model | `app/models/email_template_item.rb` | Individual emails in template |
| ScheduledEmail | Model | `app/models/scheduled_email.rb` | Event-specific email instances |
| EmailDelivery | Model | `app/models/email_delivery.rb` | Per-recipient delivery tracking |
| ScheduledEmailGenerator | Service | `app/services/scheduled_email_generator.rb` | Creates scheduled emails from template |
| EmailScheduleCalculator | Service | `app/services/email_schedule_calculator.rb` | Calculates send times |
| EmailSenderService | Service | `app/services/email_sender_service.rb` | Sends emails via SendGrid |
| EmailSenderWorker | Job | `app/workers/email_sender_worker.rb` | Background email sending (every 5 min) |
| EmailAutomationTab | Component | `src/components/producer/Email/EmailAutomationTab.tsx` | Main email UI |

---

## 🏗 Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         EVENT CREATION                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Event.after_create → assign_email_template_and_generate_emails │
│  1. Find default template (organization or system)              │
│  2. Assign to event.email_campaign_template_id                  │
│  3. Call ScheduledEmailGenerator.generate()                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SCHEDULED EMAIL GENERATION                         │
│  ScheduledEmailGenerator:                                       │
│  1. Loop through email_template_items (7 emails)                │
│  2. Calculate scheduled_for time (EmailScheduleCalculator)      │
│  3. Check for duplicates (event + template_item)                │
│  4. Create ScheduledEmail records                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AUTOMATED SENDING                             │
│  EmailSenderWorker (Sidekiq, every 5 minutes):                  │
│  1. Query ScheduledEmail.where(status='scheduled', ready)       │
│  2. For each → EmailSenderService.send_to_recipients            │
│  3. Filter recipients by filter_criteria                        │
│  4. Resolve variables ([eventName], [firstName], etc.)          │
│  5. Send via SendGrid API                                       │
│  6. Create EmailDelivery record per recipient                   │
│  7. Update ScheduledEmail.status = 'sent'                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DELIVERY TRACKING                             │
│  SendGrid Webhook → EmailDeliveryProcessorJob:                  │
│  1. Find EmailDelivery by sendgrid_message_id                   │
│  2. Update status: delivered, bounced, dropped, unsubscribed    │
│  3. For soft bounces: schedule retry with backoff               │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack Integration

- **Rails Backend:** Models, Services, Controllers, Background Jobs
- **PostgreSQL:** JSONB for filter_criteria, GIN indexes
- **SendGrid:** Email delivery, webhook events
- **Sidekiq:** Background job processing (email sending, webhooks)
- **React Frontend:** Email management UI, preview, stats
- **TypeScript:** Type-safe API client and components

---

## 💾 Database Schema

### Table Relationships

```
┌──────────────────────┐
│   organizations      │
│  ─────────────────── │
│  id                  │
└──────┬───────────────┘
       │
       │ has_many
       ▼
┌──────────────────────────────┐       ┌────────────────────┐
│  email_campaign_templates    │       │      events        │
│  ──────────────────────────  │       │  ────────────────  │
│  id                          │◄──────┤  email_campaign_   │
│  organization_id (nullable)  │ FK    │  template_id       │
│  template_type (system/user) │       └────────┬───────────┘
│  name                        │                │
│  is_default                  │                │ has_many
│  email_count (counter)       │                ▼
└──────┬───────────────────────┘       ┌────────────────────┐
       │                               │  scheduled_emails  │
       │ has_many                      │  ────────────────  │
       ▼                               │  id                │
┌──────────────────────────┐           │  event_id          │
│  email_template_items    │───────────┤  email_template_   │
│  ──────────────────────  │ FK        │  item_id           │
│  id                      │           │  name              │
│  email_campaign_         │           │  subject_template  │
│  template_id             │           │  body_template     │
│  name                    │           │  trigger_type      │
│  category                │           │  scheduled_for     │
│  position (1-40)         │           │  status            │
│  subject_template        │           │  sent_at           │
│  body_template           │           │  recipient_count   │
│  trigger_type            │           └────────┬───────────┘
│  trigger_value           │                    │
│  trigger_time            │                    │ has_many
│  filter_criteria (jsonb) │                    ▼
│  enabled_by_default      │           ┌────────────────────┐
└──────────────────────────┘           │  email_deliveries  │
                                       │  ────────────────  │
                                       │  id                │
                                       │  scheduled_email_id│
                                       │  registration_id   │
                                       │  sendgrid_         │
                                       │  message_id        │
                                       │  recipient_email   │
                                       │  status            │
                                       │  bounce_type       │
                                       │  sent_at           │
                                       │  delivered_at      │
                                       │  bounced_at        │
                                       │  retry_count       │
                                       └────────────────────┘
```

### 1. email_campaign_templates

**Migration:** `db/migrate/20260102142051_create_email_campaign_templates.rb`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | bigint | PK | Primary key |
| template_type | string | NOT NULL, in ['system', 'user'] | Template ownership |
| organization_id | bigint | FK (nullable) | NULL for system templates |
| name | string | NOT NULL, unique per org | Template name |
| description | text | | Template purpose |
| is_default | boolean | default: false | Default for org/system |
| email_count | integer | default: 0 | Counter cache |
| events_count | integer | default: 0 | Counter cache |
| created_at | datetime | | |
| updated_at | datetime | | |

**Indexes:**
- `[organization_id, name]` - UNIQUE
- `[template_type, is_default]` - for default lookup

**Constraints:**
- Only ONE system default template allowed (validated in model)

---

### 2. email_template_items

**Migration:** `db/migrate/20260102142157_create_email_template_items.rb`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | bigint | PK | Primary key |
| email_campaign_template_id | bigint | FK, NOT NULL | Which template |
| name | string | NOT NULL | Email name |
| description | text | | What this email is for |
| category | string | | event_announcements, payment_reminders, etc. |
| position | integer | 1-40, NOT NULL | Order in template |
| subject_template | string | NOT NULL | Subject with variables |
| body_template | text | NOT NULL | HTML with variables |
| trigger_type | string | NOT NULL | When to send |
| trigger_value | integer | | Days offset |
| trigger_time | time | | Time of day (HH:MM) |
| filter_criteria | jsonb | default: {} | Recipient filtering |
| enabled_by_default | boolean | default: true | Auto-create for events |
| created_at | datetime | | |
| updated_at | datetime | | |

**Indexes:**
- `[email_campaign_template_id, position]`
- `category`
- `filter_criteria` (GIN index for JSONB queries)

**Check Constraints:**
- `position BETWEEN 1 AND 40`

**Trigger Types:**
- `days_before_event` - X days before event_date
- `days_after_event` - X days after event_date
- `days_before_deadline` - X days before application_deadline
- `on_event_date` - On event_date at trigger_time
- `on_application_open` - When event created
- `on_application_submit` - Callback (when vendor applies)
- `on_approval` - Callback (when vendor approved)
- `days_before_payment_deadline` - X days before payment deadline
- `on_payment_deadline` - On payment deadline

---

### 3. scheduled_emails

**Migration:** `db/migrate/20260102143004_create_scheduled_emails.rb`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | bigint | PK | Primary key |
| event_id | bigint | FK, NOT NULL | Which event |
| email_campaign_template_id | bigint | FK (nullable) | Original template |
| email_template_item_id | bigint | FK (nullable) | Original item |
| name | string | NOT NULL | Email name (editable) |
| subject_template | string | NOT NULL | Subject (editable) |
| body_template | text | NOT NULL | HTML body (editable) |
| trigger_type | string | | Can override template |
| trigger_value | integer | | Can override template |
| trigger_time | time | | Can override template |
| scheduled_for | datetime | NOT NULL | **UTC** - when to send |
| filter_criteria | jsonb | default: {} | Recipient filters |
| status | string | NOT NULL | scheduled/paused/sent/failed/cancelled |
| sent_at | datetime | | When sent |
| recipient_count | integer | default: 0 | How many recipients |
| error_message | text | | If status='failed' |
| created_at | datetime | | |
| updated_at | datetime | | |

**Indexes:**
- `[event_id, status]` - query by event
- `[status, scheduled_for]` - for background jobs
- `filter_criteria` (GIN index)

**Status Values:**
- `scheduled` - Ready to send at scheduled_for
- `paused` - Temporarily disabled
- `sent` - Successfully sent
- `failed` - Send failed (see error_message)
- `cancelled` - Manually cancelled

---

### 4. email_deliveries

**Migration:** `db/migrate/20260102143716_create_email_deliveries.rb`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | bigint | PK | Primary key |
| scheduled_email_id | bigint | FK, NOT NULL | Which email |
| event_id | bigint | FK, NOT NULL | Which event |
| registration_id | bigint | FK, NOT NULL | Which vendor |
| sendgrid_message_id | string | UNIQUE, NOT NULL | From SendGrid |
| recipient_email | string | NOT NULL | Email sent to |
| status | string | NOT NULL | queued/sent/delivered/bounced/dropped/unsubscribed |
| bounce_type | string | | soft or hard |
| bounce_reason | text | | From webhook |
| drop_reason | text | | From webhook |
| sent_at | datetime | | From webhook |
| delivered_at | datetime | | From webhook |
| bounced_at | datetime | | From webhook |
| dropped_at | datetime | | From webhook |
| unsubscribed_at | datetime | | From webhook |
| retry_count | integer | default: 0 | Soft bounce retries |
| next_retry_at | datetime | | When to retry |
| max_retries | integer | default: 3 | Max retry attempts |
| created_at | datetime | | |
| updated_at | datetime | | |

**Indexes:**
- `sendgrid_message_id` - UNIQUE (webhook lookups)
- `[event_id, status]`
- `[registration_id, status]`
- `next_retry_at` - for retry jobs

**Delivery Status Flow:**
```
queued → sent → delivered ✅
              ↓
              bounced (soft) → retry → delivered ✅
              ↓                      ↓
              bounced (hard) ❌      bounced (hard) ❌
              ↓
              dropped ❌
```

---

## 🔧 Backend Components

### Models

#### 1. EmailCampaignTemplate

**File:** `app/models/email_campaign_template.rb`

```ruby
class EmailCampaignTemplate < ApplicationRecord
  # Associations
  belongs_to :organization, optional: true  # NULL for system templates
  has_many :email_template_items, dependent: :destroy
  has_many :events
  has_many :scheduled_emails

  # Validations
  validates :name, presence: true, uniqueness: { scope: :organization_id }
  validates :template_type, presence: true, inclusion: { in: %w[system user] }
  validate :only_one_system_default

  # Scopes
  scope :system_templates, -> { where(template_type: 'system') }
  scope :user_templates, -> { where(template_type: 'user') }
  scope :defaults, -> { where(is_default: true) }
  scope :for_organization, ->(org_id) { where(organization_id: org_id) }

  # Class methods
  def self.default_template
    find_by(template_type: 'system', is_default: true)
  end
end
```

**Key Methods:**
- `default_template` - Gets the one system default template
- `only_one_system_default` - Custom validator ensuring uniqueness

---

#### 2. EmailTemplateItem

**File:** `app/models/email_template_item.rb`

```ruby
class EmailTemplateItem < ApplicationRecord
  belongs_to :email_campaign_template, counter_cache: :email_count

  validates :name, presence: true
  validates :subject_template, presence: true
  validates :body_template, presence: true
  validates :trigger_type, presence: true, inclusion: { in: TRIGGER_TYPES }
  validates :position, numericality: { greater_than: 0, less_than_or_equal_to: 40 }

  scope :enabled, -> { where(enabled_by_default: true) }
  scope :by_position, -> { order(:position) }
  scope :by_category, ->(category) { where(category: category) }
end
```

**Constants:**
```ruby
TRIGGER_TYPES = %w[
  days_before_event
  days_after_event
  days_before_deadline
  on_event_date
  on_application_open
  on_application_submit
  on_approval
  days_before_payment_deadline
  on_payment_deadline
].freeze
```

---

#### 3. ScheduledEmail

**File:** `app/models/scheduled_email.rb`

```ruby
class ScheduledEmail < ApplicationRecord
  belongs_to :event
  belongs_to :email_campaign_template, optional: true
  belongs_to :email_template_item, optional: true
  has_many :email_deliveries, dependent: :destroy
  has_one :latest_delivery, -> { order(created_at: :desc) },
          class_name: "EmailDelivery"

  validates :name, presence: true
  validates :status, presence: true,
            inclusion: { in: %w[scheduled paused sent failed cancelled] }

  scope :scheduled, -> { where(status: 'scheduled') }
  scope :paused, -> { where(status: 'paused') }
  scope :sent, -> { where(status: 'sent') }
  scope :pending, -> { scheduled.where('scheduled_for <= ?', Time.current) }
  scope :upcoming, -> { scheduled.where('scheduled_for > ?', Time.current) }
  scope :by_schedule, -> { order(:scheduled_for) }

  # Computed fields for UI
  def delivery_status
    latest_delivery&.status || "pending"
  end

  def editable?
    status != "sent"
  end

  def sendable?
    status == "scheduled" && scheduled_for && scheduled_for <= Time.current
  end
end
```

**Key Methods:**
- `recipient_count` - Dynamically counts recipients based on filter_criteria
- `delivery_status` - Returns latest delivery status or "pending"
- `editable?` - Can this email be edited? (not if sent)
- `sendable?` - Can this email be sent now?

---

#### 4. EmailDelivery

**File:** `app/models/email_delivery.rb`

```ruby
class EmailDelivery < ApplicationRecord
  belongs_to :scheduled_email
  belongs_to :event
  belongs_to :registration

  enum status: {
    queued: "queued",
    sent: "sent",
    delivered: "delivered",
    bounced: "bounced",
    dropped: "dropped",
    unsubscribed: "unsubscribed"
  }

  validates :sendgrid_message_id, presence: true, uniqueness: true
  validates :recipient_email, presence: true

  scope :failed, -> { where(status: [:bounced, :dropped]) }
  scope :pending_retry, -> { where.not(next_retry_at: nil).where('next_retry_at <= ?', Time.current) }
  scope :soft_bounces, -> { where(status: 'bounced', bounce_type: 'soft') }
  scope :successful, -> { where(status: 'delivered') }

  def failed?
    bounced? || dropped?
  end

  def retryable?
    bounce_type == "soft" && retry_count < max_retries
  end
end
```

---

#### 5. Event Model (Email-Related)

**File:** `app/models/event.rb` (Lines 10-13, 23, 77-117)

```ruby
class Event < ApplicationRecord
  # Email automation associations
  belongs_to :email_campaign_template, optional: true
  has_many :scheduled_emails, dependent: :destroy
  has_many :email_deliveries, through: :scheduled_emails

  # Callback
  after_create :assign_email_template_and_generate_emails

  private

  def assign_email_template_and_generate_emails
    # Skip if email_campaign_template already assigned
    return if email_campaign_template.present?

    # Try to find organization's default template first
    template = organization.email_campaign_templates.find_by(is_default: true) if organization

    # Fallback to system default template
    template ||= EmailCampaignTemplate.default_template

    # If no template found, skip email generation gracefully
    return unless template

    # Assign the template
    update_column(:email_campaign_template_id, template.id)

    # Generate scheduled emails
    generate_scheduled_emails
  rescue => e
    # Log error but don't fail event creation
    Rails.logger.error("Failed to generate scheduled emails for event #{id}: #{e.message}")
  end

  def generate_scheduled_emails
    return unless email_campaign_template

    generator = ScheduledEmailGenerator.new(self)
    emails = generator.generate

    Rails.logger.info("Generated #{emails.count} scheduled emails for event #{id}")

    # Log any errors from generation
    generator.errors.each do |error|
      Rails.logger.warn("Email generation warning for event #{id}: #{error}")
    end

    emails
  rescue => e
    Rails.logger.error("Failed to generate scheduled emails for event #{id}: #{e.message}")
    []
  end
end
```

---

### Services

#### 1. ScheduledEmailGenerator

**File:** `app/services/scheduled_email_generator.rb`

**Purpose:** Create ScheduledEmail instances from event's template

```ruby
class ScheduledEmailGenerator
  attr_reader :event, :template, :errors

  def initialize(event)
    @event = event
    @template = event.email_campaign_template
    @errors = []
  end

  def generate
    return [] unless template

    scheduled_emails = []
    calculator = EmailScheduleCalculator.new(event)

    # Get all enabled email template items, ordered by position
    template.email_template_items.enabled.by_position.each do |item|
      # Calculate scheduled time
      scheduled_time = calculator.calculate(item)

      # Skip if no scheduled time (callback-triggered emails)
      next unless scheduled_time

      # Skip if scheduled time is in the past (event created late)
      if scheduled_time < Time.current
        @errors << "Skipped '#{item.name}' - scheduled time (#{scheduled_time}) is in the past"
        next
      end

      # ✨ NEW: Check if scheduled email already exists for this event + template item
      existing = ScheduledEmail.find_by(
        event: event,
        email_template_item: item
      )

      if existing
        @errors << "Skipped '#{item.name}' - already exists (ID: #{existing.id})"
        scheduled_emails << existing
        next
      end

      # Create scheduled email
      scheduled_email = create_scheduled_email(item, scheduled_time)

      if scheduled_email.persisted?
        scheduled_emails << scheduled_email
      else
        @errors << "Failed to create '#{item.name}': #{scheduled_email.errors.full_messages.join(', ')}"
      end
    end

    scheduled_emails
  end

  def generate_selective(options = {})
    # Same as generate but with optional filters:
    #   category: "event_announcements"
    #   positions: [1, 2, 3]
  end

  def regenerate
    # Delete all scheduled (not sent) emails, then generate
    event.scheduled_emails.where(status: "scheduled").destroy_all
    generate
  end

  def update_scheduled_times
    # Recalculate scheduled_for for all scheduled emails
    # Useful when event dates change
  end

  private

  def create_scheduled_email(email_template_item, scheduled_time)
    ScheduledEmail.create(
      event: event,
      email_campaign_template: template,
      email_template_item: email_template_item,
      name: email_template_item.name,
      subject_template: email_template_item.subject_template,
      body_template: email_template_item.body_template,
      trigger_type: email_template_item.trigger_type,
      scheduled_for: scheduled_time,
      filter_criteria: email_template_item.filter_criteria,
      status: "scheduled"
    )
  end
end
```

**Key Features:**
- **Duplicate Detection (Lines 45-55):** Checks if email already exists before creating
- **Error Tracking:** Collects all warnings/errors in `@errors` array
- **Past Date Handling:** Skips emails that would have been sent in the past

---

#### 2. EmailScheduleCalculator

**File:** `app/services/email_schedule_calculator.rb`

**Purpose:** Calculate when each email should be sent

```ruby
class EmailScheduleCalculator
  attr_reader :event

  def initialize(event)
    @event = event
  end

  def calculate(email_template_item)
    trigger_type = email_template_item.trigger_type
    trigger_value = email_template_item.trigger_value || 0
    trigger_time = email_template_item.trigger_time || "09:00"

    case trigger_type
    when "days_before_event"
      calculate_days_before_event(trigger_value, trigger_time)
    when "days_after_event"
      calculate_days_after_event(trigger_value, trigger_time)
    when "days_before_deadline"
      calculate_days_before_deadline(trigger_value, trigger_time)
    when "on_event_date"
      calculate_on_event_date(trigger_time)
    when "on_application_open"
      calculate_on_application_open(trigger_value, trigger_time)
    when "days_before_payment_deadline"
      # Uses application_deadline as proxy for payment deadline
      calculate_days_before_deadline(trigger_value, trigger_time)
    when "on_payment_deadline"
      # Uses application_deadline as proxy for payment deadline
      calculate_days_before_deadline(0, trigger_time)
    when "on_application_submit", "on_approval"
      # These are triggered by callbacks, not scheduled in advance
      nil
    else
      nil
    end
  end

  private

  def calculate_days_before_event(days, time)
    return nil unless event.event_date
    scheduled_date = event.event_date - days.days
    combine_date_and_time(scheduled_date, time)
  end

  def calculate_days_after_event(days, time)
    return nil unless event.event_date
    scheduled_date = event.event_date + days.days
    combine_date_and_time(scheduled_date, time)
  end

  def calculate_days_before_deadline(days, time)
    return nil unless event.application_deadline
    scheduled_date = event.application_deadline - days.days
    combine_date_and_time(scheduled_date, time)
  end

  def combine_date_and_time(date, time_input)
    # Handles both string ("09:00") and Time objects
    # Returns DateTime in UTC timezone
    if time_input.is_a?(Time) || time_input.is_a?(ActiveSupport::TimeWithZone)
      hour = time_input.hour
      minute = time_input.min
    else
      hour, minute = time_input.to_s.split(":").map(&:to_i)
    end

    Time.use_zone("UTC") do
      Time.zone.local(date.year, date.month, date.day, hour, minute, 0)
    end
  end
end
```

**Calculation Examples:**

| Trigger Type | Event Date | Deadline | Result |
|-------------|-----------|----------|--------|
| `days_before_event: 1` | Jan 10 | - | Jan 9 at trigger_time |
| `days_after_event: 1` | Jan 10 | - | Jan 11 at trigger_time |
| `days_before_deadline: 1` | - | Jan 8 | Jan 7 at trigger_time |
| `on_event_date` | Jan 10 | - | Jan 10 at trigger_time |
| `on_application_open` | - | - | event.created_at at trigger_time |

---

#### 3. EmailSenderService

**File:** `app/services/email_sender_service.rb`

**Purpose:** Send emails via SendGrid with delivery tracking

```ruby
class EmailSenderService
  def initialize(scheduled_email)
    @scheduled_email = scheduled_email
    @event = scheduled_email.event
    @organization = event.organization
  end

  def send_to_recipients
    # 1. Filter recipients using RecipientFilterService
    recipients = RecipientFilterService.new(@event, @scheduled_email.filter_criteria).call

    sent_count = 0
    failed_count = 0

    # 2. Send to each registration
    recipients.each do |registration|
      begin
        send_to_registration(registration)
        sent_count += 1
      rescue => e
        Rails.logger.error("Failed to send to #{registration.vendor_email}: #{e.message}")
        failed_count += 1
      end
    end

    # 3. Update scheduled_email status
    @scheduled_email.update(
      status: "sent",
      sent_at: Time.current,
      recipient_count: sent_count
    )

    { sent: sent_count, failed: failed_count }
  end

  def send_to_registration(registration)
    # Skip if unsubscribed
    return if registration.email_unsubscribed

    # Resolve variables
    resolver = EmailVariableResolver.new(@event, registration)
    subject = resolver.resolve(@scheduled_email.subject_template)
    body = resolver.resolve(@scheduled_email.body_template)

    # Send via SendGrid
    response = send_via_sendgrid(
      to_email: registration.vendor_email,
      to_name: registration.vendor_name,
      subject: subject,
      body: body,
      scheduled_email_id: @scheduled_email.id,
      event_id: @event.id,
      registration_id: registration.id
    )

    # Create delivery tracking record
    create_delivery_record(registration, response)

    response
  end

  private

  def send_via_sendgrid(to_email:, to_name:, subject:, body:, scheduled_email_id:, event_id:, registration_id:)
    mail = SendGrid::Mail.new
    mail.from = SendGrid::Email.new(
      email: @organization&.email || ENV["SENDER_EMAIL"],
      name: @organization&.name || "Voxxy Presents"
    )
    mail.subject = subject

    personalization = SendGrid::Personalization.new
    personalization.add_to(SendGrid::Email.new(email: to_email, name: to_name))

    # Add custom args for webhook tracking
    personalization.add_custom_arg(SendGrid::CustomArg.new(key: 'scheduled_email_id', value: scheduled_email_id.to_s))
    personalization.add_custom_arg(SendGrid::CustomArg.new(key: 'event_id', value: event_id.to_s))
    personalization.add_custom_arg(SendGrid::CustomArg.new(key: 'registration_id', value: registration_id.to_s))

    mail.add_personalization(personalization)
    mail.add_content(SendGrid::Content.new(type: 'text/html', value: body))

    sg = SendGrid::API.new(api_key: ENV["VoxxyKeyAPI"])
    response = sg.client.mail._("send").post(request_body: mail.to_json)

    unless response.status_code.to_i.between?(200, 299)
      raise "SendGrid API error: #{response.status_code} - #{response.body}"
    end

    response
  end

  def create_delivery_record(registration, response)
    message_id = response.headers['X-Message-Id'] || SecureRandom.hex(16)

    EmailDelivery.create!(
      scheduled_email: @scheduled_email,
      event: @event,
      registration: registration,
      sendgrid_message_id: message_id,
      recipient_email: registration.vendor_email,
      status: "sent",
      sent_at: Time.current
    )
  end
end
```

---

### Controllers

#### 1. ScheduledEmailsController

**File:** `app/controllers/api/v1/presents/scheduled_emails_controller.rb`

**Base Path:** `/api/v1/presents/events/:event_id/scheduled_emails`

```ruby
class Api::V1::Presents::ScheduledEmailsController < BaseController
  before_action :set_event
  before_action :set_scheduled_email, only: [:show, :update, :destroy, :pause, :resume, :send_now, :preview]

  # GET /api/v1/presents/events/:event_id/scheduled_emails
  def index
    emails = @event.scheduled_emails.includes(:email_template_item, :latest_delivery)
    emails = emails.where(status: params[:status]) if params[:status]

    if params[:category]
      emails = emails.joins(:email_template_item)
        .where(email_template_items: { category: params[:category] })
    end

    render json: emails.order(scheduled_for: :asc), include: [:email_template_item, :latest_delivery]
  end

  # POST /api/v1/presents/events/:event_id/scheduled_emails/generate
  def generate
    unless @event.email_campaign_template
      render json: { error: "Event has no email campaign template" }, status: :unprocessable_entity
      return
    end

    generator = ScheduledEmailGenerator.new(@event)

    emails = if params[:category] || params[:positions]
      generator.generate_selective(category: params[:category], positions: params[:positions])
    else
      generator.generate
    end

    # Calculate skipped count from errors
    skipped_count = generator.errors.count

    render json: {
      message: "Generated #{emails.count} scheduled emails",
      generated_count: emails.count,
      skipped_count: skipped_count,
      scheduled_emails: emails
    }, status: :created
  end

  # POST /api/v1/presents/events/:event_id/scheduled_emails/:id/send_now
  def send_now
    sender = EmailSenderService.new(@scheduled_email)
    result = sender.send_to_recipients

    render json: {
      message: "Sent email to #{result[:sent]} recipients",
      sent_count: result[:sent],
      failed_count: result[:failed],
      email: @scheduled_email
    }
  end

  # PATCH /api/v1/presents/events/:event_id/scheduled_emails/:id/pause
  def pause
    @scheduled_email.update!(status: 'paused')
    render json: @scheduled_email
  end

  # PATCH /api/v1/presents/events/:event_id/scheduled_emails/:id/resume
  def resume
    @scheduled_email.update!(status: 'scheduled')
    render json: @scheduled_email
  end

  # ... other actions: show, update, destroy, preview
end
```

**API Endpoints:**

| Method | Path | Action | Purpose |
|--------|------|--------|---------|
| GET | `/scheduled_emails` | index | List all emails |
| GET | `/scheduled_emails/:id` | show | Get single email with deliveries |
| POST | `/scheduled_emails/generate` | generate | Create from template |
| PATCH | `/scheduled_emails/:id` | update | Edit email |
| DELETE | `/scheduled_emails/:id` | destroy | Delete email |
| PATCH | `/scheduled_emails/:id/pause` | pause | Pause email |
| PATCH | `/scheduled_emails/:id/resume` | resume | Resume email |
| POST | `/scheduled_emails/:id/send_now` | send_now | Send immediately |
| POST | `/scheduled_emails/:id/preview` | preview | Preview with variables |

---

#### 2. EventInvitationsController

**File:** `app/controllers/api/v1/presents/event_invitations_controller.rb`

**Base Path:** `/api/v1/presents/events/:event_slug/invitations`

```ruby
# POST /api/v1/presents/events/:event_slug/invitations/batch
def create_batch
  vendor_contact_ids = params[:vendor_contact_ids] || []

  vendor_contacts = VendorContact.where(
    id: vendor_contact_ids,
    organization_id: @event.organization_id
  )

  created_invitations = []
  errors = []

  vendor_contacts.each do |contact|
    # Check if invitation already exists (skip duplicates)
    existing_invitation = @event.event_invitations.find_by(vendor_contact_id: contact.id)
    next if existing_invitation

    # Create new invitation
    invitation = @event.event_invitations.build(vendor_contact: contact)

    if invitation.save
      created_invitations << invitation
      invitation.mark_as_sent!

      # Send invitation email IMMEDIATELY
      begin
        EventInvitationMailer.invitation_email(invitation).deliver_now
      rescue => e
        Rails.logger.error "Failed to send invitation email: #{e.message}"
      end
    else
      errors << { vendor_contact_id: contact.id, errors: invitation.errors.full_messages }
    end
  end

  # NOTE: No longer marks scheduled email as sent
  # Invitation emails are tracked separately via EventInvitationMailer

  render json: {
    invitations: serialized,
    created_count: created_invitations.count,
    errors: errors
  }, status: :created
end
```

**Important:** Invitation emails are sent via `EventInvitationMailer`, NOT the scheduled email system. They appear as a virtual email in the frontend for display purposes only.

---

### Background Jobs

#### 1. EmailSenderWorker

**File:** `app/workers/email_sender_worker.rb`

**Schedule:** Every 5 minutes (Sidekiq-Cron)

```ruby
class EmailSenderWorker
  include Sidekiq::Worker
  sidekiq_options queue: :email_delivery, retry: 2

  def perform
    # Find all scheduled emails ready to send
    ready_emails = ScheduledEmail.where(status: 'scheduled')
      .where('scheduled_for <= ?', Time.current)
      .where('scheduled_for >= ?', 7.days.ago)  # Don't send stale emails

    sent_count = 0
    failed_count = 0

    ready_emails.each do |email|
      begin
        send_scheduled_email(email)
        sent_count += 1
      rescue => e
        Rails.logger.error("Failed to send scheduled email #{email.id}: #{e.message}")
        email.update(status: 'failed', error_message: e.message)
        failed_count += 1
      end
    end

    Rails.logger.info("EmailSenderWorker complete: #{sent_count} sent, #{failed_count} failed")

    { sent: sent_count, failed: failed_count }
  end

  private

  def send_scheduled_email(scheduled_email)
    service = EmailSenderService.new(scheduled_email)
    service.send_to_recipients
  end
end
```

---

#### 2. EmailDeliveryProcessorJob

**File:** `app/workers/email_delivery_processor_job.rb`

**Purpose:** Process SendGrid webhook events

```ruby
class EmailDeliveryProcessorJob
  include Sidekiq::Worker
  sidekiq_options queue: :email_webhooks, retry: 3

  def perform(event_data)
    event_type = event_data['event']
    message_id = event_data['sg_message_id']

    delivery = EmailDelivery.find_by(sendgrid_message_id: message_id)
    return unless delivery

    case event_type
    when 'delivered'
      handle_delivered(delivery, event_data)
    when 'bounce'
      handle_bounce(delivery, event_data)
    when 'dropped'
      handle_dropped(delivery, event_data)
    when 'deferred'
      # Log only, no action
      Rails.logger.info("Email deferred: #{message_id}")
    when 'unsubscribe', 'spamreport'
      handle_unsubscribe(delivery, event_data)
    end
  end

  private

  def handle_delivered(delivery, event)
    delivery.update(
      status: 'delivered',
      delivered_at: Time.at(event['timestamp'])
    )
  end

  def handle_bounce(delivery, event)
    bounce_type = determine_bounce_type(event['reason'])

    delivery.update(
      status: 'bounced',
      bounce_type: bounce_type,
      bounce_reason: event['reason'],
      bounced_at: Time.at(event['timestamp'])
    )

    # Schedule retry for soft bounces
    if bounce_type == 'soft' && delivery.retry_count < delivery.max_retries
      schedule_retry(delivery)
    end
  end

  def schedule_retry(delivery)
    # Exponential backoff: 1h, 4h, 24h
    delays = [1.hour, 4.hours, 24.hours]
    delay = delays[delivery.retry_count] || 24.hours

    delivery.update(
      next_retry_at: Time.current + delay,
      retry_count: delivery.retry_count + 1
    )

    EmailRetryJob.set(wait: delay).perform_later(delivery.id)
  end

  def determine_bounce_type(reason)
    # Hard bounce reasons
    hard_bounce_patterns = [
      /does not exist/i,
      /invalid/i,
      /undeliverable/i,
      /permanent/i
    ]

    hard_bounce_patterns.any? { |pattern| reason =~ pattern } ? 'hard' : 'soft'
  end
end
```

---

## 🎨 Frontend Components

### Type Definitions

**File:** `src/types/email.ts`

```typescript
// Main interfaces
export interface ScheduledEmail {
  id: number
  event_id: number
  email_campaign_template_id: number | null
  email_template_item_id: number | null
  name: string
  subject_template: string
  body_template: string
  trigger_type: TriggerType
  trigger_value: number | null
  trigger_time: string | null  // "HH:MM"
  scheduled_for: string  // ISO datetime (UTC)
  filter_criteria: FilterCriteria
  status: ScheduledEmailStatus
  sent_at: string | null
  recipient_count: number
  error_message: string | null
  created_at: string
  updated_at: string

  // Optional includes
  latest_delivery?: EmailDelivery
  email_deliveries?: EmailDelivery[]
  delivery_status?: DeliveryStatus

  // ✨ NEW: Virtual invitation flag
  isInvitationAnnouncement?: boolean
}

export interface EmailDelivery {
  id: number
  scheduled_email_id: number
  event_id: number
  registration_id: number
  sendgrid_message_id: string
  recipient_email: string
  status: DeliveryStatus
  bounce_type: 'soft' | 'hard' | null
  sent_at: string | null
  delivered_at: string | null
  bounced_at: string | null
  dropped_at: string | null
  retry_count: number
}

export type ScheduledEmailStatus = 'scheduled' | 'paused' | 'sent' | 'failed' | 'cancelled'
export type DeliveryStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'bounced' | 'dropped' | 'unsubscribed'
```

---

### API Client

**File:** `src/services/api.ts` (Lines 977-1086, 1914-1983)

```typescript
// Scheduled Emails API
export const scheduledEmailsApi = {
  async getByEvent(eventSlug: string): Promise<ScheduledEmail[]> {
    return fetchApi<ScheduledEmail[]>(`/v1/presents/events/${eventSlug}/scheduled_emails`)
  },

  async generate(eventSlug: string, data?: GenerateScheduledEmailsRequest): Promise<GenerateScheduledEmailsResponse> {
    return fetchApi(`/v1/presents/events/${eventSlug}/scheduled_emails/generate`, {
      method: 'POST',
      body: JSON.stringify(data || {})
    })
  },

  async sendNow(eventSlug: string, id: number): Promise<SendNowResponse> {
    return fetchApi(`/v1/presents/events/${eventSlug}/scheduled_emails/${id}/send_now`, {
      method: 'POST'
    })
  },

  async pause(eventSlug: string, id: number): Promise<ScheduledEmail> {
    return fetchApi(`/v1/presents/events/${eventSlug}/scheduled_emails/${id}/pause`, {
      method: 'PATCH'
    })
  },

  async resume(eventSlug: string, id: number): Promise<ScheduledEmail> {
    return fetchApi(`/v1/presents/events/${eventSlug}/scheduled_emails/${id}/resume`, {
      method: 'PATCH'
    })
  },

  // ... other methods: getById, update, delete, preview, saveAsTemplate
}

// Event Invitations API
export const eventInvitationsApi = {
  async getByEvent(eventSlug: string, params?: { status?: string }) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)

    const query = queryParams.toString()
    return fetchApi<{
      invitations: EventInvitation[]
      meta: {
        total_count: number
        pending_count: number
        sent_count: number
        accepted_count: number
        declined_count: number
        expired_count: number
      }
    }>(`/v1/presents/events/${eventSlug}/invitations${query ? `?${query}` : ''}`)
  },

  // ... other methods: createBatch, getByToken, respond
}
```

---

### Components

#### 1. EmailAutomationTab (Main UI)

**File:** `src/components/producer/Email/EmailAutomationTab.tsx`

**Purpose:** Main email management interface

```typescript
export default function EmailAutomationTab({ eventSlug }: EmailAutomationTabProps) {
  const [emails, setEmails] = useState<ScheduledEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadEmails = async () => {
    setIsLoading(true)
    try {
      console.log('📧 Loading emails for event:', eventSlug)

      // Fetch scheduled emails
      const scheduledEmailsData = await scheduledEmailsApi.getByEvent(eventSlug)
      console.log('✅ Fetched', scheduledEmailsData.length, 'scheduled emails')

      // ✨ NEW: Fetch invitations (non-blocking)
      const invitationsData = await eventInvitationsApi.getByEvent(eventSlug).catch(() => ({
        invitations: [],
        meta: { total_count: 0, sent_count: 0, ... }
      }))

      const allEmails: ScheduledEmail[] = [...scheduledEmailsData]

      // ✨ NEW: Create virtual "Event Announcement (Invitations Sent)" email
      if (invitationsData.meta.sent_count > 0) {
        const sentInvitations = invitationsData.invitations.filter((inv: any) => inv.sent_at)
        const earliestSentDate = sentInvitations.length > 0
          ? sentInvitations.reduce((earliest, inv) =>
              new Date(inv.sent_at) < new Date(earliest.sent_at) ? inv : earliest
            ).sent_at
          : new Date().toISOString()

        const invitationEmail: ScheduledEmail = {
          id: -1,
          event_id: -1,
          email_campaign_template_id: null,
          email_template_item_id: null,
          name: 'Event Announcement (Invitations Sent)',
          subject_template: 'You\'re Invited: {{event_title}} - Apply Now!',
          body_template: '',
          trigger_type: 'on_application_open',
          scheduled_for: earliestSentDate,
          status: 'sent',
          sent_at: earliestSentDate,
          recipient_count: invitationsData.meta.sent_count,
          isInvitationAnnouncement: true,  // ✨ Flag for special handling
          // ... other required fields
        }

        allEmails.unshift(invitationEmail)  // Add at beginning
      }

      setEmails(allEmails)
    } catch (err) {
      console.error('❌ Failed to load emails:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Email action handlers
  const handlePause = async (emailId: number) => { ... }
  const handleResume = async (emailId: number) => { ... }
  const handleSendNow = async (emailId: number) => { ... }
  const handleDelete = async (emailId: number) => { ... }

  // Render statistics, email list
  return (
    <div>
      {/* Stats Grid */}
      {/* ScheduledEmailList */}
      {/* Modals */}
    </div>
  )
}
```

---

#### 2. ScheduledEmailCard (Individual Email Display)

**File:** `src/components/producer/Email/ScheduledEmailCard.tsx`

```typescript
export default function ScheduledEmailCard({ email, onEdit, onPreview, onPause, ... }) {
  const isInvitationAnnouncement = email.isInvitationAnnouncement || false

  return (
    <div className="email-card">
      {/* Email details */}
      <h3>{email.name}</h3>
      <p>{email.subject_template}</p>
      <div>
        <span>📅 {format(new Date(email.scheduled_for), 'MMM d, yyyy')}</span>
        <span>👥 {email.recipient_count} recipients</span>
      </div>

      {/* ✨ NEW: Hide actions menu for invitation announcements */}
      {!isInvitationAnnouncement && (
        <DropdownMenu>
          <DropdownMenuTrigger>⋮</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onPreview(email)}>Preview</DropdownMenuItem>
            {!email.sent_at && <DropdownMenuItem onClick={() => onEdit(email)}>Edit</DropdownMenuItem>}
            {/* ... other actions */}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
```

**Key Feature:** Invitation announcements show as read-only (no dropdown menu)

---

## 📋 Default Email Template

**File:** `db/seeds/email_campaign_templates.rb`

### Template Overview

**Name:** "Default Event Campaign"
**Type:** system (is_default: true)
**Total Emails:** 7
**Categories:** 3

---

### Category 1: Event Announcements (2 emails)

#### Email 1: 1 Day Before Application Deadline
- **Position:** 1
- **Trigger:** `days_before_deadline`, value=1, time=09:00
- **Recipients:** All vendors (no filter)
- **Subject:** "⏰ Last Chance: [eventName] Applications Close Tomorrow!"
- **Purpose:** Final reminder before application deadline

#### Email 2: Application Deadline Day
- **Position:** 2
- **Trigger:** `days_before_deadline`, value=0, time=08:00
- **Recipients:** All vendors (no filter)
- **Subject:** "🚨 URGENT: [eventName] Applications Close TODAY"
- **Purpose:** Last chance urgency on deadline day

---

### Category 2: Payment Reminders (2 emails)

#### Email 3: 1 Day Before Payment Due
- **Position:** 3
- **Trigger:** `days_before_payment_deadline`, value=1, time=10:00
- **Recipients:** **Approved vendors only** (`status: ['approved']`)
- **Subject:** "Reminder: Payment Due Tomorrow - [eventName]"
- **Purpose:** Payment reminder for approved vendors

#### Email 4: Payment Due Today
- **Position:** 4
- **Trigger:** `on_payment_deadline`, value=0, time=08:00
- **Recipients:** **Approved vendors only** (`status: ['approved']`)
- **Subject:** "🚨 URGENT: Payment Due Today - [eventName]"
- **Purpose:** Final payment urgency on deadline

---

### Category 3: Event Countdown (3 emails)

#### Email 5: 1 Day Before Event
- **Position:** 5
- **Trigger:** `days_before_event`, value=1, time=17:00
- **Recipients:** **Approved/Confirmed vendors** (`status: ['approved', 'confirmed']`)
- **Subject:** "Tomorrow: [eventName] Final Details"
- **Purpose:** Final preparation reminder with setup info

#### Email 6: Day of Event
- **Position:** 6
- **Trigger:** `on_event_date`, value=0, time=07:00
- **Recipients:** **Approved/Confirmed vendors** (`status: ['approved', 'confirmed']`)
- **Subject:** "🎉 Today is the Day! [eventName]"
- **Purpose:** Event day excitement and reminders

#### Email 7: Day After Event - Thank You
- **Position:** 7
- **Trigger:** `days_after_event`, value=1, time=10:00
- **Recipients:** **Approved/Confirmed vendors** (`status: ['approved', 'confirmed']`)
- **Subject:** "Thank You for Making [eventName] Amazing!"
- **Purpose:** Post-event gratitude and follow-up

---

### Important Note

**Invitation Announcement Email:** The "Event Announcement (immediate)" email sent when event invitations are created is handled by the **EventInvitation system**, NOT by scheduled emails. It's sent via `EventInvitationMailer` and tracked separately. The frontend creates a virtual email for display purposes only.

---

## 🔄 Key Workflows

### Workflow 1: Event Creation → Email Generation

```
1. Producer creates event via UI
   └─→ POST /api/v1/presents/organizations/:slug/events

2. Backend: Event.create
   └─→ after_create callback triggered

3. Event#assign_email_template_and_generate_emails
   ├─→ Find organization's default template (if exists)
   ├─→ Fallback to system default template
   ├─→ Assign event.email_campaign_template_id
   └─→ Call generate_scheduled_emails

4. ScheduledEmailGenerator.new(event).generate
   ├─→ Loop through template.email_template_items.enabled
   │   ├─→ Calculate scheduled_for (EmailScheduleCalculator)
   │   ├─→ Skip if time in past
   │   ├─→ Check for duplicates (event + item combo)
   │   └─→ Create ScheduledEmail record
   └─→ Return array of created emails (7)

5. Response: Event JSON with 7 scheduled emails created
```

---

### Workflow 2: Automated Email Sending

```
Every 5 minutes: EmailSenderWorker.perform

1. Query ScheduledEmail.where(
     status: 'scheduled',
     scheduled_for <= now,
     scheduled_for >= 7.days.ago
   )

2. For each ready email:
   EmailSenderService.new(email).send_to_recipients

   ├─→ RecipientFilterService filters by filter_criteria
   │   (e.g., status: ['approved', 'confirmed'])
   │
   ├─→ For each recipient registration:
   │   ├─→ Skip if email_unsubscribed
   │   ├─→ EmailVariableResolver resolves [variables]
   │   ├─→ Send via SendGrid API
   │   │   ├─→ Uses ENV["VoxxyKeyAPI"]
   │   │   ├─→ Custom args: scheduled_email_id, event_id, registration_id
   │   │   └─→ Extract X-Message-Id from response
   │   └─→ Create EmailDelivery record (status: 'sent')
   │
   └─→ Update ScheduledEmail:
       ├─→ status = 'sent'
       ├─→ sent_at = Time.current
       └─→ recipient_count = N

3. Log results: "EmailSenderWorker complete: X sent, Y failed"
```

---

### Workflow 3: Invitation Email Sending

```
1. Producer selects vendor contacts and clicks "Send Invitations"
   └─→ POST /api/v1/presents/events/:slug/invitations/batch
       body: { vendor_contact_ids: [1, 2, 3] }

2. EventInvitationsController#create_batch
   ├─→ Load VendorContact records
   ├─→ Check for existing invitations (skip duplicates)
   ├─→ For each new invitation:
   │   ├─→ Create EventInvitation record
   │   ├─→ Mark as sent (invitation.mark_as_sent!)
   │   └─→ Send EventInvitationMailer.invitation_email(invitation).deliver_now
   │
   └─→ Return { invitations, created_count, errors }

3. Frontend: EmailAutomationTab.loadEmails
   ├─→ Fetches event invitations
   ├─→ If sent_count > 0:
   │   └─→ Creates virtual ScheduledEmail object
   │       ├─→ name: "Event Announcement (Invitations Sent)"
   │       ├─→ status: 'sent'
   │       ├─→ recipient_count: sent_count
   │       ├─→ sent_at: earliest invitation sent_at
   │       └─→ isInvitationAnnouncement: true
   │
   └─→ Displays virtual email at top of list (read-only)

NOTE: Invitation emails are NOT in scheduled_emails table.
      They're tracked via EventInvitation and displayed virtually in UI.
```

---

### Workflow 4: SendGrid Webhook → Delivery Update

```
1. SendGrid sends webhook event to:
   POST /api/webhooks/sendgrid
   body: {
     event: 'delivered' | 'bounce' | 'dropped' | 'deferred' | 'unsubscribe',
     sg_message_id: 'abc123',
     timestamp: 1234567890,
     reason: '...'
   }

2. WebhooksController enqueues job:
   EmailDeliveryProcessorJob.perform_async(event_data)

3. EmailDeliveryProcessorJob.perform
   ├─→ Extract sendgrid_message_id
   ├─→ Find EmailDelivery record
   │
   └─→ Route by event type:

       ├─→ 'delivered':
       │   └─→ Update delivery: status='delivered', delivered_at
       │
       ├─→ 'bounce':
       │   ├─→ Determine bounce_type (hard/soft)
       │   ├─→ Update delivery: status='bounced', bounce_type, bounced_at
       │   └─→ If soft bounce && retry_count < max_retries:
       │       ├─→ Calculate exponential backoff (1h, 4h, 24h)
       │       ├─→ Set next_retry_at
       │       └─→ Schedule EmailRetryJob
       │
       ├─→ 'dropped':
       │   └─→ Update delivery: status='dropped', drop_reason
       │
       └─→ 'unsubscribe':
           ├─→ Update delivery: status='unsubscribed'
           └─→ Mark registration.email_unsubscribed = true

4. Result: EmailDelivery status updated in real-time
```

---

## 🆕 Recent Changes (January 7, 2026)

### 1. Template Simplification (16 → 7 Emails) ✅

**Before:** Default template had 16 emails
**After:** Simplified to 7 emails in 3 categories

**Reason:** Reduce complexity, focus on essential communications

**Files Changed:**
- `db/seeds/email_campaign_templates.rb` - Rewritten with 7 emails
- Database cleanup script ran to delete old template items

---

### 2. Duplicate Detection in ScheduledEmailGenerator ✅

**Problem:** Frontend was calling generation twice, creating duplicates

**Solution:** Added duplicate check before creating ScheduledEmail

**Code Added:**
```ruby
# app/services/scheduled_email_generator.rb (Lines 45-55)
existing = ScheduledEmail.find_by(
  event: event,
  email_template_item: item
)

if existing
  @errors << "Skipped '#{item.name}' - already exists (ID: #{existing.id})"
  scheduled_emails << existing
  next
end
```

**Result:** No more duplicate emails when generation called multiple times

---

### 3. Removed Outdated Invitation Tracking ✅

**Problem:** Old system tried to mark "Immediate Announcement" scheduled email as sent when invitations were sent, but that email no longer exists in the template

**Solution:** Removed lines 96-110 from EventInvitationsController

**Code Removed:**
```ruby
# REMOVED: Lines 96-110 from event_invitations_controller.rb
# No longer marks scheduled email as sent
# Invitations tracked separately via EventInvitation system
```

**Result:** Cleaner separation between invitation system and scheduled emails

---

### 4. Virtual Invitation Announcement (Frontend) ✅

**Problem:** Users wanted to see invitation emails in the email dashboard

**Solution:** Create virtual ScheduledEmail object for display only

**Code Added:**
```typescript
// src/components/producer/Email/EmailAutomationTab.tsx (Lines 44-82)
if (invitationsData.meta.sent_count > 0) {
  const invitationEmail: ScheduledEmail = {
    id: -1,
    name: 'Event Announcement (Invitations Sent)',
    status: 'sent',
    recipient_count: invitationsData.meta.sent_count,
    isInvitationAnnouncement: true,  // Special flag
    // ...
  }
  allEmails.unshift(invitationEmail)
}
```

**Result:** Invitation email appears at top of email list, read-only

---

### 5. Removed Manual Generation Call (Frontend) ✅

**Problem:** Frontend was calling generation endpoint after event creation, but backend already generates via callback

**Solution:** Removed manual API call from ProducerDashboard.tsx

**Code Removed:**
```typescript
// REMOVED from ProducerDashboard.tsx (Lines 250-261)
// No longer calls scheduledEmailsApi.generate()
// Backend handles automatically via Event.after_create
```

**Result:** Cleaner flow, no unnecessary API calls

---

### 6. Frontend Type Update ✅

**Added to ScheduledEmail interface:**
```typescript
// src/types/email.ts (Lines 101-102)
isInvitationAnnouncement?: boolean
```

**Purpose:** Flag virtual invitation emails for special handling in UI

---

## 🛠 Developer Reference

### Common Tasks

#### Task 1: Add a New Email to Template

**Step 1:** Add to seed file

```ruby
# db/seeds/email_campaign_templates.rb

create_email(template, {
  name: 'New Email Name',
  position: 8,  # Increment position
  category: 'event_countdown',
  subject_template: 'Subject with [variables]',
  body_template: <<~HTML,
    <p>Email body with [eventName] and [firstName]</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 3,  # 3 days before
  trigger_time: '14:00',
  filter_criteria: { status: ['confirmed'] },
  enabled_by_default: true
})
```

**Step 2:** Run seed file

```bash
bundle exec rails runner db/seeds/email_campaign_templates.rb
```

**Step 3:** Test with new event

```bash
bundle exec rails console
event = Event.last
generator = ScheduledEmailGenerator.new(event)
emails = generator.generate
puts "Created #{emails.count} emails"
```

---

#### Task 2: Change Email Send Time

**Option A: Update Template (Affects Future Events)**

```ruby
# Rails console
template = EmailCampaignTemplate.default_template
item = template.email_template_items.find_by(position: 5)
item.update(trigger_time: '16:00')  # Change from 17:00 to 16:00
```

**Option B: Update Scheduled Email (Single Event)**

```ruby
# Rails console
event = Event.find_by(slug: 'my-event')
email = event.scheduled_emails.find_by(name: '1 Day Before Event')
email.update(trigger_time: '16:00')

# Recalculate scheduled_for
calculator = EmailScheduleCalculator.new(event)
new_time = calculator.calculate(email.email_template_item)
email.update(scheduled_for: new_time)
```

---

#### Task 3: Test Email Sending

```ruby
# Rails console

# Find or create scheduled email
event = Event.last
email = event.scheduled_emails.first

# Send now (bypasses schedule)
service = EmailSenderService.new(email)
result = service.send_to_recipients

puts "Sent: #{result[:sent]}, Failed: #{result[:failed]}"

# Check deliveries
email.email_deliveries.each do |delivery|
  puts "#{delivery.recipient_email}: #{delivery.status}"
end
```

---

#### Task 4: Debug Webhook Events

```bash
# Check webhook logs
tail -f log/production.log | grep EmailDeliveryProcessorJob

# Find delivery by SendGrid message ID
bundle exec rails console
delivery = EmailDelivery.find_by(sendgrid_message_id: 'abc123')
puts delivery.inspect
```

---

#### Task 5: Manually Trigger Email Worker

```bash
# Run worker manually (testing)
bundle exec rails runner "EmailSenderWorker.new.perform"

# Check Sidekiq queue
bundle exec rails console
Sidekiq::Queue.new('email_delivery').size
```

---

### API Endpoints Quick Reference

#### Scheduled Emails

```
GET    /api/v1/presents/events/:slug/scheduled_emails
GET    /api/v1/presents/events/:slug/scheduled_emails/:id
POST   /api/v1/presents/events/:slug/scheduled_emails/generate
PATCH  /api/v1/presents/events/:slug/scheduled_emails/:id
DELETE /api/v1/presents/events/:slug/scheduled_emails/:id
PATCH  /api/v1/presents/events/:slug/scheduled_emails/:id/pause
PATCH  /api/v1/presents/events/:slug/scheduled_emails/:id/resume
POST   /api/v1/presents/events/:slug/scheduled_emails/:id/send_now
POST   /api/v1/presents/events/:slug/scheduled_emails/:id/preview
```

#### Event Invitations

```
GET    /api/v1/presents/events/:slug/invitations
POST   /api/v1/presents/events/:slug/invitations/batch
GET    /api/v1/presents/invitations/:token (public)
PATCH  /api/v1/presents/invitations/:token/respond (public)
```

#### Email Campaign Templates

```
GET    /api/v1/presents/email_campaign_templates
GET    /api/v1/presents/email_campaign_templates/:id
POST   /api/v1/presents/email_campaign_templates
PATCH  /api/v1/presents/email_campaign_templates/:id
DELETE /api/v1/presents/email_campaign_templates/:id
```

---

### File Path Reference

#### Backend (Rails)

```
Models:
├── app/models/email_campaign_template.rb
├── app/models/email_template_item.rb
├── app/models/scheduled_email.rb
├── app/models/email_delivery.rb
└── app/models/event.rb (email callbacks)

Services:
├── app/services/scheduled_email_generator.rb
├── app/services/email_schedule_calculator.rb
├── app/services/email_sender_service.rb
├── app/services/email_variable_resolver.rb
└── app/services/recipient_filter_service.rb

Controllers:
├── app/controllers/api/v1/presents/scheduled_emails_controller.rb
└── app/controllers/api/v1/presents/event_invitations_controller.rb

Workers:
├── app/workers/email_sender_worker.rb
├── app/workers/email_delivery_processor_job.rb
└── app/workers/email_retry_job.rb

Mailers:
└── app/mailers/event_invitation_mailer.rb

Seeds:
└── db/seeds/email_campaign_templates.rb

Migrations:
├── db/migrate/20260102142051_create_email_campaign_templates.rb
├── db/migrate/20260102142157_create_email_template_items.rb
├── db/migrate/20260102143004_create_scheduled_emails.rb
├── db/migrate/20260102143716_create_email_deliveries.rb
└── db/migrate/20260102143910_add_email_campaign_template_to_events.rb
```

#### Frontend (React)

```
Components:
├── src/components/producer/Email/EmailAutomationTab.tsx
├── src/components/producer/Email/ScheduledEmailList.tsx
├── src/components/producer/Email/ScheduledEmailCard.tsx
├── src/components/producer/Email/EmailPreviewModal.tsx
└── src/components/producer/Email/SaveAsTemplateDialog.tsx

Types:
└── src/types/email.ts

API Client:
└── src/services/api.ts (scheduledEmailsApi, eventInvitationsApi)
```

---

### Debugging Tips

#### Issue: Emails Not Generating

```bash
# Check if template exists
rails console
EmailCampaignTemplate.default_template
# => Should return template

# Check if callback ran
event = Event.last
event.email_campaign_template
# => Should have template assigned

# Manually generate
generator = ScheduledEmailGenerator.new(event)
emails = generator.generate
puts generator.errors  # Check for errors
```

---

#### Issue: Emails Not Sending

```bash
# Check if worker is running
ps aux | grep sidekiq

# Check scheduled emails ready
rails console
ScheduledEmail.where(status: 'scheduled', scheduled_for: ..Time.current).count

# Check Sidekiq queue
Sidekiq::Queue.new('email_delivery').size

# Manually trigger
EmailSenderWorker.new.perform
```

---

#### Issue: Webhooks Not Updating

```bash
# Check webhook endpoint is accessible
curl -X POST https://yourapp.com/api/webhooks/sendgrid \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}'

# Check Sidekiq queue
Sidekiq::Queue.new('email_webhooks').size

# Find delivery
rails console
EmailDelivery.find_by(sendgrid_message_id: 'abc123')
```

---

## 📝 Notes & Best Practices

### Important Technical Details

1. **Time Handling:** All `scheduled_for` times stored in **UTC**. Use `Time.use_zone("UTC")` in calculations.

2. **Variable Format:** Use `[variable]` format (brackets), not `{{variable}}` (double braces).

3. **Filter Criteria:** JSONB column with GIN index. Query with: `.where("filter_criteria @> ?", {status: ['approved']}.to_json)`

4. **SendGrid Custom Args:** Include `scheduled_email_id`, `event_id`, `registration_id` for webhook tracking.

5. **Soft Bounce Retries:** 3 attempts max with exponential backoff (1h, 4h, 24h).

6. **Stale Emails:** Worker skips emails older than 7 days to avoid sending outdated communications.

---

### Email Template Best Practices

1. **Clear Subject Lines:** Use emojis sparingly, focus on clarity
2. **Variable Usage:** Always include fallbacks for optional variables
3. **Mobile-Friendly HTML:** Use simple, responsive email templates
4. **Unsubscribe Link:** Include in all automated emails (legal requirement)
5. **Test Before Deploy:** Use preview feature to test with real data

---

### Performance Considerations

1. **Batch Email Sending:** Worker processes 100 emails max per run
2. **Database Indexes:** Ensure indexes on `[status, scheduled_for]` and `sendgrid_message_id`
3. **JSONB Queries:** Use GIN indexes for `filter_criteria` column
4. **Sidekiq Concurrency:** Monitor memory usage, adjust worker count
5. **SendGrid Rate Limits:** Check SendGrid plan limits, implement throttling if needed

---

## 🎓 Summary

The Email Automation System is a **production-ready**, **fully-integrated** solution for event-based email campaigns. It combines:

- **7 carefully-timed emails** covering the complete event lifecycle
- **Flexible template system** for organization customization
- **SendGrid integration** with real-time delivery tracking
- **React UI** for email management and monitoring
- **Background processing** for reliable, automated sending
- **Webhook-based updates** for delivery status

The system was recently simplified from 16 to 7 emails while maintaining full functionality and adding improved duplicate detection and cleaner invitation email handling.

---

**For questions or issues, reference this documentation and check the debugging section above.**

**Last Updated:** January 7, 2026
