# Email Copy Update - Testing & Deployment Guide

**Branch:** `courtney/email-copy-update`
**Created:** January 25, 2026
**Status:** Ready for Review & Testing

---

## Summary of Changes

This PR updates all email copy across the system with new messaging, improved greeting logic, and consistent "do not reply" footers.

### Files Changed (5)

1. **app/services/email_variable_resolver.rb** - Added `[greetingName]` variable
2. **app/services/registration_email_service.rb** - Updated 6 system notification emails
3. **app/views/event_invitation_mailer/invitation_email.html.erb** - Updated invitation email
4. **db/seeds/email_campaign_templates.rb** - Updated 7 scheduled email templates
5. **lib/tasks/update_default_email_template.rake** - NEW: Rake task for production migration

### Key Features

✅ **New `[greetingName]` Variable**
- Prefers `businessName` → falls back to `firstName` → ultimate fallback "there"
- All emails now use this for personalized greetings

✅ **7 Scheduled Email Templates Updated**
- Application deadline emails (2)
- Payment deadline emails (2)
- Event countdown emails (3)
- All include "do not reply" footer with organization contact email
- Uses `[dashboardLink]` for vendor portal (payment/event emails)
- Uses `[eventLink]` for application portal (application emails)

✅ **6 System Notification Emails Updated**
- Application Received (includes confirmation code)
- Application Approved (includes dashboard link + login instructions)
- Application Rejected
- Moved to Waitlist
- Payment Confirmed (includes dashboard link)
- Category Changed (includes dashboard link)

✅ **Event Invitation Email Updated**
- Cleaner formatting
- "Do not reply" footer added

✅ **All Emojis Removed**
- Plain text formatting throughout

---

## Testing Steps

### 1. Test New Greeting Variable

```ruby
rails console

# Test with businessName
reg = Registration.where.not(business_name: [nil, '']).first
resolver = EmailVariableResolver.new(reg.event, reg)
puts resolver.resolve("Hi [greetingName],")
# Expected: "Hi {BusinessName},"

# Test with only firstName
reg = Registration.where(business_name: [nil, '']).first
resolver = EmailVariableResolver.new(reg.event, reg)
puts resolver.resolve("Hi [greetingName],")
# Expected: "Hi {FirstName},"
```

### 2. Preview Scheduled Email Templates

```ruby
rails console

# Check if default template exists
template = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)
puts "Template: #{template.name}"
puts "Email count: #{template.email_count}"

# Preview first email
email = template.email_template_items.find_by(position: 1)
puts "\nEmail 1: #{email.name}"
puts "Subject: #{email.subject_template}"
puts "\nBody preview (first 200 chars):"
puts email.body_template[0..200]
puts "..."

# Check for greetingName variable
puts "\nUses [greetingName]: #{email.body_template.include?('[greetingName]')}"
puts "Uses [dashboardLink]: #{email.body_template.include?('[dashboardLink]')}"
puts "Has 'do not reply': #{email.body_template.include?('do not reply')}"
```

### 3. Run Rake Task (Test in Development First)

```bash
# This updates the existing system template in the database
bundle exec rake email_templates:update_default
```

Expected output:
```
🔍 Finding default system email template...
✅ Found template: Default Event Campaign (ID: X)
   Current email count: 7
   ✓ Updated: 1 Day Before Application Deadline
   ✓ Updated: Application Deadline Day
   ✓ Updated: 1 Day Before Payment Due
   ✓ Updated: Payment Due Today
   ✓ Updated: 1 Day Before Event
   ✓ Updated: Day of Event
   ✓ Updated: Day After Event - Thank You

✅ Successfully updated 7 email templates
```

### 4. Test System Notification Emails

#### Create Test Event and Test Flow

```ruby
rails console

# Create test event
org = Organization.first
event = Event.create!(
  organization: org,
  title: "Test Email Copy Event",
  event_date: 2.weeks.from_now,
  application_deadline: 1.week.from_now,
  payment_deadline: 10.days.from_now,
  location: "Test Location",
  venue: "Test Venue"
)

# Create test vendor registration
registration = Registration.create!(
  event: event,
  name: "John Doe",
  business_name: "Artisan Crafts Co",
  email: "test@example.com",
  vendor_category: "Art",
  status: "pending"
)

# Test Application Received email
RegistrationEmailService.send_confirmation(registration)
# Check email in logs or email preview tool

# Approve the vendor
registration.update!(status: 'approved')
RegistrationEmailService.send_status_update(registration)
# Should send "You're in" email with dashboard link

# Test rejection
registration2 = Registration.create!(
  event: event,
  name: "Jane Smith",
  business_name: "Cool Vendor LLC",
  email: "test2@example.com",
  vendor_category: "Food",
  status: "pending"
)
registration2.update!(status: 'rejected')
RegistrationEmailService.send_status_update(registration2)
# Should send rejection email
```

### 5. Test Event Invitation Email

