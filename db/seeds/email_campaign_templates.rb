# Email Campaign Templates Seed Data
# Creates the default system template with 7 scheduled email templates
# Based on simplified email schedule requirements with improved deliverability
#
# NOTE: The "Event Announcement (immediate)" email sent on event creation
# is handled by the EventInvitation system, NOT by scheduled emails.
# It is tracked in the email deliveries but not duplicated here.

puts "\nSeeding Email Campaign Templates...\n"

# Check if default template already exists
existing_default = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)

if existing_default
  puts "Default template already exists (ID: #{existing_default.id})"
  puts "Skipping creation. Use 'rails email_automation:regenerate' to update individual events."
  exit 0
end

# Create the default system template
puts "\n1. Creating Default Email Campaign Template..."
template = EmailCampaignTemplate.create!(
  template_type: 'system',
  name: 'Default Event Campaign',
  description: 'Simplified email campaign with 7 automated emails covering application deadline, payment reminders, and event countdown',
  is_default: true
)
puts "   Created: #{template.name} (ID: #{template.id})"

# Helper to create email template items
def create_email(template, attrs)
  EmailTemplateItem.create!(
    email_campaign_template: template,
    **attrs
  )
end

puts "\n2. Adding Email Templates...\n"

# ==============================================================================
# CATEGORY 1: EVENT ANNOUNCEMENTS (2 emails)
# ==============================================================================

puts "   Event Announcements..."

create_email(template, {
  name: '1 Day Before Application Deadline',
  position: 1,
  category: 'event_announcements',
  subject_template: "Last Chance: [eventName] Applications Close Tomorrow",
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>This is a final reminder that applications for <strong>[eventName]</strong> close tomorrow on [applicationDeadline].</p>

    <p><strong>Event Details:</strong></p>
    <p>
      Date: [eventDate]<br/>
      Location: [eventVenue], [eventLocation]<br/>
      Booth Fee: [boothPrice]
    </p>

    <p>Apply now: <a href="[eventLink]">[eventLink]</a></p>

    <p>Best regards,<br/>
    [organizationName]</p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #aaaaaa;">
      Powered by Voxxy Presents
    </p>
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 1,
  trigger_time: '09:00',
  filter_criteria: {},
  enabled_by_default: true
})

create_email(template, {
  name: 'Application Deadline Day',
  position: 2,
  category: 'event_announcements',
  subject_template: 'URGENT: [eventName] Applications Close Today',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>Today is the final day to apply for <strong>[eventName]</strong>. Applications close at midnight tonight.</p>

    <p><strong>Quick Details:</strong></p>
    <p>
      Event Date: [eventDate]<br/>
      Location: [eventVenue]<br/>
      Booth Fee: [boothPrice]
    </p>

    <p>Apply now: <a href="[eventLink]">[eventLink]</a></p>

    <p>This is your last chance.</p>

    <p>Thanks,<br/>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: {},
  enabled_by_default: true
})

puts "      Added 2 announcement emails"

# ==============================================================================
# CATEGORY 2: PAYMENT REMINDERS (2 emails)
# ==============================================================================

puts "   Payment Reminders..."

create_email(template, {
  name: '1 Day Before Payment Due',
  position: 3,
  category: 'payment_reminders',
  subject_template: 'Reminder: Payment Due Tomorrow - [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>This is a reminder that your payment for <strong>[eventName]</strong> is due tomorrow on [paymentDueDate].</p>

    <p><strong>Payment Details:</strong></p>
    <p>
      Amount Due: [boothPrice]<br/>
      Event Date: [eventDate]<br/>
      Category: [vendorCategory]
    </p>

    <p>Make your payment here: <a href="[paymentLink]">[paymentLink]</a></p>

    <p>If you have already submitted payment, please disregard this message.</p>

    <p>Thank you,<br/>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_payment_deadline',
  trigger_value: 1,
  trigger_time: '10:00',
  filter_criteria: { status: [ 'approved' ] },
  enabled_by_default: true
})

