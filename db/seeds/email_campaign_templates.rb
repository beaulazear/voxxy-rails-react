# Email Campaign Templates Seed Data
# Exact stamp of production template ID 6 as of 2026-02-17
# 9 emails: 2 event announcements, 1 application update, 2 payment reminders, 3 event countdown
#
# NOTE: The "Initial Invitation" email (position 1) is sent via the EventInvitation system.
# It is tracked in email_deliveries but generated here as a template item for reference/preview.

puts "\nSeeding Email Campaign Templates...\n"

existing_default = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)

if existing_default
  puts "Default template already exists (ID: #{existing_default.id}) — skipping creation."
  puts "To force update, run: EmailCampaignTemplate.find_by(template_type: 'system', is_default: true).destroy"
  return
end

puts "\n1. Creating Default Email Campaign Template..."
template = EmailCampaignTemplate.create!(
  template_type: 'system',
  name: 'Default Event Campaign',
  description: 'Simplified email campaign with 9 automated emails covering invitations, application updates, deadline reminders, payment reminders, and event countdown',
  is_default: true
)
puts "   Created: #{template.name} (ID: #{template.id})"

def create_email(template, attrs)
  EmailTemplateItem.create!(email_campaign_template: template, **attrs)
end

puts "\n2. Adding Email Templates...\n"

# ==============================================================================
# POSITION 1 — EVENT ANNOUNCEMENTS: Initial Invitation
# Sent via EventInvitation system on application open; included here for preview
# ==============================================================================

puts "   [1/9] Initial Invitation..."
create_email(template, {
  name: 'Initial Invitation',
  position: 1,
  category: 'event_announcements',
  subject_template: 'Submissions Open for [eventName]',
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

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>

  HTML
  trigger_type: 'on_application_open',
  trigger_value: 0,
  trigger_time: '09:00',
  filter_criteria: {},
  enabled_by_default: true
})

# ==============================================================================
# POSITION 2 — APPLICATION UPDATES: Application Received
# ==============================================================================

puts "   [2/9] Application Received..."
create_email(template, {
  name: 'Application Received',
  position: 2,
  category: 'application_updates',
  subject_template: 'Application Received - [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>Thanks for submitting your application to participate in <strong>[eventName]</strong> at <strong>[eventVenue]</strong> on <strong>[eventDate]</strong>.</p>

    <p><strong>IMPORTANT:</strong> This is NOT an acceptance email. Please allow up to 10 days for us to review your submission. You will receive another email with further details if you're selected.</p>

    <p>In the meantime, check us out on Instagram (@pancakesandbooze) and see our "FAQs" Story Highlights for details on how our events work.</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>

  HTML
  trigger_type: 'on_application_submit',
  trigger_value: 0,
  trigger_time: '00:00',
  filter_criteria: {},
  enabled_by_default: true
})

# ==============================================================================
# POSITIONS 3–4 — EVENT ANNOUNCEMENTS: Deadline reminders
# ==============================================================================

puts "   [3/9] 1 Day Before Application Deadline..."
create_email(template, {
  name: '1 Day Before Application Deadline',
  position: 3,
  category: 'event_announcements',
  subject_template: 'Last Chance: [eventName] Applications Close Tomorrow',
  body_template: <<~HTML,
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

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 1,
  trigger_time: '09:00',
  filter_criteria: { statuses: [ 'pending' ] },
  enabled_by_default: true
})

puts "   [4/9] Application Deadline Day..."
create_email(template, {
  name: 'Application Deadline Day',
  position: 4,
  category: 'event_announcements',
  subject_template: 'URGENT: [eventName] Applications Close Today',
  body_template: <<~HTML,
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

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: { statuses: [ 'pending' ] },
  enabled_by_default: true
})

# ==============================================================================
# POSITIONS 5–6 — PAYMENT REMINDERS
# ==============================================================================

puts "   [5/9] 1 Day Before Payment Due..."
create_email(template, {
  name: '1 Day Before Payment Due',
  position: 5,
  category: 'payment_reminders',
  subject_template: 'Reminder: Payment Due Tomorrow - [eventName]',
  body_template: <<~HTML,
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

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_payment_deadline',
  trigger_value: 1,
  trigger_time: '10:00',
  filter_criteria: { statuses: [ 'approved' ], payment_status: [ 'pending', 'overdue' ] },
  enabled_by_default: true
})

puts "   [6/9] Payment Due Today..."
create_email(template, {
  name: 'Payment Due Today',
  position: 6,
  category: 'payment_reminders',
  subject_template: 'URGENT: Payment Due Today - [eventName]',
  body_template: <<~HTML,
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

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'on_payment_deadline',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: { statuses: [ 'approved' ], payment_status: [ 'pending', 'overdue' ] },
  enabled_by_default: true
})

# ==============================================================================
# POSITIONS 7–9 — EVENT COUNTDOWN
# ==============================================================================

puts "   [7/9] 1 Day Before Event..."
create_email(template, {
  name: '1 Day Before Event',
  position: 7,
  category: 'event_countdown',
  subject_template: 'Tomorrow: [eventName] Final Details',
  body_template: <<~HTML,
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

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 1,
  trigger_time: '17:00',
  filter_criteria: { statuses: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

puts "   [8/9] Day of Event..."
create_email(template, {
  name: 'Day of Event',
  position: 8,
  category: 'event_countdown',
  subject_template: 'Today: [eventName]',
  body_template: <<~HTML,
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

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'on_event_date',
  trigger_value: 0,
  trigger_time: '07:00',
  filter_criteria: { statuses: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

puts "   [9/9] Day After Event - Thank You..."
create_email(template, {
  name: 'Day After Event - Thank You',
  position: 9,
  category: 'event_countdown',
  subject_template: 'Thank You for Participating in [eventName]',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>Thank you for participating in <strong>[eventName]</strong>. We appreciate your contribution to making this event a success.</p>

    <p>We hope the event met your expectations and provided value for your business.</p>

    <p>If you have any feedback about the event, please share it with us. We are always looking to improve.</p>

    <p>We look forward to working with you again at future events.</p>

    <p>Best regards,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">Questions? Reply to this email or contact team@voxxypresents.com directly.</p>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_after_event',
  trigger_value: 1,
  trigger_time: '10:00',
  filter_criteria: { statuses: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

puts "\nEmail Campaign Template Setup Complete!"
puts "Total: 9 email templates created"
puts "\nTemplate breakdown:"
puts "  - 2 Event Announcements     (invitation, deadline reminders)"
puts "  - 1 Application Update      (application received)"
puts "  - 2 Payment Reminders       (1 day before, day of)"
puts "  - 3 Event Countdown         (day before, day of, day after)"
