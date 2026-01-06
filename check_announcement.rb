# Check what the immediate announcement email is supposed to do
template = EmailCampaignTemplate.default_template
immediate = template.email_template_items.find_by("name LIKE ?", "%Immediate%")

if immediate
  puts "📧 IMMEDIATE ANNOUNCEMENT EMAIL"
  puts "=" * 60
  puts "Name: #{immediate.name}"
  puts "Category: #{immediate.category}"
  puts "Trigger: #{immediate.trigger_type}"
  puts "Filter Criteria: #{immediate.filter_criteria.inspect}"
  puts ""
  puts "This email is supposed to be sent to:"
  puts "  Trigger: #{immediate.trigger_type}"
  puts "  Recipients: #{immediate.filter_criteria.empty? ? 'ALL registrations (no filter)' : "Filtered: #{immediate.filter_criteria}"}"
  puts ""
  puts "🤔 QUESTION: Should this email go to:"
  puts "  A) Vendor CONTACTS (from Network/CRM) before they apply?"
  puts "  B) Existing REGISTRATIONS (people who already applied)?"
end
