# Category-Specific Application Links - Project Documentation

**Status:** In Development
**Target Launch:** Pancakes & Booze Pilot (Granby, CO)
**Created:** February 5, 2026
**Branch:** `feature/email-preview-improvements`

---

## Overview

This feature replaces generic invitation token links with direct category-specific application links in vendor invitation emails. Instead of one invitation URL that redirects to a generic page, vendors now receive multiple hyperlinked category options (e.g., "Artists", "Vendors") that link directly to the appropriate application form with pre-filled contact information.

---

## Business Requirements

### Problem Statement
- Previous system used invitation tokens (`/invitations/{token}`) that required an extra redirect step
- Vendors couldn't easily choose between multiple application categories (Artists vs Vendors)
- Application forms required manual data entry even though we had vendor contact information
- Email displayed raw URLs instead of clean, professional hyperlinked text

### Solution
- Generate direct links to category-specific application pages: `/events/{slug}/{vendor-app-id}/apply?token={token}`
- Display multiple category options as clickable hyperlinked text in emails
- Pre-fill application forms with vendor contact data (email, first name, last name, business name)
- Improve email UX with clean, professional styling

---

## Technical Implementation

### Backend Changes (Rails API)

#### 1. EventInvitation Model Updates
**File:** `app/models/event_invitation.rb`

New methods added:
```ruby
# Generate category-specific application URL with pre-fill token
def vendor_application_url(vendor_application, base_url = nil)
  base_url ||= presents_frontend_url
  "#{base_url}/events/#{event.slug}/#{vendor_application.id}/apply?token=#{invitation_token}"
end

# Get all vendor application links for email display
def vendor_application_links(base_url = nil)
  event.vendor_applications.active.map do |vendor_app|
    {
      id: vendor_app.id,
      name: vendor_app.name,
      description: vendor_app.description,
      url: vendor_application_url(vendor_app, base_url)
    }
  end
end
```

**Purpose:** Generate unique URLs for each vendor application category with embedded invitation token for pre-fill.

---

#### 2. Pre-Fill Token Endpoint
**File:** `app/controllers/api/v1/presents/event_invitations_controller.rb`

New endpoint:
```ruby
# GET /api/v1/presents/event_invitations/prefill/:token
def prefill
  invitation = EventInvitation.find_by!(invitation_token: params[:token])
  vendor_contact = invitation.vendor_contact

  # Parse name into first/last
  name_parts = (vendor_contact.name || "").split(" ", 2)

  render json: {
    email: vendor_contact.email,
    first_name: name_parts[0] || "",
    last_name: name_parts[1] || "",
    business_name: vendor_contact.business_name
  }
rescue ActiveRecord::RecordNotFound
  render json: { error: "Invalid invitation token" }, status: :not_found
end
```

**Purpose:** Decode invitation token and return vendor contact data for form pre-population.

**Route:** `GET /api/v1/presents/event_invitations/prefill/:token`

---

#### 3. Email Mailer Updates
**File:** `app/mailers/event_invitation_mailer.rb`

Updated `invitation_email` method:
```ruby
def invitation_email(event_invitation)
  @invitation = event_invitation
  @event = event_invitation.event
  @vendor_contact = event_invitation.vendor_contact
  @organization = @event.organization
  @vendor_applications = @event.vendor_applications.active  # NEW

  # ... rest of method
end
```

**Purpose:** Pass vendor applications to email template for category link generation.

---

#### 4. Email Template Updates
**File:** `app/views/event_invitation_mailer/invitation_email.html.erb`

**Before:**
```html
<p>Submit your work here:<br/>
<a href="<%= @invitation_url %>" class="link"><%= @invitation_url %></a></p>
```

**After:**
```html
<p>Submit your work below:</p>

<% @invitation.vendor_application_links.each do |app_link| %>
  <p><strong><%= app_link[:name] %></strong> - <a href="<%= app_link[:url] %>" class="link">Apply Here</a></p>
<% end %>
```

**Example Output:**
```
Submit your work below:

Artists - Apply Here
Vendors - Apply Here
```

**Purpose:** Display clean, hyperlinked category options instead of raw URLs.

---

### Frontend Changes (voxxy-presents-client)

#### 1. Pre-Fill Token Handler
**Location:** Application form component (to be implemented)

**Logic:**
```javascript
// Detect ?token= parameter
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  // Fetch vendor contact data
  const response = await fetch(`/api/v1/presents/event_invitations/prefill/${token}`);
  const data = await response.json();

  // Pre-populate form fields
  setEmail(data.email);
  setFirstName(data.first_name);
  setLastName(data.last_name);
  setBusinessName(data.business_name);
}
```

---

#### 2. UI Changes - Hide Payment Details
**Location:** Event application page

**Changes:**
- Hide `booth_price` from event detail view
- Make `booth_price` optional (not required) in event creation flow
- Payment details mentioned in category description only
- Keep field in database for internal tracking

---

#### 3. UI Changes - Hide Application Description
**Location:** Application page

**Changes:**
- Hide `event.description` from application form page
- Keep in database, just don't display in UI

---

## Data Flow

