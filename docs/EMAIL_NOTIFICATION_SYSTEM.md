# Email Notification System with User Confirmation

This document explains the email notification system that requires user confirmation before sending emails.

## Overview

The system is designed to **never send bulk emails automatically**. Instead, when a user performs an action that would trigger an email (like updating event details or confirming payment), the API returns a warning in the response. The frontend can then show a confirmation dialog to the user before actually sending the emails.

## System Architecture

### 1. Email Service Layer
**Location**: `app/services/registration_email_service.rb`

Contains methods to send different types of emails:
- `send_confirmation(registration)` - Application received ✅ (auto-sent on create)
- `send_status_update(registration)` - Approval/rejection/waitlist ✅ (auto-sent on status change)
- `send_payment_confirmation(registration)` - Payment confirmed ⚠️ (requires confirmation)
- `send_category_change_notification(registration, price)` - Category changed ⚠️ (requires confirmation)
- `send_event_details_changed_to_all(event)` - Event details updated ⚠️ (requires confirmation)
- `send_event_canceled_to_all(event)` - Event canceled ⚠️ (requires confirmation)

✅ = Automatically sent via model callbacks
⚠️ = Requires user confirmation via controller

---

## Email Triggers

### Trigger 1: Application Received (Automatic)
**When**: Vendor submits an application
**Sends to**: Applicant + Event Owner
**Flow**:
```
POST /api/v1/presents/events/:slug/registrations
  → Registration created
  → after_create callback fires
  → RegistrationEmailService.send_confirmation(registration)
  → Email sent automatically
```

---

### Trigger 2: Payment Confirmed (Requires Confirmation)

**When**: Event owner marks payment as confirmed
**Sends to**: Individual vendor
**Flow**:

```
Step 1: Update payment status
PATCH /api/v1/presents/registrations/:id
{
  "registration": {
    "payment_status": "confirmed"
  }
}

Response includes:
{
  "registration": { ... },
  "email_notification": {
    "type": "payment_confirmed",
    "requires_confirmation": true,
    "recipient_email": "vendor@example.com",
    "warning": "Payment was marked as confirmed. Would you like to send a confirmation email?",
    "endpoint": {
      "send": "/api/v1/presents/registrations/123/email_notifications/send_payment_confirmation"
    }
  }
}

Step 2: User confirms in UI, then:
POST /api/v1/presents/registrations/:id/email_notifications/send_payment_confirmation

Response:
{
  "success": true,
  "message": "Payment confirmation email sent to vendor@example.com"
}
```

---

### Trigger 3: Category Changed (Requires Confirmation)

**When**: Event owner changes a vendor's category
**Sends to**: Individual vendor
**Flow**:

```
Step 1: Update vendor category
PATCH /api/v1/presents/registrations/:id
{
  "registration": {
    "vendor_category": "Food - Desserts"
  }
}

Response includes:
{
  "registration": { ... },
  "email_notification": {
    "type": "category_changed",
    "requires_confirmation": true,
    "recipient_email": "vendor@example.com",
    "warning": "Vendor category was changed from 'Food - Savory' to 'Food - Desserts'. Would you like to notify this vendor?",
    "endpoint": {
      "send": "/api/v1/presents/registrations/123/email_notifications/send_category_change"
    }
  }
}

Step 2: User confirms, then:
POST /api/v1/presents/registrations/:id/email_notifications/send_category_change
{
  "new_price": 150  // Optional: specify new category price
}

Response:
{
  "success": true,
  "message": "Category change notification sent to vendor@example.com"
}
```

---

### Trigger 4: Event Details Changed (Requires Confirmation)

**When**: Event owner updates event date, venue, location, or time
**Sends to**: ALL registered vendors (bulk email)
**Flow**:

