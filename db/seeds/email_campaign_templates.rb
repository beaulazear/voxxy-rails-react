# Email Campaign Templates Seed Data
# Creates the default system template with 7 scheduled email templates
# Based on simplified email schedule requirements
#
# NOTE: The "Event Announcement (immediate)" email sent on event creation
# is handled by the EventInvitation system, NOT by scheduled emails.
# It is tracked in the email deliveries but not duplicated here.

puts "\n🌱 Seeding Email Campaign Templates...\n"

# Check if default template already exists
existing_default = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)

if existing_default
  puts "✅ Default template already exists (ID: #{existing_default.id})"
  puts "   Skipping creation. Use 'rails email_automation:regenerate' to update individual events."
  exit 0
end

# Create the default system template
puts "\n1️⃣  Creating Default Email Campaign Template..."
template = EmailCampaignTemplate.create!(
  template_type: 'system',
  name: 'Default Event Campaign',
  description: 'Simplified email campaign with 7 automated emails covering application deadline, payment reminders, and event countdown',
  is_default: true
)
puts "   ✅ Created: #{template.name} (ID: #{template.id})"

# Helper to create email template items
def create_email(template, attrs)
  EmailTemplateItem.create!(
    email_campaign_template: template,
    **attrs
  )
end

puts "\n2️⃣  Adding Email Templates...\n"

# ==============================================================================
# CATEGORY 1: EVENT ANNOUNCEMENTS (2 emails)
# ==============================================================================

puts "   📢 Event Announcements..."

create_email(template, {
  name: '1 Day Before Application Deadline',
  position: 1,
  category: 'event_announcements',
  subject_template: "⏰ Last Chance: [eventName] Applications Close Tomorrow!",
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>Final reminder!</strong> Applications for <strong>[eventName]</strong> close <strong>tomorrow</strong> on [applicationDeadline].</p>

    <h3>Event Details:</h3>
    <ul>
      <li><strong>Date:</strong> [eventDate]</li>
      <li><strong>Location:</strong> [eventVenue], [eventLocation]</li>
      <li><strong>Booth Fee:</strong> [boothPrice]</li>
    </ul>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[eventLink]" style="background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Apply Before It's Too Late</a>
    </p>

    <p>Don't miss this opportunity!</p>

    <p>Best regards,<br>
    [organizationName]</p>
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
  subject_template: '🚨 URGENT: [eventName] Applications Close TODAY',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>URGENT:</strong> Today is the final day to apply for <strong>[eventName]</strong>!</p>

    <p>Applications close at midnight tonight.</p>

    <h3>Quick Details:</h3>
    <ul>
      <li><strong>Event Date:</strong> [eventDate]</li>
      <li><strong>Location:</strong> [eventVenue]</li>
      <li><strong>Booth Fee:</strong> [boothPrice]</li>
    </ul>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[eventLink]" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Apply Right Now</a>
    </p>

    <p><strong>This is your last chance!</strong></p>

    <p>Thanks,<br>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: {},
  enabled_by_default: true
})

puts "      ✓ Added 2 announcement emails"

# ==============================================================================
# CATEGORY 2: PAYMENT REMINDERS (2 emails)
# ==============================================================================

puts "   💳 Payment Reminders..."

create_email(template, {
  name: '1 Day Before Payment Due',
  position: 3,
  category: 'payment_reminders',
  subject_template: 'Reminder: Payment Due Tomorrow - [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>This is a reminder that your payment for <strong>[eventName]</strong> is due <strong>tomorrow</strong> on [paymentDueDate].</p>

    <p><strong>Amount Due:</strong> [boothPrice]</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[paymentLink]" style="background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Complete Payment</a>
    </p>

    <p>Please complete your payment to secure your spot.</p>

    <p>Questions? Reply to this email.</p>

    <p>Thank you,<br>
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
  subject_template: '🚨 URGENT: Payment Due Today - [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>URGENT:</strong> Your payment for <strong>[eventName]</strong> is due <strong>TODAY</strong>.</p>

    <p>Amount: <strong>[boothPrice]</strong></p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[paymentLink]" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Pay Immediately</a>
    </p>

    <p><strong>Important:</strong> If payment is not received by end of day, your spot may be released.</p>

    <p>Need an extension? Contact us immediately at [organizationEmail].</p>

    <p>Thank you,<br>
    [organizationName]</p>
  HTML
  trigger_type: 'on_payment_deadline',
  trigger_value: 0,
  trigger_time: '08:00',
  filter_criteria: { status: [ 'approved' ] },
  enabled_by_default: true
})

