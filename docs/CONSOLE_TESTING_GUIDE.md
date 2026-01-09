# 🧪 Email Automation - Rails Console Testing Guide

This guide shows you how to manually test and explore the email automation system using Rails console.

## Starting Rails Console

```bash
bin/rails console
# or just: bin/rails c
```

---

## 1. Explore Database Tables

```ruby
# List all email-related tables
ActiveRecord::Base.connection.tables.grep(/email/)
# => ["email_campaign_templates", "email_template_items", "email_deliveries"]

# Check table columns
EmailCampaignTemplate.column_names
EmailTemplateItem.column_names
ScheduledEmail.column_names
EmailDelivery.column_names
Registration.column_names  # Should include 'email_unsubscribed'
```

---

## 2. Create a Template with Emails

```ruby
# Create a system template
template = EmailCampaignTemplate.create!(
  template_type: 'system',
  name: 'My Test Campaign',
  description: 'Testing the email system',
  is_default: true
)

# Add some emails to it
email1 = EmailTemplateItem.create!(
  email_campaign_template: template,
  name: 'Welcome Email',
  position: 1,
  category: 'event_announcements',
  subject_template: 'Welcome to [eventName]!',
  body_template: '<p>Hi [firstName], welcome!</p>',
  trigger_type: 'on_application_open',
  trigger_value: 0,
  trigger_time: '09:00'
)

email2 = EmailTemplateItem.create!(
  email_campaign_template: template,
  name: 'Reminder Email',
  position: 2,
  category: 'payment_reminders',
  subject_template: 'Don\'t forget about [eventName]',
  body_template: '<p>Payment due soon!</p>',
  trigger_type: 'days_before_event',
  trigger_value: 7
)

# Check counter cache
template.reload
template.email_count  # Should be 2
```

---

## 3. Test Template Associations

```ruby
# Get all emails for a template
template.email_template_items
template.email_template_items.count
template.email_template_items.pluck(:name)

# Get emails by position
template.email_template_items.by_position

# Get enabled emails
template.email_template_items.enabled
```

---

## 4. Create Event with Template

```ruby
# Get or create an organization
org = Organization.first || Organization.create!(name: 'Test Org')

# Create event with email template
event = Event.create!(
  organization: org,
  title: 'Summer Food Market',
  slug: 'summer-food-market-2026',
  event_date: 30.days.from_now,
  application_deadline: 15.days.from_now,
  email_campaign_template: template
)

# Check event has template
event.email_campaign_template
event.email_campaign_template.name
```

---

## 5. Create Scheduled Emails

```ruby
# Manually create a scheduled email for the event
scheduled = ScheduledEmail.create!(
  event: event,
  email_campaign_template: template,
  email_template_item: email1,
  name: email1.name,
  subject_template: email1.subject_template,
  body_template: email1.body_template,
  trigger_type: email1.trigger_type,
  scheduled_for: 2.hours.from_now,
  status: 'scheduled'
)

# Check scheduled email
scheduled.editable?     # true (not sent yet)
scheduled.sendable?     # false (not time yet)
scheduled.delivery_status  # 'pending' (no delivery record)
```

---

## 6. Create Registration & Email Delivery

```ruby
# Create a registration
registration = Registration.create!(
  event: event,
  email: 'test@example.com',
  name: 'Test Vendor',
  status: 'approved',
  business_name: 'Test Business',
  vendor_category: 'Food'
)

# Check unsubscribe status
registration.email_unsubscribed  # false by default

# Create an email delivery record (simulating SendGrid)
delivery = EmailDelivery.create!(
  scheduled_email: scheduled,
  event: event,
  registration: registration,
  sendgrid_message_id: 'test-msg-' + SecureRandom.hex(8),
  recipient_email: registration.email,
  status: 'sent',
  sent_at: Time.current
)

# Check delivery status
delivery.status         # 'sent'
delivery.sent?          # true
delivery.delivered?     # false
delivery.failed?        # false
```

---

## 7. Test Scopes

```ruby
# Template scopes
EmailCampaignTemplate.system_templates
EmailCampaignTemplate.user_templates
EmailCampaignTemplate.default_template

# Scheduled email scopes
ScheduledEmail.scheduled
ScheduledEmail.upcoming
ScheduledEmail.pending

# Delivery scopes
EmailDelivery.sent
EmailDelivery.delivered
EmailDelivery.failed
EmailDelivery.soft_bounces
```

---

## 8. Test Associations Chain

```ruby
# From template to deliveries
template.email_template_items.first.email_campaign_template
template.events
template.events.first.scheduled_emails
template.events.first.email_deliveries

# From event
event.email_campaign_template
event.scheduled_emails
event.email_deliveries

# From registration
registration.email_deliveries
registration.email_deliveries.first.scheduled_email

# From scheduled email
scheduled.latest_delivery
scheduled.delivery_status
```

---

## 9. Simulate SendGrid Webhook Update

```ruby
# Simulate email getting delivered
delivery.update!(
  status: 'delivered',
  delivered_at: Time.current
)

# Check updated status
scheduled.reload
scheduled.delivery_status  # 'delivered'

# Simulate bounce
delivery.update!(
  status: 'bounced',
  bounce_type: 'soft',
  bounce_reason: 'Mailbox full',
  bounced_at: Time.current
)

delivery.failed?      # true
delivery.retryable?   # true (soft bounce, retry_count < max_retries)
```

---

## 10. Test Validations

```ruby
# Try invalid position
EmailTemplateItem.create(
  email_campaign_template: template,
  name: 'Bad Email',
  position: 50,  # Invalid! Must be 1-40
  subject_template: 'Test',
  body_template: 'Test',
  trigger_type: 'on_event_date'
)
# => Should fail validation

# Try duplicate default template
EmailCampaignTemplate.create(
  template_type: 'system',
  name: 'Another Default',
  is_default: true  # Invalid! Only one default allowed
)
# => Should fail validation
```

---

## 11. Cleanup Test Data

```ruby
# Delete everything you created
event.destroy           # Also destroys scheduled_emails and deliveries
template.destroy        # Also destroys email_template_items
org.destroy if org.name == 'Test Org'
```

---

## Quick Queries to Check System Status

```ruby
# Count records in each table
puts "Templates: #{EmailCampaignTemplate.count}"
puts "Template Items: #{EmailTemplateItem.count}"
puts "Scheduled Emails: #{ScheduledEmail.count}"
puts "Email Deliveries: #{EmailDelivery.count}"

# Check for default template
EmailCampaignTemplate.default_template

# List all event email templates
Event.joins(:email_campaign_template).pluck(:title, 'email_campaign_templates.name')
```

---

## Tips

- Use `.reload` on models after creating associated records to see updated counter caches
- Use `.valid?` and `.errors` to debug validation issues
- Use `.pluck(:column)` for quick data inspection
- Use `pp` (pretty print) for better formatting: `pp template.attributes`

Happy testing! 🚀
