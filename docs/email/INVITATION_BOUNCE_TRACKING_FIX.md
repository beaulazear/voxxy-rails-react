# Invitation Bounce Tracking - Fix Documentation

**Date:** January 18, 2026
**Issue:** Invitation emails that bounce are not being tracked as "undelivered"
**Status:** Needs Implementation

---

## 🐛 Problem

Invitation emails sent via `EventInvitationMailer` do NOT create `EmailDelivery` records, so:
- Bounces are not tracked
- "Undelivered" count always shows 0
- No visibility into failed invitation emails

**Current Flow:**
```
EventInvitationMailer.invitation_email(invitation).deliver_now
  → Sends via SendGrid ✅
  → No EmailDelivery record created ❌
  → SendGrid webhook fires with bounce
  → EmailDeliveryProcessorJob looks for EmailDelivery by message_id
  → NOT FOUND ❌
  → Bounce is ignored
```

**Why This Happens:**
- `EmailSenderService` (used for scheduled emails) creates `EmailDelivery` records
- `EventInvitationMailer` (used for invitations) uses standard Rails mailer WITHOUT delivery tracking

---

## 🔍 Verification

Run this to confirm:

```ruby
# Check if invitation emails have delivery tracking
event = Event.last

puts "Invitations sent: #{event.event_invitations.where.not(sent_at: nil).count}"
puts "EmailDelivery records for invitations: #{EmailDelivery.where(event_id: event.id).count}"

# Should be the same! If EmailDelivery count is 0, tracking is not working.
```

---

## ✅ Solution

We need to intercept the mailer and create `EmailDelivery` records with SendGrid message IDs.

### Option A: Use SendGrid Interceptor (Recommended)

Create a mailer interceptor that creates `EmailDelivery` records when invitation emails are sent:

**File:** `app/mailers/concerns/email_delivery_tracker.rb`

```ruby
module EmailDeliveryTracker
  extend ActiveSupport::Concern

  included do
    after_action :track_delivery, if: :should_track_delivery?
  end

  private

  def should_track_delivery?
    # Only track for invitation emails
    action_name == 'invitation_email'
  end

  def track_delivery
    return unless @invitation && @event

    # Store metadata to create delivery record after sending
    @track_delivery_data = {
      event: @event,
      invitation: @invitation,
      recipient_email: @vendor_contact.email
    }
  end
end
```

**File:** `config/initializers/sendgrid_interceptor.rb`

```ruby
class SendGridDeliveryTracker
  def self.delivering_email(message)
    # Check if this email should be tracked
    track_data = message.instance_variable_get(:@track_delivery_data)
    return unless track_data

    # Extract SendGrid message ID from headers (after sending)
    # We'll need to use an observer instead...
  end
end

# This approach won't work because we need the message ID AFTER sending
```

### Option B: Create Delivery Records in Mailer (Simple)

Modify `EventInvitationMailer` to create delivery records:

**File:** `app/mailers/event_invitation_mailer.rb`

```ruby
class EventInvitationMailer < ApplicationMailer
  after_action :create_delivery_record

  def invitation_email(event_invitation)
    @invitation = event_invitation
    @event = event_invitation.event
    @vendor_contact = event_invitation.vendor_contact
    @organization = @event.organization
    @invitation_url = @invitation.invitation_url

    location_parts = []
    location_parts << @event.location if @event.location.present?
    location_suffix = location_parts.any? ? " in #{location_parts.join(', ')}" : ""

    mail(
      to: @vendor_contact.email,
      subject: "#{@event.title} is coming#{location_suffix}",
      # Add custom args for SendGrid tracking
      'X-SMTPAPI' => smtp_api_header.to_json
    )
  end

  private

  def smtp_api_header
    {
      unique_args: {
        event_id: @event.id.to_s,
        invitation_id: @invitation.id.to_s,
        email_type: 'invitation'
      }
    }
  end

  def create_delivery_record
    # Create EmailDelivery record (without sendgrid_message_id yet)
    # The webhook will match it using custom args
    EmailDelivery.create!(
      event: @event,
      recipient_email: @vendor_contact.email,
      sendgrid_message_id: "pending-#{@invitation.id}", # Temporary ID
      status: 'sent',
      sent_at: Time.current
    )
  end
end
```

**Problem:** We don't have the SendGrid message ID at send time!

