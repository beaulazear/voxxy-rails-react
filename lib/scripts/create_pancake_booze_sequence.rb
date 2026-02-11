# Create Pancake & Booze Email Campaign Template
# This script creates a custom email sequence specifically for Pancake & Booze organization
# with 33 category-specific emails (Artists vs Vendors)
#
# Usage:
#   rails runner lib/scripts/create_pancake_booze_sequence.rb
#
# This creates a template that can be selected when creating new events

puts "\n🎨 Creating Pancake & Booze Email Campaign Template...\n"

# Find Pancake & Booze organization (or create for testing)
organization = Organization.find_by(name: "Pancake & Booze")
unless organization
  puts "⚠️  Pancake & Booze organization not found. Creating test organization..."
  # For now, we'll create a system template that can be assigned to P&B later
  organization = nil
end

# Check if template already exists
existing_template = EmailCampaignTemplate.find_by(name: 'Pancake & Booze Event Campaign')

if existing_template
  puts "Template already exists (ID: #{existing_template.id})"
  puts "Deleting existing template to recreate with latest content..."
  existing_template.destroy
end

# Create the Pancake & Booze template
# Using template_type: 'system' so it's available globally
# organization_id: nil means it's a system template
puts "\n1. Creating Pancake & Booze Email Campaign Template..."
template = EmailCampaignTemplate.create!(
  template_type: 'system',
  name: 'Pancake & Booze Event Campaign',
  description: 'Custom email campaign for Pancake & Booze events with 33 category-specific automated emails covering invitations, applications, payments, and event countdown',
  is_default: false,  # Not the default - must be explicitly selected
  organization_id: organization&.id  # nil for system template, or specific org ID
)
puts "   ✓ Created: #{template.name} (ID: #{template.id})"

# Helper to create email template items
def create_email(template, attrs)
  EmailTemplateItem.create!(
    email_campaign_template: template,
    **attrs
  )
end

puts "\n2. Adding Email Templates...\n"

# ==============================================================================
# SECTION 1: EVENT ANNOUNCEMENTS (8 emails - 4 announcements × 2 categories)
# ==============================================================================

puts "   📢 Event Announcements (8 emails)..."

# Announcement 1: 10 weeks out - ARTISTS
create_email(template, {
  name: 'Event Announcement - 10 Weeks Out (Artists)',
  position: 1,
  category: 'Artists',
  subject_template: 'Pancake and Booze Art Show is Coming to [eventCity] on [date]',
  body_template: <<~HTML,
    <p>Hey [greetingName],</p>

    <p>Pancake and Booze Art Show is coming to [eventCity] on [date] at [venue]!</p>

    <p>We are currently opening up submissions for visual artists to participate in this show.</p>

    <p>We hang artwork from over 150 local artists and this year we are looking for even more amazing talent.</p>

    <p>If you are interested in participating, please submit your work here: [eventLink]</p>

    <p>Looking forward to your submission!</p>

    <p>Thanks,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 70,
  trigger_time: '10:00',
  filter_criteria: {},
  enabled_by_default: true
})

# Announcement 1: 10 weeks out - VENDORS
create_email(template, {
  name: 'Event Announcement - 10 Weeks Out (Vendors)',
  position: 2,
  category: 'Vendors',
  subject_template: 'Pancake and Booze Art Show is Coming to [eventCity] on [date]',
  body_template: <<~HTML,
    <p>Hey [greetingName],</p>

    <p>Pancake and Booze Art Show is coming to [eventCity] on [date] at [venue]!</p>

    <p>We are currently opening up submissions for vendors to participate in this show.</p>

    <p>We feature merchandise from over 50 local vendors and this year we are looking for even more amazing talent.</p>

    <p>If you are interested in participating, please submit your work here: [eventLink]</p>

    <p>Looking forward to your submission!</p>

    <p>Thanks,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 70,
  trigger_time: '10:00',
  filter_criteria: {},
  enabled_by_default: true
})

# Announcement 2: 8 weeks out - ARTISTS
create_email(template, {
  name: 'Event Announcement - 8 Weeks Out (Artists)',
  position: 3,
  category: 'Artists',
  subject_template: 'Artist Submissions for Pancake and Booze in [eventCity]',
  body_template: <<~HTML,
    <p>Hey [greetingName],</p>

    <p>Just a reminder that artist submissions are still open for Pancake and Booze in [eventCity]!</p>

    <p><strong>Event Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Location:</strong> [eventCity]</p>

    <p>We're looking for paintings, photography, mixed media, sculptures, and more from talented local artists.</p>

    <p>Submit your work here: [eventLink]</p>

    <p>Don't miss out on this opportunity to showcase your art!</p>

    <p>Thanks,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 56,
  trigger_time: '10:00',
  filter_criteria: {},
  enabled_by_default: true
})

