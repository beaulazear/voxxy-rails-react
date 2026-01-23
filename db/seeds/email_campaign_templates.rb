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

    <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Date:</strong> [eventDate]</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Location:</strong> [eventVenue], [eventLocation]</p>
      <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Application Deadline:</strong> [applicationDeadline]</p>
    </div>

    <div style="background-color: #e6f3ff; padding: 15px; margin: 15px 0; border: 1px solid #0066cc;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333; font-weight: 600;">View all vendor application options, pricing, and details:</p>
      <p style="margin: 0;"><a href="[eventLink]" style="color: #0066cc; text-decoration: underline; font-weight: 600;">[eventLink]</a></p>
    </div>

    <p><strong>Apply now before tomorrow's deadline!</strong></p>

    <p>Best regards,<br/>
    [organizationName]</p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="margin-top: 10px; font-size: 12px; color: #aaaaaa;">
      Powered by Voxxy Presents
    </p>
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 1,
  trigger_time: '09:00',
  filter_criteria: { statuses: [ 'pending' ] },  # Only send to vendors awaiting review
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

    <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Event Date:</strong> [eventDate]</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Location:</strong> [eventVenue]</p>
      <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Deadline:</strong> Today, [applicationDeadline]</p>
    </div>

    <div style="background-color: #fff3cd; padding: 15px; margin: 15px 0; border: 1px solid #ffc107;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333; font-weight: 600;">⚠️ Last chance! View application options and apply now:</p>
      <p style="margin: 0;"><a href="[eventLink]" style="color: #0066cc; text-decoration: underline; font-weight: 600;">[eventLink]</a></p>
    </div>

    <p><strong>This is your last chance.</strong></p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="margin-top: 10px; font-size: 12px; color: #aaaaaa;">
      Powered by Voxxy Presents
    </p>
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: { statuses: [ 'pending' ] },  # Only send to vendors awaiting review
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

    <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Payment Due Date:</strong> [paymentDueDate]</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Event Date:</strong> [eventDate]</p>
      <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Category:</strong> [vendorCategory]</p>
    </div>

    <div style="background-color: #e6f3ff; padding: 15px; margin: 15px 0; border: 1px solid #0066cc;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333; font-weight: 600;">View your application details and payment information:</p>
      <p style="margin: 0;"><a href="[eventLink]" style="color: #0066cc; text-decoration: underline; font-weight: 600;">[eventLink]</a></p>
    </div>

    <p>If you have already submitted payment, please disregard this message.</p>

    <p>Thank you,<br/>
    [organizationName]</p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="margin-top: 10px; font-size: 12px; color: #aaaaaa;">
      Powered by Voxxy Presents
    </p>
  HTML
  trigger_type: 'days_before_payment_deadline',
  trigger_value: 1,
  trigger_time: '10:00',
  filter_criteria: {
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
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

    <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Due Date:</strong> Today, [paymentDueDate]</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Event Date:</strong> [eventDate]</p>
      <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Category:</strong> [vendorCategory]</p>
    </div>

    <div style="background-color: #fff3cd; padding: 15px; margin: 15px 0; border: 1px solid #ffc107;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333; font-weight: 600;">⚠️ Payment due today! View your details and submit payment:</p>
      <p style="margin: 0;"><a href="[eventLink]" style="color: #0066cc; text-decoration: underline; font-weight: 600;">[eventLink]</a></p>
    </div>

    <p>If payment is not received by midnight tonight, your spot may be moved to the waitlist.</p>

    <p>Questions? Contact us at <a href="mailto:[organizationEmail]" style="color: #0066cc; text-decoration: underline;">[organizationEmail]</a></p>

    <p>Thank you,<br/>
    [organizationName]</p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="margin-top: 10px; font-size: 12px; color: #aaaaaa;">
      Powered by Voxxy Presents
    </p>
  HTML
  trigger_type: 'on_payment_deadline',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: {
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
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

    <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333; font-weight: 600;">Event Information:</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Date:</strong> [eventDate]</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Time:</strong> [eventTime]</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Venue:</strong> [eventVenue]</p>
      <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Location:</strong> [eventLocation]</p>
    </div>

    <div style="background-color: #e6f3ff; padding: 15px; margin: 15px 0; border: 1px solid #0066cc;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333; font-weight: 600;">View your setup schedule and complete event details:</p>
      <p style="margin: 0;"><a href="[eventLink]" style="color: #0066cc; text-decoration: underline; font-weight: 600;">[eventLink]</a></p>
    </div>

    <div style="background-color: #fffef0; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333; font-weight: 600;">Important Reminders:</p>
      <p style="margin: 0 0 5px 0; font-size: 14px; color: #333333;">• Arrive during your scheduled setup time</p>
      <p style="margin: 0 0 5px 0; font-size: 14px; color: #333333;">• Bring all necessary equipment and supplies</p>
      <p style="margin: 0 0 5px 0; font-size: 14px; color: #333333;">• Have your confirmation code ready for check-in</p>
      <p style="margin: 0; font-size: 14px; color: #333333;">• Review any vendor guidelines on the event page</p>
    </div>

    <p>We look forward to seeing you tomorrow.</p>

    <p>Best regards,<br/>
    [organizationName]</p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="margin-top: 10px; font-size: 12px; color: #aaaaaa;">
      Powered by Voxxy Presents
    </p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 1,
  trigger_time: '17:00',
  filter_criteria: { statuses: [ 'approved', 'confirmed' ] },
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

    <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333; font-weight: 600;">Event Details:</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Time:</strong> [eventTime]</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333;"><strong>Venue:</strong> [eventVenue]</p>
      <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Location:</strong> [eventLocation]</p>
    </div>

    <div style="background-color: #e6f3ff; padding: 15px; margin: 15px 0; border: 1px solid #0066cc;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #333333; font-weight: 600;">View your setup time and event details:</p>
      <p style="margin: 0;"><a href="[eventLink]" style="color: #0066cc; text-decoration: underline; font-weight: 600;">[eventLink]</a></p>
    </div>

    <div style="background-color: #fffef0; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #333333; font-weight: 600;">Reminders:</p>
      <p style="margin: 0 0 5px 0; font-size: 14px; color: #333333;">• Arrive on time for setup</p>
      <p style="margin: 0 0 5px 0; font-size: 14px; color: #333333;">• Check in at the vendor desk</p>
      <p style="margin: 0 0 5px 0; font-size: 14px; color: #333333;">• Follow all venue guidelines</p>
      <p style="margin: 0; font-size: 14px; color: #333333;">• Have a successful event</p>
    </div>

    <p>See you there.</p>

    <p>Best regards,<br/>
    [organizationName]</p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="margin-top: 10px; font-size: 12px; color: #aaaaaa;">
      Powered by Voxxy Presents
    </p>
  HTML
  trigger_type: 'on_event_date',
  trigger_value: 0,
  trigger_time: '07:00',
  filter_criteria: { statuses: [ 'approved', 'confirmed' ] },
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

    <div style="background-color: #f0f8ff; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;">
      <p style="margin: 0; font-size: 14px; color: #333333;">
        If you have any feedback about the event, please share it with us. We are always looking to improve.
      </p>
    </div>

    <p>We look forward to working with you again at future events.</p>

    <p>Best regards,<br/>
    [organizationName]</p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="margin-top: 10px; font-size: 12px; color: #aaaaaa;">
      Powered by Voxxy Presents
    </p>
  HTML
  trigger_type: 'days_after_event',
  trigger_value: 1,
  trigger_time: '10:00',
  filter_criteria: { statuses: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

puts "      Added 3 event countdown emails"

puts "\nEmail Campaign Template Setup Complete!"
puts "Total: 7 email templates created"
puts "\nTemplates:"
puts "  - 2 Event Announcements (application deadline reminders)"
puts "  - 2 Payment Reminders (payment due reminders)"
puts "  - 3 Event Countdown (pre-event, day-of, post-event)"