puts "      ✓ Added 2 payment reminder emails"

# ==============================================================================
# CATEGORY 3: EVENT COUNTDOWN (3 emails)
# ==============================================================================

puts "   ⏰ Event Countdown..."

create_email(template, {
  name: '1 Day Before Event',
  position: 5,
  category: 'event_countdown',
  subject_template: 'Tomorrow: [eventName] Final Details',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>[eventName]</strong> is <strong>tomorrow</strong>!</p>

    <h3>Final Reminders:</h3>
    <ul>
      <li><strong>Setup:</strong> [installDate] at [installTime]</li>
      <li><strong>Event:</strong> [eventDate] at [eventTime]</li>
      <li><strong>Location:</strong> [eventVenue]</li>
    </ul>

    <p><strong>Don't Forget:</strong></p>
    <ul>
      <li>Arrive early for setup</li>
      <li>Bring all necessary materials</li>
      <li>Check weather forecast</li>
      <li>Have parking information ready</li>
    </ul>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[bulletinLink]" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Last-Minute Updates</a>
    </p>

    <p>Can't wait to see you tomorrow!</p>

    <p>Best,<br>
    [organizationName]</p>
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
  subject_template: '🎉 Today is the Day! [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>TODAY IS THE DAY!</strong></p>

    <p>We're so excited for <strong>[eventName]</strong>!</p>

    <h3>Today's Schedule:</h3>
    <p>⏰ <strong>Setup:</strong> [installTime]<br>
    🎪 <strong>Event Start:</strong> [eventTime]<br>
    📍 <strong>Location:</strong> [eventVenue]</p>

    <p><strong>Important:</strong></p>
    <ul>
      <li>Arrive on time for setup</li>
      <li>Check in at the registration table</li>
      <li>Follow all safety guidelines</li>
    </ul>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[bulletinLink]" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Day-Of Information</a>
    </p>

    <p>See you soon!</p>

    <p>Best,<br>
    [organizationName]</p>
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
  subject_template: 'Thank You for Making [eventName] Amazing!',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>Thank you</strong> for being part of <strong>[eventName]</strong>!</p>

    <p>Your participation made this event special, and we hope you had a great experience.</p>

    <h3>What's Next:</h3>
    <ul>
      <li>📸 Event photos coming soon</li>
      <li>📊 We'd love your feedback</li>
      <li>🔔 Stay tuned for future events</li>
    </ul>

    <p>We'd love to hear about your experience! Reply to this email to share your feedback.</p>

    <p>Looking forward to working with you again!</p>

    <p>With gratitude,<br>
    [organizationName]</p>
  HTML
  trigger_type: 'days_after_event',
  trigger_value: 1,
  trigger_time: '10:00',
  filter_criteria: { status: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

puts "      ✓ Added 3 event countdown emails"

# Summary
template.reload
puts "\n✅ SEED COMPLETE!"
puts "=" * 60
puts "   Template: #{template.name}"
puts "   Template ID: #{template.id}"
puts "   Total Emails: #{template.email_count}"
puts "   Type: #{template.template_type}"
puts "   Default: #{template.is_default}"
puts "=" * 60

puts "\n📊 Email Breakdown:"
puts "   Event Announcements: #{template.email_template_items.where(category: 'event_announcements').count}"
puts "   Payment Reminders: #{template.email_template_items.where(category: 'payment_reminders').count}"
puts "   Event Countdown: #{template.email_template_items.where(category: 'event_countdown').count}"

puts "\n📝 Note: The immediate 'Event Announcement' email sent on event creation"
puts "   is handled by the EventInvitation system and tracked separately."
puts "   It is NOT included in this scheduled email template.\n"

puts "\n🎉 Ready to automate events!\n\n"