# Announcement 2: 8 weeks out - VENDORS
create_email(template, {
  name: 'Event Announcement - 8 Weeks Out (Vendors)',
  position: 4,
  category: 'Vendors',
  subject_template: 'Vendor Submissions for Pancake and Booze in [eventCity]',
  body_template: <<~HTML,
    <p>Hey [greetingName],</p>

    <p>Just a reminder that vendor submissions are still open for Pancake and Booze in [eventCity]!</p>

    <p><strong>Event Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Location:</strong> [eventCity]</p>

    <p>We're looking for clothing, jewelry, handcrafted goods, and small merch from talented local vendors.</p>

    <p>Submit your application here: [eventLink]</p>

    <p>Don't miss out on this opportunity to showcase your products!</p>

    <p>Thanks,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 56,
  trigger_time: '10:00',
  filter_criteria: {},
  enabled_by_default: true
})

# Announcement 3: 4 weeks out - ARTISTS
create_email(template, {
  name: 'Event Announcement - 4 Weeks Out (Artists)',
  position: 5,
  category: 'Artists',
  subject_template: 'Final Call for Artist Submissions - Pancake & Booze [eventCity]',
  body_template: <<~HTML,
    <p>Hey [greetingName],</p>

    <p>Final call! Artist submissions for Pancake and Booze in [eventCity] are closing soon.</p>

    <p><strong>Event Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]</p>

    <p>This is your last chance to be part of one of the most exciting art shows in [eventCity]!</p>

    <p>Submit now: [eventLink]</p>

    <p>Thanks,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 28,
  trigger_time: '10:00',
  filter_criteria: {},
  enabled_by_default: true
})

# Announcement 3: 4 weeks out - VENDORS
create_email(template, {
  name: 'Event Announcement - 4 Weeks Out (Vendors)',
  position: 6,
  category: 'Vendors',
  subject_template: 'Final Call for Vendor Submissions - Pancake & Booze [eventCity]',
  body_template: <<~HTML,
    <p>Hey [greetingName],</p>

    <p>Final call! Vendor submissions for Pancake and Booze in [eventCity] are closing soon.</p>

    <p><strong>Event Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]</p>

    <p>This is your last chance to be part of one of the most exciting events in [eventCity]!</p>

    <p>Submit now: [eventLink]</p>

    <p>Thanks,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 28,
  trigger_time: '10:00',
  filter_criteria: {},
  enabled_by_default: true
})

# Announcement 4: 12 days out - ARTISTS
create_email(template, {
  name: 'Event Announcement - 12 Days Out (Artists)',
  position: 7,
  category: 'Artists',
  subject_template: 'Pancake & Booze [eventCity] - 12 Days Away!',
  body_template: <<~HTML,
    <p>Hey [greetingName],</p>

    <p>Pancake and Booze in [eventCity] is just 12 days away!</p>

    <p><strong>Event Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Location:</strong> [address]</p>

    <p>Get ready for an amazing show featuring art from over 150 local artists!</p>

    <p>If you haven't submitted yet, there's still time: [eventLink]</p>

    <p>See you soon!</p>

    <p>Thanks,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 12,
  trigger_time: '10:00',
  filter_criteria: {},
  enabled_by_default: true
})

# Announcement 4: 12 days out - VENDORS
create_email(template, {
  name: 'Event Announcement - 12 Days Out (Vendors)',
  position: 8,
  category: 'Vendors',
  subject_template: 'Pancake & Booze [eventCity] - 12 Days Away!',
  body_template: <<~HTML,
    <p>Hey [greetingName],</p>

    <p>Pancake and Booze in [eventCity] is just 12 days away!</p>

    <p><strong>Event Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Location:</strong> [address]</p>

    <p>Get ready for an amazing show featuring merchandise from over 50 local vendors!</p>

    <p>If you haven't submitted yet, there's still time: [eventLink]</p>

    <p>See you soon!</p>

    <p>Thanks,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 12,
  trigger_time: '10:00',
  filter_criteria: {},
  enabled_by_default: true
})

puts "      ✓ Added 8 announcement emails"

