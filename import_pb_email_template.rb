#!/usr/bin/env ruby
# Script to import Pancake & Booze email template from CSV
# Usage: bundle exec rails runner import_pb_email_template.rb

require 'csv'

puts "🚀 Starting Pancake & Booze Email Template Import..."

# Trigger mapping from CSV format to database format
TRIGGER_MAP = {
  'manual_invite' => { type: 'on_application_open', value: 0 },
  'application_submitted' => { type: 'on_application_submit', value: 0 },
  'status_change_accepted' => { type: 'on_approval', value: 0 },
  'status_change_waitlist' => { type: 'on_waitlist', value: 0 },
  'scheduled_10_weeks_out' => { type: 'days_before_event', value: 70 },
  'scheduled_8_weeks_out' => { type: 'days_before_event', value: 56 },
  'scheduled_4_weeks_out' => { type: 'days_before_event', value: 28 },
  'scheduled_12_days_out' => { type: 'days_before_event', value: 12 },
  'scheduled_39_days_out_unpaid' => { type: 'days_before_payment_deadline', value: 39 },
  'scheduled_26_days_out_unpaid' => { type: 'days_before_payment_deadline', value: 26 },
  'scheduled_16_days_out_unpaid' => { type: 'days_before_payment_deadline', value: 16 },
  'scheduled_8_days_out_unpaid' => { type: 'days_before_payment_deadline', value: 8 },
  'scheduled_4_days_out_unpaid' => { type: 'days_before_payment_deadline', value: 4 },
  'scheduled_1_day_out_unpaid' => { type: 'days_before_payment_deadline', value: 1 },
  'scheduled_29_days_out_unpaid' => { type: 'days_before_payment_deadline', value: 29 },
  'scheduled_15_days_out_unpaid' => { type: 'days_before_payment_deadline', value: 15 },
  'scheduled_9_days_out_unpaid' => { type: 'days_before_payment_deadline', value: 9 },
  'scheduled_3_days_out_unpaid' => { type: 'days_before_payment_deadline', value: 3 },
  'payment_received' => { type: 'on_payment_received', value: 0 },
  'scheduled_17_days_out_paid' => { type: 'days_before_event', value: 17 },
  'scheduled_11_days_out_paid' => { type: 'days_before_event', value: 11 },
  'scheduled_3_days_out_paid' => { type: 'days_before_event', value: 3 },
  'scheduled_day_of' => { type: 'on_event_date', value: 0 },
  'scheduled_12_days_out_paid' => { type: 'days_before_event', value: 12 },
  'scheduled_7_days_out_paid' => { type: 'days_before_event', value: 7 }
}

# CSV file path (update this to match where you save the CSV)
csv_file = File.join(Rails.root, 'pb-email-templates.csv')

unless File.exist?(csv_file)
  puts "❌ Error: CSV file not found at #{csv_file}"
  puts "   Please save your CSV file as 'pb-email-templates.csv' in the Rails root directory"
  exit 1
end

# Step 1: Create the EmailCampaignTemplate
template_name = "Pancake & Booze 2026 Email Campaign"

puts "\n📋 Creating template: #{template_name}"

template = EmailCampaignTemplate.create!(
  name: template_name,
  description: "Complete email sequence for Pancake & Booze events including art calls, confirmations, payment reminders, and countdown emails",
  template_type: "system",  # Available to all users
  is_default: false         # Won't auto-select, but users can choose it
)

puts "✅ Template created with ID: #{template.id}"

# Step 2: Read CSV and create EmailTemplateItems
puts "\n📧 Processing emails from CSV..."

csv_data = CSV.read(csv_file, headers: true)
position = 1
created_count = 0
skipped_count = 0

csv_data.each do |row|
  email_name = row['email_name']
  subject = row['subject']
  trigger = row['trigger']
  category = row['category']
  body = row['body']

  # Skip application_page_load emails
  if trigger == 'application_page_load'
    puts "   ⏭️  Skipping: #{email_name} (application_page_load)"
    skipped_count += 1
    next
  end

  # Map trigger to database format
  unless TRIGGER_MAP[trigger]
    puts "   ⚠️  Warning: Unknown trigger '#{trigger}' for #{email_name}"
    skipped_count += 1
    next
  end

  trigger_data = TRIGGER_MAP[trigger]

  # Convert body to HTML (preserve line breaks)
  html_body = body.gsub("\n", "<br>")

  # Create the email template item
  begin
    template.email_template_items.create!(
      name: email_name,
      subject_template: subject,
      body_template: html_body,
      trigger_type: trigger_data[:type],
      trigger_value: trigger_data[:value],
      trigger_time: "09:00",  # Default to 9am
      category: category,
      position: position,
      enabled_by_default: true
    )

    puts "   ✅ Created: #{email_name} (Position #{position})"
    created_count += 1
    position += 1
  rescue => e
    puts "   ❌ Failed to create #{email_name}: #{e.message}"
    skipped_count += 1
  end
end

# Step 3: Summary
puts "\n" + "=" * 80
puts "✅ Import Complete!"
puts "=" * 80
puts "Template: #{template.name}"
puts "Template ID: #{template.id}"
puts "Emails Created: #{created_count}"
puts "Emails Skipped: #{skipped_count}"
puts "Total Emails: #{template.email_template_items.count}"
puts ""
puts "🎉 The template is now available for all users to select when creating events!"
puts ""
puts "Next Steps:"
puts "1. Go to your event creation flow"
puts "2. Look for the email template dropdown"
puts "3. Select '#{template.name}'"
puts "4. Generate emails for your event"
puts ""
