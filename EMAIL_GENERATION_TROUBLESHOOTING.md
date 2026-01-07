# Email Generation Troubleshooting Guide

## Problem Statement

**Issue:** Newest event created successfully sent invitation emails (EventInvitationMailer) but scheduled emails were NOT auto-generated.

**Expected Behavior:** When an event is created, 16 scheduled emails should be automatically generated from the default email campaign template.

**What Worked:** Previous events had scheduled emails generated correctly.

**What Failed:** Most recent event has invitations but no scheduled emails.

---

## How It Should Work

### Event Creation Flow:

```
1. User creates event via API/UI
2. Event.after_create callback triggers
3. assign_email_template_and_generate_emails() runs
4. Default template is assigned to event
5. ScheduledEmailGenerator creates 16 scheduled emails
6. Emails are visible in Email Automation tab
```

### Key Code Locations:

**Event Model:** `/app/models/event.rb`
- Line 22: `after_create :assign_email_template_and_generate_emails`
- Lines 63-84: `assign_email_template_and_generate_emails` method
- Lines 86-103: `generate_scheduled_emails` method

**Generator Service:** `/app/services/scheduled_email_generator.rb`
- Creates scheduled emails from template items
- Calculates scheduled_for dates based on triggers

**Controller:** `/app/controllers/api/v1/presents/scheduled_emails_controller.rb`
- Line 32-51: Manual generation endpoint `POST /generate`

---

## Diagnostic Steps

### Step 1: Check Template Assignment

```ruby
# In Rails console or Render shell
event = Event.find_by(slug: 'YOUR-EVENT-SLUG')

# Check if template is assigned
event.email_campaign_template
# Should return: #<EmailCampaignTemplate id: X, name: "Default Event Campaign"...>

# If nil, template was never assigned (this is the problem)
```

### Step 2: Check Scheduled Emails Exist

```ruby
event.scheduled_emails.count
# Should return: 16

# If 0, emails were never generated
```

### Step 3: Check Default Template Exists

```ruby
EmailCampaignTemplate.default_template
# Should return: #<EmailCampaignTemplate...>

# If nil, run: load 'db/seeds/email_campaign_templates.rb'
```

### Step 4: Check Rails Logs

Look for errors during event creation:
```
Failed to generate scheduled emails for event X: [error message]
```

---

## Possible Causes

### 1. **Template Assignment Failed**
- `email_campaign_template_id` was already set (callback returns early on line 65)
- No default template found in database
- Database constraint prevented assignment

### 2. **Generation Failed Silently**
- Error occurred in `ScheduledEmailGenerator`
- Error was caught and logged (line 81-83) but event creation succeeded
- Check Rails logs for error messages

### 3. **After Create Callback Didn't Run**
- Event was created via `create!` with callbacks skipped
- Event was created then updated (not a new creation)
- Callback was disabled or removed temporarily

### 4. **Database Transaction Rolled Back**
- Emails were generated but transaction rolled back
- Left event without emails

---

## Solutions

### Quick Fix: Manual Generation

**Option A: Via Browser Console**
```javascript
// On the event page
fetch('/api/v1/presents/events/YOUR-EVENT-SLUG/scheduled_emails/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('railsAuthToken'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(data => {
  console.log(data);
  location.reload(); // Refresh to see emails
});
```

**Option B: Via Rails Console/Render Shell**
```ruby
event = Event.find_by(slug: 'YOUR-EVENT-SLUG')

# If no template assigned
event.send(:assign_email_template_and_generate_emails)

# If template exists but no emails
event.send(:generate_scheduled_emails)

# Force regeneration (deletes existing first)
generator = ScheduledEmailGenerator.new(event)
event.scheduled_emails.destroy_all
generator.generate
```

**Option C: Via API Endpoint**
```bash
curl -X POST \
  https://your-api.com/api/v1/presents/events/YOUR-EVENT-SLUG/scheduled_emails/generate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Permanent Fix: Add UI Button

Add a "Generate Emails" button to the Email Automation tab:

**Location:** `/src/components/producer/Email/EmailAutomationTab.tsx`

```tsx
// Add to header section next to "Refresh" button
{emails.length === 0 && (
  <button
    onClick={handleGenerateEmails}
    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600"
  >
    <Plus className="w-4 h-4" />
    Generate Emails
  </button>
)}

