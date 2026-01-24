# Voxxy Presents - Email Unsubscribe System

**Last Updated:** 2026-01-24
**Status:** ✅ Production Ready

---

## Overview

The Voxxy Presents platform includes a comprehensive email unsubscribe system that allows users to control which emails they receive at three different scopes: event-specific, organization-wide, or global.

## Features

### Three-Tier Unsubscribe Scopes

1. **Event Scope** - Unsubscribe from a specific event only
2. **Organization Scope** - Unsubscribe from all emails from a specific producer/organization (current and future events)
3. **Global Scope** - Unsubscribe from all Voxxy Presents emails

### Key Capabilities

- ✅ Token-based security (no authentication required)
- ✅ 90-day token expiration
- ✅ One-time use tokens to prevent replay attacks
- ✅ Unsubscribe links in all email templates (7 scheduled templates + invitation emails)
- ✅ Recipient filtering based on unsubscribe status
- ✅ Resubscribe functionality
- ✅ Admin analytics dashboard
- ✅ UNSUB count in Email Automation tab

---

## Architecture

### Database Schema

#### `unsubscribe_tokens` Table
```ruby
t.string :token, null: false, index: { unique: true }  # 32-byte urlsafe base64
t.string :email, null: false
t.references :event, null: true, foreign_key: true
t.references :organization, null: true, foreign_key: true
t.datetime :expires_at, null: false
t.datetime :used_at
t.timestamps
```

#### `email_unsubscribes` Table
```ruby
t.string :email, null: false
t.string :scope, null: false  # 'event', 'organization', 'global'
t.references :event, null: true, foreign_key: true
t.references :organization, null: true, foreign_key: true
t.datetime :unsubscribed_at, null: false
t.string :unsubscribe_source  # 'user_action', 'sendgrid_webhook', 'admin_action'
t.timestamps

# Unique indexes per scope
add_index [:email, :event_id], unique: true, where: "scope = 'event'"
add_index [:email, :organization_id], unique: true, where: "scope = 'organization'"
add_index :email, unique: true, where: "scope = 'global'"
```

### Backend Components

#### Models

**UnsubscribeToken** (`app/models/unsubscribe_token.rb`)
- Generates secure 32-character tokens
- 90-day expiration
- Tracks usage (used_at timestamp)
- Scopes: `active`, `expired`, `used`
- Key method: `find_active_token(token)`

**EmailUnsubscribe** (`app/models/email_unsubscribe.rb`)
- Stores unsubscribe preferences
- Validates scope and associations
- Class methods:
  - `unsubscribed_from_event?(email, event)`
  - `unsubscribed_from_organization?(email, organization)`
  - `unsubscribed_globally?(email)`
  - `create_or_find_unsubscribe(email:, scope:, event:, organization:, source:)`
  - `resubscribe(email:, scope:, event:, organization:)`

#### Services

**UnsubscribeTokenService** (`app/services/unsubscribe_token_service.rb`)
- `generate_token(email:, event:, organization:)` - Create new token
- `generate_for_registration(registration)` - Create token from registration
- `validate_and_get_context(token)` - Validate and return context
- `process_unsubscribe(token, scope:)` - Process unsubscribe request
- `generate_unsubscribe_url(token, frontend_url:)` - Generate full URL

**FrontendUrlHelper** (`app/helpers/frontend_url_helper.rb`)
- `presents_frontend_url` - Returns correct frontend URL based on environment
- Uses PRIMARY_DOMAIN env variable to determine staging vs production
- Production: `https://www.voxxypresents.com`
- Staging: `https://voxxy-presents-client-staging.onrender.com`
- Development: `http://localhost:5173`

**RecipientFilterService** (`app/services/recipient_filter_service.rb`)
- Filters email recipients based on unsubscribe status
- Checks both `Registration.email_unsubscribed` (legacy) and `EmailUnsubscribe` table
- Applies filtering before sending scheduled emails

#### Controllers

**Api::V1::Presents::UnsubscribesController** (`app/controllers/api/v1/presents/unsubscribes_controller.rb`)

Public endpoints (no auth required, token-based security):
- `GET /api/v1/presents/unsubscribe/:token` - View unsubscribe context
- `POST /api/v1/presents/unsubscribe/:token` - Process unsubscribe
- `POST /api/v1/presents/unsubscribe/:token/resubscribe` - Resubscribe

