# Voxxy Rails Email Flow System - Comprehensive Analysis

## 1. Application Overview

**Voxxy** is a unified Rails API backend supporting two products:
- **Voxxy Presents**: Event management & vendor coordination platform (primary focus for email system)
- **Voxxy Mobile**: Social planning app (minimal email usage)

**Tech Stack**: Rails 7.2.2, PostgreSQL 14+, Redis, Sidekiq, SendGrid

---

## 2. Email System Architecture Overview

The email system in Voxxy Presents is a sophisticated **event-driven, template-based automation platform** with the following key components:

### 2.1 Core Flow
```
EmailCampaignTemplate (master templates)
  └─> EmailTemplateItem (individual emails)
      └─> ScheduledEmail (scheduled instances for events)
          └─> EmailDelivery (individual delivery tracking)
          └─> EventInvitation (invitation tracking)
          └─> Registration (vendor application tracking)
```

### 2.2 Key Characteristics
- **Template-Based**: Reusable campaigns with multiple email templates (40+ emails per template)
- **Event-Driven**: Each event can have its own email campaign or use system defaults
- **Scheduled/Triggered**: Emails can be scheduled for specific times OR triggered by events
- **Multi-Channel**: Supports both registration-based emails (vendors who applied) and invitation-based emails (pre-invited contacts)
- **Delivery Tracking**: Webhook integration with SendGrid for bounce/delivery/open tracking
- **Unsubscribe Management**: Three-tier scoping (global, organization, event-level)

---

## 3. Email Models & Database Structure

### 3.1 EmailCampaignTemplate
**Purpose**: Master template containers for organizing email sequences
**Key Fields**:
- `template_type`: "system" (default) or "user" (organization-specific)
- `is_default`: Boolean flag for default system template
- `organization_id`: NULL for system templates
- `name`: Unique within organization
- `description`: Template description
- `email_count`: Counter cache of associated templates
- `events_count`: Counter cache of events using this template

**Associations**:
```ruby
has_many :email_template_items, dependent: :destroy
has_many :scheduled_emails
has_many :events
belongs_to :organization, optional: true
```

**Example System Templates**:
- Pancake & Booze (30 emails)
- Default system template

### 3.2 EmailTemplateItem
**Purpose**: Individual email definitions within a campaign template
**Key Fields**:
- `name`: Email name (e.g., "Application Received")
- `category`: Routing category (e.g., "event_announcements", "payment_reminders", "application_updates")
- `position`: Display order (1-40)
- `trigger_type`: When email is sent
  - `days_before_event`: X days before event date
  - `days_after_event`: X days after event date
  - `days_before_deadline`: X days before application deadline
  - `on_event_date`: On the event date
  - `on_application_open`: When application opens (invitation-based)
  - `on_application_submit`: When application is submitted (callback-triggered)
  - `on_approval`: When vendor is approved (callback-triggered)
  - `on_payment_received`: When payment received
  - `days_before_payment_deadline`: X days before payment deadline
  - `on_payment_deadline`: On payment deadline
  - `on_waitlist`: When moved to waitlist
  - `on_rejection`: When rejected
- `trigger_value`: Numeric value for day-based triggers
- `trigger_time`: Time of day for delivery
- `subject_template`: Email subject (supports variables like {{vendor_name}})
- `body_template`: Email body HTML (supports variables)
- `filter_criteria`: JSONB filters for recipients
- `enabled_by_default`: Whether included in generated schedules

**Validations**:
- Max 40 emails per template
- Subject and body are required
- Category is critical for routing

### 3.3 ScheduledEmail
**Purpose**: Scheduled instances of emails for specific events
**Key Fields**:
- `event_id`: Associated event
- `email_campaign_template_id`: Source template
- `email_template_item_id`: Source template item
- `name`: Email name (copied from template)
- `subject_template` / `body_template`: Content (copied/customizable)
- `scheduled_for`: Exact datetime when email should send
- `status`: "scheduled", "paused", "sent", "failed", "cancelled"
- `filter_criteria`: JSONB criteria for filtering recipients
- `recipient_count`: Count of recipients who received email (after sent)
- `sent_at`: When email was actually sent
- `error_message`: If failed, the error