# ==============================================================================
# SECTION 2: APPLICATION WORKFLOW (4 emails - 2 per category)
# ==============================================================================

puts "   📝 Application Workflow (4 emails)..."

# Application Received - ARTISTS
create_email(template, {
  name: 'Application Received (Artists)',
  position: 9,
  category: 'Artists',
  subject_template: 'Thank You For Your Submission!',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Thank you for your submission to be apart of the upcoming Pancake and Booze Show in [eventCity]!</p>

    <p>Your artist profile has been received and our team is reviewing all submissions.</p>

    <p>You will receive an email letting you know if your work has been accepted into the show within the next few days.</p>

    <p>We appreciate your patience!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'on_application_submit',
  trigger_value: 0,
  trigger_time: '09:00',
  filter_criteria: {},
  enabled_by_default: true
})

# Application Received - VENDORS
create_email(template, {
  name: 'Application Received (Vendors)',
  position: 10,
  category: 'Vendors',
  subject_template: 'Thank You For Your Submission!',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Thank you for your submission to be apart of the upcoming Pancake and Booze Show in [eventCity]!</p>

    <p>Your vendor profile has been received and our team is reviewing all submissions.</p>

    <p>You will receive an email letting you know if your application has been accepted into the show within the next few days.</p>

    <p>We appreciate your patience!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'on_application_submit',
  trigger_value: 0,
  trigger_time: '09:00',
  filter_criteria: {},
  enabled_by_default: true
})

# Application Accepted - ARTISTS
create_email(template, {
  name: 'Application Accepted (Artists)',
  position: 11,
  category: 'Artists',
  subject_template: 'You\'re In! Pancake and Booze Art Show - [eventCity]',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Congratulations! Your work has been accepted into the Pancake and Booze Art Show in [eventCity] on [date]!</p>

    <p><strong>Event Details:</strong><br/>
    <strong>Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Address:</strong> [address]<br/>
    <strong>Age Restriction:</strong> [ageRestriction]+</p>

    <p><strong>Artist Details:</strong><br/>
    <strong>Fee:</strong> [boothPrice]<br/>
    <strong>Install Date:</strong> [installDate]<br/>
    <strong>Install Time:</strong> [installTime]</p>

    <p><strong>Next Steps:</strong><br/>
    1. Complete payment using this link: [categoryPaymentLink]<br/>
    2. Payment deadline: [paymentDueDate]<br/>
    3. Install your artwork on [installDate] between [installTime]<br/>
    4. Artwork must be ready to hang (wire, hooks, or hanging hardware)<br/>
    5. Pick up your artwork after the show</p>

    <p>We're excited to have you as part of the show!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'on_approval',
  trigger_value: 0,
  trigger_time: '09:00',
  filter_criteria: { statuses: ['approved'] },
  enabled_by_default: true
})

# Application Accepted - VENDORS
create_email(template, {
  name: 'Application Accepted (Vendors)',
  position: 12,
  category: 'Vendors',
  subject_template: 'You\'re In! Pancake and Booze Art Show - [eventCity]',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Congratulations! Your application has been accepted for the Pancake and Booze Art Show in [eventCity] on [date]!</p>

    <p><strong>Event Details:</strong><br/>
    <strong>Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Address:</strong> [address]<br/>
    <strong>Age Restriction:</strong> [ageRestriction]+</p>

    <p><strong>Vendor Details:</strong><br/>
    <strong>Fee:</strong> [boothPrice]<br/>
    <strong>Install Date:</strong> [installDate]<br/>
    <strong>Install Time:</strong> [installTime]</p>

    <p><strong>Next Steps:</strong><br/>
    1. Complete payment using this link: [categoryPaymentLink]<br/>
    2. Payment deadline: [paymentDueDate]<br/>
    3. Set up your table on [installDate] between [installTime]<br/>
    4. Bring your own table covering and display materials<br/>
    5. Be ready to sell from [eventTime]</p>

    <p>We're excited to have you as part of the show!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'on_approval',
  trigger_value: 0,
  trigger_time: '09:00',
  filter_criteria: { statuses: ['approved'] },
  enabled_by_default: true
})

puts "      ✓ Added 4 application workflow emails"

# ==============================================================================
# SECTION 3: PAYMENT REMINDERS - ARTISTS (6 emails)
# ==============================================================================

puts "   💳 Payment Reminders - Artists (6 emails)..."

