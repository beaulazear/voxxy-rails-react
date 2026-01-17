# Email Preview Feature

**Last Updated:** January 17, 2026

## Overview

Added email preview functionality to the admin email testing dashboard. Admins can now preview any of the 21 emails before sending them, seeing exactly what recipients will receive.

---

## What Was Added

### Backend Changes

**1. New Preview Endpoint** (`app/controllers/admin/emails_controller.rb`)

Added `POST /admin/emails/preview` endpoint that generates email HTML without sending:

```ruby
def preview
  email_type = params[:email_type]
  service = Admin::EmailTestService.new(current_user)
  test_data = service.setup_test_data

  # Generate HTML based on email type
  html_content = case email_type
  when "scheduled_1" then preview_scheduled_email(test_data, 1)
  when "application_confirmation" then preview_registration_email(...)
  # ... all 21 email types
  end

  render json: { html: html_content }
end
```

**Supported Email Types:**
- `scheduled_1` through `scheduled_7` - Scheduled automated emails
- `application_confirmation`, `application_approved`, `application_rejected`, `application_waitlist` - Vendor application emails
- `invitation_vendor`, `invitation_accepted_vendor`, etc. - Event invitation emails
- `new_submission`, `payment_confirmed`, `category_changed`, `event_updated`, `event_canceled` - Admin/Producer notifications

**2. Helper Methods**

Added preview helper methods that generate HTML using:
- `BaseEmailService.build_simple_email_template()` for most emails
- `EventInvitationMailer` views for invitation emails

### Frontend Changes

**1. New EmailPreviewModal Component** (`src/components/admin/EmailPreviewModal.tsx`)

Beautiful modal that displays email HTML:
- Full-screen modal with dark purple theme
- Iframe rendering for accurate email display
- Loading state while fetching preview
- Close button and backdrop dismiss
- Matches admin dashboard design

**2. Updated EmailTestingPanel** (`src/components/admin/EmailTestingPanel.tsx`)

Added preview functionality:
- **Preview button** on every email card (Eye icon)
- **Modal state management** (open/close, loading, HTML content)
- **Email type mapping** - Maps email names to backend email_type parameter
- **Error handling** for failed preview requests

**3. Updated API Service** (`src/services/api.ts`)

Added `adminApi.previewEmail(emailType)` method:
```typescript
async previewEmail(emailType: string) {
  const response = await fetch(`/admin/emails/preview.json`, {
    method: 'POST',
    body: JSON.stringify({ email_type: emailType })
  })
  return response.json() // { html: "..." }
}
```

### UI Improvements

**Consolidated Warning Messages**

Removed duplicate security warnings:

**Before:**
- Blue box: "Test Email Recipient: user@email.com. All test emails will be sent..."
- Yellow box: "Security Note: Emails are automatically sent to YOUR email address..."

**After:**
- Single blue box with icon: "Test Email Recipient: user@email.com. All test emails will be sent to your admin email address only. This cannot be changed for security reasons."

---

## How It Works

### Preview Flow

1. **User clicks "Preview" button** on any email card
2. **Modal opens immediately** (shows loading spinner)
3. **API request sent** to `/admin/emails/preview.json` with email_type
4. **Backend generates HTML:**
   - Creates test data (event, registration, etc.)
   - Renders email template with test data
   - Returns HTML string
5. **Frontend displays HTML** in iframe
6. **User sees exact email** as recipients would see it

### Email Type Mapping

Frontend maps email names to backend types:

```typescript
// Category 0: Scheduled (position 1-7)
"1 Day Before Application Deadline" → "scheduled_1"
"Application Deadline Day" → "scheduled_2"

// Category 1: Vendor Applications
"Application Confirmation" → "application_confirmation"
"Application Approved" → "application_approved"

// Category 2: Event Invitations
"Vendor Invitation" → "invitation_vendor"
"Invitation Accepted - Vendor Confirmation" → "invitation_accepted_vendor"

// Category 3: Admin/Producer Notifications
"New Vendor Submission Notification" → "new_submission"
"Payment Confirmed" → "payment_confirmed"
```

---

## User Experience

### Before Preview Feature

❌ Admins had to send actual emails to see what they look like
❌ Cluttering inbox with test emails
❌ No way to verify content without sending

### After Preview Feature

✅ Click "Preview" on any email card
✅ See exact HTML rendering in modal
✅ No emails sent (preview only)
✅ Fast and instant feedback
✅ Test data created automatically

---

## UI Design

### Email Card with Preview Button

```
┌─────────────────────────────────┐
│ 📧  1 Day Before Application    │
│     Deadline                     │
│                                  │
│     Last Chance: Applications   │
│     Close Tomorrow               │
│                                  │
│  ┌───────────────────────────┐  │
│  │  👁️  Preview              │  │ ← NEW
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Preview Modal

```
┌────────────────────────────────────────────┐
│  Email Preview                         ✕   │
│  1 Day Before Application Deadline         │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │                                      │ │
│  │  [Rendered Email HTML in iframe]    │ │
│  │                                      │ │
│  │  • Uses actual email styling        │ │
│  │  • Shows resolved variables         │ │
│  │  • Links are visible                │ │
│  │  • Footer included                  │ │
│  │                                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
├────────────────────────────────────────────┤
│                               [Close]      │
└────────────────────────────────────────────┘
```

---

## Technical Details

### iframe Sandboxing

Preview uses sandboxed iframe for security:

```tsx
<iframe
  srcDoc={emailHtml}
  sandbox="allow-same-origin"
  className="w-full h-full border-0"
