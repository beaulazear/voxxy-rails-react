#!/usr/bin/env ruby
# Script to fix email injection for Pancake & Booze San Francisco event
# Deletes wrong emails and injects from correct template (ID: 3)

puts "🔧 Starting email injection fix..."

# Find the event
event_slug = "test-8-san-francisco-pancake-booze-art-show"
event = Event.find_by(slug: event_slug)

unless event
  puts "❌ Error: Event '#{event_slug}' not found"
  exit 1
end

puts "✅ Found event: #{event.title}"

# Delete all non-sent scheduled emails
non_sent_emails = event.scheduled_emails.where.not(status: 'sent')
count_to_delete = non_sent_emails.count

puts "\n📧 Found #{count_to_delete} non-sent scheduled emails to delete..."

non_sent_emails.each do |email|
  puts "   Deleting: #{email.name} (status: #{email.status})"
end

non_sent_emails.destroy_all
puts "✅ Deleted #{count_to_delete} emails"

# Find the correct template
template = EmailCampaignTemplate.find(3)  # "Pancake & Booze Event Campaign"
puts "\n📋 Using template: #{template.name} (#{template.email_template_items.count} emails)"

# Generate emails from correct template
puts "\n🚀 Generating emails from correct template..."

generator = ScheduledEmailGenerator.new(event)
emails = generator.generate

puts "✅ Generated #{emails.count} scheduled emails"

# Set all emails to 'paused' status
puts "\n⏸️  Setting all emails to 'paused' status..."
event.scheduled_emails.where.not(status: 'sent').update_all(status: 'paused')

# Display summary of created emails
puts "\n📊 Summary of created emails:"
puts "-" * 80

event.scheduled_emails.order(scheduled_for: :asc).each do |email|
  template_item = email.email_template_item
  category = template_item&.category || "N/A"
  trigger = template_item&.trigger_type || "N/A"

  puts "#{email.name}"
  puts "  Subject: #{email.subject_template}"
  puts "  Category: #{category}"
  puts "  Trigger: #{trigger}"
  puts "  Scheduled: #{email.scheduled_for&.strftime('%b %d, %Y %I:%M %p') || 'Not scheduled'}"
  puts "  Status: #{email.status}"
  puts ""
end

puts "-" * 80
puts "✅ Email injection fix complete!"
puts "\n📝 Next steps:"
puts "   1. Review the emails in the Mail tab"
puts "   2. Find 'Art Call Email #1' (4 weeks before event)"
puts "   3. Click 'Send Now' to send it"
puts ""