```
Step 1: Update event
PATCH /api/v1/presents/events/:slug
{
  "event": {
    "event_date": "2026-06-15",
    "venue": "New Venue Name"
  }
}

Response includes:
{
  "event": { ... },
  "email_notification": {
    "type": "event_details_changed",
    "requires_confirmation": true,
    "recipient_count": 45,
    "warning": "Event details were updated. Would you like to notify 45 vendors?",
    "changed_fields": ["event_date", "venue"],
    "endpoint": {
      "check": "/api/v1/presents/events/summer-market/email_notifications/check_event_update_impact",
      "send": "/api/v1/presents/events/summer-market/email_notifications/send_event_update"
    }
  }
}

Step 2: (Optional) Check impact
POST /api/v1/presents/events/:slug/email_notifications/check_event_update_impact

Response:
{
  "action": "event_details_changed",
  "recipient_count": 45,
  "event": { ... },
  "warning": "This will send an email notification to 45 recipients.",
  "requires_confirmation": true
}

Step 3: User confirms, then:
POST /api/v1/presents/events/:slug/email_notifications/send_event_update
{
  "confirmed": true
}

Response:
{
  "success": true,
  "message": "Event update emails sent",
  "sent_count": 45,
  "failed_count": 0
}
```

---

### Trigger 5: Event Canceled (Requires Confirmation)

**When**: Event owner cancels an event
**Sends to**: ALL registered vendors (bulk email)
**Flow**:

```
Step 1: Cancel event
PATCH /api/v1/presents/events/:slug
{
  "event": {
    "status": "cancelled"
  }
}

Response includes:
{
  "event": { ... },
  "email_notification": {
    "type": "event_canceled",
    "requires_confirmation": true,
    "recipient_count": 45,
    "warning": "⚠️ IMPORTANT: Event has been canceled. Would you like to notify 45 vendors?",
    "endpoint": {
      "check": "/api/v1/presents/events/summer-market/email_notifications/check_cancellation_impact",
      "send": "/api/v1/presents/events/summer-market/email_notifications/send_cancellation"
    }
  }
}

Step 2: (Optional) Check impact
POST /api/v1/presents/events/:slug/email_notifications/check_cancellation_impact

Response:
{
  "action": "event_canceled",
  "recipient_count": 45,
  "event": { ... },
  "warning": "⚠️ IMPORTANT: This will send a cancellation email to 45 recipients and cannot be undone.",
  "requires_confirmation": true
}

Step 3: User confirms, then:
POST /api/v1/presents/events/:slug/email_notifications/send_cancellation
{
  "confirmed": true
}

Response:
{
  "success": true,
  "message": "Cancellation emails sent",
  "sent_count": 45,
  "failed_count": 0
}
```

---

### Trigger 6: Moved to Waitlist (Automatic)

**When**: Registration status changes to "waitlist"
**Sends to**: Individual vendor
**Flow**:
```
PATCH /api/v1/presents/registrations/:id
{
  "registration": {
    "status": "waitlist"
  }
}
  → after_update callback fires (status changed)
  → RegistrationEmailService.send_status_update(registration)
  → send_waitlist_notification(registration)
  → Email sent automatically
```

---

## Database Schema

### New Fields Added

**registrations table**:
```ruby
payment_status: string, default: "pending"  # Values: pending, paid, confirmed, overdue
payment_confirmed_at: datetime
```

Migration: `db/migrate/20260109021143_add_payment_status_to_registrations.rb`

---

## API Endpoints

### Email Notification Controller
**Location**: `app/controllers/api/v1/presents/email_notifications_controller.rb`

#### Event-level endpoints:
```
POST /api/v1/presents/events/:event_id/email_notifications/check_event_update_impact
POST /api/v1/presents/events/:event_id/email_notifications/send_event_update
POST /api/v1/presents/events/:event_id/email_notifications/check_cancellation_impact
POST /api/v1/presents/events/:event_id/email_notifications/send_cancellation
```

#### Registration-level endpoints:
```
POST /api/v1/presents/registrations/:id/email_notifications/send_payment_confirmation
POST /api/v1/presents/registrations/:id/email_notifications/send_category_change
```

