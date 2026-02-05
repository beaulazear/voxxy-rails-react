# Rake task to update email templates for pilot launch
# This task:
# 1. Removes redundant "Initial Invitation" template (handled by EventInvitationMailer)
# 2. Adds "Application Received" template
# 3. Updates footers on all existing templates
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
    # STEP 1: Remove redundant "Initial Invitation" template if it exists
    # =========================================================================
    puts "Checking for redundant 'Initial Invitation' template..."

    initial_invitation = default_template.email_template_items.find_by(
      trigger_type: "on_application_open",
      name: "Initial Invitation"
    )

    if initial_invitation
      puts "  Found redundant 'Initial Invitation' template (ID: #{initial_invitation.id})"
      puts "  This is redundant because invitations are sent immediately via EventInvitationMailer"
      puts "  Removing..."

      initial_invitation.destroy

      # Reorder remaining positions
      default_template.email_template_items.where("position > ?", initial_invitation.position).order(:position).each do |email|
        new_position = email.position - 1
        email.update_column(:position, new_position)
      end

      puts "  ✓ Removed 'Initial Invitation' and reordered positions"
    else
      puts "  ✓ No redundant 'Initial Invitation' template found"
    end

    # =========================================================================
    # STEP 2: Check if Application Received template already exists
    # =========================================================================
    puts "\nChecking for 'Application Received' template..."

    application_received = default_template.email_template_items.find_by(
      trigger_type: "on_application_submit",
      name: "Application Received"
    )

    if application_received
      puts "  ✓ 'Application Received' template already exists (ID: #{application_received.id})"
    else
      puts "  Creating 'Application Received' template..."

      # Shift existing emails to make room at position 1
      existing_emails = default_template.email_template_items.order(:position)
      existing_emails.each do |email|
        new_position = email.position + 1
        email.update_column(:position, new_position)
      end

      # =========================================================================
      # STEP 3: Create Application Received template
      # =========================================================================

      EmailTemplateItem.create!(
        email_campaign_template: default_template,
        name: "Application Received",
        position: 1,
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

      puts "  ✓ Created 'Application Received' at position 1"
    end

    # =========================================================================
    # STEP 4: Update footers on all existing emails
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
    puts "\nNote: The 'Initial Invitation' scheduled email was removed because"
    puts "      invitations are sent immediately via EventInvitationMailer, not scheduled."
    puts "\nNext steps:"
    puts "  1. Create a new event to test the updated templates"
    puts "  2. Verify invitation email shows in Email Automation tab"
    puts "  3. Test the new email variables with real data"
    puts "\n"
  end
end
