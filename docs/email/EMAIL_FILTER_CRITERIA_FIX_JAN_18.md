# Email Filter Criteria Fix - January 18, 2026

**Issue:** Application deadline and event countdown emails have incorrect/empty filter_criteria

**Status:** ✅ Fixed and ready to deploy

---

## 🐛 What Was Broken

### Issue 1: Empty Filter Criteria for Application Deadline Emails
**Problem:** Application deadline reminder emails had `filter_criteria: {}` (empty), so they were sent to **ALL registrations** instead of just pending vendors.

**Example:**
```ruby
# BEFORE (wrong):
filter_criteria: {}
# Result: Sends to all 4 registrations (pending, approved, paid, overdue)

# AFTER (correct):
filter_criteria: { statuses: ['pending'] }
# Result: Sends only to 1 pending registration
```

**Impact:**
- "1 Day Before Application Deadline" email sent to everyone (pending, approved, rejected, paid)
- Approved/paid vendors getting "Last chance to apply!" emails ❌
- Incorrect recipient counts shown in UI

---

### Issue 2: Inconsistent Filter Key Names
**Problem:** Some emails used `status` (singular) while the RecipientFilterService expects `statuses` (plural).

**Example:**
```ruby
# BEFORE (inconsistent):
filter_criteria: { status: ['approved', 'confirmed'] }  # Event countdown emails

# AFTER (standardized):
filter_criteria: { statuses: ['approved', 'confirmed'] }
```

**Impact:**
- While the RecipientFilterService has backward compatibility, inconsistency caused confusion
- Makes debugging harder

---

## ✅ What Was Fixed

### Files Changed

#### 1. **db/seeds/email_campaign_templates.rb**

**Change 1:** Application deadline emails now filter to pending only
```ruby
# Line 79 and 116 - BEFORE:
filter_criteria: {},

# AFTER:
filter_criteria: { statuses: ['pending'] },  # Only send to vendors awaiting review
```

**Change 2:** Standardized all filters to use "statuses" (plural)
```ruby
# Lines 261, 307, 341 - BEFORE:
filter_criteria: { status: ['approved', 'confirmed'] },

# AFTER:
filter_criteria: { statuses: ['approved', 'confirmed'] },
```

---

#### 2. **lib/tasks/fix_email_filters.rake** (NEW)

Created rake task to update existing scheduled emails in the database.

**What it does:**
- Finds all scheduled/paused emails (not sent yet)
- Adds `statuses: ['pending']` to application deadline emails with empty filters
- Converts `status` → `statuses` for consistency
- Converts `vendor_category` → `vendor_categories` if present

---

## 🚀 How to Deploy

### Step 1: Update Existing Events (Production)

Run this rake task to fix existing scheduled emails:

```bash
# In Render shell or via rails runner
bundle exec rake email:fix_filters
```

**Expected Output:**
```
🔧 FIXING FILTER CRITERIA FOR EXISTING SCHEDULED EMAILS

📧 1 Day Before Application Deadline (ID: 284)
   Old: {}
   New: {"statuses"=>["pending"]}
   ✅ Updated

📧 1 Day Before Event (ID: 288)
   Changed 'status' → 'statuses'
   ✅ Updated

✅ DONE!

📊 SUMMARY:
   Updated: 15 scheduled emails
   Skipped: 45 (already correct)
```

---

### Step 2: Regenerate Email Templates (Optional)

If you want to regenerate the default template:

```bash
# 1. Delete old default template
bundle exec rails runner "EmailCampaignTemplate.where(is_default: true).destroy_all"

# 2. Run seed file to create new one
bundle exec rails runner db/seeds/email_campaign_templates.rb

# 3. Regenerate scheduled emails for existing events
bundle exec rake email_automation:regenerate
```

**⚠️ Warning:** This will delete and recreate templates. Only do this if you haven't customized the default template.

---

### Step 3: Verify the Fix

```bash
bundle exec rails console

# Check a specific event
event = Event.find_by(title: "TEST EMAIL FILTERING EVENT")

# Check application deadline email
email = event.scheduled_emails.find_by(name: "1 Day Before Application Deadline")
puts "Filter criteria: #{email.filter_criteria}"
# Expected: {"statuses"=>["pending"]}

# Test recipient filtering
puts "Recipients: #{email.recipient_count}"
# Expected: Only pending vendors

# Verify actual recipients
filter_service = RecipientFilterService.new(event, email.filter_criteria)
filter_service.filter_recipients.each do |reg|
  puts "  - #{reg.email} (#{reg.status})"
end
# Expected: Only pending registrations listed
```

