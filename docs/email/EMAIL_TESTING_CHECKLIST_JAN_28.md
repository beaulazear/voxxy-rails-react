# Email System Testing Checklist - Jan 28, 2026

**Purpose:** Validate email system stability before Feb 3rd event
**Created:** Jan 28, 2026
**Environment:** Staging → Production

---

## ✅ Pre-Deployment Checklist

### Environment Setup
- [ ] Staging environment available
- [ ] Test event created with real data
- [ ] Test vendor contacts added
- [ ] Test registrations created
- [ ] SendGrid API key valid
- [ ] Database backed up

---

## 🧪 Test Scenarios

### **Test 1: Basic Email Creation**
**Goal:** Ensure scheduled emails can be created

```ruby
# Rails console (staging)
event = Event.last
template = EmailTemplateItem.find_by(category: "vendor_updates")

scheduled_email = ScheduledEmail.create!(
  event: event,
  email_template_item: template,
  name: "Test Email",
  subject_template: "Test: [eventName]",
  body_template: "<p>Test email for [eventName]</p>",
  scheduled_for: 5.minutes.from_now,
  status: "scheduled"
)

puts "✓ Created scheduled email ##{scheduled_email.id}"
```

**Expected Result:** Email created successfully
**Actual Result:** _____________________

---

### **Test 2: Routing Logic (Registration-based)**
**Goal:** Ensure EmailSenderService receives correct emails

```ruby
# Create email with non-announcement category
event = Event.last
scheduled_email = ScheduledEmail.where(status: "scheduled")
  .joins(:email_template_item)
  .where.not(email_template_items: { category: "event_announcements" })
  .first

# Manually trigger worker
worker = EmailSenderWorker.new
worker.send(:send_scheduled_email, scheduled_email)

# Check logs for: "→ Routing to EmailSenderService"
```

**Expected Result:** Routes to EmailSenderService
**Actual Result:** _____________________

---

### **Test 3: Routing Logic (Invitation-based)**
**Goal:** Ensure InvitationReminderService receives announcement emails

```ruby
# Create email with event_announcements category
event = Event.last
template = EmailTemplateItem.find_by(category: "event_announcements")

scheduled_email = ScheduledEmail.create!(
  event: event,
  email_template_item: template,
  name: "Application Deadline Reminder",
  subject_template: "Reminder: [eventName]",
  body_template: "<p>Reminder</p>",
  scheduled_for: 1.minute.from_now,
  status: "scheduled",
  filter_criteria: { invitation_status: ["sent", "viewed"] }
)

# Wait for worker to process (or trigger manually)
sleep 70
scheduled_email.reload

# Check logs for: "→ Routing to InvitationReminderService"
```

**Expected Result:** Routes to InvitationReminderService
**Actual Result:** _____________________

---

### **Test 4: Zero Recipients Handling (NEW BEHAVIOR)**
**Goal:** Ensure emails with 0 recipients are marked as "failed", not "sent"

```ruby
# Create email with filter that matches nobody
event = Event.last
template = EmailTemplateItem.first

scheduled_email = ScheduledEmail.create!(
  event: event,
  email_template_item: template,
  name: "Test Zero Recipients",
  subject_template: "Test",
  body_template: "<p>Test</p>",
  scheduled_for: 1.minute.from_now,
  status: "scheduled",
  filter_criteria: { statuses: ["nonexistent_status"] } # Won't match anyone
)

# Wait for processing
sleep 70
scheduled_email.reload

puts "Status: #{scheduled_email.status}"
puts "Error: #{scheduled_email.error_message}"
```

**Expected Result:** Status = "failed", error message explains why
**Actual Result:** _____________________

---

### **Test 5: Missing Email Template Item (NEW VALIDATION)**
**Goal:** Ensure emails can't be created without template

```ruby
event = Event.last

begin
  ScheduledEmail.create!(
    event: event,
    email_template_item: nil, # Missing!
    name: "Test",
    subject_template: "Test",
    body_template: "<p>Test</p>",
    scheduled_for: 1.hour.from_now,
    status: "scheduled"
  )
  puts "❌ FAIL: Should have raised validation error"
rescue ActiveRecord::RecordInvalid => e
  puts "✓ PASS: Validation caught it"
  puts "Errors: #{e.record.errors.full_messages}"
end
```

**Expected Result:** Validation error
**Actual Result:** _____________________

---

