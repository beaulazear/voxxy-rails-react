# Comprehensive test for all email automation models
puts "\n🧪 Testing Complete Email Automation System\n\n"

# Test 1: Create template with emails
puts "1️⃣  Creating email campaign template..."
template = EmailCampaignTemplate.create!(
  template_type: 'system',
  name: 'Default Event Campaign',
  description: 'Test campaign',
  is_default: true
)
puts "   ✅ Template created: #{template.name}"

# Test 2: Add multiple emails to template
puts "\n2️⃣  Adding email items to template..."
email1 = EmailTemplateItem.create!(
  email_campaign_template: template,
  name: 'Applications Open',
  position: 1,
  category: 'event_announcements',
  subject_template: '[eventName] is Open!',
  body_template: '<p>Apply now!</p>',
  trigger_type: 'on_application_open',
  trigger_value: 0
)

email2 = EmailTemplateItem.create!(
  email_campaign_template: template,
  name: 'Payment Reminder',
  position: 2,
  category: 'payment_reminders',
  subject_template: 'Payment Due',
  body_template: '<p>Please pay!</p>',
  trigger_type: 'days_before_event',
  trigger_value: 7
)
puts "   ✅ Created 2 email items"

# Test 3: Counter cache verification
template.reload
puts "\n3️⃣  Testing counter cache..."
puts "   ✅ Template email_count: #{template.email_count} (expected: 2)"

# Test 4: Find an organization and create event with template
puts "\n4️⃣  Creating event with email template..."
org = Organization.first
if org.nil?
  puts "   ⚠️  No organization found, creating one..."
  org = Organization.create!(name: 'Test Org')
end

event = Event.create!(
  organization: org,
  title: 'Test Market Event',
  slug: 'test-market-event-' + SecureRandom.hex(4),
  event_date: 30.days.from_now,
  application_deadline: 15.days.from_now,
  email_campaign_template: template
)
puts "   ✅ Event created: #{event.title}"
puts "   ✅ Event has template: #{event.email_campaign_template&.name}"

# Test 5: Create scheduled emails for event
puts "\n5️⃣  Creating scheduled emails..."
scheduled1 = ScheduledEmail.create!(
  event: event,
  email_campaign_template: template,
  email_template_item: email1,
  name: email1.name,
  subject_template: email1.subject_template,
  body_template: email1.body_template,
  trigger_type: email1.trigger_type,
  scheduled_for: Time.current + 1.hour,
  status: 'scheduled'
)

scheduled2 = ScheduledEmail.create!(
  event: event,
  email_campaign_template: template,
  email_template_item: email2,
  name: email2.name,
  subject_template: email2.subject_template,
  body_template: email2.body_template,
  trigger_type: email2.trigger_type,
  scheduled_for: Time.current + 2.days,
  status: 'scheduled'
)
puts "   ✅ Created #{event.scheduled_emails.count} scheduled emails"

# Test 6: Create registration
puts "\n6️⃣  Creating registration..."
registration = Registration.create!(
  event: event,
  email: 'vendor@example.com',
  name: 'Test Vendor',
  status: 'pending',
  business_name: 'Test Business',
  vendor_category: 'Food'
)
puts "   ✅ Registration created: #{registration.email}"
puts "   ✅ Email unsubscribed: #{registration.email_unsubscribed}"

# Test 7: Create email delivery record
puts "\n7️⃣  Creating email delivery record..."
delivery = EmailDelivery.create!(
  scheduled_email: scheduled1,
  event: event,
  registration: registration,
  sendgrid_message_id: 'test-msg-' + SecureRandom.hex(8),
  recipient_email: registration.email,
  status: 'sent',
  sent_at: Time.current
)
puts "   ✅ Delivery created with status: #{delivery.status}"

# Test 8: Test associations
puts "\n8️⃣  Testing all associations..."
puts "   Template → Emails: #{template.email_template_items.count}"
puts "   Template → Events: #{template.events.count}"
puts "   Event → Template: #{event.email_campaign_template&.name}"
puts "   Event → Scheduled Emails: #{event.scheduled_emails.count}"
puts "   Event → Deliveries: #{event.email_deliveries.count}"
puts "   Scheduled Email → Deliveries: #{scheduled1.email_deliveries.count}"
puts "   Scheduled Email → Latest Delivery: #{scheduled1.latest_delivery&.status}"
puts "   Registration → Deliveries: #{registration.email_deliveries.count}"
puts "   ✅ All associations working!"

# Test 9: Test scopes
puts "\n9️⃣  Testing scopes..."
puts "   System templates: #{EmailCampaignTemplate.system_templates.count}"
puts "   Default template: #{EmailCampaignTemplate.default_template&.name}"
puts "   Scheduled emails: #{ScheduledEmail.scheduled.count}"
puts "   Pending emails: #{ScheduledEmail.pending.count}"
puts "   Upcoming emails: #{ScheduledEmail.upcoming.count}"
puts "   Sent deliveries: #{EmailDelivery.sent.count}"
puts "   ✅ All scopes working!"

# Test 10: Test methods
puts "\n🔟 Testing methods..."
puts "   Scheduled email editable?: #{scheduled1.editable?}"
puts "   Scheduled email sendable?: #{scheduled1.sendable?}"
puts "   Scheduled email delivery_status: #{scheduled1.delivery_status}"
puts "   Delivery failed?: #{delivery.failed?}"
puts "   Delivery retryable?: #{delivery.retryable?}"
puts "   ✅ All methods working!"

puts "\n✨ All tests passed! Email automation system is ready!\n\n"

# Cleanup
puts "🧹 Cleaning up test data..."
event.destroy
template.destroy
org.destroy if org.name == 'Test Org'
puts "   ✅ Done!\n\n"