**AdminController** (`app/controllers/admin_controller.rb`)
- `GET /admin/presents_analytics` - Includes unsubscribe stats:
  - Total unsubscribes
  - Breakdown by scope
  - Recent 7/30 days
  - Top events/organizations with unsubscribes

### Frontend Components

**UnsubscribePage** (`src/pages/UnsubscribePage.tsx`)
- Branded unsubscribe page matching Voxxy Presents design
- Displays email, event, and organization context
- Three radio button options for scope selection
- Success confirmation screen with resubscribe option
- Error handling for invalid/expired tokens

**API Client** (`src/services/api.ts`)
```typescript
unsubscribeApi.getByToken(token: string)
unsubscribeApi.confirm(token: string, scope: 'event' | 'organization' | 'global')
unsubscribeApi.resubscribe(token: string)
```

---

## User Flow

### Unsubscribe Flow

1. **User receives email** with unsubscribe link:
   - Example: `https://www.voxxypresents.com/unsubscribe/{token}`

2. **User clicks link** → Lands on UnsubscribePage
   - Frontend makes API call: `GET /api/v1/presents/unsubscribe/{token}`
   - Backend validates token, returns context (email, event, organization)

3. **User sees context and options**:
   - Email address
   - Event details (if applicable)
   - Organization details (if applicable)
   - Three radio button options based on available scopes

4. **User selects scope and confirms**:
   - Frontend makes API call: `POST /api/v1/presents/unsubscribe/{token}` with scope
   - Backend creates `EmailUnsubscribe` record
   - Backend marks token as used
   - Backend updates `Registration.email_unsubscribed = true` if global scope

5. **User sees success confirmation**:
   - Success message: "You have been unsubscribed from..."
   - Option to resubscribe ("Changed Your Mind?" button)
   - "Go Home" button

### Resubscribe Flow

1. **User clicks "Changed Your Mind? Resubscribe"** on success page
   - Frontend makes API call: `POST /api/v1/presents/unsubscribe/{token}/resubscribe`

2. **Backend processes resubscribe**:
   - Finds and deletes the `EmailUnsubscribe` record
   - Updates `Registration.email_unsubscribed = false` if was global
   - Returns success message

3. **Page reloads** to show updated subscription status

### Email Sending Flow with Filtering

1. **ScheduledEmail reaches send time**:
   - `SendScheduledEmailJob` is triggered

2. **RecipientFilterService filters recipients**:
   - Checks `Registration.email_unsubscribed = false`
   - Queries `EmailUnsubscribe` table for:
     - Event scope unsubscribes (event_id matches)
     - Organization scope unsubscribes (organization_id matches)
     - Global scope unsubscribes
   - Removes matching emails from recipient list

3. **Email sent only to non-unsubscribed recipients**

---

## Email Template Integration

### Scheduled Email Templates

All 7 default templates include unsubscribe links:
- Invitation Announcement
- Application Reminder (7 days)
- Application Reminder (3 days)
- Application Reminder (Final - 1 day)
- Approval Notification
- Payment Reminder
- Event Day Reminder

Template footer includes:
```html
<p style="font-size: 12px; color: #888888;">
  <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">
    Unsubscribe from these emails
  </a>
</p>
```

### Invitation Emails

**EventInvitationMailer** (`app/mailers/event_invitation_mailer.rb`)
- Generates unsubscribe token for each invitation
- Includes `@unsubscribe_url` in both HTML and text templates

HTML template (`app/views/event_invitation_mailer/invitation_email.html.erb`):
```erb
<a href="<%= @unsubscribe_url %>" style="color: #888888; text-decoration: underline;">
  Unsubscribe from these emails
</a>
```

---

## Admin Analytics

### Available Metrics

Accessed via `GET /admin/presents_analytics`:

```json
{
  "unsubscribes": {
    "total": 42,
    "by_scope": {
      "event": 15,
      "organization": 10,
      "global": 17
    },
    "recent_7_days": 5,
    "recent_30_days": 18,
    "top_events": [
      {
        "event_id": 123,
        "event_title": "Summer Market 2025",
        "unsubscribe_count": 8
      }
    ],
    "top_organizations": [
      {
        "organization_id": 45,
        "organization_name": "Downtown Events",
        "unsubscribe_count": 12
      }
    ]
  }
}
```

### Email Automation Tab Integration