**Status Flow**:
```
[New] → scheduled → paused/resumed → sent/failed/cancelled
```

**Recipient Count Logic**:
- Before sending: Dynamic calculation based on current filters
- After sending: Fixed count stored for historical accuracy

**Computed Fields**:
- `delivery_counts`: Hash with {total_sent, delivered, bounced, dropped, unsubscribed, pending}
- `delivery_rate`: Percentage of delivered emails
- `delivery_status`: Latest delivery status from associated EmailDelivery
- `undelivered_count`: Bounced + dropped count
- `unsubscribed_count`: Count of recipients who unsubscribed
- `delivered_count`: Successfully delivered count
- `overdue?`: Is scheduled time more than 10 minutes past?

**Two Routing Paths**:
1. **Invitation-Based** (event_announcements category):
   - Targets EventInvitations → VendorContacts
   - Sent via EventInvitationMailer
   - Uses InvitationReminderService
   
2. **Registration-Based** (all other categories):
   - Targets Registrations (vendors who applied)
   - Sent via ApplicationMailer (generic)
   - Uses EmailSenderService

### 3.4 EmailDelivery
**Purpose**: Track individual email delivery events and webhook updates
**Key Fields**:
- `scheduled_email_id`: Associated scheduled email (optional)
- `event_id`: Associated event
- `registration_id`: If sent to a registration/vendor
- `event_invitation_id`: If sent to an invited contact
- `sendgrid_message_id`: Unique SendGrid tracking ID (required, unique)
- `recipient_email`: Email address sent to
- `status`: "queued", "sent", "delivered", "bounced", "dropped", "unsubscribed"
- `bounce_type`: "hard" or "soft" if bounced
- `bounce_reason`: Why it bounced
- `sent_at`, `delivered_at`, `bounced_at`, `dropped_at`, `unsubscribed_at`: Timestamps
- `opened_at`, `clicked_at`: From SendGrid tracking
- `retry_count`: Number of retry attempts
- `next_retry_at`: When next retry is scheduled
- `max_retries`: Maximum retries allowed (default 3)

**Validation Constraint**:
- Must have either `scheduled_email_id` OR `event_invitation_id`
- Cannot have both `registration_id` AND `event_invitation_id`
- sendgrid_message_id must be unique

**Scopes**:
- `failed`: bounced or dropped
- `pending_retry`: next_retry_at <= now
- `soft_bounces`: bounced with type "soft"
- `successful`: delivered

### 3.5 EmailUnsubscribe
**Purpose**: Manage unsubscribe preferences across different scopes
**Key Fields**:
- `email`: Recipient email (normalized to lowercase)
- `scope`: "event", "organization", or "global"
- `event_id`: If scope is "event"
- `organization_id`: If scope is "organization"
- `unsubscribed_at`: When unsubscribe occurred
- `unsubscribe_source`: "user_action", "sendgrid_webhook", "admin_action"

**Three-Tier Unsubscribe System**:
1. **Global Unsubscribe**: No emails from any organization
2. **Organization Unsubscribe**: No emails from specific organization
3. **Event Unsubscribe**: No emails from specific event

**Uniqueness Constraints**:
- Global: email must be unique per scope
- Organization: email + organization_id must be unique
- Event: email + event_id must be unique

---

## 4. Email System Architecture: Mailers & Services

### 4.1 Mailers

#### EventInvitationMailer
**Purpose**: Send invitations to pre-invited vendor contacts
**Method**: `invitation_email(event_invitation)`
**Recipients**: VendorContacts (pre-invited, not registered vendors)
**Uses**:
- UnsubscribeTokenService: Generate unsubscribe links
- SendGrid X-SMTPAPI header for webhook tracking

**Email Details**:
- To: vendor_contact.email
- From: organization_name <noreply@voxxypresents.com>
- Reply-To: organization.reply_to_email
- Subject: "{{event.title}} is coming in {{location}}"
- Custom Args: event_id, event_invitation_id, email_type

