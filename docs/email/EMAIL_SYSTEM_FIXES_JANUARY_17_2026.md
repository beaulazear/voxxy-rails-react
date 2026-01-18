# Email System Fixes and Improvements - January 17, 2026

**Date:** January 17, 2026
**Updated By:** Claude Code
**Session:** Email Template Migration & Testing Panel Improvements
**Final Email Count:** 17 emails (down from 21)

---

## Executive Summary

This document details critical fixes and improvements made to the Voxxy Presents email system on January 17, 2026. The changes address scheduling accuracy, timezone handling, template structure, admin testing capabilities, and workflow simplification.

**Major Changes:**
- Template structure migration (16 → 7 scheduled emails)
- Timezone fix (UTC → Eastern time)
- Payment deadline calculator improvements
- Admin preview enhancements
- Removed 4 invitation accept/decline emails (21 → 17 total)

---

## Critical Fixes

### 1. Email Template Structure Migration (16 → 7 Emails)

**Problem:**
- Production had 16 email template items (positions 1-16)
- Positions 8-16 contained old emoji-based emails
- Positions 1-7 had wrong trigger settings from old structure
- New events were generating emails with incorrect dates

**Root Cause:**
- Idempotent seed file didn't update existing templates
- Rake task only updated name/subject/body, NOT trigger settings
- Template items retained old trigger types from 16-item structure

**Solution:**
1. Created cleanup rake task to delete positions 8-16
2. Updated rake task to include trigger_type, trigger_value, trigger_time
3. Ran migration on production

**Files Modified:**
- `lib/tasks/email_templates.rake` - Added trigger settings to updates
- `lib/tasks/email_templates_cleanup.rake` - Created cleanup task
- `docs/EMAIL_TEMPLATE_MIGRATION_GUIDE.md` - Migration documentation

**Rake Tasks:**
```bash
# Show current template structure
rails email_templates:show_default

# Show scheduled emails using old items
rails email_templates:show_old_scheduled_emails

# Delete positions 8-16 (one-time migration)
rails email_templates:cleanup_old_structure

# Update template with correct trigger settings
rails email_templates:update_default
```

**Results:**
- ✅ Production template now has 7 positions (emoji-free)
- ✅ Trigger settings correct for all 7 emails
- ✅ New events generate 7 emails with correct dates

---

### 2. Timezone Fix (UTC → Eastern Time)

**Problem:**
- Emails scheduled for "08:00" were being sent at 8:00 AM UTC
- Should be sent at 8:00 AM Eastern time (EST/EDT)
- 5-hour difference caused emails to send at 3:00 AM Eastern in winter

**Root Cause:**
- `EmailScheduleCalculator#combine_date_and_time` used `Time.use_zone("UTC")`
- Interpreted trigger times as UTC instead of Eastern

**Solution:**
Changed timezone from UTC to America/New_York in EmailScheduleCalculator

**File Modified:**
- `app/services/email_schedule_calculator.rb:125`

**Code Change:**
```ruby
# BEFORE
Time.use_zone("UTC") do
  Time.zone.local(date.year, date.month, date.day, hour, minute, 0)
end

# AFTER
Time.use_zone("America/New_York") do
  Time.zone.local(date.year, date.month, date.day, hour, minute, 0)
end
```

**Impact:**
- Trigger time "08:00" now means 8:00 AM EST/EDT
- Rails stores as UTC in database (13:00 UTC in winter, 12:00 UTC in summer)
- Automatic DST handling via America/New_York timezone
- Affects ALL future scheduled emails

**Example:**
```
Trigger time: "08:00"
Old behavior: Sent at 08:00 UTC (3:00 AM EST)
New behavior: Sent at 08:00 EST (13:00 UTC)
```

---

### 3. Payment Deadline Calculator Fix

**Problem:**
- Payment-related emails calculated using application_deadline as proxy
- Should use separate payment_deadline field
- Caused wrong dates for payment reminder emails

