# Find the most recent event
recent_event = Event.order(created_at: :desc).first

puts "\n🔍 DIAGNOSING NEWEST EVENT"
puts "=" * 60

if recent_event
  puts "Event: #{recent_event.title} (#{recent_event.slug})"
  puts "Created: #{recent_event.created_at}"
  puts ""

  # Check template assignment
  puts "📋 EMAIL TEMPLATE:"
  if recent_event.email_campaign_template
    puts "  ✅ Template assigned: #{recent_event.email_campaign_template.name}"
    puts "  Template ID: #{recent_event.email_campaign_template_id}"
    puts "  Template has #{recent_event.email_campaign_template.email_template_items.count} email items"
  else
    puts "  ❌ NO TEMPLATE ASSIGNED!"
    puts "  This is the problem - emails can't be generated without a template"
  end
  puts ""

  # Check scheduled emails
  puts "📧 SCHEDULED EMAILS:"
  emails = recent_event.scheduled_emails
  if emails.any?
    puts "  ✅ Found #{emails.count} scheduled emails"
    emails.group_by(&:status).each do |status, group|
      puts "    #{status}: #{group.count}"
    end
  else
    puts "  ❌ NO SCHEDULED EMAILS FOUND!"
    puts "  Emails should have been auto-generated on event creation"
  end
  puts ""

  # Check invitations
  puts "📬 INVITATIONS:"
  invitations = recent_event.event_invitations
  if invitations.any?
    puts "  ✅ Found #{invitations.count} invitations"
    invitations.group_by(&:status).each do |status, group|
      puts "    #{status}: #{group.count}"
    end
  else
    puts "  No invitations sent yet"
  end
  puts ""

  # Check default template exists
  puts "🔧 SYSTEM CHECK:"
  default_template = EmailCampaignTemplate.default_template
  if default_template
    puts "  ✅ Default template exists (ID: #{default_template.id})"
  else
    puts "  ❌ NO DEFAULT TEMPLATE FOUND!"
    puts "  Run: rails runner \"load 'db/seeds/email_campaign_templates.rb'\""
  end
  puts ""

  # Suggest fix
  puts "💡 SUGGESTED FIX:"
  if !recent_event.email_campaign_template
    puts "  The event has no template. Assign and generate emails:"
    puts "  rails runner \"event = Event.find(#{recent_event.id}); event.assign_email_template_and_generate_emails\""
  elsif emails.empty?
    puts "  Template is assigned but emails weren't generated. Regenerate:"
    puts "  rails runner \"event = Event.find(#{recent_event.id}); event.generate_scheduled_emails\""
  else
    puts "  Everything looks good! Emails exist."
  end

else
  puts "❌ No events found in database"
end
