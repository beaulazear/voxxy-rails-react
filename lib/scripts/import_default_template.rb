#!/usr/bin/env ruby
# frozen_string_literal: true

# Script to import the default email template from exported JSON
#
# Usage:
#   rails runner lib/scripts/import_default_template.rb path/to/default_template_export.json

require "json"

if ARGV.empty?
  puts "Usage: rails runner lib/scripts/import_default_template.rb <json_file>"
  exit 1
end

json_file = ARGV[0]

unless File.exist?(json_file)
  puts "ERROR: File not found: #{json_file}"
  exit 1
end

puts "📥 Importing default email template..."

# Load JSON data
data = JSON.parse(File.read(json_file))

# Check if template already exists
existing_template = EmailCampaignTemplate.find_by(name: data["template"]["name"])
if existing_template
  puts "⚠️  Template '#{data['template']['name']}' already exists (ID: #{existing_template.id})"
  print "   Delete and recreate? (y/N): "
  response = STDIN.gets.chomp

  if response.downcase == "y"
    existing_template.destroy!
    puts "   ✓ Deleted existing template"
  else
    puts "   Aborting import."
    exit 0
  end
end

# Create template
ActiveRecord::Base.transaction do
  template = EmailCampaignTemplate.create!(
    name: data["template"]["name"],
    description: data["template"]["description"],
    template_type: data["template"]["template_type"],
    is_default: data["template"]["is_default"]
  )

  puts "✓ Created template: #{template.name} (ID: #{template.id})"

  # Create email items
  data["email_items"].each do |item_data|
    template.email_template_items.create!(
      name: item_data["name"],
      position: item_data["position"],
      category: item_data["category"],
      subject_template: item_data["subject_template"],
      body_template: item_data["body_template"],
      trigger_type: item_data["trigger_type"],
      trigger_value: item_data["trigger_value"],
      trigger_time: item_data["trigger_time"],
      filter_criteria: item_data["filter_criteria"] || {},
      enabled_by_default: item_data["enabled_by_default"],
      description: item_data["description"]
    )
  end

  puts "✓ Created #{data['email_items'].count} email items"
  puts ""
  puts "✅ Import complete!"
  puts "   Template ID: #{template.id}"
  puts "   Email count: #{template.email_template_items.count}"
end