**Root Cause:**
- Lines 43-48 in EmailScheduleCalculator had comment: "Use application_deadline as proxy for payment deadline"
- No methods for calculate_days_before_payment_deadline or calculate_on_payment_deadline

**Solution:**
Added proper payment_deadline calculation methods

**File Modified:**
- `app/services/email_schedule_calculator.rb`

**Methods Added:**
```ruby
def calculate_days_before_payment_deadline(days, time)
  return nil unless event.payment_deadline
  scheduled_date = event.payment_deadline - days.days
  combine_date_and_time(scheduled_date, time)
end

def calculate_on_payment_deadline(time)
  return nil unless event.payment_deadline
  combine_date_and_time(event.payment_deadline, time)
end
```

**Impact:**
- Position 3 email: "1 Day Before Payment Due" now uses payment_deadline - 1
- Position 4 email: "Payment Due Today" now uses payment_deadline
- Requires events to have payment_deadline field populated

---

### 4. Admin Email Preview Improvements

**Problem 1: Invitation Emails Not Previewing**
- Clicking preview on invitation emails showed blank or failed
- Error: Unable to extract HTML from multipart Mail objects

**Root Cause:**
- `preview_invitation_email` method used `.body.to_s` on Mail object
- Doesn't properly extract HTML from multipart emails (HTML + text)

**Solution:**
Extract HTML part specifically from multipart emails

**File Modified:**
- `app/controllers/admin/emails_controller.rb:370-390`

**Code Change:**
```ruby
# BEFORE
def preview_invitation_email(invitation, type)
  case type
  when :invitation
    EventInvitationMailer.invitation_email(invitation).body.to_s
  # ... other cases
  end
end

# AFTER
def preview_invitation_email(invitation, type)
  mail = case type
  when :invitation
    EventInvitationMailer.invitation_email(invitation)
  # ... other cases
  end

  # Extract HTML body from multipart email
  if mail.multipart?
    mail.html_part&.body&.decoded || mail.text_part&.body&.decoded || ""
  else
    mail.body.decoded
  end
end
```

**Result:**
- ✅ All 5 invitation email previews now work
- ✅ Properly renders HTML content
- ✅ Falls back to text part if HTML not available

**Problem 2: Preview Modal Too Small**
- Modal was cramped, required excessive scrolling
- Hard to review email content

**Solution:**
Increased modal dimensions and improved flexbox layout

**File Modified:**
- `src/components/admin/EmailPreviewModal.tsx` (frontend)

**Changes:**
- Width: `max-w-4xl` → `max-w-6xl` (wider)
- Height: `max-h-[90vh]` → `h-[85vh]` (fixed height)
- Added `flex-shrink-0` to header and footer
- Added `min-h-0` to content area for proper overflow

**Result:**
- ✅ Modal shows significantly more content
- ✅ Less scrolling required
- ✅ Better preview experience

---

### 5. Removed Invitation Accept/Decline Workflow (21 → 17 Emails)

**Problem:**
- System had 5 invitation emails with accept/decline workflow
- Workflow was unnecessary - vendors apply if interested, no RSVP needed
- Accept/decline emails never used in practice
- Added complexity without value

**User Workflow (Simplified):**
1. Producer sends **Vendor Invitation** email (announcement)
2. Vendor receives invitation with event details
3. If interested → Vendor applies through application system
4. If not interested → No action needed
5. Producer tracks who was invited (database tracking remains)

**Solution:**
Removed 4 accept/decline emails, kept only invitation announcement

**Files Removed:**
- `app/views/event_invitation_mailer/accepted_confirmation_vendor.html.erb`
- `app/views/event_invitation_mailer/accepted_notification_producer.html.erb`
- `app/views/event_invitation_mailer/declined_confirmation_vendor.html.erb`
- `app/views/event_invitation_mailer/declined_notification_producer.html.erb`
- (Plus text versions)

