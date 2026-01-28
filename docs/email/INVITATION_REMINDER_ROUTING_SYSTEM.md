# 📧 Invitation Reminder Routing System & Recipients Modal

**Created:** January 27, 2026
**Last Updated:** January 27, 2026
**Purpose:** Document the email routing system that distinguishes between invitation reminders and registration-based emails
**Status:** ✅ Production Ready

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Problem Solved](#problem-solved)
3. [Architecture](#architecture)
4. [Implementation Details](#implementation-details)
5. [Recipients Modal Feature](#recipients-modal-feature)
6. [Testing](#testing)
7. [Verification](#verification)

---

## Overview

The Invitation Reminder Routing System implements category-based email routing to correctly target different recipient groups based on their relationship to the event:

- **Initial Invitations** → Invited vendor contacts (sent when invitations are created)
- **Application Deadline Reminders** (`event_announcements`) → Invited contacts who haven't applied yet
- **All Other Scheduled Emails** → Registered vendors (filtered by status, payment, etc.)

This ensures that:
- Application deadline reminders only go to people who were invited but haven't submitted an application
- Payment reminders only go to approved vendors who haven't paid
- Event reminders only go to confirmed/paid vendors

---

## Problem Solved

### Before This System

**Issue:** All scheduled emails used `RecipientFilterService`, which ONLY queries the `registrations` table.

**Specific Problem:**
Application deadline reminder emails were trying to target `registrations.where(status: 'pending')`, but:
1. "Pending" registrations are people who HAVE applied (waiting for approval)
2. People who were invited but haven't applied yet are NOT in the registrations table at all
3. They only exist in `event_invitations` → `vendor_contacts`

**Result:** Application deadline reminders were going to the wrong people or nobody at all.

### After This System

**Solution:** Category-based routing in `EmailSenderWorker`:
- `event_announcements` emails → Route to `InvitationReminderService`
- All other emails → Route to `EmailSenderService` (registration-based)

**Result:** Each email type targets the correct audience with proper filtering.

---

## Architecture

### High-Level Flow

```
ScheduledEmail (database record)
       ↓
  scheduled_for time arrives
       ↓
EmailSenderWorker (background job)
       ↓
 Check: email_template_item.category
       ↓
   ┌──────────────────────────────┐
   │                              │
category == "event_announcements" │  All other categories
       ↓                          │         ↓
InvitationReminderService         │  EmailSenderService
       ↓                          │         ↓
Filter invited contacts           │  Filter registrations
       ↓                          │         ↓
Send to vendor_contacts.email     │  Send to registrations.email
```

### Data Model Relationships

```
Event
  ├── event_invitations → vendor_contacts (invited people)
  │   └── Used by: InvitationReminderService
  │
  └── registrations (people who applied)
      └── Used by: EmailSenderService
```

### Category Mapping

| Email Type | Category | Service | Target Audience |
|------------|----------|---------|----------------|
| Initial Invitation | N/A (transactional) | EventInvitationsController | All invited contacts |
| 1 Day Before Application Deadline | `event_announcements` | InvitationReminderService | Invited contacts who haven't applied |
| Application Deadline Day | `event_announcements` | InvitationReminderService | Invited contacts who haven't applied |
| 1 Day Before Payment Due | `payment_reminders` | EmailSenderService | Approved unpaid registrations |
| Payment Due Today | `payment_reminders` | EmailSenderService | Approved unpaid registrations |
| 1 Day Before Event | `event_countdown` | EmailSenderService | Confirmed paid registrations |
| Day of Event | `event_countdown` | EmailSenderService | Confirmed paid registrations |
| Day After Event | `event_countdown` | EmailSenderService | Confirmed paid registrations |

---

## Implementation Details

### 1. InvitationReminderService

**File:** `app/services/invitation_reminder_service.rb`

**Purpose:** Send emails to invited vendor contacts who haven't applied yet.

**Key Methods:**

```ruby
def send_to_recipients
  recipients = filter_invitation_recipients

  recipients.each do |event_invitation|
    send_to_invitation(event_invitation)
    create_delivery_record(event_invitation)
  end
end

private

def filter_invitation_recipients
  # Start with all event invitations
  invitations = event.event_invitations.includes(:vendor_contact)

  # Apply invitation status filter (if specified)
  if scheduled_email.filter_criteria["invitation_status"].present?
    invitations = invitations.where(status: filter_criteria["invitation_status"])
  end

  # Exclude vendor contacts who already registered/applied
  # Match by email (no foreign key relationship)
  registered_emails = event.registrations.pluck(:email).compact.map(&:downcase)
  invitations = invitations.joins(:vendor_contact)
    .where.not("LOWER(vendor_contacts.email) IN (?)", registered_emails)

  # Exclude unsubscribed contacts
  invitations.reject do |invitation|
    EmailUnsubscribe.unsubscribed_from_event?(invitation.vendor_contact.email, event)
  end
end
```

**Key Features:**
- Email-based matching (registrations don't have `vendor_contact_id`)
- Filters out people who already applied
- Respects unsubscribe preferences
- Creates `EmailDelivery` records with `event_invitation_id`

### 2. InvitationVariableResolver

**File:** `app/services/invitation_variable_resolver.rb`

**Purpose:** Resolve email template variables for `VendorContact` objects (different interface than `Registration`).

**Variable Mappings:**

| Variable | Source | Notes |
|----------|--------|-------|
| `[greetingName]` | `business_name` or `first_name` | Prefers business name |
| `[firstName]` | Split from `name` field | |
| `[fullName]` | `vendor_contact.name` | |
| `[businessName]` | `vendor_contact.business_name` | |
| `[email]` | `vendor_contact.email` | |
| `[vendorCategory]` | Empty | Not applicable for non-applicants |
| `[boothNumber]` | Empty | Not applicable for non-applicants |
| `[applicationDate]` | Empty | Not applicable for non-applicants |

### 3. EmailSenderWorker Routing

**File:** `app/workers/email_sender_worker.rb`

**Key Code:**

```ruby
def send_scheduled_email(scheduled_email)
  category = scheduled_email.email_template_item&.category

  service = if category == "event_announcements"
    # Application deadline reminders → InvitationReminderService
    Rails.logger.info("→ Routing to InvitationReminderService (targets invited contacts)")
    InvitationReminderService.new(scheduled_email)
  else
    # All other emails → EmailSenderService (targets registrations)
    Rails.logger.info("→ Routing to EmailSenderService (targets registrations)")
    EmailSenderService.new(scheduled_email)
  end

  service.send_to_recipients
end
```

### 4. ScheduledEmail Recipient Count

**File:** `app/models/scheduled_email.rb`

**Key Method:**

```ruby
def calculate_current_recipient_count
  return 0 unless event

  # Route to appropriate service based on email category
  category = email_template_item&.category

  if category == "event_announcements"
    # Application deadline reminders - use InvitationReminderService filtering
    service = InvitationReminderService.new(self)
    recipients = service.send(:filter_invitation_recipients)
    return recipients.count
  end

  # All other emails - use registration-based filtering
  recipients = event.registrations.where(email_unsubscribed: false)
  # Apply filter_criteria...
  recipients.count
end
```

**Why This Matters:**
Frontend displays `email.recipient_count` in the UI. This method ensures the count matches the actual send logic, so users see accurate numbers before emails are sent.

---

## Recipients Modal Feature

### Overview

The Recipients Modal allows users to click on any recipient count in the email automation UI to see a detailed list of who will receive the email.

### Frontend Components

**1. RecipientsModal Component**

**File:** `src/components/producer/Email/RecipientsModal.tsx`

**Features:**
- Compact table view (Name | Email | Organization)
- Handles three email types:
  - `initial_invitations` - Fetches from event invitations
  - `invitation_reminders` - Fetches from scheduled email recipients endpoint
  - `registration_emails` - Fetches from scheduled email recipients endpoint
- Color-coded badges for email type
- Scrollable list (handles 100+ recipients efficiently)
- Shows count in header

**2. EmailRow Integration**

**File:** `src/components/producer/Email/EmailRow.tsx`

**Changes:**
- Made recipient count clickable
- Added hover state
- Passes `isInvitationAnnouncement` flag to modal
- Opens modal on click

### Backend API Endpoint

**Route:** `GET /api/v1/presents/events/:event_slug/scheduled_emails/:id/recipients`

**Controller:** `app/controllers/api/v1/presents/scheduled_emails_controller.rb`

**Response Format:**

```json
{
  "count": 5,
  "category": "event_announcements",
  "email_type": "invitation_reminders",
  "recipients": [
    {
      "email": "vendor@example.com",
      "name": "John Doe",
      "organization": "Doe's Business"
    }
  ]
}
```

**Logic:**
```ruby
def recipients
  category = @scheduled_email.email_template_item&.category

  recipients_list = if category == "event_announcements"
    # Use InvitationReminderService filtering
    service = InvitationReminderService.new(@scheduled_email)
    invitations = service.send(:filter_invitation_recipients)

    invitations.map do |invitation|
      vc = invitation.vendor_contact
      { email: vc.email, name: vc.name, organization: vc.business_name || vc.name }
    end
  else
    # Use registration-based filtering
    recipients = @event.registrations.where(email_unsubscribed: false)
    # Apply filter_criteria...

    recipients.map do |registration|
      { email: registration.email, name: registration.name, organization: registration.business_name || registration.name }
    end
  end

  render json: {
    count: recipients_list.count,
    category: category,
    email_type: category == "event_announcements" ? "invitation_reminders" : "registration_emails",
    recipients: recipients_list
  }
end
```

### Frontend API Service

**File:** `src/services/api.ts`

**New Method:**

```typescript
async getRecipients(eventSlug: string, id: number) {
  return fetchApi<{
    count: number
    category: string
    email_type: 'invitation_reminders' | 'registration_emails' | 'initial_invitations'
    recipients: Array<{
      email: string
      name: string
      organization: string
    }>
  }>(`/v1/presents/events/${eventSlug}/scheduled_emails/${id}/recipients`)
}
```

### User Experience

1. User sees recipient count next to each email in the automation tab
2. Count is clickable with hover effect
3. Clicking opens modal with:
   - Email name and type badge (color-coded)
   - Total recipient count
   - Compact table of all recipients
   - Info note explaining targeting logic
4. Works for:
   - Initial invitation emails (fetches from event invitations)
   - Application deadline reminders (uses InvitationReminderService)
   - All other scheduled emails (uses registration filtering)

---

## Testing

### Backend Testing

**Test Invitation Reminder Routing:**

```bash
# In Rails console
event = Event.find_by(slug: 'your-event-slug')

# Create test invitations
contact = VendorContact.create!(
  organization_id: event.organization_id,
  name: "Test Vendor",
  email: "test@example.com",
  contact_type: "vendor"
)

EventInvitation.create!(
  event: event,
  vendor_contact: contact,
  status: 'sent'
)

# Find application deadline email
deadline_email = event.scheduled_emails
  .joins(:email_template_item)
  .where(email_template_items: { category: 'event_announcements' })
  .first

# Test recipient count
deadline_email.calculate_current_recipient_count
# Should return 1

# Test service directly
service = InvitationReminderService.new(deadline_email)
recipients = service.send(:filter_invitation_recipients)
recipients.count
# Should return 1

# Test that it excludes registered vendors
registration = event.registrations.create!(
  email: "test@example.com",
  name: "Test Vendor",
  status: 'pending'
)

deadline_email.calculate_current_recipient_count
# Should return 0 (excluded because they applied)
```

**Test Recipients API:**

```bash
# In terminal or via curl
curl http://localhost:3000/api/v1/presents/events/your-event-slug/scheduled_emails/123/recipients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq
```

### Frontend Testing

**Test Recipients Modal:**

1. Navigate to Email Automation tab for an event
2. Look for recipient counts next to each email
3. Click on any recipient count
4. Modal should open showing:
   - Email name
   - Type badge (Initial Invitations / Invitation Reminders / Application Emails)
   - Total count
   - Table of recipients
5. Test with:
   - Initial invitation email (virtual email at top)
   - Application deadline emails
   - Payment reminder emails
   - Event countdown emails

**Expected Behaviors:**

- Initial invitation: Shows all invited vendor contacts
- Application deadline: Shows invited contacts minus those who registered
- Payment reminders: Shows only approved unpaid registrations
- Event reminders: Shows only confirmed paid registrations

---

## Verification

### Pre-Production Checklist

Run this rake task to verify the entire system:

```bash
bundle exec rake verify:email_system
```

**What It Checks:**

1. ✅ EmailSenderWorker has category-based routing logic
2. ✅ InvitationReminderService exists and has correct methods
3. ✅ InvitationVariableResolver exists
4. ✅ Email template categories are correct
5. ✅ ScheduledEmail recipient count calculation matches services
6. ✅ EmailDelivery schema (event_invitation_id column, nullable registration_id)
7. ✅ Real data testing (if events with scheduled emails exist)
8. ✅ Organization branding works

### Debug Rake Task

For troubleshooting invitation reminders:

```bash
bundle exec rake debug:invitation_reminders[your-event-slug]
```

**What It Shows:**

- All event invitations
- All registrations
- Scheduled emails with categories
- InvitationReminderService filtering step-by-step
- Why recipients are included/excluded

### Manual Verification Steps

**1. Check Routing in Logs:**

When EmailSenderWorker processes a scheduled email, you should see:

```
EmailSenderWorker: Checking for scheduled emails ready to send...
Sending scheduled email #123: 1 Day Before Application Deadline
  Category: event_announcements
  → Routing to InvitationReminderService (targets invited contacts)
✓ Scheduled email #123 sent to 5 recipients
```

**2. Verify Recipient Counts in UI:**

- Create an event
- Invite 5 vendor contacts
- Check application deadline email recipient count → Should show 5
- Have 2 vendors submit applications
- Refresh page
- Check application deadline email recipient count → Should show 3

**3. Verify Recipients Modal:**

- Click on recipient count
- Modal should show exactly 3 recipients
- Should be the 3 who haven't applied yet

**4. Verify Email Delivery:**

- Wait for scheduled time or use "Send Now"
- Check logs for routing message
- Verify only correct recipients received email
- Check EmailDelivery records created with event_invitation_id

---

## Related Documentation

- **[EMAIL_AUTOMATION_SYSTEM_GUIDE.md](./EMAIL_AUTOMATION_SYSTEM_GUIDE.md)** - Complete automation system docs
- **[VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md](./VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md)** - All email details
- **[WEBHOOK_PROCESSING_FIX_JAN_23_2026.md](./WEBHOOK_PROCESSING_FIX_JAN_23_2026.md)** - Delivery tracking
- **[EMAIL_DOCS_INDEX.md](./EMAIL_DOCS_INDEX.md)** - Documentation index

---

## Troubleshooting

### Issue: Application deadline emails going to wrong people

**Check:**
1. Is the email category set to `event_announcements`?
2. Are there actually invited contacts who haven't applied?
3. Run debug rake task to see filtering logic

### Issue: Recipient count shows 0 but there are invitations

**Check:**
1. Have all invited contacts already applied?
2. Are they unsubscribed?
3. Check logs for filtering details
4. Run `scheduled_email.calculate_current_recipient_count` in console

### Issue: Recipients modal not loading

**Check:**
1. Browser console for errors
2. Network tab - is API request returning 200?
3. Check Rails logs for errors in recipients action
4. Verify route exists: `bundle exec rails routes | grep recipients`

### Issue: Modal shows wrong recipients

**Check:**
1. Is category correctly set on email_template_item?
2. Does backend routing logic match expected category?
3. Check API response in network tab
4. Verify InvitationReminderService filtering logic

---

**Last Updated:** January 27, 2026
**Status:** ✅ Production Ready
**Tested:** ✅ Backend, Frontend, Integration
**Deployed:** [Date when deployed]
