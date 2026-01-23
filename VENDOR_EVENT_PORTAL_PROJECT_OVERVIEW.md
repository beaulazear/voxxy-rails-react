# Vendor Event Portal - Project Overview

## What We're Building

The Vendor Event Portal is a new vendor-facing page that provides comprehensive event information to vendors who have been invited and applied to an event. This portal serves as a central hub for vendors to access event details, category information, payment links, install times, and producer updates.

---

## Phase 1: Core Event Information Portal

### Purpose
Create a publicly accessible (with authentication) event portal page that displays all event details to vendors. All vendors see the same information - this is NOT a personalized dashboard in Phase 1.

### User Flow

1. **Event Creation** → Portal is auto-created with unique access code
2. **Vendor Receives Email** → After applying/being accepted, vendor receives email with portal link
3. **Email Link Contains Parameters** → `https://voxxypresents.com/portal/EVENT-202601-ABC123?email=vendor@example.com`
4. **Portal Page Loads** → Access code and email are pre-filled in the form
5. **One-Click Access** → Vendor clicks "Access Portal" button (or auto-submit on page load)
6. **Email Verification** → System checks:
   - Email must exist in event invitations (they were invited)
   - Email must exist in registrations (they applied)
   - **Both conditions required** to access portal
7. **Portal Access Granted** → Vendor sees event details page

**Benefits:**
- **From email**: One click access with pre-filled credentials
- **Manual entry**: If they lose the email, they can still manually enter code + email
- **Fallback**: Fields are editable if email changed or incorrect

### What Vendors See

Based on the prototype mockup:

- **Event Details**: Name, description, dates/times, venue, age restriction, ticket link
- **Vendor Categories**: All categories with pricing, payment links, install times, descriptions
- **Producer Updates**: Bulletin board with announcements, comments, timestamps, importance tags
- **Withdraw Option**: "Can't make it?" section to withdraw from event

---

## High-Level Changes

### Backend (Rails)

#### New Model: `EventPortal`
- Belongs to Event (one-to-one relationship)
- Auto-created when event is created
- Reuses existing access code from `vendor_application.shareable_code`
- Tracks view count and last viewed timestamp

#### New Controller: `EventPortalsController`
- `POST /api/v1/presents/portals/verify` - Verify access code + email
- `GET /api/v1/presents/portals/:access_code` - Get portal data
- Uses JWT session tokens (24-hour expiration)
- Public endpoints (no authentication required)

#### New Serializer: `EventPortalSerializer`
- Returns event details, vendor categories, producer updates
- Includes event, organization, and vendor applications data

#### Database Migration
- Create `event_portals` table
- Backfill existing events with portals

### Frontend (React)

#### New Routes
- `/portal/:accessCode` - Main portal page with authentication form
- URL params: `?email=vendor@example.com` (pre-fills email from email links)

#### New Components
- `VendorEventPortalPage` - Main portal page with two states:
  - **Authentication Form** (if not authenticated):
    - Access code field (pre-filled from URL param `:accessCode`)
    - Email field (pre-filled from URL param `?email=`)
    - "Access Portal" button
  - **Event Details View** (after authentication):
    - Event Details, Vendor Categories, Producer Updates, Withdraw sections

#### API Integration
- Verify access endpoint (sends code + email)
- Fetch portal data endpoint
- Store session token in localStorage
- Read URL params to pre-fill form fields

### Command Center Integration

#### Settings Tab → Event Links Section
Add new link display:
- **Application Page**: Existing link for vendors to apply
- **Event Portal**: New link for accepted vendors to view details

Features:
- Copy button for portal URL
- Open in new tab button
- Both links use same access code for consistency

Example URLs:
- Application: `https://voxxypresents.com/apply/EVENT-202601-ABC123`
- Portal: `https://voxxypresents.com/portal/EVENT-202601-ABC123`

---

## Architecture Notes

### Access Code Strategy
- Reuse existing `vendor_application.shareable_code` pattern
- Format: `EVENT-YYYYMM-RANDOM` (e.g., `EVENT-202601-A1B2C3`)
- One code per event, used for both application and portal
- Auto-generated on event creation

### Authentication Flow
- No user accounts required
- Email + access code verification
- JWT session tokens for subsequent requests
- 24-hour token expiration

### Access Control Rules
- Email must be in `event_invitations` (invited) AND `registrations` (applied)
- If invited but not applied → Access denied ("You must submit an application first")
- If not invited → Access denied ("Email not found")

### Data Model
```
Event (existing)
  ↓ has_one
EventPortal (new)
  ↓ belongs_to
Event
  ↓ has_many
VendorApplications (existing) → Displayed in portal
Registrations (existing) → Used for email verification
EventInvitations (existing) → Used for email verification
```

---

## Phase 1 Build Plan

### Week 1: Backend Foundation
- Create EventPortal model and migration
- Add auto-creation callback to Event model
- Implement access code generation (reuse pattern)
- Backfill existing events
- Write model tests

### Week 2: Backend API
- Build EventPortalsController with verify and show endpoints
- Implement JWT session token system
- Create EventPortalSerializer
- Add routes
- Write controller tests

### Week 3: Frontend Portal
- Create VendorEventPortalPage component
- Build authentication form with URL param pre-filling
- Build event details, categories, and updates sections
- Implement authentication flow and session management
- Add routing with URL param handling
- Style with existing dark theme

### Week 4: Command Center & Testing
- Add portal link to Settings tab (with ?email= param option)
- Copy button functionality
- Update email templates to include portal links with pre-filled params
- End-to-end testing
- Bug fixes and polish

---

## Phase 2: Action-Required Workflows (Future)

### Category Change Request Flow
When producer changes a vendor's category, vendor receives:
- Email notification: "Event producer updated your category"
- Link to portal with action token
- Modal showing:
  - Original category vs. proposed category
  - Price difference
  - Producer's note
  - Accept/Reject/Counter-propose options

**Implementation**: New `PortalAction` model to track vendor responses

---

## Open Questions

1. **Producer Updates**: Build new model or integrate with existing system?
2. **Withdrawal**: What happens when vendor withdraws? Notify producer? Open spot?
3. **Payment Tracking**: Track payment link clicks? Show "Paid" status?
4. **Mobile**: Web-only or mobile app support needed?

---

## Success Criteria

- [ ] Portal auto-creates on event creation
- [ ] Vendors can access with code + email
- [ ] All event details display correctly
- [ ] Payment links work
- [ ] Producer can copy portal URL from command center
- [ ] Access control prevents unauthorized access

---

## Related Files

### Backend
- `app/models/event_portal.rb` (new)
- `app/models/event.rb` (update)
- `app/controllers/api/v1/presents/event_portals_controller.rb` (new)
- `app/serializers/api/v1/presents/event_portal_serializer.rb` (new)
- `config/routes.rb` (update)

### Frontend
- `src/pages/VendorEventPortalPage.tsx` (new)
- `src/services/api/eventPortalService.ts` (new)
- `src/App.tsx` (update routes)
- Command Center Settings page (update)

### Email Templates
- Acceptance/confirmation emails (add portal link with `?email=` param)
- Payment reminder emails (add portal link)
- Event update/bulletin emails (add portal link)
- Any vendor-facing event communication (add portal link)

---

**Document Version**: 2.0
**Last Updated**: January 18, 2026
**Status**: Ready for Development
