# Email Template Migration Guide

**Last Updated:** January 17, 2026
**Issue:** Old 16-email template structure causing emojis in new events

---

## The Problem

Your production database has a **mismatch between old and new email template structures**.

### What Happened

**Old Structure (Jan 6, 2026):**
- 16 email template items (positions 1-16)
- Subjects had emojis: `"⏰ Last Chance"`, `"🎉 Today is the Day!"`, etc.
- Complex scheduling with many intermediate emails

**New Structure (Jan 17, 2026):**
- 7 email template items (positions 1-7)
- No emojis: `"Last Chance: [eventName] Applications Close Tomorrow"`
- Simplified scheduling focused on key moments

**Your Current State:**
- Production template: 16 items
- Update task ran: Updated positions 1-7 (emoji-free ✅)
- Positions 8-16: Still have emojis ❌
- Seeds file: Creates 7 items (but skips if template exists)

### Why New Events Have Emojis

When you create a new event:

```
1. Event.after_create → assign_email_template_and_generate_emails
2. Finds default template (ID: 3, has 16 items)
3. ScheduledEmailGenerator loops through ALL enabled items
4. Creates ScheduledEmail records for positions 1-16
5. Positions 8-16 still have emoji subjects → emojis in new events ❌
```

---

## The Solution

**Delete positions 8-16** from your template, keeping only the 7 emoji-free positions.

### Step 1: Check What Needs Cleaning

```bash
rails email_templates:show_old_scheduled_emails
```

This shows:
- How many old template items exist (should show positions 8-16)
- How many scheduled emails are using them
- How many are still pending (not sent yet)

### Step 2: Run Cleanup Task

```bash
rails email_templates:cleanup_old_structure
```

**What it does:**
1. Finds template items with positions > 7
2. Shows you what will be deleted
3. Asks for confirmation
4. Detaches any existing scheduled emails from these items
5. Deletes positions 8-16
6. Leaves positions 1-7 intact (your emoji-free updates)

**Result:**
- ✅ Template now has only 7 positions (1-7)
- ✅ All subjects emoji-free
- ✅ New events will use only these 7 emails
- ✅ Existing scheduled emails preserved (just detached)

### Step 3: Verify

```bash
rails email_templates:show_default
```

Should show:
```
Email Templates:
1. 1 Day Before Application Deadline
   Subject: Last Chance: [eventName] Applications Close Tomorrow

2. Application Deadline Day
   Subject: URGENT: [eventName] Applications Close Today

3. 1 Day Before Payment Due
   Subject: Reminder: Payment Due Tomorrow - [eventName]

4. Payment Due Today
   Subject: URGENT: Payment Due Today - [eventName]

5. 1 Day Before Event
   Subject: Tomorrow: [eventName] Final Details

6. Day of Event
   Subject: Today: [eventName]

7. Day After Event - Thank You
   Subject: Thank You for Participating in [eventName]
```

**No emojis, only 7 items ✅**

### Step 4: Test New Event

Create a new test event in production and verify:
- Only 7 scheduled emails generated (not 10 or 16)
- All subjects emoji-free
- Proper scheduling times

---

## Technical Details

### How Templates Work

**EmailCampaignTemplate:**
```
EmailCampaignTemplate (is_default: true)
  └── EmailTemplateItems (positions 1-7)
       ├── Position 1: "1 Day Before Application Deadline"
       ├── Position 2: "Application Deadline Day"
       └── ... (7 total)
```

**When Event is Created:**
```ruby
# app/models/event.rb:23
after_create :assign_email_template_and_generate_emails

def assign_email_template_and_generate_emails
  # Finds default template
  template = EmailCampaignTemplate.find_by(is_default: true)
  self.update(email_campaign_template: template)

  # Generates scheduled emails from template
  generate_scheduled_emails
end

def generate_scheduled_emails
  generator = ScheduledEmailGenerator.new(self)
  generator.generate # ← Loops through ALL template items
end
```

**ScheduledEmailGenerator:**
```ruby
# app/services/scheduled_email_generator.rb:32
def generate
  # Get ALL enabled email template items
  template.email_template_items.enabled.by_position.each do |item|
    # Creates ScheduledEmail copying subject/body from template item
    create_scheduled_email(item, scheduled_time)
  end
end
```

**Key Point:** Generator loops through **ALL** template items, not just 1-7.

### Why Seeds Don't Update

**Seed File Logic:**
```ruby
# db/seeds/email_campaign_templates.rb:12-18
existing_default = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)

if existing_default
  puts "Default template already exists (ID: #{existing_default.id})"
  puts "Skipping creation."
  exit 0  # ← Exits without updating
end
```

Seeds are **idempotent** - they never overwrite existing data to prevent accidental data loss.

---

## Migration Commands Reference

### Show Current Template

```bash
# Show all template items and subjects
rails email_templates:show_default

# Show how many scheduled emails use old items
rails email_templates:show_old_scheduled_emails
```

### Update Template

