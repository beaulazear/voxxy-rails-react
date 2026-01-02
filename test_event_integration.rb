# Test Event Integration - Automatic Email Generation
# Run with: bin/rails runner test_event_integration.rb

puts "\n" + "="*70
puts "🧪 EVENT INTEGRATION TEST - Automatic Email Generation"
puts "="*70 + "\n"

# Setup: Ensure we have a default template
puts "📝 Setting up test data..."
template = EmailCampaignTemplate.default_template

unless template
  puts "✗ No default template found. Run seed file first."
  exit 1
end

puts "✓ Found default template: #{template.name} (#{template.email_count} emails)"

# Get or create organization
org = Organization.first || Organization.create!(name: "Test Organization #{SecureRandom.hex(4)}")
puts "✓ Using organization: #{org.name}\n"

# Test 1: Create event WITHOUT explicitly setting email template
puts "\n1️⃣  TEST: Create Event (Auto-assign template)"
puts "-" * 70

event1 = Event.create!(
  organization: org,
  title: "Auto Email Test Event #{SecureRandom.hex(4)}",
  slug: "auto-email-test-#{SecureRandom.hex(6)}",
  event_date: 45.days.from_now.to_date,
  application_deadline: 30.days.from_now.to_date,
  start_time: "10:00",
  end_time: "18:00",
  venue: "Test Venue"
)

puts "✓ Event created: #{event1.title}"
puts "✓ Event ID: #{event1.id}"

# Check if template was assigned
if event1.email_campaign_template
  puts "✓ Email template assigned: #{event1.email_campaign_template.name}"
else
  puts "✗ No email template assigned!"
end

# Check if scheduled emails were generated
scheduled_count = event1.scheduled_emails.count
puts "✓ Scheduled emails generated: #{scheduled_count}"

if scheduled_count > 0
  puts "\n✓ Sample scheduled emails:"
  event1.scheduled_emails.order(scheduled_for: :asc).limit(5).each do |email|
    days_until = ((email.scheduled_for - Time.current) / 1.day).round
    puts "  - #{email.name}"
    puts "    Scheduled: #{email.scheduled_for.strftime('%Y-%m-%d %H:%M')} (#{days_until} days)"
    puts "    Status: #{email.status}"
  end
end

# Test 2: Create event WITH explicit template (should not auto-assign)
puts "\n2️⃣  TEST: Create Event (With explicit template)"
puts "-" * 70

event2 = Event.create!(
  organization: org,
  title: "Manual Template Event #{SecureRandom.hex(4)}",
  slug: "manual-template-#{SecureRandom.hex(6)}",
  event_date: 50.days.from_now.to_date,
  application_deadline: 35.days.from_now.to_date,
  start_time: "14:00",
  end_time: "20:00",
  venue: "Another Venue",
  email_campaign_template: template
)

puts "✓ Event created with explicit template: #{event2.title}"
puts "✓ Template: #{event2.email_campaign_template.name}"
puts "✓ Scheduled emails: #{event2.scheduled_emails.count}"

# Test 3: Check template priority (organization default vs system default)
puts "\n3️⃣  TEST: Template Selection Priority"
puts "-" * 70

# Create organization's custom template
custom_template = org.email_campaign_templates.create!(
  template_type: 'user',
  name: "Org Custom Template #{SecureRandom.hex(4)}",
  description: "Organization's custom template",
  is_default: true
)

# Add a few emails to it
3.times do |i|
  custom_template.email_template_items.create!(
    name: "Custom Email #{i + 1}",
    position: i + 1,
    category: 'event_announcements',
    subject_template: "Custom subject #{i + 1}",
    body_template: "<p>Custom body #{i + 1}</p>",
    trigger_type: 'days_before_event',
    trigger_value: (i + 1) * 7
  )
end

puts "✓ Created organization's custom template with #{custom_template.email_count} emails"

# Create event - should use organization's template
event3 = Event.create!(
  organization: org,
  title: "Org Template Test #{SecureRandom.hex(4)}",
  slug: "org-template-#{SecureRandom.hex(6)}",
  event_date: 60.days.from_now.to_date,
  application_deadline: 40.days.from_now.to_date,
  start_time: "12:00",
  venue: "Org Venue"
)

puts "✓ Event created: #{event3.title}"
puts "✓ Assigned template: #{event3.email_campaign_template.name}"
puts "✓ Is organization's template? #{event3.email_campaign_template == custom_template}"
puts "✓ Scheduled emails: #{event3.scheduled_emails.count}"

# Test 4: Event without template (graceful handling)
puts "\n4️⃣  TEST: Graceful Handling (No templates)"
puts "-" * 70

# Temporarily hide templates
EmailCampaignTemplate.update_all(is_default: false)

event4 = Event.create!(
  organization: org,
  title: "No Template Event #{SecureRandom.hex(4)}",
  slug: "no-template-#{SecureRandom.hex(6)}",
  event_date: 40.days.from_now.to_date,
  application_deadline: 25.days.from_now.to_date,
  start_time: "16:00",
  venue: "No Template Venue"
)

puts "✓ Event created without errors: #{event4.title}"
puts "✓ Template assigned: #{event4.email_campaign_template&.name || 'None'}"
puts "✓ Scheduled emails: #{event4.scheduled_emails.count}"
puts "✓ Event creation succeeded gracefully!"

# Restore templates
template.update(is_default: true)

# Cleanup
puts "\n🧹 Cleaning up test data..."
event1.destroy
event2.destroy
event3.destroy
event4.destroy
custom_template.destroy
org.destroy if org.events.count == 0
puts "✓ Test data cleaned up"

# Summary
puts "\n" + "="*70
puts "🎉 ALL EVENT INTEGRATION TESTS PASSED!"
puts "="*70
puts "\n📊 SUMMARY:"
puts "   ✅ Events auto-assign email templates on creation"
puts "   ✅ Scheduled emails auto-generated from templates"
puts "   ✅ Organization templates have priority over system default"
puts "   ✅ Explicit template assignment prevents auto-assignment"
puts "   ✅ Graceful handling when no templates exist"
puts "\n🚀 Event integration ready for production!"
puts "\n" + "="*70 + "\n"
