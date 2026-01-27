namespace :debug do
  desc "Debug invitation reminder recipients for an event"
  task :invitation_reminders, [ :event_slug ] => :environment do |t, args|
    unless args[:event_slug]
      puts "❌ Error: Event slug required"
      puts "Usage: rake debug:invitation_reminders[your-event-slug]"
      exit 1
    end

    event = Event.find_by(slug: args[:event_slug])
    unless event
      puts "❌ Error: Event not found with slug '#{args[:event_slug]}'"
      exit 1
    end

    puts "\n" + "="*80
    puts "🔍 DEBUGGING INVITATION REMINDER RECIPIENTS"
    puts "="*80

    puts "\n📋 Event: #{event.title}"
    puts "   Slug: #{event.slug}"
    puts "   Application Deadline: #{event.application_deadline}"
    puts ""

    # Check EventInvitations
    puts "📬 Event Invitations:"
    invitations = event.event_invitations.includes(:vendor_contact)
    puts "   Total: #{invitations.count}"

    if invitations.any?
      invitations.each do |inv|
        vc = inv.vendor_contact
        puts "   - #{vc.name} (#{vc.email})"
        puts "     Invitation Status: #{inv.status}"
        puts "     VendorContact ID: #{vc.id}"
      end
    else
      puts "   ⚠️  No invitations found!"
    end
    puts ""

    # Check Registrations
    puts "📝 Registrations:"
    registrations = event.registrations
    puts "   Total: #{registrations.count}"

    if registrations.any?
      registrations.each do |reg|
        puts "   - #{reg.name} (#{reg.email})"
        puts "     Status: #{reg.status}"
        puts "     VendorContact ID: #{reg.vendor_contact_id || 'nil'}"
      end
    else
      puts "   (No registrations yet - expected for new event)"
    end
    puts ""

    # Check Scheduled Emails
    puts "📅 Scheduled Emails (Application Deadline):"
    deadline_emails = event.scheduled_emails.includes(:email_template_item)
                           .where(email_template_items: { category: "event_announcements" })

    if deadline_emails.empty?
      puts "   ❌ No application deadline emails found!"
      puts "   They should be auto-created when event is created"
      puts ""

      # Check if ANY scheduled emails exist
      all_scheduled = event.scheduled_emails
      if all_scheduled.any?
        puts "   ℹ️  Found #{all_scheduled.count} other scheduled emails:"
        all_scheduled.each do |email|
          category = email.email_template_item&.category
          puts "     - #{email.name} (category: #{category || 'nil'})"
        end
      end
    else
      deadline_emails.each do |email|
        puts "   - #{email.name}"
        puts "     Status: #{email.status}"
        puts "     Scheduled for: #{email.scheduled_for}"
        puts "     Template Item ID: #{email.email_template_item_id}"
        puts "     Category: #{email.email_template_item&.category}"
        puts ""
      end
    end
    puts ""

    # Test InvitationReminderService filtering
    if deadline_emails.any?
      puts "🧪 Testing InvitationReminderService Filter:"
      puts "-"*80

      test_email = deadline_emails.first
      service = InvitationReminderService.new(test_email)

      begin
        # Access private method for debugging
        recipients = service.send(:filter_invitation_recipients)

        puts "   Recipients found: #{recipients.count}"

        if recipients.empty?
          puts ""
          puts "   ⚠️  PROBLEM: No recipients found!"
          puts ""
          puts "   Debugging steps:"
          puts ""

          # Step 1: Check base query
          base_invitations = event.event_invitations.includes(:vendor_contact)
          puts "   1. Base event invitations: #{base_invitations.count}"

          # Step 2: Check registration exclusion
          registered_contact_ids = event.registrations.where.not(vendor_contact_id: nil).pluck(:vendor_contact_id)
          puts "   2. Registered vendor_contact_ids: #{registered_contact_ids.inspect}"

          remaining_after_filter = base_invitations.reject { |inv| registered_contact_ids.include?(inv.vendor_contact_id) }
          puts "   3. After excluding registered: #{remaining_after_filter.count}"

          # Step 3: Check unsubscribe filtering
          unsubscribed_count = 0
          remaining_after_filter.each do |inv|
            vc = inv.vendor_contact

            # Check old field
            if vc.respond_to?(:email_unsubscribed?) && vc.email_unsubscribed?
              puts "      ❌ #{vc.email} - has email_unsubscribed = true"
              unsubscribed_count += 1
              next
            end

            # Check new EmailUnsubscribe table
            if EmailUnsubscribe.unsubscribed?(email: vc.email, event: event, organization: event.organization)
              puts "      ❌ #{vc.email} - found in EmailUnsubscribe table"
              unsubscribed_count += 1
              next
            end

            puts "      ✅ #{vc.email} - should receive email"
          end

          puts "   4. Unsubscribed contacts: #{unsubscribed_count}"
          puts "   5. Final recipients: #{remaining_after_filter.count - unsubscribed_count}"

        else
          puts ""
          recipients.each do |inv|
            vc = inv.vendor_contact
            puts "   ✅ #{vc.name} (#{vc.email})"
          end
        end

      rescue => e
        puts "   ❌ Error testing filter: #{e.message}"
        puts "   #{e.backtrace.first(3).join("\n   ")}"
      end
    end

    puts ""
    puts "="*80
    puts "✅ Debug complete"
    puts "="*80
    puts ""
  end
end