```ruby
rails console

# Create vendor contact
vendor_contact = VendorContact.create!(
  organization: Organization.first,
  name: "Test Vendor",
  business_name: "Test Business",
  email: "vendor@example.com"
)

# Create event invitation
invitation = EventInvitation.create!(
  event: Event.first,
  vendor_contact: vendor_contact
)

# Send invitation
EventInvitationMailer.invitation_email(invitation).deliver_now
# Check for "do not reply" footer and clean formatting
```

### 6. Verify Scheduled Emails for New Event

```ruby
rails console

# Create new event (will auto-generate scheduled emails)
event = Event.create!(
  organization: Organization.first,
  title: "New Event After Update",
  event_date: 3.weeks.from_now,
  application_deadline: 2.weeks.from_now,
  payment_deadline: 2.5.weeks.from_now,
  location: "New Location",
  venue: "New Venue"
)

# Check generated scheduled emails
event.scheduled_emails.order(:position).each do |se|
  puts "\n#{se.position}. #{se.name}"
  puts "Subject: #{se.subject_template}"
  puts "Has [greetingName]: #{se.body_template.include?('[greetingName]')}"
  puts "Has 'do not reply': #{se.body_template.include?('do not reply')}"
end

# Should show 7 emails with new copy
```

---

## Deployment Steps

### Step 1: Merge to Staging

1. **Developer merges their changes to staging first**
2. **Merge this PR to staging**
3. **Deploy staging**

### Step 2: Run Rake Task in Staging

```bash
# SSH to staging server or run via deployment tool
RAILS_ENV=staging bundle exec rake email_templates:update_default
```

### Step 3: Test in Staging

1. Create test event in staging
2. Go through vendor application flow
3. Verify emails:
   - Application received email has confirmation code
   - Approval email has dashboard link
   - Payment emails link to dashboard
   - All emails have "do not reply" footer
   - Greeting uses business name when available

### Step 4: Production Deployment

1. **Merge staging to main**
2. **Deploy to production**
3. **IMPORTANT: Run rake task in production:**

```bash
RAILS_ENV=production bundle exec rake email_templates:update_default
```

4. **Verify:**
   - Create test event
   - Check scheduled emails have new copy
   - Test vendor application flow
   - Verify all emails render correctly

---

## Rollback Plan

If issues are found:

### Option 1: Git Revert

```bash
git revert 1ba0614a
git push origin staging
# Redeploy
```

### Option 2: Database Rollback (if rake task was run)

The rake task doesn't have an automatic rollback. If needed:

```ruby
rails console production

# Find the system template
template = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)

# Manually update emails back to old copy (use backup SQL dump)
# OR re-run old seed data
```

**Recommendation:** Take database snapshot before running rake task in production.

---

## Verification Checklist

### Before Merging to Staging
- [ ] Code reviewed by developer
- [ ] All 5 files updated correctly
- [ ] No syntax errors

### After Deploying to Staging
- [ ] Rake task runs successfully
- [ ] `[greetingName]` resolves correctly (businessName → firstName)
- [ ] Scheduled emails have new copy
- [ ] System notifications have new copy
- [ ] Dashboard links work (`[dashboardLink]`)
- [ ] Application links work (`[eventLink]`)
- [ ] "Do not reply" footer appears on all emails
- [ ] No emojis in email content
- [ ] Emails render correctly in test email client

### After Deploying to Production
- [ ] Database backup taken
- [ ] Rake task runs successfully
- [ ] Test event created with new emails
- [ ] Vendor flow tested end-to-end
- [ ] No errors in production logs
- [ ] Existing events continue working

---

## Support & Questions

**Developer Contact:** [Your developer's name/email]
**Branch Owner:** Courtney
**PR Link:** [Will be added after creation]

### Common Issues

**Issue:** "Template not found" when running rake task
**Solution:** Run `rails db:seed` first to create the default template

**Issue:** `[greetingName]` not resolving
**Solution:** Ensure EmailVariableResolver changes are deployed

**Issue:** Dashboard link returns 404
**Solution:** Verify `FRONTEND_URL` environment variable is set correctly

---

## Technical Details

### New Variable: `[greetingName]`

**Location:** `app/services/email_variable_resolver.rb:97-105`

**Logic:**
```ruby
greeting_name = if registration.business_name.present?
  registration.business_name
elsif first_name.present?
  first_name
else
  "there"  # Ultimate fallback
end
```

### Link Variables

- `[eventLink]` → Public event page: `{base_url}/events/{slug}`
- `[dashboardLink]` → Vendor dashboard: `{base_url}/vendor/dashboard`

### Email Counts

- **Scheduled Templates:** 7 emails
- **System Notifications:** 6 emails (updated)
- **Event Invitation:** 1 email (updated)
- **Total Updated:** 14 email templates

---

**Last Updated:** January 25, 2026
**Status:** ✅ Ready for Review