artist_payment_days = [39, 26, 16, 8, 4, 1]
artist_payment_days.each_with_index do |days, index|
  urgency = days <= 4 ? 'URGENT: ' : ''
  create_email(template, {
    name: "Payment Reminder - #{days} Days (Artists)",
    position: 13 + index,
    category: 'Artists',
    subject_template: "#{urgency}Payment Due in #{days} Days - Pancake & Booze [eventCity]",
    body_template: <<~HTML,
      <p>Hello [greetingName],</p>

      <p>This is a reminder that your payment for the Pancake and Booze Art Show in [eventCity] is due in #{days} days.</p>

      <p><strong>Event Date:</strong> [date]<br/>
      <strong>Payment Due:</strong> [paymentDueDate]<br/>
      <strong>Amount:</strong> [boothPrice]</p>

      <p>Please complete your payment here: [categoryPaymentLink]</p>

      <p>If you have already submitted payment, please disregard this message.</p>

      <p>Thank you!</p>

      <p>Best,<br/>
      Pancake & Booze</p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

      <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

      <p style="font-size: 12px; color: #888888;">
        <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>

      <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
    HTML
    trigger_type: 'days_before_payment_deadline',
    trigger_value: days,
    trigger_time: '10:00',
    filter_criteria: {
      statuses: ['approved'],
      payment_status: ['pending', 'overdue']
    },
    enabled_by_default: true
  })
end

puts "      ✓ Added 6 artist payment reminder emails"

# ==============================================================================
# SECTION 4: PAYMENT REMINDERS - VENDORS (4 emails)
# ==============================================================================

puts "   💳 Payment Reminders - Vendors (4 emails)..."

vendor_payment_days = [29, 15, 9, 3]
vendor_payment_days.each_with_index do |days, index|
  urgency = days <= 9 ? 'URGENT: ' : ''
  create_email(template, {
    name: "Payment Reminder - #{days} Days (Vendors)",
    position: 19 + index,
    category: 'Vendors',
    subject_template: "#{urgency}Payment Due in #{days} Days - Pancake & Booze [eventCity]",
    body_template: <<~HTML,
      <p>Hello [greetingName],</p>

      <p>This is a reminder that your payment for the Pancake and Booze Art Show in [eventCity] is due in #{days} days.</p>

      <p><strong>Event Date:</strong> [date]<br/>
      <strong>Payment Due:</strong> [paymentDueDate]<br/>
      <strong>Amount:</strong> [boothPrice]</p>

      <p>Please complete your payment here: [categoryPaymentLink]</p>

      <p>If you have already submitted payment, please disregard this message.</p>

      <p>Thank you!</p>

      <p>Best,<br/>
      Pancake & Booze</p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

      <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

      <p style="font-size: 12px; color: #888888;">
        <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>

      <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
    HTML
    trigger_type: 'days_before_payment_deadline',
    trigger_value: days,
    trigger_time: '10:00',
    filter_criteria: {
      statuses: ['approved'],
      payment_status: ['pending', 'overdue']
    },
    enabled_by_default: true
  })
end

puts "      ✓ Added 4 vendor payment reminder emails"

# ==============================================================================
# SECTION 5: PAYMENT CONFIRMATION (2 emails - 1 per category)
# ==============================================================================

puts "   ✅ Payment Confirmation (2 emails)..."

# Payment Confirmation - ARTISTS
create_email(template, {
  name: 'Payment Confirmation (Artists)',
  position: 23,
  category: 'Artists',
  subject_template: 'Payment Received - Pancake & Booze [eventCity]',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Great news! We have received your payment for the Pancake and Booze Art Show in [eventCity].</p>

    <p><strong>Event Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Install Date:</strong> [installDate]<br/>
    <strong>Install Time:</strong> [installTime]</p>

    <p>You're all set! We'll send you additional details and reminders as we get closer to the event.</p>

    <p>Looking forward to seeing your artwork!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'on_payment_deadline',
  trigger_value: -1,  # -1 means "after" payment deadline (triggered when payment received)
  trigger_time: '09:00',
  filter_criteria: {
    statuses: ['approved', 'confirmed'],
    payment_status: ['paid']
  },
  enabled_by_default: true
})

