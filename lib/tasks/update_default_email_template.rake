namespace :email_templates do
  desc "Update the default system email template content"
  task update_default: :environment do
    puts "🔍 Finding default system email template..."

    template = EmailCampaignTemplate.find_by(
      template_type: "system",
      is_default: true
    )

    unless template
      puts "❌ Default system template not found. Run db:seed first."
      exit 1
    end

    puts "✅ Found template: #{template.name} (ID: #{template.id})"
    puts "   Current email count: #{template.email_count}"

    # Update individual email items
    updated_count = 0

    # ==============================================================
    # EMAIL 1: 1 Day Before Application Deadline
    # ==============================================================
    email = template.email_template_items.find_by(position: 1)
    if email
      email.update!(
        subject_template: "Last Chance: [eventName] Applications Close Tomorrow",
        body_template: <<~HTML
          <p>Hi [greetingName],</p>

          <p>This is a final reminder that applications for <strong>[eventName]</strong> close tomorrow on [applicationDeadline].</p>

          <p><strong>Date:</strong> [eventDate]<br/>
          <strong>Location:</strong> [eventVenue], [eventLocation]<br/>
          <strong>Application Deadline:</strong> [applicationDeadline]</p>

          <p>View all vendor application options, pricing, and details:<br/>
          <a href="[eventLink]" style="color: #0066cc; text-decoration: underline;">[eventLink]</a></p>

          <p>Apply now before tomorrow's deadline!</p>

          <p>Best regards,<br/>
          [organizationName]</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

          <p style="font-size: 12px; color: #888888;">Please do not reply to this email. For questions, contact <a href="mailto:[organizationEmail]" style="color: #888888;">[organizationEmail]</a></p>

          <p style="font-size: 12px; color: #888888;">
            <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
          </p>

          <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
        HTML
      )
      updated_count += 1
      puts "   ✓ Updated: #{email.name}"
    end

    # ==============================================================
    # EMAIL 2: Application Deadline Day
    # ==============================================================
    email = template.email_template_items.find_by(position: 2)
    if email
      email.update!(
        subject_template: "URGENT: [eventName] Applications Close Today",
        body_template: <<~HTML
          <p>Hi [greetingName],</p>

          <p>Today is the final day to apply for <strong>[eventName]</strong>. Applications close at midnight tonight.</p>

          <p><strong>Event Date:</strong> [eventDate]<br/>
          <strong>Location:</strong> [eventVenue]<br/>
          <strong>Deadline:</strong> Today, [applicationDeadline]</p>

          <p>Last chance! View application options and apply now:<br/>
          <a href="[eventLink]" style="color: #0066cc; text-decoration: underline;">[eventLink]</a></p>

          <p>This is your last chance.</p>

          <p>Thanks,<br/>
          [organizationName]</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

          <p style="font-size: 12px; color: #888888;">Please do not reply to this email. For questions, contact <a href="mailto:[organizationEmail]" style="color: #888888;">[organizationEmail]</a></p>

          <p style="font-size: 12px; color: #888888;">
            <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
          </p>

          <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
        HTML
      )
      updated_count += 1
      puts "   ✓ Updated: #{email.name}"
    end

    # ==============================================================
    # EMAIL 3: 1 Day Before Payment Due
    # ==============================================================
    email = template.email_template_items.find_by(position: 3)
    if email
      email.update!(
        subject_template: "Reminder: Payment Due Tomorrow - [eventName]",
        body_template: <<~HTML
          <p>Hi [greetingName],</p>

          <p>This is a reminder that your payment for <strong>[eventName]</strong> is due tomorrow on [paymentDueDate].</p>

          <p><strong>Payment Due Date:</strong> [paymentDueDate]<br/>
          <strong>Event Date:</strong> [eventDate]<br/>
          <strong>Category:</strong> [vendorCategory]</p>

          <p>View your payment details and submit payment on your vendor dashboard:<br/>
          <a href="[dashboardLink]" style="color: #0066cc; text-decoration: underline;">[dashboardLink]</a></p>

          <p>If you have already submitted payment, please disregard this message.</p>

          <p>Thank you,<br/>
          [organizationName]</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

          <p style="font-size: 12px; color: #888888;">Please do not reply to this email. For questions, contact <a href="mailto:[organizationEmail]" style="color: #888888;">[organizationEmail]</a></p>

          <p style="font-size: 12px; color: #888888;">
            <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
          </p>

          <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
        HTML
      )
      updated_count += 1
      puts "   ✓ Updated: #{email.name}"
    end

    # ==============================================================
    # EMAIL 4: Payment Due Today
    # ==============================================================
    email = template.email_template_items.find_by(position: 4)
    if email
      email.update!(
        subject_template: "URGENT: Payment Due Today - [eventName]",
        body_template: <<~HTML
          <p>Hi [greetingName],</p>

          <p>Your payment for <strong>[eventName]</strong> is due today.</p>

          <p><strong>Due Date:</strong> Today, [paymentDueDate]<br/>
          <strong>Event Date:</strong> [eventDate]<br/>
          <strong>Category:</strong> [vendorCategory]</p>

          <p>Payment due today! View your details and submit payment:<br/>
          <a href="[dashboardLink]" style="color: #0066cc; text-decoration: underline;">[dashboardLink]</a></p>

          <p>If payment is not received by midnight tonight, your spot may be moved to the waitlist.</p>

          <p>Questions? Contact us at <a href="mailto:[organizationEmail]" style="color: #0066cc; text-decoration: underline;">[organizationEmail]</a></p>

          <p>Thank you,<br/>
          [organizationName]</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

          <p style="font-size: 12px; color: #888888;">Please do not reply to this email. For questions, contact <a href="mailto:[organizationEmail]" style="color: #888888;">[organizationEmail]</a></p>

          <p style="font-size: 12px; color: #888888;">
            <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
          </p>

          <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
        HTML
      )
      updated_count += 1
      puts "   ✓ Updated: #{email.name}"
    end

    # ==============================================================
    # EMAIL 5: 1 Day Before Event
    # ==============================================================
    email = template.email_template_items.find_by(position: 5)
    if email
      email.update!(
        subject_template: "Tomorrow: [eventName] Final Details",
        body_template: <<~HTML
          <p>Hi [greetingName],</p>

          <p><strong>[eventName]</strong> is tomorrow. Here are the final details you need:</p>

          <p><strong>Event Information:</strong><br/>
          <strong>Date:</strong> [eventDate]<br/>
          <strong>Time:</strong> [eventTime]<br/>
          <strong>Venue:</strong> [eventVenue]<br/>
          <strong>Location:</strong> [eventLocation]</p>

          <p>View your setup schedule and complete event details on your dashboard:<br/>
          <a href="[dashboardLink]" style="color: #0066cc; text-decoration: underline;">[dashboardLink]</a></p>

          <p><strong>Important Reminders:</strong><br/>
          - Arrive during your scheduled setup time<br/>
          - Bring all necessary equipment and supplies<br/>
          - Review any vendor guidelines on the event page</p>

          <p>We look forward to seeing you tomorrow.</p>

          <p>Best regards,<br/>
          [organizationName]</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

          <p style="font-size: 12px; color: #888888;">Please do not reply to this email. For questions, contact <a href="mailto:[organizationEmail]" style="color: #888888;">[organizationEmail]</a></p>

          <p style="font-size: 12px; color: #888888;">
            <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
          </p>

          <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
        HTML
      )
      updated_count += 1
      puts "   ✓ Updated: #{email.name}"
    end

    # ==============================================================
    # EMAIL 6: Day of Event
    # ==============================================================
    email = template.email_template_items.find_by(position: 6)
    if email
      email.update!(
        subject_template: "Today: [eventName]",
        body_template: <<~HTML
          <p>Hi [greetingName],</p>

          <p>Today is the day. <strong>[eventName]</strong> is happening today.</p>

          <p><strong>Event Details:</strong><br/>
          <strong>Time:</strong> [eventTime]<br/>
          <strong>Venue:</strong> [eventVenue]<br/>
          <strong>Location:</strong> [eventLocation]</p>

          <p>View your setup time and event details:<br/>
          <a href="[dashboardLink]" style="color: #0066cc; text-decoration: underline;">[dashboardLink]</a></p>

          <p><strong>Reminders:</strong><br/>
          - Arrive on time for setup<br/>
          - Check in at the vendor desk<br/>
          - Follow all venue guidelines<br/>
          - Have a successful event</p>

          <p>See you there.</p>

          <p>Best regards,<br/>
          [organizationName]</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

          <p style="font-size: 12px; color: #888888;">Please do not reply to this email. For questions, contact <a href="mailto:[organizationEmail]" style="color: #888888;">[organizationEmail]</a></p>

          <p style="font-size: 12px; color: #888888;">
            <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
          </p>

          <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
        HTML
      )
      updated_count += 1
      puts "   ✓ Updated: #{email.name}"
    end

    # ==============================================================
    # EMAIL 7: Day After Event - Thank You
    # ==============================================================
    email = template.email_template_items.find_by(position: 7)
    if email
      email.update!(
        subject_template: "Thank You for Participating in [eventName]",
        body_template: <<~HTML
          <p>Hi [greetingName],</p>

          <p>Thank you for participating in <strong>[eventName]</strong>. We appreciate your contribution to making this event a success.</p>

          <p>We hope the event met your expectations and provided value for your business.</p>

          <p>If you have any feedback about the event, please share it with us. We are always looking to improve.</p>

          <p>We look forward to working with you again at future events.</p>

          <p>Best regards,<br/>
          [organizationName]</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

          <p style="font-size: 12px; color: #888888;">Please do not reply to this email. For questions, contact <a href="mailto:[organizationEmail]" style="color: #888888;">[organizationEmail]</a></p>

          <p style="font-size: 12px; color: #888888;">
            <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
          </p>

          <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
        HTML
      )
      updated_count += 1
      puts "   ✓ Updated: #{email.name}"
    end

    puts "\n✅ Successfully updated #{updated_count} email templates"
    puts "\n📝 Note: This only updates the SYSTEM template. Users with custom templates are unaffected."
    puts "   Existing scheduled emails keep their current copy (they're independent records)."
    puts "   New events created after this update will use the new copy."
  end
end