#### ApplicationMailer (base)
**Purpose**: Parent class for all other mailers
**Common Functionality**: SendGrid integration, header setup

#### AdminMailer
**Purpose**: Administrative notifications (undocumented, likely for admin alerts)

### 4.2 Service Classes

#### EmailSenderService
**Purpose**: Send scheduled emails to registrations
**Recipients**: Registrations (vendors who applied)
**Key Methods**:
- `send_to_recipients`: Send to filtered recipient list
- `send_to_registration`: Send to individual registration
- `retry_delivery`: Retry a failed delivery

**Flow**:
1. Filter registrations using RecipientFilterService
2. Resolve email variables using EmailVariableResolver
3. Send via SendGrid
4. Create EmailDelivery records for tracking
5. Update ScheduledEmail status

**Features**:
- Checks unsubscribe status before sending
- Logs recipient counts prominently
- Warns if zero recipients or very few recipients
- Handles per-recipient send failures gracefully

#### InvitationReminderService
**Purpose**: Send scheduled emails to invited contacts (not registered)
**Recipients**: EventInvitations with associated VendorContacts
**Key Methods**:
- `send_to_recipients`: Send reminders
- `send_to_invitation`: Send to individual invitation
- `filter_invitation_recipients`: Filter invitations

**Use Cases**:
- Application deadline reminders to invited vendors who haven't applied yet
- Triggered by emails with category "event_announcements"

#### EmailScheduleCalculator
**Purpose**: Calculate when an email should be sent based on trigger type and event dates
**Calculates schedules** for:
- Days before/after event date
- Days before/after application deadline
- On specific dates (event date, deadline)
- At specific times

#### ScheduledEmailGenerator
**Purpose**: Create ScheduledEmail records from EmailCampaignTemplate for an event
**Flow**:
1. Get all enabled EmailTemplateItems from template
2. For each item, calculate scheduled time
3. Skip callback-triggered items (on_application_submit, on_approval)
4. Skip if scheduled time is in past
5. Create ScheduledEmail records

**Methods**:
- `generate`: Generate all emails
- `generate_selective`: Generate specific emails by category/positions

#### EmailVariableResolver
**Purpose**: Replace template variables with actual data
**Variables Supported**:
- {{vendor_name}}, {{business_name}}, {{category}}, {{status}}
- {{event_title}}, {{event_date}}, {{venue}}, {{location}}
- {{deadline}}, {{application_deadline}}, {{payment_deadline}}
- {{registration_code}}, {{ticket_code}}, {{approval_code}}
- {{unsubscribe_link}}, {{invitation_url}}
- {{portal_url}}, {{dashboard_url}}

#### InvitationVariableResolver
**Purpose**: Similar to EmailVariableResolver but for invitation emails
**Context**: Resolves variables from EventInvitation and Event

#### RecipientFilterService
**Purpose**: Filter registrations based on filter_criteria
**Filter Options**:
- Status: approved, confirmed, pending, rejected, waitlist
- Vendor Category: food, beverage, entertainment, etc.
- Exclude Status: specific statuses to exclude
- Location: (prepared for future use)
- Unsubscribe Status: check email_unsubscribed flag

#### EmailCampaignTemplateCloner
**Purpose**: Clone email templates for organizations
**Usage**: When organization needs custom template based on system template

---

## 5. Background Job Processing

### 5.1 EmailSenderWorker (Cron: Every 5 minutes)
**Location**: `/app/workers/email_sender_worker.rb`
**Queue**: `email_delivery`
**Retry**: 2 times
**Schedule**: `*/5 * * * *` (every 5 minutes)

**Functionality**:
1. Find ScheduledEmails with:
   - Status = "scheduled"
   - scheduled_for <= now
   - scheduled_for >= 7 days ago
2. For each email, route based on category:
   - **event_announcements**: Use InvitationReminderService
   - **All others**: Use EmailSenderService
3. Update ScheduledEmail status to "sent" or "failed"
4. Log results