# Payment Confirmation - VENDORS
create_email(template, {
  name: 'Payment Confirmation (Vendors)',
  position: 24,
  category: 'Vendors',
  subject_template: 'Payment Received - Pancake & Booze [eventCity]',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Great news! We have received your payment for the Pancake and Booze Art Show in [eventCity].</p>

    <p><strong>Event Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Install Date:</strong> [installDate]<br/>
    <strong>Install Time:</strong> [installTime]</p>

    <p>You're all set! We'll send you additional details and reminders as we get closer to the event.</p>

    <p>Looking forward to seeing your products!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'on_payment_deadline',
  trigger_value: -1,  # -1 means "after" payment deadline (triggered when payment received)
  trigger_time: '09:00',
  filter_criteria: {
    statuses: ['approved', 'confirmed'],
    payment_status: ['paid']
  },
  enabled_by_default: true
})

puts "      ✓ Added 2 payment confirmation emails"

# ==============================================================================
# SECTION 6: EVENT COUNTDOWN - ARTISTS (4 emails)
# ==============================================================================

puts "   ⏰ Event Countdown - Artists (4 emails)..."

# 17 days before
create_email(template, {
  name: 'Event Countdown - 17 Days (Artists)',
  position: 25,
  category: 'Artists',
  subject_template: '17 Days Until Pancake & Booze in [eventCity]!',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>The Pancake and Booze Art Show in [eventCity] is just 17 days away!</p>

    <p><strong>Event Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Address:</strong> [address]</p>

    <p><strong>Important Reminders:</strong><br/>
    - Install your artwork on [installDate] between [installTime]<br/>
    - Artwork must be ready to hang with wire or hooks<br/>
    - All artwork must have price tags<br/>
    - Pick up your artwork after the show ends</p>

    <p>Get ready for an amazing show!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 17,
  trigger_time: '10:00',
  filter_criteria: { statuses: ['approved', 'confirmed'] },
  enabled_by_default: true
})

# 11 days before
create_email(template, {
  name: 'Event Countdown - 11 Days (Artists)',
  position: 26,
  category: 'Artists',
  subject_template: '11 Days Until Pancake & Booze in [eventCity]!',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Only 11 days until the Pancake and Booze Art Show in [eventCity]!</p>

    <p><strong>Event Date:</strong> [date] at [eventTime]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Address:</strong> [address]</p>

    <p><strong>Artist Install:</strong><br/>
    <strong>Date:</strong> [installDate]<br/>
    <strong>Time:</strong> [installTime]</p>

    <p>Make sure your artwork is ready to hang and has price tags attached!</p>

    <p>See you soon!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 11,
  trigger_time: '10:00',
  filter_criteria: { statuses: ['approved', 'confirmed'] },
  enabled_by_default: true
})

# 3 days before
create_email(template, {
  name: 'Event Countdown - 3 Days (Artists)',
  position: 27,
  category: 'Artists',
  subject_template: '3 Days Until Pancake & Booze in [eventCity]!',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Only 3 days until the Pancake and Booze Art Show in [eventCity]!</p>

    <p><strong>Event Date:</strong> [date] at [eventTime]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Address:</strong> [address]</p>

    <p><strong>Final Reminders:</strong><br/>
    - Install on [installDate] between [installTime]<br/>
    - Bring all hanging hardware and price tags<br/>
    - Check in at the artist desk when you arrive<br/>
    - Pick up your artwork after the show</p>

    <p>We can't wait to see your work!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 3,
  trigger_time: '10:00',
  filter_criteria: { statuses: ['approved', 'confirmed'] },
  enabled_by_default: true
})

# Day of event
create_email(template, {
  name: 'Event Day - Today (Artists)',
  position: 28,
  category: 'Artists',
  subject_template: 'Today: Pancake & Booze in [eventCity]!',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Today is the day! The Pancake and Booze Art Show is happening today!</p>

    <p><strong>Event:</strong> TODAY at [eventTime]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Address:</strong> [address]</p>

    <p><strong>Today's Schedule:</strong><br/>
    - Install time: [installTime]<br/>
    - Show starts: [eventTime]<br/>
    - Check in at artist desk upon arrival</p>

    <p>Have an amazing show!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'on_event_date',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: { statuses: ['approved', 'confirmed'] },
  enabled_by_default: true
})

puts "      ✓ Added 4 artist countdown emails"

# ==============================================================================
# SECTION 7: EVENT COUNTDOWN - VENDORS (4 emails)
# ==============================================================================

puts "   ⏰ Event Countdown - Vendors (4 emails)..."

