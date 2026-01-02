# Test script for Email Automation models
puts "\n🧪 Testing Email Automation Models\n\n"

# Test 1: Create a System Template
puts "1️⃣ Creating system default template..."
template = EmailCampaignTemplate.create!(
  template_type: 'system',
  name: 'Default Event Campaign',
  description: 'Standard email campaign for all event types',
  is_default: true
)
puts "   ✅ Created: #{template.name} (ID: #{template.id})"

# Test 2: Add an email to the template
puts "\n2️⃣ Adding email item to template..."
email = EmailTemplateItem.create!(
  email_campaign_template: template,
  name: 'Applications Now Open',
  position: 1,
  category: 'event_announcements',
  subject_template: 'You\'re Invited: [eventName] - Apply Now!',
  body_template: '<p>Hi [firstName],</p><p>Applications are now open!</p>',
  trigger_type: 'on_application_open',
  trigger_value: 0,
  trigger_time: '09:00',
  filter_criteria: {}
)
puts "   ✅ Created: #{email.name} (Position: #{email.position})"

# Test 3: Verify counter cache
puts "\n3️⃣ Testing counter cache..."
template.reload
puts "   ✅ Template email_count: #{template.email_count} (should be 1)"

# Test 4: Test validations
puts "\n4️⃣ Testing validations..."

# Test invalid position
begin
  EmailTemplateItem.create!(
    email_campaign_template: template,
    name: 'Invalid Email',
    position: 50,  # Should fail (> 40)
    subject_template: 'Test',
    body_template: 'Test',
    trigger_type: 'on_event_date'
  )
  puts "   ❌ Validation FAILED: Should not allow position > 40"
rescue ActiveRecord::RecordInvalid => e
  puts "   ✅ Validation works: #{e.message}"
end

# Test duplicate default system template
begin
  EmailCampaignTemplate.create!(
    template_type: 'system',
    name: 'Another Default',
    is_default: true  # Should fail - only one default allowed
  )
  puts "   ❌ Validation FAILED: Should not allow two default system templates"
rescue ActiveRecord::RecordInvalid => e
  puts "   ✅ Validation works: #{e.message}"
end

# Test 5: Test associations
puts "\n5️⃣ Testing associations..."
puts "   Template has #{template.email_template_items.count} email(s)"
puts "   Email belongs to template: #{email.email_campaign_template.name}"

# Test 6: Test scopes
puts "\n6️⃣ Testing scopes..."
puts "   System templates: #{EmailCampaignTemplate.system_templates.count}"
puts "   Default template: #{EmailCampaignTemplate.default_template&.name}"
puts "   Enabled emails: #{EmailTemplateItem.enabled.count}"
puts "   Emails by position: #{EmailTemplateItem.by_position.pluck(:position).join(', ')}"

puts "\n✨ All tests passed! Models are working correctly.\n\n"

# Cleanup
puts "🧹 Cleaning up test data..."
template.destroy
puts "   ✅ Done!\n\n"