**ScheduledEmail Model** - Enhanced `unsubscribed_count` method:
- For **sent emails**: Returns count from `email_deliveries` (SendGrid webhook data)
- For **scheduled emails**: Queries `EmailUnsubscribe` table to show how many current recipients won't receive the email

API response includes:
```json
{
  "id": 789,
  "name": "Application Reminder - 7 days",
  "recipient_count": 125,
  "unsubscribed_count": 8,
  "delivery_rate": 92.8
}
```

---

## Configuration

### Environment Variables

**Production:**
- `PRIMARY_DOMAIN` - Set to production domain (e.g., "voxxypresents.com")
- `PRESENTS_FRONTEND_URL` - Optional override for frontend URL

**Staging:**
- `PRIMARY_DOMAIN` - Contains "voxxyai.com" for staging detection

**Development:**
- `FRONTEND_URL` - Defaults to `http://localhost:5173`

### Token Expiration

Default: 90 days (configured in `UnsubscribeToken#set_expiration`)

To change:
```ruby
# app/models/unsubscribe_token.rb
def set_expiration
  self.expires_at ||= 90.days.from_now  # Change here
end
```

---

## Testing

### Backend Tests

```ruby
# Test unsubscribe
EmailUnsubscribe.create_or_find_unsubscribe(
  email: 'test@example.com',
  scope: 'global',
  source: 'user_action'
)

# Test resubscribe
EmailUnsubscribe.resubscribe(
  email: 'test@example.com',
  scope: 'global'
)

# Check status
EmailUnsubscribe.unsubscribed_globally?('test@example.com')  # => false after resubscribe
```

### Frontend Testing

1. Generate test token in Rails console:
```ruby
event = Event.first
organization = event.organization
token = UnsubscribeTokenService.generate_token(
  email: 'test@example.com',
  event: event,
  organization: organization
)
url = UnsubscribeTokenService.generate_unsubscribe_url(token.token)
puts url
```

2. Visit URL in browser
3. Test all three scope options
4. Verify success message
5. Test resubscribe button

---

## Troubleshooting

### Issue: SSL 525 Error

**Cause:** Domain mismatch - unsubscribe URLs using domain without `www.` prefix

**Fix:** Ensure `FrontendUrlHelper.presents_frontend_url` returns correct domain with `www.` in production

### Issue: 500 Error on Unsubscribe Page

**Cause:** Missing `skip_before_action :check_presents_access`

**Fix:** Already implemented - controller skips both `:authorized` and `:check_presents_access` for public endpoints

### Issue: Token Already Used

**Cause:** User clicked link twice, token marked as used

**Solution:** User can still resubscribe using the same link if they're on the success page

### Issue: UNSUB Count Not Showing

**Cause:** `EmailUnsubscribe` table not being queried for scheduled emails

**Fix:** Already implemented - `ScheduledEmail#unsubscribed_count` checks the table

---

## Future Enhancements

### Planned Features
- ✅ Admin analytics dashboard (Completed)
- ✅ Resubscribe functionality (Completed)
- ✅ UNSUB count in Email Automation tab (Completed)
- ⏳ Unsubscribe reason survey (optional)
- ⏳ Bulk resubscribe for admin
- ⏳ Email preference center (fine-grained control)
- ⏳ Unsubscribe statistics per event/organization in producer dashboard

### Technical Debt
- Consider adding `unsubscribed_at` index for performance on large datasets
- Add background job for cleaning up expired tokens (currently relies on DB to ignore them)
- Consider caching unsubscribe checks for high-volume sending

---

## Related Documentation

- [Email System Documentation](./email/SCHEDULED_EMAILS_SYSTEM.md)
- [SendGrid Webhook Integration](./email/SENDGRID_WEBHOOKS.md)
- [Admin Analytics](./ADMIN_ANALYTICS.md)

---

## Change Log

### 2026-01-24
- ✅ Initial implementation
- ✅ Three-tier scope system (event/organization/global)
- ✅ Token-based security with 90-day expiration
- ✅ Frontend unsubscribe page with branded UI
- ✅ Email template integration (7 templates + invitations)
- ✅ Recipient filtering based on unsubscribe status
- ✅ Admin analytics with unsubscribe stats
- ✅ Resubscribe functionality
- ✅ UNSUB count in Email Automation tab
- ✅ FrontendUrlHelper for consistent URL generation

---

**For questions or issues, contact the development team.**