# 12 days before
create_email(template, {
  name: 'Event Countdown - 12 Days (Vendors)',
  position: 29,
  category: 'Vendors',
  subject_template: '12 Days Until Pancake & Booze in [eventCity]!',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>The Pancake and Booze Art Show in [eventCity] is just 12 days away!</p>

    <p><strong>Event Date:</strong> [date]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Address:</strong> [address]</p>

    <p><strong>Important Reminders:</strong><br/>
    - Set up your table on [installDate] between [installTime]<br/>
    - Bring your own table covering and display materials<br/>
    - All items must be priced and ready to sell<br/>
    - Event starts at [eventTime]</p>

    <p>Get ready for an amazing show!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 12,
  trigger_time: '14:00',  # Different time than announcement to avoid duplicate
  filter_criteria: { statuses: ['approved', 'confirmed'] },
  enabled_by_default: true
})

# 7 days before
create_email(template, {
  name: 'Event Countdown - 7 Days (Vendors)',
  position: 30,
  category: 'Vendors',
  subject_template: '7 Days Until Pancake & Booze in [eventCity]!',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Only 7 days until the Pancake and Booze Art Show in [eventCity]!</p>

    <p><strong>Event Date:</strong> [date] at [eventTime]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Address:</strong> [address]</p>

    <p><strong>Vendor Setup:</strong><br/>
    <strong>Date:</strong> [installDate]<br/>
    <strong>Time:</strong> [installTime]</p>

    <p>Make sure you have your table covering, display materials, and all items priced!</p>

    <p>See you soon!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 7,
  trigger_time: '10:00',
  filter_criteria: { statuses: ['approved', 'confirmed'] },
  enabled_by_default: true
})

# 3 days before
create_email(template, {
  name: 'Event Countdown - 3 Days (Vendors)',
  position: 31,
  category: 'Vendors',
  subject_template: '3 Days Until Pancake & Booze in [eventCity]!',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Only 3 days until the Pancake and Booze Art Show in [eventCity]!</p>

    <p><strong>Event Date:</strong> [date] at [eventTime]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Address:</strong> [address]</p>

    <p><strong>Final Reminders:</strong><br/>
    - Setup on [installDate] between [installTime]<br/>
    - Bring table covering and display materials<br/>
    - Check in at the vendor desk when you arrive<br/>
    - Be ready to sell when doors open at [eventTime]</p>

    <p>We can't wait to see your products!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 3,
  trigger_time: '14:00',  # Different time than artists
  filter_criteria: { statuses: ['approved', 'confirmed'] },
  enabled_by_default: true
})

# Day of event (morning)
create_email(template, {
  name: 'Event Day - Morning (Vendors)',
  position: 32,
  category: 'Vendors',
  subject_template: 'Today: Pancake & Booze in [eventCity]!',
  body_template: <<~HTML,
    <p>Hello [greetingName],</p>

    <p>Good morning! The Pancake and Booze Art Show is happening TODAY!</p>

    <p><strong>Event:</strong> TODAY at [eventTime]<br/>
    <strong>Venue:</strong> [venue]<br/>
    <strong>Address:</strong> [address]</p>

    <p><strong>Today's Schedule:</strong><br/>
    - Setup time: [installTime]<br/>
    - Doors open: [eventTime]<br/>
    - Check in at vendor desk upon arrival</p>

    <p>Have an amazing show and great sales!</p>

    <p>Best,<br/>
    Pancake & Booze</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'on_event_date',
  trigger_value: 0,
  trigger_time: '07:00',  # Earlier than artists
  filter_criteria: { statuses: ['approved', 'confirmed'] },
  enabled_by_default: true
})

puts "      ✓ Added 4 vendor countdown emails"

# Summary
total_emails = template.email_template_items.count

puts "\n" + "="*80
puts "✅ Pancake & Booze Email Campaign Template Setup Complete!"
puts "="*80
puts "\nTemplate ID: #{template.id}"
puts "Template Name: #{template.name}"
puts "Total Emails Created: #{total_emails}"
puts "\nBreakdown:"
puts "  - 8 Event Announcements (4 announcements × 2 categories)"
puts "  - 4 Application Workflow emails (2 per category)"
puts "  - 6 Payment Reminders (Artists)"
puts "  - 4 Payment Reminders (Vendors)"
puts "  - 2 Payment Confirmations (1 per category)"
puts "  - 4 Event Countdown (Artists)"
puts "  - 4 Event Countdown (Vendors)"
puts "\nThis template can now be selected when creating new events."
puts "To assign to Pancake & Booze organization specifically, update the organization_id field."
puts "\n"