---

### Option C: Enhanced Webhook Processing (BEST)

Use SendGrid's `unique_args` to track invitations without needing `EmailDelivery` records upfront.

**Step 1:** Add custom args to invitation emails

**File:** `app/mailers/event_invitation_mailer.rb`

```ruby
def invitation_email(event_invitation)
  @invitation = event_invitation
  @event = event_invitation.event
  @vendor_contact = event_invitation.vendor_contact
  @organization = @event.organization
  @invitation_url = @invitation.invitation_url

  location_parts = []
  location_parts << @event.location if @event.location.present?
  location_suffix = location_parts.any? ? " in #{location_parts.join(', ')}" : ""

  # Add custom tracking via SendGrid headers
  headers['X-SMTPAPI'] = smtp_api_header.to_json

  mail(
    to: @vendor_contact.email,
    subject: "#{@event.title} is coming#{location_suffix}"
  )
end

private

def smtp_api_header
  {
    unique_args: {
      event_id: @event.id.to_s,
      event_invitation_id: @invitation.id.to_s,
      email_type: 'invitation'
    }
  }
end
```

**Step 2:** Update webhook processor to handle invitations

**File:** `app/workers/email_delivery_processor_job.rb`

```ruby
def perform(event_data)
  event_type = event_data["event"]
  sg_message_id = extract_message_id(event_data)
  unique_args = event_data["unique_args"] || {}

  unless sg_message_id
    Rails.logger.warn("No message ID in SendGrid event: #{event_type}")
    return
  end

  # Try to find existing EmailDelivery record
  delivery = EmailDelivery.find_by(sendgrid_message_id: sg_message_id)

  # If not found and this is an invitation, create delivery record on-the-fly
  if delivery.nil? && unique_args["email_type"] == "invitation"
    delivery = create_invitation_delivery(event_data, unique_args)
  end

  unless delivery
    Rails.logger.info("No delivery record found for SendGrid message: #{sg_message_id}")
    return
  end

  # Rest of processing...
end

private

def create_invitation_delivery(event_data, unique_args)
  event_id = unique_args["event_id"]
  invitation_id = unique_args["event_invitation_id"]

  return nil unless event_id && invitation_id

  invitation = EventInvitation.find_by(id: invitation_id)
  return nil unless invitation

  sg_message_id = extract_message_id(event_data)

  EmailDelivery.create!(
    event_id: event_id,
    sendgrid_message_id: sg_message_id,
    recipient_email: event_data["email"],
    status: 'sent',
    sent_at: Time.at(event_data["timestamp"].to_i)
  )
rescue => e
  Rails.logger.error("Failed to create invitation delivery: #{e.message}")
  nil
end
```

---

## 🚀 Implementation Steps

1. **Update `EventInvitationMailer`** to add custom SendGrid args
2. **Update `EmailDeliveryProcessorJob`** to create delivery records for invitations
3. **Test with a bounce** to verify tracking works
4. **Deploy** and monitor

---

## 🧪 Testing

After implementing:

```ruby
# Send test invitation
event = Event.last
contact = VendorContact.create!(
  organization: event.organization,
  email: "invalid@bounce-test.com", # Use a known bounce address
  name: "Test Bounce"
)

invitation = EventInvitation.create!(
  event: event,
  vendor_contact: contact
)

EventInvitationMailer.invitation_email(invitation).deliver_now

# Wait for SendGrid webhook (usually < 1 minute)
sleep 60

# Check if delivery was tracked
delivery = EmailDelivery.find_by(recipient_email: "invalid@bounce-test.com")
puts "Delivery status: #{delivery.status}" # Should be 'bounced'
puts "Bounce reason: #{delivery.bounce_reason}"
```

---

## 📊 Current State

- ❌ Invitation bounces NOT tracked
- ✅ Scheduled email bounces ARE tracked
- ✅ SendGrid webhook infrastructure working
- ❌ Need to integrate invitations into delivery tracking

---

## 🎯 After Fix

- ✅ Invitation bounces will be tracked
- ✅ "Undelivered" count will show invitation bounces
- ✅ Full visibility into email delivery status
- ✅ Can retry failed invitations

---

**Status:** Ready for implementation (Option C recommended)
**Priority:** P1 (High - affects email deliverability visibility)
**Estimated Time:** 2 hours