### **Test 6: Successful Email Send**
**Goal:** End-to-end test of actual email delivery

```ruby
# Use your own email for testing
event = Event.last
reg = event.registrations.create!(
  name: "Test User",
  email: "YOUR_EMAIL@example.com", # <-- USE YOUR EMAIL
  status: "approved"
)

template = EmailTemplateItem.find_by(category: "vendor_updates")
scheduled_email = ScheduledEmail.create!(
  event: event,
  email_template_item: template,
  name: "Test Send to Self",
  subject_template: "Test Email for [eventName]",
  body_template: "<p>If you receive this, emails are working!</p>",
  scheduled_for: 1.minute.from_now,
  status: "scheduled",
  filter_criteria: { statuses: ["approved"] }
)

# Wait for email to send
sleep 70

# Check your inbox
```

**Expected Result:** Email received in inbox
**Actual Result:** _____________________

---

### **Test 7: Error Logging Format (NEW)**
**Goal:** Verify enhanced error messages appear in logs

```ruby
# Intentionally cause a SendGrid error by using invalid API key
original_key = ENV["VoxxyKeyAPI"]
ENV["VoxxyKeyAPI"] = "invalid_key"

event = Event.last
scheduled_email = ScheduledEmail.where(status: "scheduled").first

begin
  service = EmailSenderService.new(scheduled_email)
  service.send_to_recipients
rescue => e
  puts "✓ Error caught (expected)"
end

# Restore key
ENV["VoxxyKeyAPI"] = original_key

# Check logs for: "❌ SENDGRID ERROR" with full context
```

**Expected Result:** Detailed error with context in logs
**Actual Result:** _____________________

---

### **Test 8: Recipient Count Warnings (NEW)**
**Goal:** Verify warning when recipient count is low

```ruby
# Create email targeting small subset
event = Event.with_deleted.last
template = EmailTemplateItem.first

# Ensure event has 10+ registrations
if event.registrations.count < 10
  10.times do |i|
    event.registrations.create!(
      name: "Bulk Test #{i}",
      email: "test#{i}@example.com",
      status: "pending"
    )
  end
end

# Create email targeting only 1-2 registrations
scheduled_email = ScheduledEmail.create!(
  event: event,
  email_template_item: template,
  name: "Test Low Recipients",
  subject_template: "Test",
  body_template: "<p>Test</p>",
  scheduled_for: 1.minute.from_now,
  status: "scheduled",
  filter_criteria: { statuses: ["approved"] } # Assuming only 1-2 approved
)

# Trigger send
EmailSenderWorker.new.perform

# Check logs for: "⚠️  LOW RECIPIENT COUNT"
```

**Expected Result:** Warning logged
**Actual Result:** _____________________

---

## 📊 Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Email Creation | ⬜ | |
| 2. Registration Routing | ⬜ | |
| 3. Invitation Routing | ⬜ | |
| 4. Zero Recipients | ⬜ | |
| 5. Missing Template | ⬜ | |
| 6. Actual Send | ⬜ | |
| 7. Error Logging | ⬜ | |
| 8. Recipient Warnings | ⬜ | |

---

## 🚨 Failure Scenarios

If any test fails:

1. **DO NOT deploy to production**
2. **Document the failure** (logs, error messages)
3. **Roll back changes in staging**
4. **Debug in local environment**
5. **Re-test after fix**

---

## ✅ Production Deployment Criteria

Only deploy to production if:
- [ ] All 8 tests pass in staging
- [ ] No customer sessions active
- [ ] Logs show expected behavior
- [ ] Rollback plan documented
- [ ] Team member available for 1 hour monitoring

---

## 🔄 Rollback Plan

If issues appear in production:

```bash
# 1. Revert Git commits
git revert <commit-hash>
git push origin main

# 2. Redeploy previous version on Render
# (Use Render dashboard: "Manual Deploy" → select previous commit)

# 3. Restart Sidekiq worker
# (Render dashboard → heyvoxxy-sidekiq → Manual Deploy)

# 4. Verify emails working
rails console
# Test email send
```

---

## 📝 Notes

- Test in staging first, always
- Keep customer informed of any downtime
- Have backup person available during deploy
- Monitor logs for 2+ hours after deploy
- Document any unexpected behavior

---

**Tester:** _____________________
**Date Tested:** _____________________
**Environment:** ☐ Staging  ☐ Production
**Result:** ☐ Pass  ☐ Fail  ☐ Partial
