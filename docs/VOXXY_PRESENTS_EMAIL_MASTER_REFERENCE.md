# 📧 Voxxy Presents Email System - Master Reference

**Last Updated:** January 17, 2026
**Total Emails:** 17 (7 scheduled + 10 transactional)
**Purpose:** Complete reference for ALL emails used in Voxxy Presents
**Audience:** Developers making email edits across the entire system

**Recent Changes (Jan 17, 2026):**
- ✅ Removed 4 invitation accept/decline emails (21 → 17 total)
- ✅ All emails now use Eastern timezone (was UTC)
- ✅ Removed emojis from all subject lines
- ✅ Simplified styling for better deliverability

---

## 📑 Table of Contents

1. [Email System Overview](#email-system-overview)
2. [Email Categories](#email-categories)
3. [All Voxxy Presents Emails](#all-voxxy-presents-emails)
4. [Email Styling & Branding](#email-styling--branding)
5. [Variable System](#variable-system)
6. [How to Edit Emails](#how-to-edit-emails)
7. [Testing Emails](#testing-emails)
8. [Quick File Reference](#quick-file-reference)

---

## Email System Overview

Voxxy Presents has **TWO distinct email systems**:

### System 1: Automated Scheduled Emails (7 emails)
- **Purpose:** Time-based automated campaigns throughout event lifecycle
- **Technology:** Database-driven, SendGrid delivery, Sidekiq background jobs
- **Customizable:** Yes, per organization via email templates
- **Location:** Seed file (`db/seeds/email_campaign_templates.rb`)
- **Delivery:** Automatic via EmailSenderWorker (every 5 minutes)
- **Tracking:** Full delivery tracking with EmailDelivery records

### System 2: Transactional Service Emails (10 emails)
- **Purpose:** Immediate emails triggered by specific actions
- **Technology:** Ruby service classes, SendGrid delivery
- **Customizable:** No (hardcoded in services)
- **Location:** Service files (`app/services/`, `app/mailers/`)
- **Delivery:** Immediate (synchronous or via model callbacks)
- **Tracking:** Via SendGrid categories only

**Total Emails:** 17 (7 scheduled + 10 transactional)

---

## Email Categories

### Category A: Scheduled Automated Emails
**Count:** 7 emails
**Editable via:** Database seed file
**Sent via:** EmailSenderService + Sidekiq worker

1. Application deadline reminders (2 emails)
2. Payment reminders (2 emails)
3. Event countdown (3 emails)

### Category B: Vendor Application Emails
**Count:** 4 emails
**Editable via:** RegistrationEmailService
**Sent via:** Model callbacks or service calls

1. Application confirmation
2. Approval notification
3. Rejection notification
4. Waitlist notification

### Category C: Event Invitation Email
**Count:** 1 email
**Editable via:** EventInvitationMailer + email template
**Sent via:** ActionMailer

1. Vendor invitation (announcement)

### Category D: Admin/Producer Notification Emails
**Count:** 2+ emails
**Editable via:** RegistrationEmailService
**Sent via:** Service calls

1. New vendor submission notification
2. Payment confirmation
3. Category change notification
4. Event details changed (bulk)
5. Event canceled (bulk)

---

## All Voxxy Presents Emails

### 🎯 CATEGORY A: Scheduled Automated Emails (7 total)

#### A1. **1 Day Before Application Deadline**
- **File:** `db/seeds/email_campaign_templates.rb`
- **Trigger:** 1 day before `application_deadline` at 09:00 EST
- **Recipients:** All vendors (no filter)
- **Subject:** `Last Chance: [eventName] Applications Close Tomorrow`
- **Purpose:** Urgency reminder before deadline
- **Variables:** `[eventName]`, `[eventDate]`, `[eventVenue]`, `[eventLocation]`, `[boothPrice]`, `[eventLink]`, `[organizationName]`
- **Status:** ✅ Active

#### A2. **Application Deadline Day**
- **File:** `db/seeds/email_campaign_templates.rb`
- **Trigger:** On `application_deadline` day at 08:00 EST
- **Recipients:** All vendors (no filter)
- **Subject:** `URGENT: [eventName] Applications Close Today`
- **Purpose:** Final urgency on deadline day
- **Variables:** Same as A1
- **Status:** ✅ Active

#### A3. **1 Day Before Payment Due**
- **File:** `db/seeds/email_campaign_templates.rb`
- **Trigger:** 1 day before payment deadline at 10:00 EST
- **Recipients:** **Approved vendors only** (`status: ['approved']`)
- **Subject:** `Reminder: Payment Due Tomorrow - [eventName]`
- **Purpose:** Payment reminder
- **Variables:** `[firstName]`, `[eventName]`, `[paymentDueDate]`, `[boothPrice]`, `[paymentLink]`, `[organizationName]`
- **Status:** ✅ Active

#### A4. **Payment Due Today**
- **File:** `db/seeds/email_campaign_templates.rb`
- **Trigger:** On payment deadline at 08:00 EST
- **Recipients:** **Approved vendors only** (`status: ['approved']`)
- **Subject:** `URGENT: Payment Due Today - [eventName]`
- **Purpose:** Final payment urgency
- **Variables:** Same as A3 + `[organizationEmail]`
- **Status:** ✅ Active

#### A5. **1 Day Before Event**
- **File:** `db/seeds/email_campaign_templates.rb`
- **Trigger:** 1 day before `event_date` at 17:00 EST
- **Recipients:** **Approved/Confirmed vendors** (`status: ['approved', 'confirmed']`)
- **Subject:** `Tomorrow: [eventName] Final Details`
- **Purpose:** Final preparation reminders
- **Variables:** `[firstName]`, `[eventName]`, `[installDate]`, `[installTime]`, `[eventDate]`, `[eventTime]`, `[eventVenue]`, `[bulletinLink]`, `[organizationName]`
- **Status:** ✅ Active

#### A6. **Day of Event**
- **File:** `db/seeds/email_campaign_templates.rb`
- **Trigger:** On `event_date` at 07:00 EST
- **Recipients:** **Approved/Confirmed vendors** (`status: ['approved', 'confirmed']`)
- **Subject:** `Today: [eventName]`
- **Purpose:** Event day reminders
- **Variables:** Same as A5
- **Status:** ✅ Active

#### A7. **Day After Event - Thank You**
- **File:** `db/seeds/email_campaign_templates.rb`
- **Trigger:** 1 day after `event_date` at 10:00 EST
- **Recipients:** **Approved/Confirmed vendors** (`status: ['approved', 'confirmed']`)
- **Subject:** `Thank You for Participating in [eventName]`
- **Purpose:** Post-event gratitude
- **Variables:** `[firstName]`, `[eventName]`, `[organizationName]`
- **Status:** ✅ Active

---

### 🎯 CATEGORY B: Vendor Application Emails (4 total)

#### B1. **Vendor Application Confirmation**
- **File:** `app/services/registration_email_service.rb` (Lines 163-220)
- **Trigger:** Immediately when vendor submits application (Registration.after_create)
- **Recipients:** Vendor applicant
- **Subject:** `Application Received - #{event.title}`
- **Purpose:** Confirm application received
- **Template:** `build_presents_email_template` with organization branding
- **Styling:** Purple gradient background, Montserrat font, organization header
- **Status:** ✅ Active
- **SendGrid Category:** `transactional`, `application-confirmation`

#### B2. **Application Approved**
- **File:** `app/services/registration_email_service.rb`
- **Trigger:** When registration status changes to "approved"
- **Recipients:** Vendor applicant
- **Subject:** `Your Application Was Approved - #{event.title}`
- **Purpose:** Notify approval
- **Template:** Approval details with payment instructions
- **Status:** ✅ Active
- **SendGrid Category:** `transactional`, `application-approved`

#### B3. **Application Rejected**
- **File:** `app/services/registration_email_service.rb` (Lines 330-369)
- **Trigger:** When registration status changes to "rejected"
- **Recipients:** Vendor applicant
- **Subject:** `Update on Your Application - #{event.title}`
- **Purpose:** Polite rejection notice
- **Template:** Neutral messaging, encouragement for future events
- **Status:** ✅ Active
- **SendGrid Category:** `transactional`, `application-rejected`

#### B4. **Moved to Waitlist**
- **File:** `app/services/registration_email_service.rb` (Lines 372-424)
- **Trigger:** When registration status changes to "waitlist"
- **Recipients:** Vendor applicant
- **Subject:** `You're on the Waitlist - #{event.title}`
- **Purpose:** Notify of waitlist status (usually due to missed payment)
- **Template:** Explanation with producer contact info
- **Status:** ✅ Active
- **SendGrid Category:** `transactional`, `application-waitlist`

---

### 🎯 CATEGORY C: Event Invitation Email (1 total)

#### C1. **Vendor Invitation**
- **File:** `app/mailers/event_invitation_mailer.rb`
- **View Template:** `app/views/event_invitation_mailer/invitation_email.html.erb`
- **Trigger:** When producer sends batch invitations
- **Recipients:** Vendor contacts selected by producer
- **Subject:** `#{event.title} is coming in #{event.location}`
- **Purpose:** Invite vendors to event (announcement email)
- **Workflow:** Vendors apply through normal application system if interested
- **Contains:** Event details, invitation URL with token
- **Status:** ✅ Active
- **Note:** Removed accept/decline workflow (January 17, 2026) - vendors simply apply if interested

---

### 🎯 CATEGORY D: Admin/Producer Notification Emails (5 total)

#### D1. **New Vendor Submission Notification**
- **File:** `app/services/registration_email_service.rb` (Lines 17-89)
- **Trigger:** Immediately when vendor submits application
- **Recipients:** Event owner/producer
- **Subject:** `New Vendor Application for #{event.title}`
- **Purpose:** Alert producer of new submission
- **Contains:** Vendor details, business info, social media, note from vendor
- **Template:** Info box with all vendor details, review button
- **Status:** ✅ Active
- **SendGrid Category:** `transactional`, `vendor-submission`

#### D2. **Payment Confirmed**
- **File:** `app/services/registration_email_service.rb`
- **Trigger:** Manual (via email notification controller)
- **Recipients:** Vendor whose payment was confirmed
- **Subject:** `Payment Confirmed - #{event.title}`
- **Purpose:** Confirm payment received
- **Contains:** Category, amount paid, event details, install schedule
- **Status:** ✅ Active
- **SendGrid Category:** `transactional`, `payment-confirmed`

#### D3. **Category Changed Notification**
- **File:** `app/services/registration_email_service.rb` (Lines 505-561)
- **Trigger:** Manual (via email notification controller)
- **Recipients:** Vendor whose category was changed
- **Subject:** `Category Update - #{event.title}`
- **Purpose:** Notify of category change and new pricing
- **Status:** ✅ Active
- **SendGrid Category:** `transactional`, `category-changed`

#### D4. **Event Details Changed (Bulk)**
- **File:** `app/services/registration_email_service.rb`
- **Trigger:** Manual (via email notification controller) when event details change
- **Recipients:** ALL registered vendors (excluding unsubscribed)
- **Subject:** `Event Update - #{event.title}`
- **Purpose:** Notify all vendors of event changes (date, venue, time)
- **Bulk:** Yes (iterates through all registrations)
- **Status:** ✅ Active
- **SendGrid Category:** `transactional`, `event-details-changed`

#### D5. **Event Canceled (Bulk)**
- **File:** `app/services/registration_email_service.rb`
- **Trigger:** Manual (via email notification controller) when event canceled
- **Recipients:** ALL registered vendors (excluding unsubscribed)
- **Subject:** `Event Canceled - #{event.title}`
- **Purpose:** Notify all vendors of cancellation and refund info
- **Bulk:** Yes (iterates through all registrations)
- **Status:** ✅ Active
- **SendGrid Category:** `transactional`, `event-canceled`

---

## Email Styling & Branding

**Last Updated:** January 17, 2026 - Simplified styling for better deliverability

### All Emails (Unified Styling)
**Source:** BaseEmailService provides BASE_STYLES constants

**Design Philosophy:**
- **No emojis** in subject lines or content (removed Jan 2026)
- **Plain text links** instead of styled buttons (better deliverability)
- **Simplified colors** (neutral grays and blues)
- **System fonts** (no external font loading)

**Key Styling Constants (`BASE_STYLES`):**
```ruby
background: "#f5f5f5" (light gray)
container: "#ffffff" (white)
border: "1px solid #e0e0e0"
text_color: "#333333" (dark gray)
link_color: "#0066cc" (blue)
footer_color: "#888888" (medium gray)
font_family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
```

**Template Method:**
```ruby
build_simple_email_template(heading, message, link_text, link_url)
```

**Organization Branding:**
- Header shows organization name
- Uses organization email as from address if available
- Fallback: `team@voxxyai.com` / "Voxxy Presents"

**Links:**
- Plain underlined text links (no buttons)
- Blue color (#0066cc)
- Full URLs displayed for transparency

---

## Variable System

### Automated Scheduled Emails (Category A)

**Variable Format:** Square brackets `[variableName]`

**Resolution:** `EmailVariableResolver` service (`app/services/email_variable_resolver.rb`)

**Available Variables:**

#### Event Variables
```
[eventName]         → Event title
[eventTitle]        → Event title (alias)
[eventDate]         → Formatted date (June 15, 2025)
[eventTime]         → Event time (10:00 AM - 6:00 PM)
[eventVenue]        → Venue name
[eventLocation]     → Full location (City, State)
[eventLink]         → Public event detail page URL
[applicationDeadline] → Application deadline date
[boothPrice]        → Booth/vendor fee amount
```

#### Vendor/Registration Variables
```
[firstName]         → First name from full name
[vendorName]        → Full vendor name
[businessName]      → Business/company name
[vendorCategory]    → Category (Food, Art, etc.)
```

#### Organization Variables
```
[organizationName]  → Organization/venue name
[organizationEmail] → Organization contact email
[producerName]      → Organization name (alias)
[producerEmail]     → Organization email (alias)
```

#### Special Variables
```
[paymentLink]       → Payment URL
[paymentDueDate]    → Payment deadline date
[installDate]       → Setup/install date
[installTime]       → Setup time window
[bulletinLink]      → Event bulletin/info page
```

### Service Emails (Categories B, C, D)

**Variable Format:** Ruby string interpolation `#{variable}`

**Resolution:** Direct Ruby variable substitution in service methods

**Available Variables:**
- `event.title`, `event.event_date`, `event.venue`, `event.location`
- `registration.name`, `registration.business_name`, `registration.vendor_category`
- `organization.name`, `organization.email`
- `producer_name`, `producer_email`
- `first_name` (parsed from full name)
- Plus any Ruby variables in scope

---

## How to Edit Emails

### Editing Scheduled Emails (Category A)

**File to Edit:** `/Users/beaulazear/Desktop/voxxy-rails/db/seeds/email_campaign_templates.rb`

**Steps:**
1. Locate the email by position or name (search for the subject line)
2. Edit `subject_template` or `body_template` fields
3. Use square brackets for variables: `[eventName]`, `[firstName]`
4. Save file
5. Re-run seed file:
   ```bash
   bundle exec rails runner db/seeds/email_campaign_templates.rb
   ```
6. Regenerate for existing events or wait for new events

**Example:**
```ruby
create_email(template, {
  name: '1 Day Before Application Deadline',
  position: 1,
  category: 'event_announcements',
  subject_template: "⏰ Last Chance: [eventName] Applications Close Tomorrow!",  # Edit this
  body_template: <<~HTML,  # Edit this
    <p>Hi [firstName],</p>
    <p>Your application deadline is tomorrow!</p>
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 1,
  trigger_time: '09:00'
})
```

### Editing Service Emails (Categories B, C, D)

**Files to Edit:**
- Vendor application emails: `app/services/registration_email_service.rb`
- Invitation emails:
  - Controller logic: `app/mailers/event_invitation_mailer.rb`
  - HTML templates: `app/views/event_invitation_mailer/*.html.erb`

**Steps:**
1. Locate the method (e.g., `send_approval_email`)
2. Edit `subject` string
3. Edit `content` HTML heredoc
4. Use Ruby interpolation `#{variable}`
5. Save file
6. Restart Rails server if needed
7. Test by triggering the action

**Example:**
```ruby
def self.send_approval_email(registration)
  event = registration.event

  subject = "🎉 Your Application Was Approved - #{event.title}"  # Edit this

  content = <<~HTML  # Edit this
    <p style="#{BASE_STYLES[:text]}">
      Hi #{registration.name},
    </p>
    <p style="#{BASE_STYLES[:text]}">
      Great news! Your application has been approved!
    </p>
  HTML

  # ... rest of method
end
```

### Editing Invitation Email Templates

**Files to Edit:** `app/views/event_invitation_mailer/*.html.erb`

**Example Files:**
- `invitation_email.html.erb` - Initial invitation
- `accepted_confirmation_vendor.html.erb` - Acceptance confirmation
- `declined_notification_producer.html.erb` - Decline notification

**Steps:**
1. Open the `.html.erb` file
2. Edit HTML and ERB tags (`<%= @variable %>`)
3. Use instance variables: `@event`, `@vendor_contact`, `@organization`, `@invitation`
4. Save file
5. Test by sending invitation

**Example:**
```erb
<h1>You're Invited to <%= @event.title %></h1>

<p>Dear <%= @vendor_contact.name %>,</p>

<p>We'd love to have you participate in our event!</p>

<a href="<%= @invitation_url %>">View Invitation</a>
```

---

## Testing Emails

### Testing Scheduled Emails

**Rails Console:**
```ruby
# Find or create test event
event = Event.last
email = event.scheduled_emails.first

# Send to single registration
registration = event.registrations.first
service = EmailSenderService.new(email)
service.send_to_registration(registration)

# Or send to all matching recipients
result = service.send_to_recipients
puts "Sent: #{result[:sent]}, Failed: #{result[:failed]}"
```

**Preview Variables:**
```ruby
# Test variable resolution
resolver = EmailVariableResolver.new(event, registration)
subject = resolver.resolve("[eventName] - Payment Due")
puts subject  # => "Summer Market 2025 - Payment Due"

body = resolver.resolve("<p>Hi [firstName],</p>")
puts body  # => "<p>Hi John,</p>"
```

### Testing Service Emails

**Rails Console:**
```ruby
# Test vendor application confirmation
registration = Registration.last
RegistrationEmailService.send_confirmation(registration)

# Test approval email
RegistrationEmailService.send_approval_email(registration)

# Test owner notification
RegistrationEmailService.notify_owner_of_submission(registration)

# Test bulk email (event update)
event = Event.last
result = RegistrationEmailService.send_event_details_changed_to_all(event)
puts "Sent: #{result[:sent]}, Failed: #{result[:failed]}"
```

### Testing Invitation Emails

**Rails Console:**
```ruby
# Find invitation
invitation = EventInvitation.last

# Send invitation
EventInvitationMailer.invitation_email(invitation).deliver_now

# Send acceptance confirmation
EventInvitationMailer.accepted_confirmation_vendor(invitation).deliver_now

# Send decline notification to producer
EventInvitationMailer.declined_notification_producer(invitation).deliver_now
```

### Viewing Sent Emails (Development)

**Option 1: Check Rails Logs**
```bash
tail -f log/development.log | grep -E "(Email sent|Sending)"
```

**Option 2: Use Letter Opener (Recommended)**

Add to `Gemfile`:
```ruby
group :development do
  gem 'letter_opener'
end
```

Configure `config/environments/development.rb`:
```ruby
config.action_mailer.delivery_method = :letter_opener
config.action_mailer.perform_deliveries = true
```

Emails will open in your browser automatically when sent!

---

## Quick File Reference

### Scheduled Email System
```
Email Templates (seed):
└── db/seeds/email_campaign_templates.rb (7 emails)

Models:
├── app/models/email_campaign_template.rb
├── app/models/email_template_item.rb
├── app/models/scheduled_email.rb
└── app/models/email_delivery.rb

Services:
├── app/services/email_sender_service.rb (sends via SendGrid)
├── app/services/email_variable_resolver.rb (variable substitution)
├── app/services/email_schedule_calculator.rb (timing)
├── app/services/scheduled_email_generator.rb (creates from template)
└── app/services/recipient_filter_service.rb (filters recipients)

Workers:
└── app/workers/email_sender_worker.rb (runs every 5 minutes)

Controllers:
└── app/controllers/api/v1/presents/scheduled_emails_controller.rb
```

### Service Email System
```
Services:
├── app/services/base_email_service.rb (styling, SendGrid integration)
└── app/services/registration_email_service.rb (vendor application emails)

Mailers:
└── app/mailers/event_invitation_mailer.rb (invitation emails)

Views:
└── app/views/event_invitation_mailer/
    ├── invitation_email.html.erb
    ├── accepted_confirmation_vendor.html.erb
    ├── accepted_notification_producer.html.erb
    ├── declined_confirmation_vendor.html.erb
    └── declined_notification_producer.html.erb
```

### Email Notification Controllers
```
Controllers:
└── app/controllers/api/v1/presents/email_notifications_controller.rb
    (handles payment confirmation, category change, event update emails)
```

---

## Summary Statistics

### Email Count by Category
- **Category A (Scheduled):** 7 emails
- **Category B (Vendor Application):** 4 emails
- **Category C (Invitations):** 5 emails
- **Category D (Admin/Producer):** 5 emails
- **TOTAL:** 21 emails

### Email Count by Type
- **Automated (time-based):** 7 emails
- **Transactional (action-triggered):** 14 emails

### Email Count by System
- **Scheduled email system:** 7 emails
- **Service email system:** 14 emails

---

## Additional Documentation

For more detailed information, see:
- **Email Automation Guide:** `/docs/EMAIL_AUTOMATION_SYSTEM_GUIDE.md` (3000+ lines)
- **Email System Documentation:** `/docs/EMAIL_SYSTEM_DOCUMENTATION.md` (2000+ lines)
- **Email Notification System:** `/docs/EMAIL_NOTIFICATION_SYSTEM.md` (472 lines)
- **SendGrid Webhook Setup:** `/docs/SENDGRID_WEBHOOK_SETUP.md` (365 lines)

---

## Quick Edit Cheatsheet

| Email | File | Line Range | Method/Section |
|-------|------|------------|----------------|
| Application Deadline -1 day | `email_campaign_templates.rb` | 46-77 | Position 1 |
| Application Deadline Day | `email_campaign_templates.rb` | 79-112 | Position 2 |
| Payment Due -1 day | `email_campaign_templates.rb` | 122-150 | Position 3 |
| Payment Due Today | `email_campaign_templates.rb` | 152-180 | Position 4 |
| 1 Day Before Event | `email_campaign_templates.rb` | 190-229 | Position 5 |
| Day of Event | `email_campaign_templates.rb` | 231-269 | Position 6 |
| Day After Event | `email_campaign_templates.rb` | 271-302 | Position 7 |
| Application Confirmation | `registration_email_service.rb` | 163-220 | `send_vendor_submission_confirmation` |
| Approval Email | `registration_email_service.rb` | 282-327 | `send_approval_email` |
| Rejection Email | `registration_email_service.rb` | 330-369 | `send_rejection_email` |
| Waitlist Email | `registration_email_service.rb` | 372-424 | `send_waitlist_notification` |
| Payment Confirmed | `registration_email_service.rb` | 427-502 | `send_payment_confirmation` |
| Category Changed | `registration_email_service.rb` | 505-561 | `send_category_change_notification` |
| Event Details Changed | `registration_email_service.rb` | 564-635 | `send_event_details_changed_to_all` |
| Event Canceled | `registration_email_service.rb` | 638-703 | `send_event_canceled_to_all` |
| Vendor Invitation | `event_invitation_mailer.rb` + view | 3-21 | `invitation_email` |
| Invitation Accepted (Vendor) | `event_invitation_mailer.rb` + view | 24-34 | `accepted_confirmation_vendor` |
| Invitation Accepted (Producer) | `event_invitation_mailer.rb` + view | 37-48 | `accepted_notification_producer` |
| Invitation Declined (Vendor) | `event_invitation_mailer.rb` + view | 51-60 | `declined_confirmation_vendor` |
| Invitation Declined (Producer) | `event_invitation_mailer.rb` + view | 63-74 | `declined_notification_producer` |
| New Submission Notification | `registration_email_service.rb` | 17-89 | `notify_owner_of_submission` |

---

**🎉 You now have complete reference for all Voxxy Presents emails!**

**Questions?** Reference the detailed documentation files in `/docs` or check service/mailer code directly.

**Last Updated:** January 17, 2026