/>
```

**Security benefits:**
- Prevents JavaScript execution
- Isolates email content from main app
- No access to parent window
- Safe rendering of user-generated content

### Variable Resolution

Emails use variables that get resolved:

**Template:**
```
Subject: Last Chance: [eventName] Applications Close Tomorrow
```

**Preview output:**
```
Subject: Last Chance: TEST - Summer Market 2026 Applications Close Tomorrow
```

All variables (`[eventName]`, `[eventDate]`, etc.) are resolved using `EmailVariableResolver` with test data.

### Test Data Generation

Preview automatically creates test data:
- Test event: "TEST - Summer Market 2026"
- Test registration: "test.vendor@voxxypresents.com"
- Test organization: "TEST - Sample Venue"
- Test dates: 1 month from now

This data is reused across previews and doesn't clutter production data.

---

## Benefits

### For Admins

✅ **Quick verification** - See emails instantly without sending
✅ **Accurate rendering** - See exact HTML as recipients see it
✅ **No inbox clutter** - Preview doesn't send real emails
✅ **Variable testing** - Verify all variables resolve correctly
✅ **Style validation** - Check consistent styling across all emails
✅ **Link checking** - Verify all links are present and formatted

### For Development

✅ **Faster iteration** - No need to send test emails during development
✅ **Visual regression** - Easy to spot styling changes
✅ **Template debugging** - See exactly what's rendered
✅ **Safe testing** - No risk of sending to real users

---

## Edge Cases Handled

**1. Missing Template**
- Returns: `<p>No default template found</p>`
- User sees error in preview modal

**2. Missing Test Data**
- Automatically creates test data on first preview
- Reuses existing test data on subsequent previews

**3. API Errors**
- Displays error message at top of dashboard
- Modal closes automatically
- User can retry preview

**4. Long Email Content**
- iframe scrolls independently
- Modal has max-height of 90vh
- Content never overflows screen

---

## Known Limitations

1. **ActionMailer Emails Only Show Body**
   - Invitation emails use `mailer.body.to_s`
   - Subject line not included in preview
   - Future: Could parse full message object

2. **Preview Uses Test Data**
   - Variables resolved with "TEST -" prefix
   - Not actual production event names
   - This is intentional for safety

3. **No Mobile Preview**
   - iframe shows desktop view only
   - Future: Could add responsive toggle
   - Emails are responsive but preview is fixed width

---

## Future Enhancements

Potential additions:

- [ ] Mobile/desktop preview toggle
- [ ] Side-by-side comparison of multiple emails
- [ ] Preview history (see previous previews)
- [ ] Export preview as HTML file
- [ ] Copy preview HTML to clipboard
- [ ] Preview with custom test data (choose event/registration)
- [ ] Email accessibility checker
- [ ] Link validator (test all URLs)

---

## Files Modified

**Backend:**
- `app/controllers/admin/emails_controller.rb` - Added preview action and helpers
- `config/routes.rb` - Added `post :preview` route

**Frontend:**
- `src/services/api.ts` - Added `previewEmail()` method
- `src/components/admin/EmailTestingPanel.tsx` - Added preview button and handlers
- `src/components/admin/EmailPreviewModal.tsx` - **NEW FILE** - Preview modal component

---

## Testing Checklist

When testing preview feature:

- [ ] Click preview on scheduled emails (all 7)
- [ ] Click preview on vendor application emails (all 4)
- [ ] Click preview on invitation emails (all 5)
- [ ] Click preview on admin/producer emails (all 5)
- [ ] Verify modal opens instantly
- [ ] Verify loading spinner shows while fetching
- [ ] Verify email HTML renders correctly in iframe
- [ ] Verify variables are resolved (no [eventName] placeholders)
- [ ] Verify links are visible and formatted
- [ ] Verify "Powered by Voxxy Presents" footer shows
- [ ] Verify modal closes with X button
- [ ] Verify modal closes with backdrop click
- [ ] Test error handling (disconnect network)
- [ ] Test on mobile screen size

---

## Summary

✅ Preview functionality fully integrated
✅ All 21 emails can be previewed
✅ No emails sent during preview
✅ Beautiful modal matches admin dashboard theme
✅ Duplicate security warnings consolidated
✅ Iframe renders email HTML safely
✅ Test data created automatically
✅ Error handling included

**Users can now preview all emails before sending them!**

---

**Questions or issues?** Check the troubleshooting section in `EMAIL_TESTING_REACT_INTEGRATION.md`.

**Last Updated:** January 17, 2026
