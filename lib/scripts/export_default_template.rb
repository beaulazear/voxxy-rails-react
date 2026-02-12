#!/usr/bin/env ruby
# frozen_string_literal: true

# Script to export the default email template from staging database
# Run this on staging to get the template data, then use import_default_template.rb locally
#
# Usage on staging:
#   rails runner lib/scripts/export_default_template.rb > default_template_export.json

require "json"

# Find the default template
template = EmailCampaignTemplate.find_by(is_default: true)

if template.nil?
  puts "ERROR: No default template found!"
  exit 1
end

# Export template and all its email items
export_data = {
  template: {
    name: template.name,
    description: template.description,
    template_type: "system",
    is_default: true
  },
  email_items: template.email_template_items.order(:position).map do |item|
    {
      name: item.name,
      position: item.position,
      category: item.category,
      subject_template: item.subject_template,
      body_template: item.body_template,
      trigger_type: item.trigger_type,
      trigger_value: item.trigger_value,
      trigger_time: item.trigger_time,
      filter_criteria: item.filter_criteria,
      enabled_by_default: item.enabled_by_default,
      description: item.description
    }
  end
}

puts JSON.pretty_generate(export_data)

STDERR.puts "\n✅ Exported template: #{template.name}"
STDERR.puts "   Email items: #{template.email_template_items.count}"
STDERR.puts "\nSave this output to a file and use import_default_template.rb to import locally"