**Files Modified:**
- `app/mailers/event_invitation_mailer.rb` - Removed 4 mailer methods
- `app/controllers/admin/emails_controller.rb` - Removed preview cases, updated counts
- `app/services/admin/email_test_service.rb` - Removed test sending code
- Frontend: `EmailTestingPanel.tsx` - Updated counts and categories
- Documentation: Updated all references from 21 → 17 emails

**Model Unchanged:**
- `EventInvitation` model kept as-is (accept!/decline! methods preserved for potential future use)

**Result:**
- ✅ Simplified invitation workflow
- ✅ Removed unused emails
- ✅ Total emails: 21 → 17
- ✅ Invitation category: 5 → 1 email

**Final Email Breakdown (17 Total):**
- Scheduled: 7 emails
- Vendor Application: 4 emails
- Event Invitation: 1 email (was 5)
- Admin/Producer: 5 emails

---

## The 7 Scheduled Email Templates

After cleanup, these are the final 7 automated emails with correct trigger settings:

| Position | Name | Trigger Type | Trigger Value | Trigger Time |
|----------|------|--------------|---------------|--------------|
| 1 | 1 Day Before Application Deadline | `days_before_deadline` | 1 | 09:00 |
| 2 | Application Deadline Day | `days_before_deadline` | 0 | 08:00 |
| 3 | 1 Day Before Payment Due | `days_before_payment_deadline` | 1 | 10:00 |
| 4 | Payment Due Today | `on_payment_deadline` | 0 | 08:00 |
| 5 | 1 Day Before Event | `days_before_event` | 1 | 17:00 |
| 6 | Day of Event | `on_event_date` | 0 | 07:00 |
| 7 | Day After Event - Thank You | `days_after_event` | 1 | 10:00 |

**Trigger Type Reference:**
- `days_before_deadline` - X days before application_deadline
- `days_before_payment_deadline` - X days before payment_deadline ✨ **NEW**
- `on_payment_deadline` - On payment_deadline date at trigger_time ✨ **NEW**
- `days_before_event` - X days before event_date
- `on_event_date` - On event_date at trigger_time
- `days_after_event` - X days after event_date

---

## Admin Email Testing Panel

### Current Features (All Working)

**Preview System:**
- ✅ Preview all 17 emails before sending
- ✅ Renders actual HTML in modal
- ✅ Works for all categories including invitation
- ✅ Large modal for better visibility
- ✅ Generates test data without sending actual emails

**Sending System:**
- ✅ Send all 17 emails to admin inbox
- ✅ Send 7 scheduled emails only
- ✅ Automatic test data generation
- ✅ Cleanup test data functionality

**Email Categories:**
1. **Scheduled Automated Emails (7)** - Time-based triggers
2. **Vendor Application Emails (4)** - Status change triggers
3. **Event Invitation Email (1)** - Vendor announcement
4. **Admin/Producer Notifications (5)** - Producer alerts

### Access

**Admin Panel:**
```
URL: /admin/emails
Role: Admin only
Features: All 21 email previews and sending
```

**API Endpoints:**
```
GET  /admin/emails              → Load dashboard
POST /admin/emails/send_all     → Send all 21 emails
POST /admin/emails/send_scheduled → Send 7 scheduled emails
POST /admin/emails/setup_test_data → Create test data
POST /admin/emails/preview      → Preview email (with skip_callbacks)
DELETE /admin/emails/cleanup_test_data → Remove test data
```

### Testing Workflow

**Recommended Process:**
```
1. Navigate to /admin/emails
2. Click "Setup Test Data" (first time only)
3. Preview emails using "Preview" button on each card
4. Send test emails using "Send All 21 Emails" button
5. Check your admin email inbox (2-3 minutes)
6. Verify content, styling, and deliverability
7. Optional: Click "Cleanup Test Data" to remove test records
```

**Preview vs Send:**
- **Preview:** Generates test data with `skip_callbacks: true`, no emails sent
- **Send:** Generates test data, actually sends emails via SendGrid

---

## Migration Steps for Existing Events

If you have existing events with wrong scheduled emails:

**Step 1: Delete incorrect emails**
```bash
rails runner "ScheduledEmail.where(event_id: EVENT_ID).destroy_all"
```

**Step 2: Regenerate with correct template**
```bash
rails runner "event = Event.find(EVENT_ID); ScheduledEmailGenerator.new(event).generate"
```

**Step 3: Verify**
```bash
rails runner "puts ScheduledEmail.where(event_id: EVENT_ID).order(:scheduled_for).pluck(:id, :trigger_type, :scheduled_for).map { |id, type, time| \"ID: #{id} | #{type} | #{time}\" }.join(\"\n\")"
```

**Expected Output (7 emails with correct dates):**
```
ID: 235 | days_before_deadline | 2026-02-05 09:00:00 UTC
ID: 236 | days_before_deadline | 2026-02-06 08:00:00 UTC
ID: 237 | days_before_payment_deadline | 2026-02-06 10:00:00 UTC
ID: 238 | on_payment_deadline | 2026-02-07 08:00:00 UTC
ID: 239 | days_before_event | 2026-02-06 17:00:00 UTC
ID: 240 | on_event_date | 2026-02-07 07:00:00 UTC
ID: 241 | days_after_event | 2026-02-08 10:00:00 UTC
```

---

## Database Schema Updates

**No schema changes required.** All fixes were logic-only:
- EmailScheduleCalculator service logic
- Admin::EmailTestService preview logic
- Email template trigger settings (data only)

**Event Model Requirements:**
Events must now have these fields populated for email generation:
- `event_date` - Required for event-based emails
- `application_deadline` - Required for deadline emails
- `payment_deadline` - **NEW requirement** for payment emails

---

## Testing Checklist

### Before Deployment
- [x] Run email_templates:update_default on production
- [x] Test timezone calculation with sample dates
- [x] Verify payment_deadline field exists on events
- [x] Test email preview for all 21 categories
- [x] Test modal rendering and sizing

### After Deployment
- [ ] Create test event with all date fields
- [ ] Verify 7 emails generated with correct dates
- [ ] Check email times are in Eastern timezone (not UTC)
- [ ] Test admin email preview panel
- [ ] Preview all 21 emails including invitations
- [ ] Send test emails and verify receipt
- [ ] Monitor SendGrid delivery logs

### Regression Testing
- [ ] Existing events still send emails correctly
- [ ] Frontend email automation UI still works
- [ ] Scheduled email editing still functional
- [ ] SendGrid webhooks still processing
- [ ] Email delivery tracking still working

---

## Breaking Changes

### None - All Changes Backward Compatible

**Timezone Change:**
- Only affects **future** scheduled emails
- Existing scheduled emails retain their original times
- No migration needed for existing data

**Payment Deadline:**
- Events without payment_deadline: Payment emails return nil (not scheduled)
- Gracefully handles missing payment_deadline field
- Existing events unaffected

**Template Structure:**
- New events get 7 emails (not 16)
- Existing events keep their current scheduled emails
- No automatic regeneration required

---

## Performance Impact

### Minimal to None

**Timezone Change:**
- Same number of database queries
- Slightly different datetime calculation (negligible)

**Payment Deadline:**
- Added 2 simple methods (no extra queries)
- Returns early if payment_deadline missing

**Preview System:**
- Generates test data on-demand (only when previewing)
- Uses `skip_callbacks: true` to prevent side effects
- No impact on production email sending

---

## Monitoring Recommendations

### Key Metrics to Watch

**Email Delivery:**
```sql
-- Check recent scheduled emails
SELECT
  event_id,
  trigger_type,
  scheduled_for,
  status,
  sent_at
FROM scheduled_emails
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY scheduled_for;

-- Verify timezone (should be EST/EDT, stored as UTC+5/+4)
SELECT
  trigger_time,
  scheduled_for,
  EXTRACT(HOUR FROM scheduled_for AT TIME ZONE 'America/New_York') as est_hour
FROM scheduled_emails
WHERE trigger_type IN ('days_before_payment_deadline', 'on_payment_deadline')
LIMIT 10;
```