### Email Send Flow
1. Producer sends invitation via `EventInvitationMailer.invitation_email(invitation)`
2. Mailer loads event's active vendor applications
3. Template calls `@invitation.vendor_application_links`
4. Method generates array of category links with embedded `invitation_token`
5. Email displays: "Artists - Apply Here" | "Vendors - Apply Here"

### Application Flow
1. Vendor clicks "Artists - Apply Here" in email
2. Browser navigates to: `/events/pancakes-booze-sf/42/apply?token=abc123xyz`
3. Frontend detects `?token=abc123xyz` parameter
4. Frontend calls: `GET /api/v1/presents/event_invitations/prefill/abc123xyz`
5. Backend returns: `{ email, first_name, last_name, business_name }`
6. Frontend pre-fills form fields
7. Vendor reviews, completes remaining fields, submits

---

## Database Schema

No new tables or migrations required. Uses existing:

### `event_invitations` table
- `invitation_token` (string) - Secure token for pre-fill authentication
- `event_id` - Associated event
- `vendor_contact_id` - Associated vendor contact

### `vendor_applications` table
- `name` (string) - Category name (e.g., "Artists", "Vendors")
- `description` (text) - Category description
- `status` (string) - "active" or "inactive"
- `event_id` - Parent event

### `vendor_contacts` table
- `name` (string) - Full name (parsed into first/last)
- `email` (string) - Pre-fill email
- `business_name` (string) - Pre-fill business name

---

## Security Considerations

### Token Security
- `invitation_token` is generated using `SecureRandom.urlsafe_base64(32)` (256-bit entropy)
- Tokens are unique per invitation (validated at database level)
- Tokens expire based on `event.application_deadline` or `event.event_date`
- Pre-fill endpoint validates token existence before returning data

### Data Privacy
- Pre-fill endpoint only returns data that vendor already provided
- No sensitive payment or internal data exposed
- Token cannot be used to modify data, only read contact info

---

## Testing

### Backend Testing (Rails Console)
```ruby
# Test URL generation
invitation = EventInvitation.last
links = invitation.vendor_application_links

puts links.inspect
# => [
#   { id: 1, name: "Artists", url: "https://voxxypresents.com/events/event-slug/1/apply?token=..." },
#   { id: 2, name: "Vendors", url: "https://voxxypresents.com/events/event-slug/2/apply?token=..." }
# ]

# Test prefill endpoint
token = invitation.invitation_token
# Then test: GET /api/v1/presents/event_invitations/prefill/{token}
```

### Manual Testing Checklist
- [ ] Send test invitation email
- [ ] Verify email shows hyperlinked category text (not raw URLs)
- [ ] Click category link, verify URL format
- [ ] Verify pre-fill endpoint returns correct data
- [ ] Verify form fields populate correctly
- [ ] Verify application submission works
- [ ] Verify payment details hidden from UI
- [ ] Verify description hidden from application page

---

## Deployment Plan

### Phase 1: Backend Deployment (Staging)
1. Merge `feature/email-preview-improvements` → `staging`
2. Deploy to staging environment
3. Run migrations (none required for this feature)
4. Test pre-fill endpoint manually

### Phase 2: Frontend Deployment (Staging)
1. Deploy frontend changes to staging
2. Test end-to-end flow with test invitation

### Phase 3: Production Deployment
1. Merge `staging` → `main`
2. Deploy backend to production
3. Deploy frontend to production
4. Monitor SendGrid delivery logs
5. Verify first real invitation sends correctly

---

## Rollback Plan

If issues arise in production:

1. **Email Template Rollback:**
   - Revert `app/views/event_invitation_mailer/invitation_email.html.erb` to previous version
   - Deploy hotfix to restore single invitation link

2. **Code Rollback:**
   - Revert commit with `git revert`
   - Deploy previous version

3. **Data Safety:**
   - No data migrations, so rollback is safe
   - Existing invitations unaffected

---

## Performance Considerations

### Query Optimization
- `event.vendor_applications.active` uses indexed query on `status` column
- Pre-fill endpoint uses indexed lookup on `invitation_token` (unique index)
- No N+1 queries introduced

### Caching
- Frontend can cache pre-fill data in session storage
- Prevents multiple API calls for same token

---

## Future Enhancements

### Potential Improvements
1. **Token Expiration Validation:** Add explicit check in pre-fill endpoint for expired invitations
2. **Analytics Tracking:** Track which category links are clicked most
3. **A/B Testing:** Test different email copy variations
4. **Multi-Language Support:** Internationalize category names and email copy
5. **Dynamic Category Descriptions:** Pull descriptions from vendor_applications table

---

## Related Documentation

- [Email Automation System Guide](../email/EMAIL_AUTOMATION_SYSTEM_GUIDE.md)
- [Email Variable Resolver](../../app/services/email_variable_resolver.rb)
- [Invitation Variable Resolver](../../app/services/invitation_variable_resolver.rb)
- [Event Invitations Controller](../../app/controllers/api/v1/presents/event_invitations_controller.rb)

---

## Support & Questions

For questions about this feature:
- **Email:** team@voxxyai.com
- **Developer:** Contact via GitHub Issues

---

**Last Updated:** February 5, 2026
**Feature Status:** In Development
**Target Launch:** Pancakes & Booze Pilot Event
