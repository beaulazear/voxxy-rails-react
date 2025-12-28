# Event Invitation System - Quick Reference

## API Endpoints

### 1. Create Invitations
```
POST /api/v1/presents/events/:event_slug/invitations/batch
```
**Auth:** Required (Venue Owner)
**Body:** `{ "vendor_contact_ids": [1, 2, 3] }`
**Email Sent:** Invitation email to each vendor

---

### 2. List Invitations
```
GET /api/v1/presents/events/:event_slug/invitations?status=pending
```
**Auth:** Required (Venue Owner)
**Query Params:** `status` (optional)
**Email Sent:** None

---

### 3. View Invitation (Public)
```
GET /api/v1/presents/invitations/:token
```
**Auth:** Not required
**Email Sent:** None (auto-marks as "viewed")

---

### 4. Respond to Invitation (Public)
```
PATCH /api/v1/presents/invitations/:token/respond
```
**Auth:** Not required
**Body:** `{ "status": "accepted|declined", "response_notes": "..." }`
**Emails Sent:**
- Confirmation to vendor
- Notification to producer

---

## Email Triggers

| Action | Email Sent To | Template |
|--------|--------------|----------|
| Create invitation | Vendor | `invitation_email` |
| Accept invitation | Vendor | `accepted_confirmation_vendor` |
| Accept invitation | Producer | `accepted_notification_producer` |
| Decline invitation | Vendor | `declined_confirmation_vendor` |
| Decline invitation | Producer | `declined_notification_producer` |

---

## Models

### EventInvitation
**Location:** `app/models/event_invitation.rb`

**Key Methods:**
- `mark_as_sent!` - Mark invitation as sent
- `mark_as_viewed!` - Mark invitation as viewed
- `accept!(response_notes: "...")` - Accept invitation
- `decline!(response_notes: "...")` - Decline invitation
- `can_respond?` - Check if invitation can be responded to
- `expired?` - Check if invitation has expired
- `invitation_url` - Get public invitation URL

**Statuses:**
- `pending` - Created but not sent
- `sent` - Email sent to vendor
- `viewed` - Vendor viewed invitation
- `accepted` - Vendor accepted
- `declined` - Vendor declined
- `expired` - Past deadline

---

## Database

### event_invitations Table
```ruby
t.references :event, null: false
t.references :vendor_contact, null: false
t.string :status, default: "pending"
t.string :invitation_token, null: false, unique: true
t.datetime :sent_at
t.datetime :responded_at
t.text :response_notes
t.datetime :expires_at
```

**Indexes:**
- Unique: `[event_id, vendor_contact_id]`
- Unique: `invitation_token`
- Index: `status`

---

## Testing in Rails Console

```ruby
# Create invitation
event = Event.first
contact = VendorContact.first
invitation = EventInvitation.create!(event: event, vendor_contact: contact)

# Send invitation email
EventInvitationMailer.invitation_email(invitation).deliver_now

# Accept invitation
invitation.accept!(response_notes: "Excited to participate!")

# Send acceptance emails
EventInvitationMailer.accepted_confirmation_vendor(invitation).deliver_now
EventInvitationMailer.accepted_notification_producer(invitation).deliver_now

# Get invitation URL
invitation.invitation_url
# => "http://localhost:5173/invitations/{token}"
```

---

## Frontend Integration

### TypeScript API Service
```typescript
// Create invitations when event is created
if (wizardState.inviteList.invitedContactIds.length > 0) {
  await eventInvitationsApi.createBatch(
    newEvent.slug,
    wizardState.inviteList.invitedContactIds
  );
}

// View invitation by token (public page)
const { invitation } = await eventInvitationsApi.getByToken(token);

// Respond to invitation
await eventInvitationsApi.respond(token, "accepted", "Looking forward to it!");

// List invitations for event
const { invitations, meta } = await eventInvitationsApi.getByEvent(eventSlug);
```

---

## Configuration

### Email Sender
`Voxxy Presents <noreply@voxxyai.com>`

### SMTP (SendGrid)
- Host: `smtp.sendgrid.net`
- Port: `587`
- API Key: `ENV["VoxxyKeyAPI"]`

---

## Common Tasks

### Resend Invitation
```ruby
invitation = EventInvitation.find(id)
invitation.update!(sent_at: Time.current, status: "sent")
EventInvitationMailer.invitation_email(invitation).deliver_now
```

### Check Invitation Status
```ruby
event = Event.find_by(slug: "event-slug")
event.event_invitations.group(:status).count
# => {"sent"=>5, "accepted"=>2, "viewed"=>3}
```

### Find Expired Invitations
```ruby
EventInvitation.where("expires_at < ?", Time.current)
               .where.not(status: ["accepted", "declined"])
```

### Get Vendor's Invitations
```ruby
contact = VendorContact.find(id)
contact.event_invitations.includes(:event)
```

---

## URLs (Development)

- **API Base:** `http://localhost:3001/api/v1/presents`
- **Frontend:** `http://localhost:5173`
- **Invitation View:** `http://localhost:5173/invitations/{token}`

---

## Documentation

- **Full Implementation:** `INVITATION_IMPLEMENTATION_SUMMARY.md`
- **Email Details:** `EMAIL_INVITATION_IMPLEMENTATION.md`
- **Frontend Requirements:** `/Users/beaulazear/Desktop/voxxy-presents-client/docs/BACKEND_INVITATION_REQUIREMENTS.md`

---

## Quick Checklist

- [x] Database table created
- [x] Model with validations & methods
- [x] API endpoints (4 total)
- [x] Email mailer with 5 methods
- [x] Email templates (10 total)
- [x] Controller integration
- [x] Routes configured
- [x] Error handling
- [x] Security (tokens, auth)
- [x] Documentation

**Status:** ✅ Fully implemented and ready to use!
