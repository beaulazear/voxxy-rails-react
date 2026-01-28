namespace :verify do
  desc "Comprehensive verification of email routing system before production deploy"
  task email_system: :environment do
    puts "\n" + "="*80
    puts "🔍 PRE-PRODUCTION EMAIL SYSTEM VERIFICATION"
    puts "="*80
    puts ""

    errors = []
    warnings = []

    # 1. Verify EmailSenderWorker routing logic
    puts "1️⃣  Verifying EmailSenderWorker routing logic..."
    begin
      # Check that worker file exists and has routing logic
      worker_content = File.read(Rails.root.join("app/workers/email_sender_worker.rb"))

      if worker_content.include?("email_template_item&.category")
        puts "   ✅ Worker uses category-based routing"
      else
        errors << "EmailSenderWorker doesn't have category-based routing"
      end

      if worker_content.include?("InvitationReminderService")
        puts "   ✅ Worker routes to InvitationReminderService"
      else
        errors << "EmailSenderWorker doesn't route to InvitationReminderService"
      end
    rescue => e
      errors << "Failed to verify EmailSenderWorker: #{e.message}"
    end
    puts ""

    # 2. Verify InvitationReminderService exists and has correct methods
    puts "2️⃣  Verifying InvitationReminderService..."
    begin
      service_exists = File.exist?(Rails.root.join("app/services/invitation_reminder_service.rb"))

      if service_exists
        puts "   ✅ InvitationReminderService exists"

        # Check it has the filter method
        if InvitationReminderService.private_method_defined?(:filter_invitation_recipients)
          puts "   ✅ Has filter_invitation_recipients method"
        else
          errors << "InvitationReminderService missing filter_invitation_recipients method"
        end
      else
        errors << "InvitationReminderService file not found"
      end
    rescue => e
      errors << "Failed to verify InvitationReminderService: #{e.message}"
    end
    puts ""

    # 3. Verify InvitationVariableResolver exists
    puts "3️⃣  Verifying InvitationVariableResolver..."
    begin
      if defined?(InvitationVariableResolver)
        puts "   ✅ InvitationVariableResolver exists"
      else
        errors << "InvitationVariableResolver not defined"
      end
    rescue => e
      errors << "Failed to verify InvitationVariableResolver: #{e.message}"
    end
    puts ""

    # 4. Verify email template categories
    puts "4️⃣  Verifying email template categories..."
    template = EmailCampaignTemplate.find_by(is_default: true)

    if template
      announcement_emails = template.email_template_items.where(category: "event_announcements")
      payment_emails = template.email_template_items.where(category: "payment_reminders")
      countdown_emails = template.email_template_items.where(category: "event_countdown")

      puts "   ✅ Default template exists"
      puts "   📧 Application deadline emails: #{announcement_emails.count}"
      puts "   📧 Payment reminder emails: #{payment_emails.count}"
      puts "   📧 Event countdown emails: #{countdown_emails.count}"

      if announcement_emails.count == 0
        errors << "No application deadline emails found"
      end
    else
      errors << "No default email campaign template found"
    end
    puts ""

    # 5. Verify ScheduledEmail recipient count calculation
    puts "5️⃣  Verifying ScheduledEmail recipient count calculation..."
    begin
      scheduled_email_content = File.read(Rails.root.join("app/models/scheduled_email.rb"))

      if scheduled_email_content.include?("InvitationReminderService")
        puts "   ✅ ScheduledEmail uses InvitationReminderService for counts"
      else
        warnings << "ScheduledEmail may not calculate invitation reminder counts correctly"
      end
    rescue => e
      errors << "Failed to verify ScheduledEmail: #{e.message}"
    end
    puts ""

    # 6. Verify EmailDelivery has event_invitation_id column
    puts "6️⃣  Verifying EmailDelivery schema..."
    if EmailDelivery.column_names.include?("event_invitation_id")
      puts "   ✅ EmailDelivery has event_invitation_id column"
    else
      errors << "EmailDelivery missing event_invitation_id column"
    end

    if EmailDelivery.columns.find { |c| c.name == "registration_id" }.null
      puts "   ✅ EmailDelivery.registration_id is nullable"
    else
      warnings << "EmailDelivery.registration_id should be nullable"
    end
    puts ""

    # 7. Test with a real event (if any exist)
    puts "7️⃣  Testing with real data..."
    test_event = Event.joins(:scheduled_emails)
                     .where(scheduled_emails: { status: "scheduled" })
                     .first

    if test_event
      puts "   📋 Test Event: #{test_event.title}"

      # Check invitation count
      invitation_count = test_event.event_invitations.count
      registration_count = test_event.registrations.count

      puts "   📬 Invitations: #{invitation_count}"
      puts "   📝 Registrations: #{registration_count}"

      # Find application deadline emails
      deadline_emails = test_event.scheduled_emails
                                  .joins(:email_template_item)
                                  .where(email_template_items: { category: "event_announcements" })

      if deadline_emails.any?
        deadline_emails.each do |email|
          begin
            recipient_count = email.calculate_current_recipient_count
            puts "   📧 #{email.name}: #{recipient_count} recipients"

            # Verify it matches the service
            service = InvitationReminderService.new(email)
            actual_recipients = service.send(:filter_invitation_recipients)

            if recipient_count == actual_recipients.count
              puts "      ✅ Count matches InvitationReminderService"
            else
              warnings << "Recipient count mismatch for '#{email.name}': calculated=#{recipient_count}, actual=#{actual_recipients.count}"
            end
          rescue => e
            errors << "Failed to calculate recipients for '#{email.name}': #{e.message}"
          end
        end
      else
        puts "   ℹ️  No application deadline emails found for this event"
      end
    else
      puts "   ℹ️  No events with scheduled emails found"
      puts "   (This is OK if you haven't created test events yet)"
    end
    puts ""

    # 8. Verify organization branding works
    puts "8️⃣  Verifying organization email branding..."
    begin
      base_service_content = File.read(Rails.root.join("app/services/base_email_service.rb"))

      if base_service_content.include?("from_name:")
        puts "   ✅ BaseEmailService accepts from_name parameter"
      else
        warnings << "BaseEmailService may not support organization branding"
      end

      email_sender_content = File.read(Rails.root.join("app/services/email_sender_service.rb"))

      if email_sender_content.include?("organization.name")
        puts "   ✅ EmailSenderService uses organization.name"
      else
        warnings << "EmailSenderService may not use organization branding"
      end
    rescue => e
      warnings << "Failed to verify organization branding: #{e.message}"
    end
    puts ""

    # Summary
    puts "="*80
    puts "📊 VERIFICATION SUMMARY"
    puts "="*80
    puts ""

    if errors.empty? && warnings.empty?
      puts "✅ ALL CHECKS PASSED!"
      puts ""
      puts "🚀 System is ready for production deployment"
      puts ""
      puts "Next steps:"
      puts "  1. Test in staging with real event creation"
      puts "  2. Send test invitation reminders"
      puts "  3. Verify emails arrive with correct sender name"
      puts "  4. Check recipient counts in UI"
      puts "  5. Deploy to production"
    else
      if errors.any?
        puts "❌ ERRORS FOUND (#{errors.count}):"
        errors.each_with_index do |error, i|
          puts "   #{i + 1}. #{error}"
        end
        puts ""
      end

      if warnings.any?
        puts "⚠️  WARNINGS (#{warnings.count}):"
        warnings.each_with_index do |warning, i|
          puts "   #{i + 1}. #{warning}"
        end
        puts ""
      end

      if errors.any?
        puts "❌ DO NOT DEPLOY TO PRODUCTION"
        puts "   Fix errors above first"
      else
        puts "⚠️  Review warnings before deploying"
      end
    end

    puts ""
    puts "="*80
    puts ""
  end
end