```bash
# Update positions 1-7 with emoji-free content (already done)
rails email_templates:update_default

# Delete positions 8-16 (do this now)
rails email_templates:cleanup_old_structure
```

### Nuclear Option (if needed)

```bash
# Delete and recreate from seeds
# WARNING: Will fail if scheduled_emails reference template items
rails email_templates:reset_default
```

---

## What Gets Fixed

### Before Cleanup

**Template Structure:**
```
Position 1: Last Chance: [eventName] Applications Close Tomorrow ✅
Position 2: URGENT: [eventName] Applications Close Today ✅
Position 3: Reminder: Payment Due Tomorrow - [eventName] ✅
Position 4: URGENT: Payment Due Today - [eventName] ✅
Position 5: Tomorrow: [eventName] Final Details ✅
Position 6: Today: [eventName] ✅
Position 7: Thank You for Participating in [eventName] ✅
Position 8: ⚠️ Payment Due in 3 Days - [eventName] ❌ (emoji)
Position 9: 🚨 URGENT: Payment Due Today - [eventName] ❌ (emoji)
Position 10: One Month Until [eventName]! ❌ (exclamation)
Position 11: 3 Weeks Until [eventName] - Important Updates ✅
Position 12: 10 Days to Go! [eventName] Prep Checklist ❌ (exclamation)
Position 13: This Weekend: [eventName] Final Details ✅
Position 14: 2 Days Away! [eventName] Weather & Updates ❌ (exclamation)
Position 15: 🎉 Today is the Day! [eventName] ❌ (emoji + exclamation)
Position 16: Thank You for Making [eventName] Amazing! ❌ (exclamation)
```

**New Event Creates:**
- 10-16 scheduled emails (depends on timing)
- Mix of emoji and non-emoji subjects
- Confusing for recipients

### After Cleanup

**Template Structure:**
```
Position 1: Last Chance: [eventName] Applications Close Tomorrow ✅
Position 2: URGENT: [eventName] Applications Close Today ✅
Position 3: Reminder: Payment Due Tomorrow - [eventName] ✅
Position 4: URGENT: Payment Due Today - [eventName] ✅
Position 5: Tomorrow: [eventName] Final Details ✅
Position 6: Today: [eventName] ✅
Position 7: Thank You for Participating in [eventName] ✅
```

**New Event Creates:**
- Exactly 7 scheduled emails
- All subjects emoji-free
- Clean, professional, deliverable

---

## Existing Events

**What happens to existing events with old emails?**

✅ **They are preserved:**
- Existing `ScheduledEmail` records stay in database
- They keep their subject/body content (frozen at creation time)
- They will still send on schedule
- They are just detached from template items (email_template_item_id becomes null)

**Why this is safe:**
- ScheduledEmail copies subject/body when created
- It doesn't reference the template item for content
- Template item is only for tracking/reporting
- Detaching doesn't affect sending

---

## Testing Checklist

After running cleanup, verify:

- [ ] Run `rails email_templates:show_default`
- [ ] Verify only 7 positions shown
- [ ] Verify no emojis in any subjects
- [ ] Create new test event in production
- [ ] Check event's scheduled emails (should be 7)
- [ ] Verify all subjects emoji-free
- [ ] Check scheduling times make sense
- [ ] Delete test event

---

## Troubleshooting

### Problem: Cleanup task fails with foreign key error

**Error:**
```
ActiveRecord::InvalidForeignKey: update or delete on table "email_template_items"
violates foreign key constraint "fk_rails_93d86d18e3" on table "scheduled_emails"
```

**Cause:** Scheduled emails have foreign key constraint to email_template_items

**Solution:** The cleanup task already handles this by setting `email_template_item_id` to null before deleting.

If you see this error, check the cleanup task code:
```ruby
# This should be in the task
ScheduledEmail.where(email_template_item_id: item.id).update_all(email_template_item_id: nil)
item.destroy
```

### Problem: Template still shows 16 items after update

**Cause:** You ran `update_default` which only updates 1-7, doesn't delete 8-16

**Solution:** Run `cleanup_old_structure` to delete positions 8-16

### Problem: New events still have emojis

**Cause:** Template still has positions 8-16 with emojis

**Solution:** Run `cleanup_old_structure` to remove them

---

## Summary

**Current State:**
- ❌ Template has 16 items (positions 1-16)
- ✅ Positions 1-7 updated (no emojis)
- ❌ Positions 8-16 still have emojis
- ❌ New events use all 16 → emojis in emails

**Target State:**
- ✅ Template has 7 items (positions 1-7)
- ✅ All subjects emoji-free
- ✅ New events use only 7 → no emojis

**Migration Steps:**
1. Run `rails email_templates:cleanup_old_structure`
2. Confirm deletion of positions 8-16
3. Verify with `rails email_templates:show_default`
4. Test new event creation

**Time:** ~5 minutes
**Risk:** Low (existing emails preserved)
**Rollback:** Cannot rollback, but existing events unaffected

---

**Questions or issues?** Check the troubleshooting section or review the rake task output.

**Last Updated:** January 17, 2026
