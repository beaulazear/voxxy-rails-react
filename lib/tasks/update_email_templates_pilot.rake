# Rake task to update email templates for pilot launch
# This task:
# 1. Adds two new email templates to the default campaign
# 2. Updates footers on all existing templates
#
# Usage: rails update_email_templates:pilot

namespace :update_email_templates do
  desc "Update email templates for pilot launch"
  task pilot: :environment do
    puts "\n========================================="
    puts "UPDATING EMAIL TEMPLATES FOR PILOT LAUNCH"
    puts "=========================================\n"

    # Find the default system template
    default_template = EmailCampaignTemplate.find_by(template_type: "system", is_default: true)

    unless default_template
      puts "❌ ERROR: Default system template not found!"
      puts "Please run 'rails db:seed' first to create the default template."
      exit 1
    end

    puts "✓ Found default template: #{default_template.name} (ID: #{default_template.id})\n"

    # New footer for all emails
    new_footer = <<~HTML
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

      <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

      <p style="font-size: 12px; color: #888888;">
        <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>

      <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
    HTML

    # =========================================================================
    # STEP 1: Check if new templates already exist
    # =========================================================================
    puts "Checking for existing templates..."

    initial_invitation = default_template.email_template_items.find_by(
      trigger_type: "on_application_open",
      name: "Initial Invitation"
    )

    application_received = default_template.email_template_items.find_by(
      trigger_type: "on_application_submit",
      name: "Application Received"
    )

    if initial_invitation && application_received
      puts "✓ New templates already exist. Skipping creation."
      puts "  - Initial Invitation (ID: #{initial_invitation.id})"
      puts "  - Application Received (ID: #{application_received.id})"
    else
      puts "Creating new email templates...\n"

      # =========================================================================
      # STEP 2: Shift existing email positions to make room
      # =========================================================================
      puts "Shifting existing email positions..."

      # Get all existing emails ordered by position
      existing_emails = default_template.email_template_items.order(:position)

      # Shift all positions by 2 to make room at positions 1 and 2
      existing_emails.each do |email|
        new_position = email.position + 2
        email.update_column(:position, new_position)
        puts "  - Moved '#{email.name}' from position #{email.position - 2} to #{new_position}"
      end

      # =========================================================================
      # STEP 3: Create EMAIL #1 - Initial Invitation
      # =========================================================================
      puts "\nCreating EMAIL #1: Initial Invitation..."

      EmailTemplateItem.create!(
        email_campaign_template: default_template,
        name: "Initial Invitation",
        position: 1,
        category: "event_announcements",
        subject_template: "Submissions Open for [eventName]",
        body_template: <<~HTML,
          <p>Hi [firstName],</p>

          <p>We're pumped to announce that submissions are officially open for <strong>[eventName]</strong> at <strong>[eventVenue]</strong> on <strong>[eventDate]</strong>.</p>

          <p>Submit your work here:<br/>
          <a href="[invitationLink]" style="color: #0066cc; text-decoration: underline;">[invitationLink]</a></p>

          <p><strong>[eventName]</strong> is calling for the following categories:</p>

          <p>[categoryList]</p>

          <p>I'm looking forward to your submission.</p>

          <p>Thanks,<br/>
          [organizationName]</p>

          #{new_footer}
        HTML
        trigger_type: "on_application_open",
        trigger_value: 0,
        trigger_time: "09:00",
        filter_criteria: {},
        enabled_by_default: true
      )

      puts "  ✓ Created 'Initial Invitation' at position 1"

      # =========================================================================
      # STEP 4: Create EMAIL #2 - Application Received
      # =========================================================================
      puts "\nCreating EMAIL #2: Application Received..."

      EmailTemplateItem.create!(
        email_campaign_template: default_template,
        name: "Application Received",
        position: 2,
        category: "application_updates",
        subject_template: "Application Received - [eventName]",
        body_template: <<~HTML,
          <p>Hi [firstName],</p>

          <p>Thanks for submitting your application to participate in <strong>[eventName]</strong> at <strong>[eventVenue]</strong> on <strong>[eventDate]</strong>.</p>

          <p><strong>IMPORTANT:</strong> This is NOT an acceptance email. Please allow up to 10 days for us to review your submission. You will receive another email with further details if you're selected.</p>

          <p>In the meantime, check us out on Instagram (@pancakesandbooze) and see our "FAQs" Story Highlights for details on how our events work.</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

          <p><strong>PRICING & PAYMENT</strong></p>

          <p><strong>Booth/Space Fee:</strong> [boothPrice]</p>

          <p>We now cover all ticketing and processing fees—the price you see is exactly what you pay at checkout.</p>

          <p><strong>Note:</strong> If fees are paid after [paymentDueDate], rates may increase. Payment is required to reserve your space.</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

          <p><strong>EVENT DETAILS</strong></p>

          <p><strong>INSTALLATION:</strong> Currently scheduled for [installDate] from [installTime]</p>

          <p><strong>AGE POLICY:</strong> The venue enforces a strict [ageRestriction] age policy</p>

          <p><strong>CATEGORY:</strong> You applied as [vendorCategory]</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

          <p><strong>IMPORTANT GUIDELINES</strong></p>

          <p>Please review these requirements for your category:</p>

          <p>• <strong>SIZE & SPACE:</strong> Check your vendor portal for specific dimensions<br/>
          • <strong>EQUIPMENT:</strong> Confirm what you need to bring vs what's provided<br/>
          • <strong>LOAD OUT:</strong> All items must be removed at end of event<br/>
          • <strong>NO COMMISSION:</strong> You keep 100% of your sales</p>

          <p>For complete event information, category-specific rules, and updates, visit your vendor portal:<br/>
          <a href="[dashboardLink]" style="color: #0066cc; text-decoration: underline;">[dashboardLink]</a></p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

          <p>Thanks,<br/>
          [organizationName]</p>

          #{new_footer}
        HTML
        trigger_type: "on_application_submit",
        trigger_value: 0,
        trigger_time: "00:00",  # Sent immediately
        filter_criteria: {},
        enabled_by_default: true
      )

      puts "  ✓ Created 'Application Received' at position 2"
    end

    # =========================================================================
    # STEP 5: Update footers on all existing emails
    # =========================================================================
    puts "\nUpdating footers on all scheduled email templates..."

    # Old footer pattern to search for
    old_footer_pattern = /<hr style="border: none; border-top: 1px solid #e0e0e0;.*?<p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents<\/p>/m

    updated_count = 0
    default_template.email_template_items.each do |email|
      if email.body_template.match?(old_footer_pattern)
        # Replace old footer with new footer
        new_body = email.body_template.gsub(old_footer_pattern, new_footer.strip)
        email.update_column(:body_template, new_body)
        updated_count += 1
        puts "  ✓ Updated footer for '#{email.name}'"
      end
    end

    puts "\n✓ Updated #{updated_count} email template footers"

    # =========================================================================
    # SUMMARY
    # =========================================================================
    puts "\n========================================="
    puts "SUMMARY"
    puts "=========================================\n"

    total_emails = default_template.email_template_items.count
    puts "Total email templates in default campaign: #{total_emails}"
    puts "\nEmail list:"
    default_template.email_template_items.order(:position).each do |email|
      puts "  #{email.position}. #{email.name} (#{email.trigger_type})"
    end

    puts "\n✅ Email template update complete!"
    puts "\nNext steps:"
    puts "  1. Review the updated templates in the admin panel"
    puts "  2. Test the new variables with sample data"
    puts "  3. Update EventInvitationMailer and RegistrationEmailService footers"
    puts "\n"
  end
end