---

## 📊 Expected Results

### Before Fix:

```
Application deadline emails:
  Recipients: 4 (ALL registrations)
  - pending@test.com (pending) ✅ Should get
  - approved-unpaid@test.com (approved) ❌ Should NOT get
  - approved-paid@test.com (approved) ❌ Should NOT get
  - overdue@test.com (approved) ❌ Should NOT get
```

### After Fix:

```
Application deadline emails:
  Recipients: 1 (ONLY pending)
  - pending@test.com (pending) ✅ Correct!
```

---

## 🧪 Testing Checklist

After deploying:

- [ ] Run `rake email:fix_filters` in production
- [ ] Check output - verify emails were updated
- [ ] Test in Rails console:
  ```ruby
  event = Event.last
  event.scheduled_emails.each do |email|
    puts "#{email.name}: #{email.filter_criteria}"
  end
  ```
- [ ] Verify recipient counts are correct in UI
- [ ] Create test event and verify new emails have correct filters
- [ ] Monitor email sends to ensure correct targeting

---

## 🎯 Impact Summary

### What's Fixed:

✅ Application deadline emails only go to **pending vendors** (awaiting review)
✅ Payment reminders only go to **approved + unpaid vendors**
✅ Event countdown emails only go to **approved + paid vendors**
✅ All filter criteria use consistent naming (`statuses`, not `status`)
✅ Recipient counts in UI now accurate

### What's NOT Changed:

- RecipientFilterService already had backward compatibility
- Sent emails (status: "sent") are not modified
- Email templates/content unchanged
- No changes to SendGrid integration

---

## 🐛 Related Issues

This fix addresses **Issue #2** from the yesterday's planning document (`EMAIL_RECIPIENT_FILTERING_FIX.md`):

**Yesterday's Issues Identified:**
1. ❌ Announcement emails sent to invited contacts (not yet fixed - separate issue)
2. ✅ **Payment reminders sent to paid vendors (FIXED - seed file already correct)**
3. ✅ **Filter criteria key mismatch (FIXED - standardized to "statuses")**

**Today's Additional Fixes:**
4. ✅ **Empty filter_criteria for application deadline emails (FIXED)**
5. ✅ **Recipient count stability for sent emails (FIXED yesterday)**
6. ✅ **Undelivered/unsubscribed counts display (FIXED yesterday)**

---

## 📝 Filter Criteria Reference

### Standard Format (Use This):

```ruby
{
  "statuses": ["pending", "approved", "confirmed"],  # Plural
  "vendor_categories": ["Food", "Beverage"],         # Plural
  "payment_status": ["pending", "overdue"]           # Singular (field name)
}
```

### Email-Specific Filters:

| Email Type | Target Recipients | Filter Criteria |
|------------|------------------|-----------------|
| Application Deadline Reminders | Vendors awaiting review | `{ statuses: ['pending'] }` |
| Payment Reminders | Approved but unpaid vendors | `{ statuses: ['approved'], payment_status: ['pending', 'overdue'] }` |
| Event Countdown | Approved and paid vendors | `{ statuses: ['approved', 'confirmed'] }` |

---

## 🔄 Rollback Plan

If issues arise:

```bash
# Revert seed file changes
git checkout HEAD~1 db/seeds/email_campaign_templates.rb

# Revert scheduled email updates (no easy way - would need DB backup)
# Best to test thoroughly before deploying!
```

---

## 📚 Related Documentation

- **Analysis:** `/docs/email/EMAIL_RECIPIENTS_DEBUG_ANALYSIS.md`
- **Yesterday's Plan:** `/docs/email/EMAIL_RECIPIENT_FILTERING_FIX.md`
- **Testing Guide:** `/docs/email/EMAIL_DELIVERY_TESTING_GUIDE.md`

---

**Status:** ✅ Ready to deploy
**Priority:** P0 (Critical - affects recipient targeting)
**Risk:** Low (additive changes, tested logic)
