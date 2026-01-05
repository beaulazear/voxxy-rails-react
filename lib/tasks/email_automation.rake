namespace :email_automation do
  desc "Generate scheduled emails for events that are missing them"
  task backfill: :environment do
    puts "🔄 Backfilling scheduled emails for events..."
    puts "=" * 80
    puts ""

    # Find events with templates but no scheduled emails
    events = Event.includes(:email_campaign_template, :scheduled_emails)
      .where.not(email_campaign_template_id: nil)
      .select { |e| e.scheduled_emails.count == 0 }

    if events.empty?
      puts "✅ No events need backfilling. All events with templates have scheduled emails."
      next
    end

    puts "Found #{events.count} event(s) needing scheduled emails:"
    puts ""

    success_count = 0
    error_count = 0

    events.each do |event|
      print "  Processing '#{event.title}' (#{event.slug})... "

      begin
        generator = ScheduledEmailGenerator.new(event)
        emails = generator.generate

        puts "✅ Generated #{emails.count} emails"

        if generator.errors.any?
          puts "    Warnings:"
          generator.errors.each { |e| puts "      - #{e}" }
        end

        success_count += 1
      rescue => e
        puts "❌ Error: #{e.message}"
        error_count += 1
      end
    end

    puts ""
    puts "=" * 80
    puts "✅ Backfill complete!"
    puts "   Success: #{success_count} events"
    puts "   Errors: #{error_count} events"
  end

  desc "Regenerate scheduled emails for a specific event (by slug)"
  task :regenerate, [:event_slug] => :environment do |t, args|
    unless args[:event_slug]
      puts "❌ Error: Please provide an event slug"
      puts "   Usage: rails email_automation:regenerate[event-slug]"
      next
    end

    event = Event.find_by(slug: args[:event_slug])

    unless event
      puts "❌ Error: Event not found with slug '#{args[:event_slug]}'"
      next
    end

    puts "🔄 Regenerating scheduled emails for '#{event.title}'..."
    puts "=" * 80
    puts ""

    # Delete existing scheduled emails
    deleted_count = event.scheduled_emails.where(status: "scheduled").count
    event.scheduled_emails.where(status: "scheduled").destroy_all
    puts "Deleted #{deleted_count} existing scheduled emails"

    # Generate new ones
    generator = ScheduledEmailGenerator.new(event)
    emails = generator.generate

    puts "✅ Generated #{emails.count} new emails"

    if generator.errors.any?
      puts ""
      puts "Warnings:"
      generator.errors.each { |e| puts "  - #{e}" }
    end

    puts ""
    puts "✅ Regeneration complete!"
  end

  desc "Show email automation stats"
  task stats: :environment do
    puts "📊 EMAIL AUTOMATION STATISTICS"
    puts "=" * 80
    puts ""

    total_events = Event.count
    events_with_templates = Event.where.not(email_campaign_template_id: nil).count
    events_with_emails = Event.joins(:scheduled_emails).distinct.count

    templates_count = EmailCampaignTemplate.count
    system_templates = EmailCampaignTemplate.where(template_type: "system").count
    user_templates = EmailCampaignTemplate.where(template_type: "user").count

    total_scheduled = ScheduledEmail.count
    scheduled_status = ScheduledEmail.where(status: "scheduled").count
    sent_status = ScheduledEmail.where(status: "sent").count
    paused_status = ScheduledEmail.where(status: "paused").count

    puts "Events:"
    puts "  Total Events: #{total_events}"
    puts "  With Email Templates: #{events_with_templates}"
    puts "  With Scheduled Emails: #{events_with_emails}"
    puts "  Missing Emails: #{events_with_templates - events_with_emails}"
    puts ""

    puts "Templates:"
    puts "  Total Templates: #{templates_count}"
    puts "  System Templates: #{system_templates}"
    puts "  User Templates: #{user_templates}"
    puts ""

    puts "Scheduled Emails:"
    puts "  Total: #{total_scheduled}"
    puts "  Scheduled: #{scheduled_status}"
    puts "  Sent: #{sent_status}"
    puts "  Paused: #{paused_status}"
    puts ""

    puts "=" * 80
  end
end