create_email(template, {
  name: 'Payment Due Today',
  position: 4,
  category: 'payment_reminders',
  subject_template: 'URGENT: Payment Due Today - [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>Your payment for <strong>[eventName]</strong> is due today.</p>

    <p><strong>Payment Details:</strong></p>
    <p>
      Amount Due: [boothPrice]<br/>
      Due Date: Today, [paymentDueDate]<br/>
      Event Date: [eventDate]
    </p>

    <p>Pay now: <a href="[paymentLink]">[paymentLink]</a></p>

    <p>If payment is not received by midnight tonight, your spot may be moved to the waitlist.</p>

    <p>Questions? Contact us at <a href="mailto:[organizationEmail]">[organizationEmail]</a></p>

    <p>Thank you,<br/>
    [organizationName]</p>
  HTML
  trigger_type: 'on_payment_deadline',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: { status: [ 'approved' ] },
  enabled_by_default: true
})

puts "      Added 2 payment reminder emails"

# ==============================================================================
# CATEGORY 3: EVENT COUNTDOWN (3 emails)
# ==============================================================================

puts "   Event Countdown..."

create_email(template, {
  name: '1 Day Before Event',
  position: 5,
  category: 'event_countdown',
  subject_template: 'Tomorrow: [eventName] Final Details',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>[eventName]</strong> is tomorrow. Here are the final details you need:</p>

    <p><strong>Event Information:</strong></p>
    <p>
      Date: [eventDate]<br/>
      Time: [eventTime]<br/>
      Venue: [eventVenue]<br/>
      Location: [eventLocation]
    </p>

    <p><strong>Setup Information:</strong></p>
    <p>
      Install Date: [installDate]<br/>
      Install Time: [installTime]
    </p>

    <p>View event bulletin for additional details: <a href="[bulletinLink]">[bulletinLink]</a></p>

    <p>Important reminders:</p>
    <p>
      - Arrive during your scheduled setup time<br/>
      - Bring all necessary equipment and supplies<br/>
      - Have your confirmation code ready for check-in<br/>
      - Review any vendor guidelines in the bulletin
    </p>

    <p>We look forward to seeing you tomorrow.</p>

    <p>Best regards,<br/>
    [organizationName]</p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #aaaaaa;">
      Powered by Voxxy Presents
    </p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 1,
  trigger_time: '17:00',
  filter_criteria: { status: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

create_email(template, {
  name: 'Day of Event',
  position: 6,
  category: 'event_countdown',
  subject_template: 'Today: [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>Today is the day. <strong>[eventName]</strong> is happening today.</p>

    <p><strong>Event Details:</strong></p>
    <p>
      Time: [eventTime]<br/>
      Venue: [eventVenue]<br/>
      Location: [eventLocation]
    </p>

    <p><strong>Your Setup Time:</strong></p>
    <p>
      Install Time: [installTime]
    </p>

    <p>Event bulletin: <a href="[bulletinLink]">[bulletinLink]</a></p>

    <p>Reminders:</p>
    <p>
      - Arrive on time for setup<br/>
      - Check in at the vendor desk<br/>
      - Follow all venue guidelines<br/>
      - Have a successful event
    </p>

    <p>See you there.</p>

    <p>Best regards,<br/>
    [organizationName]</p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #aaaaaa;">
      Powered by Voxxy Presents
    </p>
  HTML
  trigger_type: 'on_event_date',
  trigger_value: 0,
  trigger_time: '07:00',
  filter_criteria: { status: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

create_email(template, {
  name: 'Day After Event - Thank You',
  position: 7,
  category: 'event_countdown',
  subject_template: 'Thank You for Participating in [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>Thank you for participating in <strong>[eventName]</strong>. We appreciate your contribution to making this event a success.</p>

    <p>We hope the event met your expectations and provided value for your business.</p>

    <p>If you have any feedback about the event, please share it with us. We are always looking to improve.</p>

    <p>We look forward to working with you again at future events.</p>

    <p>Best regards,<br/>
    [organizationName]</p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #aaaaaa;">
      Powered by Voxxy Presents
    </p>
  HTML
  trigger_type: 'days_after_event',
  trigger_value: 1,
  trigger_time: '10:00',
  filter_criteria: { status: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

puts "      Added 3 event countdown emails"

puts "\nEmail Campaign Template Setup Complete!"
puts "Total: 7 email templates created"
puts "\nTemplates:"
puts "  - 2 Event Announcements (application deadline reminders)"
puts "  - 2 Payment Reminders (payment due reminders)"
puts "  - 3 Event Countdown (pre-event, day-of, post-event)"
