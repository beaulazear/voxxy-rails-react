namespace :email_templates do
  desc "Update default email campaign template with emoji-free subjects and content"
  task update_default: :environment do
    puts "\n🔄 Updating Default Email Campaign Template...\n"

    # Find the default template
    template = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)

    unless template
      puts "❌ No default template found. Run 'rails db:seed' first."
      exit 1
    end

    puts "Found default template: #{template.name} (ID: #{template.id})"
    puts "Created: #{template.created_at}"
    puts "Updating #{template.email_template_items.count} email items...\n"

    # Update each email template item
    updates = [
      # Position 1: 1 Day Before Application Deadline
      {
        position: 1,
        subject: "Last Chance: [eventName] Applications Close Tomorrow",
        body: "This is your final reminder that applications for [eventName] close tomorrow.\n\nDon't miss this opportunity to be part of [eventName] on [eventDate] at [eventLocation].\n\nSubmit your application before the deadline."
      },
      # Position 2: Application Deadline Day
      {
        position: 2,
        subject: "URGENT: [eventName] Applications Close Today",
        body: "Today is the last day to apply for [eventName].\n\nApplications close at midnight tonight. Submit your application now to secure your spot at [eventLocation] on [eventDate].\n\nThis is your final chance to participate in this event."
      },
      # Position 3: 1 Day Before Payment Due
      {
        position: 3,
        subject: "Reminder: Payment Due Tomorrow - [eventName]",
        body: "Your payment for [eventName] is due tomorrow.\n\nEvent Details:\n• Event: [eventName]\n• Date: [eventDate]\n• Location: [eventLocation]\n• Amount Due: [categoryPrice]\n\nPlease submit your payment by the deadline to confirm your participation."
      },
      # Position 4: Payment Due Today
      {
        position: 4,
        subject: "URGENT: Payment Due Today - [eventName]",
        body: "This is a reminder that your payment for [eventName] is due today.\n\nAmount Due: [categoryPrice]\nEvent Date: [eventDate]\nLocation: [eventLocation]\n\nPlease submit your payment today to avoid losing your spot."
      },
      # Position 5: 1 Day Before Event
      {
        position: 5,
        subject: "Tomorrow: [eventName] Final Details",
        body: "[eventName] is tomorrow.\n\nEvent Details:\n• Date: [eventDate]\n• Location: [eventLocation]\n• Start Time: [eventStartTime]\n• Load-in: [loadInTime]\n\nWe look forward to seeing you tomorrow. Please arrive during the load-in window to set up your space."
      },
      # Position 6: Day of Event
      {
        position: 6,
        subject: "Today: [eventName]",
        body: "Today is the day.\n\n[eventName] starts at [eventStartTime] at [eventLocation].\n\nThank you for being part of this event. We're excited to see you there."
      },
      # Position 7: Day After Event
      {
        position: 7,
        subject: "Thank You for Participating in [eventName]",
        body: "Thank you for being part of [eventName] yesterday.\n\nWe hope the event was successful for you. We'd love to have you at our future events.\n\nStay tuned for upcoming opportunities."
      }
    ]

    updated_count = 0
    updates.each do |update|
      item = template.email_template_items.find_by(position: update[:position])

      if item
        item.update!(
          subject_template: update[:subject],
          body_template: update[:body]
        )
        puts "  ✅ Updated Position #{update[:position]}: #{update[:subject]}"
        updated_count += 1
      else
        puts "  ⚠️  Position #{update[:position]} not found"
      end
    end

    # Update the template's updated_at timestamp
    template.touch

    puts "\n✅ Successfully updated #{updated_count} email templates"
    puts "Template ID: #{template.id}"
    puts "Last Updated: #{template.updated_at}\n"
  end

  desc "Show current default template subjects"
  task show_default: :environment do
    template = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)

    unless template
      puts "❌ No default template found"
      exit 1
    end

    puts "\n📧 Default Email Campaign Template\n"
    puts "ID: #{template.id}"
    puts "Name: #{template.name}"
    puts "Created: #{template.created_at}"
    puts "Updated: #{template.updated_at}\n"
    puts "Email Templates:\n"

    template.email_template_items.order(:position).each do |item|
      puts "#{item.position}. #{item.name}"
      puts "   Subject: #{item.subject_template}"
      puts ""
    end
  end

  desc "Reset default template (delete and recreate from seeds)"
  task reset_default: :environment do
    puts "\n⚠️  This will DELETE the existing default template and recreate it from seeds.\n"
    print "Are you sure? (yes/no): "

    confirmation = STDIN.gets.chomp

    unless confirmation.downcase == 'yes'
      puts "Aborted."
      exit 0
    end

    template = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)

    if template
      puts "Deleting template ID: #{template.id}..."
      template.destroy
      puts "✅ Deleted"
    end

    puts "Running seeds..."
    load Rails.root.join('db', 'seeds', 'email_campaign_templates.rb')
    puts "\n✅ Default template recreated from seeds"
  end
end
