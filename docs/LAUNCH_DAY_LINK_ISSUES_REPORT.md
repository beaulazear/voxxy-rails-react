# Launch Day Link Issues - Diagnostic Report

**Date**: 2026-02-04
**Customer**: Pancake and Booze Art Show (San Francisco)
**Impact**: Critical - Affects 3,000+ invitation emails
**Priority**: P0 - Must fix before launch

## Executive Summary

Event portal links in emails are inconsistent due to multiple URL generation patterns throughout the codebase. The primary issue is that `RegistrationEmailService` uses a hardcoded fallback URL (`https://voxxy.io`) instead of using the centralized `FrontendUrlHelper`, resulting in broken links when environment variables are not set.

## Root Cause Analysis

### Problem 1: Multiple URL Generation Patterns

The codebase has **4 different ways** of generating frontend URLs:

1. **EmailVariableResolver** (✅ CORRECT)
   - Uses: `FrontendUrlHelper.presents_frontend_url`
   - Location: [app/services/email_variable_resolver.rb:43](app/services/email_variable_resolver.rb#L43)

2. **RegistrationEmailService** (❌ WRONG)
   - Uses: `ENV["FRONTEND_URL"] || "https://voxxy.io"`
   - Locations:
     - Line 334 (approval email): `base_url = ENV["FRONTEND_URL"] || "https://voxxy.io"`
     - Line 564 (payment confirmation): `base_url = ENV["FRONTEND_URL"] || "https://voxxy.io"`
     - Lines 256-265 (attendee confirmation): Custom logic that differs from the others

3. **EventPortal Model** (⚠️ DUPLICATE LOGIC)
   - Duplicates `FrontendUrlHelper` logic inline
   - Location: [app/models/event_portal.rb:21-34](app/models/event_portal.rb#L21-L34)

4. **EventInvitation Model** (⚠️ DUPLICATE LOGIC)
   - Duplicates `FrontendUrlHelper` logic inline
   - Location: [app/models/event_invitation.rb:101-103](app/models/event_invitation.rb#L101-L103)

### Problem 2: Hardcoded Fallback Domain

When `ENV['FRONTEND_URL']` is not set (which is common in development and may happen in production if misconfigured), `RegistrationEmailService` falls back to `https://voxxy.io` - **a domain that doesn't exist in your infrastructure**.

**Affected Emails:**
- Vendor approval emails ("You're in")
- Payment confirmation emails
- Category change notifications

**Example Bad URL:**
```
https://voxxy.io/portal/pancake-and-booze-sf
```

**Expected URL:**
```
https://voxxy-presents-client-staging.onrender.com/portal/pancake-and-booze-sf
```

### Problem 3: Inconsistent Environment Variable Usage

Different parts of the codebase check different environment variables:

| Component | Variables Checked | Fallback |
|-----------|------------------|----------|
| FrontendUrlHelper | `FRONTEND_URL` → `PRESENTS_FRONTEND_URL` | `http://localhost:5173` (dev) |
| RegistrationEmailService | `FRONTEND_URL` only | `https://voxxy.io` ❌ |
| EventPortal | `FRONTEND_URL` only | `http://localhost:5173` |
| EventInvitation | `FRONTEND_URL` only | `http://localhost:5173` |

## Current Environment Configuration

### Development
```
Rails.env: development
PRIMARY_DOMAIN: nil
FRONTEND_URL: nil
PRESENTS_FRONTEND_URL: nil
Result: http://localhost:5173
```

### Production (Simulated)
```
Rails.env: production
PRIMARY_DOMAIN: nil
FRONTEND_URL: nil
PRESENTS_FRONTEND_URL: nil
Result: https://voxxy-presents-client-staging.onrender.com (PRIMARY_DOMAIN contains "voxxyai.com")
```

## Impact Assessment

### Emails Using Correct URLs (via EmailVariableResolver)
✅ **Scheduled campaign emails** - Use `[dashboardLink]` and `[eventLink]` variables
✅ **Event invitation emails** - Use `EventInvitation#invitation_url`
✅ **Event announcement emails** - Use template variables

### Emails Using Incorrect URLs (via RegistrationEmailService)
❌ **Vendor approval emails** (`send_approval_email`)
❌ **Payment confirmation emails** (`send_payment_confirmation`)
❌ **Category change emails** (`send_category_change_notification`)
❌ **Waitlist notification emails** (`send_waitlist_notification`)

## URL Generation Examples (Current System)

Using event: "Test Event for Eventbrite Sync" (slug: `test-event-sync`)

| Method | Current Output | Is Correct? |
|--------|---------------|-------------|
| EmailVariableResolver `[eventLink]` | `http://localhost:5173/events/test-event-sync` | ✅ |
| EmailVariableResolver `[dashboardLink]` | `http://localhost:5173/portal/test-event-sync` | ✅ |
| EventPortal#portal_url | `http://localhost:5173/portal/test-event-sync` | ✅ |
| RegistrationEmailService (approval) | `https://voxxy.io/portal/test-event-sync` | ❌ |
| RegistrationEmailService (payment) | `https://voxxy.io/portal/test-event-sync` | ❌ |

## Recommended Fix

### Solution: Centralize all URL generation through FrontendUrlHelper

**Step 1:** Update `RegistrationEmailService` to use `FrontendUrlHelper`

Replace:
```ruby
base_url = ENV["FRONTEND_URL"] || "https://voxxy.io"
dashboard_link = "#{base_url}/portal/#{event.slug}"
```

With:
```ruby
dashboard_link = "#{FrontendUrlHelper.presents_frontend_url}/portal/#{event.slug}"
```

**Step 2:** Refactor `EventPortal` and `EventInvitation` models to call `FrontendUrlHelper` instead of duplicating logic

**Step 3:** Add tests to ensure consistent URL generation across all email types

## Testing Checklist

Before launch, verify URLs in these emails:

- [ ] Vendor application submission confirmation
- [ ] Vendor approval email ("You're in")
- [ ] Vendor rejection email
- [ ] Payment confirmation email
- [ ] Waitlist notification
- [ ] Category change notification
- [ ] Event invitation email
- [ ] Scheduled campaign emails
- [ ] Event details changed email
- [ ] Event canceled email

## Next Steps

1. ✅ Create feature branch: `feature/launch-day-email-portal-links`
2. ⏳ Fix `RegistrationEmailService`
3. ⏳ Refactor `EventPortal` and `EventInvitation` models
4. ⏳ Run test suite
5. ⏳ Manual QA with test emails
6. ⏳ Merge to staging
7. ⏳ Test on staging environment
8. ⏳ Merge to main for production deployment

## Files to Modify

1. [app/services/registration_email_service.rb](app/services/registration_email_service.rb)
   - Lines 334-335 (approval email)
   - Lines 564-565 (payment confirmation)
   - Lines 646-647 (category change)
   - Lines 256-265 (attendee confirmation - also needs updating)

2. [app/models/event_portal.rb](app/models/event_portal.rb)
   - Lines 20-34 (remove duplicate logic)

3. [app/models/event_invitation.rb](app/models/event_invitation.rb)
   - Lines 100-103 (remove duplicate logic)

## Monitoring for Launch Day

Once fixed, monitor:
- SendGrid delivery logs for 404 errors
- Bounce rates on vendor emails
- Support tickets mentioning broken links
- Redis/Sidekiq logs for email job failures

---

**Report Generated**: 2026-02-04
**Diagnostic Script**: `diagnose_event_links.rb`