**Critical Routing Logic**:
- Validates that email_template_item exists
- Validates that category exists (prevents silent routing failures)
- Logs routing decision clearly

### 5.2 EmailDeliveryProcessorJob (No Cron - Webhook Triggered)
**Location**: `/app/workers/email_delivery_processor_job.rb`
**Queue**: `email_delivery`
**Retry**: 3 times
**Trigger**: SendGrid webhooks (delivered, bounce, dropped, deferred, unsubscribe)

**Webhook Event Handling**:
1. **delivered**: Update status = "delivered"
2. **bounce**: Determine hard vs soft bounce, schedule retry if soft
3. **dropped**: Update status = "dropped" (permanent failure)
4. **deferred**: Log only (temporary failure)
5. **unsubscribe/spamreport**: Mark unsubscribed, create EmailUnsubscribe record

**Message ID Lookup Strategy** (for invitation emails):
1. Try to find by sendgrid_message_id
2. If not found, try by recipient_email + recent timestamp (for SMTP-sent invitations)
3. If still not found, create record on-the-fly if custom args present (fallback)

**Bounce Type Detection**:
- **Hard**: "invalid", "does not exist", "unknown user", classification="hard"
- **Soft**: Temporary failures, mailbox full, server issues

**Retry Strategy**:
- Only soft bounces are retried
- Exponential backoff: 1 hour, 4 hours, 24 hours
- Max 3 retries
- Schedules EmailRetryJob

### 5.3 EmailRetryJob (Scheduled by EmailDeliveryProcessorJob)
**Location**: `/app/workers/email_retry_job.rb`
**Queue**: `email_delivery`
**Retry**: 2 times
**Triggered**: Automatically scheduled with exponential backoff

**Functionality**:
1. Find EmailDelivery record
2. Skip if already delivered or unsubscribed
3. Skip if max retries exceeded
4. Call EmailSenderService.retry_delivery
5. Update next_retry_at to nil
6. On final failure, mark as dropped

### 5.4 EmailRetryScannerJob (Cron: Every 30 minutes)
**Location**: `/app/workers/email_retry_scanner_job.rb`
**Queue**: `email_delivery`
**Schedule**: `*/30 * * * *` (every 30 minutes)

**Functionality**:
- Scan for EmailDelivery records with next_retry_at <= now
- Ensure EmailRetryJob is queued for those deliveries
- Failsafe mechanism in case job got lost

---

## 6. Email Controllers & API Endpoints

### 6.1 ScheduledEmailsController
**Namespace**: `/api/v1/presents/events/:event_id/scheduled_emails`
**Actions**:
- `index`: List scheduled emails with delivery counts, filters by status/category
- `show`: Show single email with deliveries
- `generate`: Generate new emails from template
- `generate_selective`: Generate specific emails by category/positions
- `create`: Create manual scheduled email
- `update`: Edit scheduled email (if not sent)
- `destroy`: Delete email
- `pause`: Pause a scheduled email
- `resume`: Resume a paused email
- `send_now`: Immediately send email (bypasses scheduled time)
- `preview`: Preview email content with variables resolved
- `retry_failed`: Retry failed deliveries for this email
- `recipients`: List of recipients who would receive this email

**Serialization**:
- Includes delivery_counts, undelivered_count, delivered_count, delivery_rate
- Includes overdue detection: overdue?, minutes_overdue, overdue_message
- Includes delivery_status

