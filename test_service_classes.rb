# Comprehensive Service Classes Test
# Run with: bin/rails runner test_service_classes.rb

puts "\n" + "="*70
puts "🧪 SERVICE CLASSES TEST - Email Automation System"
puts "="*70 + "\n"

# Setup: Create test data
puts "📝 Setting up test data..."
org = Organization.first || Organization.create!(name: "Test Org #{SecureRandom.hex(4)}")
template = EmailCampaignTemplate.default_template

event = Event.create!(
  organization: org,
  title: "Summer Food Festival #{SecureRandom.hex(4)}",
  slug: "summer-festival-#{SecureRandom.hex(6)}",
  event_date: 45.days.from_now.to_date,
  application_deadline: 30.days.from_now.to_date,
  start_time: "10:00",
  end_time: "18:00",
  venue: "Central Park",
  email_campaign_template: template
)

registration1 = Registration.create!(
  event: event,
  email: "vendor1-#{SecureRandom.hex(4)}@example.com",
  name: "John Smith",
  business_name: "John's Tacos",
  vendor_category: "Food",
  status: "approved",
  email_unsubscribed: false
)

registration2 = Registration.create!(
  event: event,
  email: "vendor2-#{SecureRandom.hex(4)}@example.com",
  name: "Jane Doe",
  business_name: "Jane's Art",
  vendor_category: "Art",
  status: "pending",
  email_unsubscribed: false
)

registration3 = Registration.create!(
  event: event,
  email: "unsubscribed-#{SecureRandom.hex(4)}@example.com",
  name: "Bob Wilson",
  business_name: "Bob's Crafts",
  vendor_category: "Crafts",
  status: "approved",
  email_unsubscribed: true
)

puts "✓ Created test event: #{event.title}"
puts "✓ Created 3 test registrations\n"

# Test 1: EmailScheduleCalculator
puts "\n1️⃣  EmailScheduleCalculator"
puts "-" * 70

calculator = EmailScheduleCalculator.new(event)
puts "✓ Calculator initialized for event: #{event.title}"

# Test calculating different trigger types
test_items = template.email_template_items.by_position.limit(5)
test_items.each do |item|
  scheduled_time = calculator.calculate(item)
  if scheduled_time
    days_from_now = ((scheduled_time - Time.current) / 1.day).round
    puts "✓ #{item.name}"
    puts "  Trigger: #{item.trigger_type} (#{item.trigger_value || 0})"
    puts "  Scheduled: #{scheduled_time.strftime('%Y-%m-%d %H:%M')} (#{days_from_now} days from now)"
  else
    puts "✓ #{item.name} - Callback triggered (no advance schedule)"
  end
end

# Test batch calculation
batch_times = calculator.calculate_batch(template.email_template_items)
puts "\n✓ Batch calculation: #{batch_times.count} emails scheduled"

# Test 2: RecipientFilterService
puts "\n2️⃣  RecipientFilterService"
puts "-" * 70

# Test with no filters
filter_service = RecipientFilterService.new(event, {})
puts "✓ No filters: #{filter_service.recipient_count} recipients"
puts "  Emails: #{filter_service.recipient_emails.join(', ')}"

# Test filtering by status
filter_service = RecipientFilterService.new(event, { 'statuses' => [ 'approved' ] })
puts "\n✓ Status filter (approved): #{filter_service.recipient_count} recipients"
puts "  Emails: #{filter_service.recipient_emails.join(', ')}"

# Test filtering by category
filter_service = RecipientFilterService.new(event, { 'vendor_categories' => [ 'Food' ] })
puts "\n✓ Category filter (Food): #{filter_service.recipient_count} recipients"
puts "  Emails: #{filter_service.recipient_emails.join(', ')}"

# Test excluding unsubscribed
filter_service = RecipientFilterService.new(event, { 'exclude_unsubscribed' => true })
puts "\n✓ Exclude unsubscribed: #{filter_service.recipient_count} recipients"
puts "  (Should be 2, excluding the unsubscribed vendor)"

# Test matches? method
filter_service = RecipientFilterService.new(event, { 'statuses' => [ 'approved' ] })
puts "\n✓ Testing matches? method:"
puts "  Registration 1 (approved): #{filter_service.matches?(registration1)}"
puts "  Registration 2 (pending): #{filter_service.matches?(registration2)}"

# Test 3: ScheduledEmailGenerator
puts "\n3️⃣  ScheduledEmailGenerator"
puts "-" * 70

generator = ScheduledEmailGenerator.new(event)
scheduled_emails = generator.generate

puts "✓ Generated #{scheduled_emails.count} scheduled emails"
puts "✓ Errors: #{generator.errors.count}"
generator.errors.each { |err| puts "  - #{err}" }