---

## Model Methods

### Registration Model

```ruby
# Mark payment as confirmed (optionally send email)
registration.confirm_payment!(send_email: true)

# Check if payment is overdue
registration.payment_overdue?  # => true/false

# Get category change info
registration.category_change_info
# => { old_category: "Food", new_category: "Beverage", changed_at: Time }
```

### Event Model

```ruby
# Check if event details changed that would trigger notifications
event.details_changed_requiring_notification?  # => true/false

# Get detailed change information
event.event_change_info
# => { changed_fields: [:event_date, :venue], changes: {...}, changed_at: Time }

# Check if event was just canceled
event.just_canceled?  # => true/false

# Count how many people would receive emails
event.email_notification_count  # => 45
```

---

## Frontend Integration

### Example React Flow

```jsx
const handleUpdateEvent = async (eventData) => {
  const response = await api.patch(`/api/v1/presents/events/${slug}`, {
    event: eventData
  });

  // Check if email notification is needed
  if (response.data.email_notification) {
    const { type, warning, recipient_count, endpoint } = response.data.email_notification;

    // Show confirmation dialog
    const confirmed = await showConfirmDialog({
      title: 'Send Email Notification?',
      message: warning,
      confirmText: 'Yes, Send Emails',
      cancelText: 'No, Skip'
    });

    if (confirmed) {
      // Send emails
      await api.post(endpoint.send, { confirmed: true });
      showSuccessToast(`Emails sent to ${recipient_count} recipients`);
    }
  }
};
```

---

## Security & Authorization

All email notification endpoints require:
- User must be authenticated
- User must be the event owner OR admin
- For registration-specific emails: user must be event owner or admin

Unauthorized attempts return `403 Forbidden`.

---

## Testing

### Run the migration:
```bash
bundle exec rails db:migrate
```

### Test payment confirmation flow:
```ruby
# In Rails console
registration = Registration.find(123)

# Update payment status
registration.update(payment_status: "confirmed")

# Check if it would trigger notification
registration.saved_change_to_payment_status?  # => true

# Manually send email (simulating controller action)
RegistrationEmailService.send_payment_confirmation(registration)
```

### Test event update flow:
```ruby
# In Rails console
event = Event.find_by(slug: "summer-market")

# Update event details
event.update(event_date: 1.month.from_now)

# Check if it would trigger notification
event.details_changed_requiring_notification?  # => true
event.event_change_info[:changed_fields]  # => [:event_date]

# Manually send emails (simulating controller action)
result = RegistrationEmailService.send_event_details_changed_to_all(event)
# => { sent: 45, failed: 0 }
```

---

## Email Template Variables

All email templates support these variables:

**Event variables**:
- `[eventName]`, `[eventDate]`, `[eventVenue]`, `[eventLocation]`, `[eventTime]`

**Vendor variables**:
- `[firstName]`, `[businessName]`, `[categoryName]`

**Producer variables**:
- `[producerName]`, `[producerEmail]`

**Pricing**:
- `[categoryPrice]`

**Install details**:
- `[installDate]`, `[installTime]`

See `app/services/email_variable_resolver.rb` for full list.

---

## Troubleshooting

### Emails not triggering warnings?
- Check that the field actually changed: `model.saved_change_to_field?`
- Verify the update went through: check `updated_at` timestamp
- Check Rails logs for callback execution

### "Email sending not confirmed" error?
- Make sure to pass `confirmed: true` in the POST request body
- Example: `{ "confirmed": true }`

### No recipients receiving emails?
- Check `email_unsubscribed` flag on registrations
- Verify `email_notification_count > 0` before sending
- Check SendGrid logs for delivery status

---

## Future Enhancements

Potential improvements:
- Add email preview endpoint before sending
- Batch email sending with progress tracking
- Email template customization per organization
- Scheduled email sending (e.g., "send tomorrow at 10am")
- Email sending history/audit log