### 6.2 EmailCampaignTemplatesController
**Namespace**: `/api/v1/presents/organizations/:organization_id/email_campaign_templates`
**Actions**:
- `index`: List templates (system + organization's)
- `show`: Show template with items
- `create`: Create new organization template
- `update`: Update template
- `destroy`: Delete template
- `clone`: Clone template (system → organization)
- `set_default`: Set as default for organization

### 6.3 EmailTemplateItemsController
**Namespace**: `/api/v1/presents/email_campaign_templates/:template_id/items`
**Actions**:
- `index`: List items in template
- `create`: Add email to template
- `update`: Edit email details
- `destroy`: Remove email from template
- `reorder`: Change positions

### 6.4 EmailNotificationsController
**Purpose**: Event-triggered email sending (not background jobs)
**Use Cases**:
- Send event details change notifications
- Send status change notifications
- Send custom emails to recipients

### 6.5 EmailTestsController
**Purpose**: Testing email functionality
**Actions**:
- Preview email with sample data
- Send test email to admin
- Validate template variables

### 6.6 AdminEmailsController
**Purpose**: Administrative email management (undocumented, likely for manual ops)

---

## 7. Event Integration with Email System

### 7.1 Event Model Associations
```ruby
belongs_to :email_campaign_template, optional: true
has_many :scheduled_emails, dependent: :destroy
has_many :email_deliveries, dependent: :destroy
has_many :email_unsubscribes, dependent: :destroy
has_many :unsubscribe_tokens, dependent: :delete_all
```

### 7.2 Event Callbacks
```ruby
after_create :assign_email_template_and_generate_emails
after_update :send_event_change_notifications
```

**assign_email_template_and_generate_emails**:
1. Assign organization's default or system default template
2. Automatically generate ScheduledEmail records
3. Emails ready to send based on event dates

**send_event_change_notifications**:
- Triggers if event_date, venue, location, start_time, or end_time changes
- Sends notifications to registrations if event is published

### 7.3 Event Email Notification Count
```ruby
def email_notification_count
  registrations.where(email_unsubscribed: false).count
end
```

### 7.4 Event Details Requiring Notification
```ruby
def details_changed_requiring_notification?
  saved_change_to_event_date? ||
  saved_change_to_venue? ||
  saved_change_to_location? ||
  saved_change_to_start_time? ||
  saved_change_to_end_time?
end
```

---

## 8. Registration & Invitation Integration

### 8.1 Registration Model
**Email Associations**:
```ruby
has_many :email_deliveries, dependent: :destroy
```

**Callbacks**:
```ruby
after_create :send_confirmation_email
after_update :send_status_update_email, if: :saved_change_to_status?
```

**Status Values**: pending, confirmed, approved, rejected, waitlist, cancelled

**Key Fields**:
- `email`: Unique per event
- `email_unsubscribed`: Boolean flag
- `vendor_application_id`: Links to vendor application
- `vendor_category`: Category (food, beverage, etc.)

### 8.2 EventInvitation Model
**Email Associations**:
```ruby
has_many :email_deliveries, dependent: :destroy
```

**Status Flow**:
- pending → sent → viewed → accepted/declined/expired

**Key Fields**:
- `invitation_token`: Unique token for tracking
- `invitation_url`: Generated URL for accepting/declining
- `sent_at`, `responded_at`: Timestamps

---

## 9. Email Template Categories

Based on the codebase, the following categories are used for routing:

1. **event_announcements**: Invitation-based emails (application deadlines, event details)
   - Recipients: EventInvitations → VendorContacts
   - Service: InvitationReminderService
   
2. **application_updates**: Application status notifications
   - Recipients: Registrations
   - Service: EmailSenderService
   
3. **payment_reminders**: Payment-related emails
   - Recipients: Registrations
   - Service: EmailSenderService
   
4. **event_updates**: Event details change notifications
   - Recipients: Registrations
   - Service: EmailSenderService

5. (Other custom categories defined by organizations)

---

## 10. SendGrid Integration

### 10.1 Message Tracking
**Custom Args** (sent in X-SMTPAPI header):
```json
{
  "unique_args": {
    "event_id": "12345",
    "event_invitation_id": "67890",
    "email_type": "invitation",
    "registration_id": "11111",
    "scheduled_email_id": "22222"
  }
}
```

### 10.2 Webhook Events Handled
- **delivered**: Email successfully delivered
- **bounce**: Email bounced (hard or soft)
- **dropped**: Email dropped by SendGrid
- **deferred**: Temporary delivery failure
- **unsubscribe**: User clicked unsubscribe
- **spamreport**: User marked as spam

### 10.3 Message ID Formats
- SendGrid: `sg_message_id` (standard format)
- SMTP: `smtp-id` (from SMTP bounce notifications, wrapped in <>)

---

## 11. Recent Email-Related Changes & Issues

### 11.1 Recent Commits (Git History)
```
a54d7333 - fix email template copy
ae6bc2cf - update events controller to look for other selected mail sequences
52dbe2b3 - create new test event for sequence
a73dad21 - Merge PR #57: registration-email-history-api
7f062e73 - Add email history endpoint for event invitations
7283dc82 - Add email history endpoint for registrations
3df00b17 - Merge PR #56: pancake-booze-email-sequence
de000276 - Add Pancake & Booze email sequence documentation
0a8290ab - Add Pancake & Booze email sequence template with 30 emails
5d631e1a - Add SendGrid webhook monitoring for email delivery tracking
0b019f4c - Fix Instagram and TikTok profile links in vendor notification emails
f5c42368 - Improve vendor application UX and email templates
4b3031b6 - Update email templates with simplified copy and consistent placeholders
```

### 11.2 Identified Issues & Fixes
1. **Email Template Copy**: Recent fix to email template text (commit a54d7333)
2. **Mail Sequence Selection**: Update to events controller for selecting different mail sequences (commit ae6bc2cf)
3. **Profile Links**: Fixed Instagram/TikTok links in vendor emails
4. **Webhook Monitoring**: Added SendGrid webhook monitoring for delivery tracking
5. **Template Copy**: Multiple iterations on simplifying and standardizing email templates

### 11.3 Notable Features
- **30-Email Sequence**: Pancake & Booze pilot with comprehensive email sequence
- **Email History API**: New endpoints to view sent email history (registrations & invitations)
- **Webhook Integration**: Full SendGrid webhook support for delivery tracking
- **Delivery Analytics**: Tracking opens, clicks, bounces

---

## 12. Key Design Patterns & Architectural Decisions

### 12.1 Template vs. Instance Pattern
- **Template** (EmailTemplateItem): Reusable email definition
- **Instance** (ScheduledEmail): Scheduled execution for specific event
- Allows bulk updates to templates without affecting sent emails

### 12.2 Dual Recipient Systems
1. **Registrations**: Vendors who applied (vendor applications)
   - Email stored in Registration.email
   - Tracked via ScheduledEmail + EmailDelivery chain
   
2. **Invitations**: Pre-invited contacts
   - Email stored in VendorContact.email
   - Tracked via EventInvitationMailer + EventInvitation + EmailDelivery

### 12.3 Three-Tier Unsubscribe Scope
Allows users to manage preferences at multiple levels:
- Don't receive from anyone (global)
- Don't receive from organization (org-level)
- Don't receive from specific event (event-level)

### 12.4 Soft Bounce Retry Strategy
- Only retries soft bounces (temporary failures)
- Hard bounces (invalid emails) are not retried
- Exponential backoff to respect recipient servers
- Max 3 retries before permanent failure

### 12.5 Message ID Resilience
Multiple fallbacks for matching webhooks to emails:
1. Direct match by sendgrid_message_id (primary)
2. Match by recipient_email + timestamp (for SMTP-sent invitations)
3. Create on-the-fly from custom args (last resort)

### 12.6 Variable Resolution
Template supports flexible variable syntax:
- `{{variable_name}}`: Resolved at send time
- Unknown variables left as-is or logged as warnings
- Both EmailVariableResolver and InvitationVariableResolver support different contexts

---

## 13. Production Operations & Admin Scripts

### 13.1 Available Admin Tools
Located in: `/lib/scripts/`

**email_retry.rb**: Manually retry failed email deliveries
- Options: --event=SLUG, --emails=LIST, --status=STATUS, --type=TYPE, --dry-run
- Safety: Requires confirmation or ALLOW_PRODUCTION_SCRIPTS=true env var

**data_backup.rb**: Backup and restore event data

**spam_resend.rb**: Resend emails that went to spam

### 13.2 Monitoring & Observability
- Sidekiq Web UI: `/sidekiq` (requires authentication)
- Rails logs: EmailSenderWorker, EmailDeliveryProcessorJob, services all log extensively
- SendGrid dashboard: Direct webhook and delivery tracking
- EmailDelivery table: Query for delivery status by recipient, event, status

### 13.3 Common Troubleshooting Scenarios
1. **Check scheduled emails** ready to send:
   ```sql
   SELECT * FROM scheduled_emails 
   WHERE status = 'scheduled' AND scheduled_for <= NOW()
   ORDER BY scheduled_for ASC;
   ```

2. **Check delivery failures**:
   ```sql
   SELECT * FROM email_deliveries 
   WHERE status IN ('bounced', 'dropped') 
   ORDER BY created_at DESC;
   ```

3. **Find unsubscribed users** for an event:
   ```sql
   SELECT * FROM email_unsubscribes 
   WHERE scope = 'event' AND event_id = ?;
   ```

4. **Check overdue scheduled emails**:
   - ScheduledEmail#overdue? method with 10-minute grace period

---

## 14. Template Variable Reference

### Supported in EmailVariableResolver:
- {{vendor_name}}, {{business_name}}, {{category}}, {{status}}
- {{event_title}}, {{event_date}}, {{venue}}, {{location}}
- {{deadline}}, {{application_deadline}}, {{payment_deadline}}
- {{registration_code}}, {{ticket_code}}, {{approval_code}}
- {{unsubscribe_link}}, {{invitation_url}}
- {{portal_url}}, {{dashboard_url}}
- {{organization_name}}, {{organization_email}}

### Supported in InvitationVariableResolver:
- {{vendor_contact_name}}, {{event_title}}, {{location}}
- {{invitation_url}}, {{unsubscribe_link}}
- (See specific service implementation for complete list)

---

## 15. Database Indexes & Performance Optimization

### Key Indexes for Email Operations:
```
email_deliveries:
  - (event_id, status): Fast filtering by event and status
  - (scheduled_email_id): Join with scheduled emails
  - sendgrid_message_id: Fast webhook lookups

scheduled_emails:
  - (event_id, status): Find ready-to-send emails
  - (status, scheduled_for): Order for processing
  - filter_criteria (JSONB GIN): Filter queries

email_template_items:
  - (email_campaign_template_id, position): Order items

email_unsubscribes:
  - (email, event_id): Event-level unsubscribe lookups
  - (email, organization_id): Org-level unsubscribe lookups
  - (email): Global unsubscribe lookup
```

---

## 16. Security & Privacy Considerations

### 16.1 Unsubscribe Security
- UnsubscribeTokenService generates secure, time-bound tokens
- Tokens stored in unsubscribe_tokens table
- Email-only verification (no login required for unsubscribe)

### 16.2 Data Protection
- Email addresses normalized (lowercase, stripped) before storage
- Soft deletes for unsubscribe (EmailUnsubscribe records)
- Audit trail: unsubscribe_source tracks how unsubscribe happened
- Resubscribe capability: delete EmailUnsubscribe record to re-enable

### 16.3 Compliance
- Three-tier unsubscribe system (global, org, event-level)
- Respects SendGrid unsubscribe webhooks
- Email verification for sensitive operations

---

## Summary

The Voxxy Presents email system is a **comprehensive, production-grade email automation platform** with:

✓ **40+ email template support** with customizable sequences
✓ **Dual delivery mechanisms** (registration-based and invitation-based)
✓ **Full SendGrid webhook integration** for delivery tracking
✓ **Intelligent retry logic** for soft bounces with exponential backoff
✓ **Three-tier unsubscribe management** (global, org, event)
✓ **Template variable resolution** for personalization
✓ **Robust background job processing** via Sidekiq (every 5 & 30 minutes)
✓ **Admin tools** for manual intervention and recovery
✓ **Comprehensive logging** for debugging
✓ **Event-driven architecture** that automatically generates schedules

The system is designed for **high-volume event email campaigns** with sophisticated tracking, management, and compliance features.