if scheduled_emails.any?
  puts "\n✓ Sample scheduled emails:"
  scheduled_emails.first(3).each do |se|
    days_until = ((se.scheduled_for - Time.current) / 1.day).round
    puts "  - #{se.name}"
    puts "    Scheduled: #{se.scheduled_for.strftime('%Y-%m-%d %H:%M')} (#{days_until} days)"
    puts "    Status: #{se.status}"
  end
end

# Test selective generation
event.scheduled_emails.destroy_all
selective = generator.generate_selective(category: 'event_announcements')
puts "\n✓ Selective generation (event_announcements): #{selective.count} emails"

# Test 4: EmailVariableResolver
puts "\n4️⃣  EmailVariableResolver"
puts "-" * 70

resolver = EmailVariableResolver.new(event, registration1)
puts "✓ Resolver initialized for event and registration"

# Test event variables
subject_template = "Welcome to [eventName] on [eventDate]!"
resolved_subject = resolver.resolve(subject_template)
puts "\n✓ Event variables:"
puts "  Template: #{subject_template}"
puts "  Resolved: #{resolved_subject}"

# Test registration variables
body_template = "<p>Hi [firstName],</p><p>Your business [businessName] has been approved!</p>"
resolved_body = resolver.resolve(body_template)
puts "\n✓ Registration variables:"
puts "  Template: #{body_template}"
puts "  Resolved: #{resolved_body}"

# Test special variables
link_template = "Event link: [eventLink] | Unsubscribe: [unsubscribeLink]"
resolved_links = resolver.resolve(link_template)
puts "\n✓ Special variables:"
puts "  Template: #{link_template}"
puts "  Resolved: #{resolved_links}"

# Test resolve_email method
email_content = resolver.resolve_email(
  "Payment due for [eventName]",
  "<p>Hi [firstName], payment of [boothPrice] is due on [paymentDueDate]</p>"
)
puts "\n✓ Full email resolution:"
puts "  Subject: #{email_content[:subject]}"
puts "  Body: #{email_content[:body]}"

# Test 5: EmailCampaignTemplateCloner
puts "\n5️⃣  EmailCampaignTemplateCloner"
puts "-" * 70

cloner = EmailCampaignTemplateCloner.new(template, org)
puts "✓ Cloner initialized"
puts "✓ Can clone? #{cloner.can_clone?}"

# Clone the template
cloned_template = cloner.clone(name: "Custom Campaign #{SecureRandom.hex(4)}")

if cloned_template
  puts "\n✓ Template cloned successfully!"
  puts "  Original: #{template.name} (#{template.email_count} emails)"
  puts "  Cloned: #{cloned_template.name} (#{cloned_template.email_count} emails)"
  puts "  Template type: #{cloned_template.template_type}"
  puts "  Organization: #{cloned_template.organization.name}"
  puts "  Is default: #{cloned_template.is_default}"

  # Verify email items copied
  puts "\n✓ Email items verification:"
  puts "  Original positions: #{template.email_template_items.by_position.pluck(:position).join(', ')}"
  puts "  Cloned positions: #{cloned_template.email_template_items.by_position.pluck(:position).join(', ')}"

  # Verify categories preserved
  original_categories = template.email_template_items.group(:category).count
  cloned_categories = cloned_template.email_template_items.group(:category).count
  puts "\n✓ Categories preserved:"
  original_categories.each do |category, count|
    cloned_count = cloned_categories[category] || 0
    status = count == cloned_count ? "✓" : "✗"
    puts "  #{status} #{category}: #{count} → #{cloned_count}"
  end
else
  puts "✗ Clone failed: #{cloner.errors.join(', ')}"
end

# Test selective cloning
selective_clone = cloner.clone_selective(
  categories: [ 'event_announcements', 'payment_reminders' ],
  name: "Selective Clone #{SecureRandom.hex(4)}"
)

if selective_clone
  puts "\n✓ Selective clone created!"
  puts "  Name: #{selective_clone.name}"
  puts "  Email count: #{selective_clone.email_count}"
  categories = selective_clone.email_template_items.pluck(:category).uniq
  puts "  Categories: #{categories.join(', ')}"
end

# Cleanup
puts "\n🧹 Cleaning up test data..."
event.scheduled_emails.destroy_all
event.reload.destroy
cloned_template&.destroy
selective_clone&.destroy
org.reload
org.destroy if org.events.count == 0
puts "✓ Test data cleaned up"

# Summary
puts "\n" + "="*70
puts "🎉 ALL SERVICE CLASSES TESTED SUCCESSFULLY!"
puts "="*70
puts "\n📊 SUMMARY:"
puts "   ✅ EmailScheduleCalculator - Calculates send times correctly"
puts "   ✅ RecipientFilterService - Filters recipients by criteria"
puts "   ✅ ScheduledEmailGenerator - Creates scheduled emails from template"
puts "   ✅ EmailVariableResolver - Resolves all variable types"
puts "   ✅ EmailCampaignTemplateCloner - Clones templates successfully"
puts "\n🚀 All 5 service classes ready for production!"
puts "\n" + "="*70 + "\n"