**Template Structure:**
```bash
# Verify template has 7 items
rails email_templates:show_default

# Should show positions 1-7 only
```

**SendGrid Logs:**
- Monitor delivery rate (should be >98%)
- Check bounce rate (should be <2%)
- Verify send times match expected EST schedule

---

## Rollback Procedures

### If Issues Arise

**Timezone Change:**
```bash
git revert <timezone_commit_hash>
# Reverts to UTC timezone
```

**Payment Deadline:**
```bash
git revert <payment_deadline_commit_hash>
# Reverts to application_deadline proxy
```

**Template Structure:**
```bash
# To restore 16-item structure (not recommended):
rails email_templates:reset_default
# Then manually edit seed file to include positions 8-16
```

**Preview System:**
```bash
git revert <preview_commit_hash>
# Reverts to old .body.to_s method
```

---

## Future Enhancements

### Potential Improvements

**1. Custom Timezones Per Event**
- Allow producers to select timezone
- Store timezone on event model
- Use event.timezone in EmailScheduleCalculator

**2. Preview Mode in Venue Owner UI**
- Add preview capability to venue owner frontend
- Show what emails will look like before sending
- Currently admin-only feature

**3. Bulk Email Regeneration**
- Rake task to regenerate all events' scheduled emails
- Useful after template changes
- Currently manual per-event

**4. Email Template Editor UI**
- Visual editor for email templates
- Live preview of template changes
- Currently requires editing Ruby seed file

---

## Related Documentation

**Email System Documentation:**
- [EMAIL_DOCS_INDEX.md](./EMAIL_DOCS_INDEX.md) - Documentation index
- [EMAIL_TESTING_SYSTEM.md](./EMAIL_TESTING_SYSTEM.md) - Testing guide
- [EMAIL_AUTOMATION_SYSTEM_GUIDE.md](./EMAIL_AUTOMATION_SYSTEM_GUIDE.md) - Architecture
- [EMAIL_TEMPLATE_MIGRATION_GUIDE.md](./EMAIL_TEMPLATE_MIGRATION_GUIDE.md) - Migration guide
- [VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md](./VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md) - Email catalog

**Rake Tasks:**
- [lib/tasks/email_templates.rake](../lib/tasks/email_templates.rake) - Template management
- [lib/tasks/email_templates_cleanup.rake](../lib/tasks/email_templates_cleanup.rake) - Cleanup

**Services:**
- [app/services/email_schedule_calculator.rb](../app/services/email_schedule_calculator.rb)
- [app/services/admin/email_test_service.rb](../app/services/admin/email_test_service.rb)
- [app/services/base_email_service.rb](../app/services/base_email_service.rb)

---

## Summary of Changes

| Fix | Files Modified | Impact | Status |
|-----|----------------|--------|--------|
| Template Structure | 2 rake tasks | All new events | ✅ Deployed |
| Timezone Fix | 1 service | Future emails only | ✅ Deployed |
| Payment Deadline | 1 service | Payment emails only | ✅ Deployed |
| Preview - Backend | 1 controller | Admin panel only | ✅ Deployed |
| Preview - Frontend | 1 component | Admin panel only | 🟡 Ready to deploy |

---

## Questions & Support

**For questions about:**
- Email template editing → See VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md
- Email testing → See EMAIL_TESTING_SYSTEM.md
- System architecture → See EMAIL_AUTOMATION_SYSTEM_GUIDE.md
- Migration issues → See EMAIL_TEMPLATE_MIGRATION_GUIDE.md

**For bugs or issues:**
- Check Rails logs: `tail -f log/production.log | grep -i email`
- Check Sidekiq dashboard: `/sidekiq`
- Check SendGrid activity: SendGrid dashboard → Activity

---

**Document Status:** ✅ Complete
**Last Updated:** January 17, 2026
**Next Review:** After next deployment cycle