// Handler function
const handleGenerateEmails = async () => {
  try {
    const result = await scheduledEmailsApi.generate(eventSlug);
    showSuccess(`Generated ${result.emails.length} emails`);
    await loadEmails();
  } catch (err) {
    setError(err.message || 'Failed to generate emails');
  }
};
```

---

## Prevention

### Ensure After Create Callback Works

**Add logging to Event model:**
```ruby
def assign_email_template_and_generate_emails
  Rails.logger.info("🔔 Event #{id}: Starting email template assignment")

  return if email_campaign_template.present?
  Rails.logger.info("🔔 Event #{id}: No template assigned, proceeding...")

  template = organization.email_campaign_templates.find_by(is_default: true) if organization
  template ||= EmailCampaignTemplate.default_template

  unless template
    Rails.logger.error("🔔 Event #{id}: No template found!")
    return
  end

  Rails.logger.info("🔔 Event #{id}: Assigning template #{template.id}")
  update_column(:email_campaign_template_id, template.id)

  Rails.logger.info("🔔 Event #{id}: Generating scheduled emails...")
  generate_scheduled_emails

  Rails.logger.info("🔔 Event #{id}: Email generation complete")
rescue => e
  Rails.logger.error("🔔 Event #{id}: FAILED - #{e.message}")
  Rails.logger.error(e.backtrace.join("\n"))
end
```

### Add Validation

**Ensure events always have emails:**
```ruby
# In Event model
validate :must_have_scheduled_emails, on: :update, if: :published?

def must_have_scheduled_emails
  if scheduled_emails.empty?
    errors.add(:base, "Event must have scheduled emails before publishing")
  end
end
```

---

## Testing Checklist

After implementing fix, test:

- [ ] Create new event → verify 16 emails generated
- [ ] Check Email Automation tab → all emails visible
- [ ] Check "Immediate Announcement" → shows correct recipient count (invitations)
- [ ] Check other emails → show correct recipient count (registrations with filters)
- [ ] Send invitations → "Immediate Announcement" status changes to "sent"
- [ ] Approve vendor → countdown emails show recipient count = 1

---

## Related Files Changed Today

1. `/app/models/scheduled_email.rb`
   - Made `recipient_count` dynamic
   - Added `is_announcement_email?` helper
   - Announcement emails count EventInvitations, others count Registrations

2. `/app/controllers/api/v1/presents/scheduled_emails_controller.rb`
   - Updated preview endpoint to return `recipient_name` and `recipient_email`

3. `/app/controllers/api/v1/presents/event_invitations_controller.rb`
   - Auto-marks "Immediate Announcement" as sent when invitations are sent

4. `/db/seeds/email_campaign_templates.rb`
   - Removed non-existent `payment_status` filters from all emails

---

## Quick Reference Commands

**Check event status:**
```ruby
event = Event.find_by(slug: 'event-slug')
puts "Template: #{event.email_campaign_template&.name || 'NONE'}"
puts "Emails: #{event.scheduled_emails.count}"
puts "Invitations: #{event.event_invitations.count}"
```

**Generate emails manually:**
```ruby
event = Event.find_by(slug: 'event-slug')
event.send(:generate_scheduled_emails)
```

**Check default template:**
```ruby
EmailCampaignTemplate.default_template
```

**Reseed templates:**
```ruby
load 'db/seeds/email_campaign_templates.rb'
```

---

## Next Steps When You Return

1. Identify which specific event had the issue (get the slug)
2. Run diagnostic Step 1-3 above to narrow down the cause
3. Apply the appropriate Quick Fix
4. Decide if you want to add the "Generate Emails" UI button
5. Test with a new event to ensure it doesn't happen again

---

*Generated: 2026-01-06*
*Last Updated: 2026-01-06*
