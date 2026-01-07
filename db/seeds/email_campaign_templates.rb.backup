# Email Campaign Templates Seed Data
# Creates the default system template with 16 editable email templates
# Based on EMAIL_TEMPLATES.md specification

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
  description: 'Standard email campaign for all event types with 16 automated emails',
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
# CATEGORY 1: EVENT ANNOUNCEMENTS (4 emails)
# ==============================================================================

puts "   📢 Event Announcements..."

create_email(template, {
  name: 'Immediate Announcement - Applications Open',
  position: 1,
  category: 'event_announcements',
  subject_template: "You're Invited: [eventName] - Apply Now!",
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>We're excited to announce <strong>[eventName]</strong> and we'd love to have you participate!</p>

    <h3>Event Details:</h3>
    <ul>
      <li><strong>Date:</strong> [eventDate]</li>
      <li><strong>Location:</strong> [eventVenue], [eventLocation]</li>
      <li><strong>Application Deadline:</strong> [applicationDeadline]</li>
      <li><strong>Booth Fee:</strong> [boothPrice]</li>
    </ul>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[eventLink]" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Apply Now</a>
    </p>

    <p>Spots are limited—apply early to secure your spot!</p>

    <p>Looking forward to having you,<br>
    [organizationName]</p>
  HTML
  trigger_type: 'on_application_open',
  trigger_value: 0,
  trigger_time: '09:00',
  filter_criteria: {},
  enabled_by_default: true
})

create_email(template, {
  name: '10 Weeks Before Deadline',
  position: 2,
  category: 'event_announcements',
  subject_template: 'Early Bird: [eventName] Applications Open',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>Don't miss out on <strong>[eventName]</strong>! We're accepting applications now.</p>

    <h3>Why Apply Early?</h3>
    <ul>
      <li>✅ Better booth selection</li>
      <li>✅ More time to prepare</li>
      <li>✅ Priority consideration</li>
    </ul>

    <p><strong>Application Deadline:</strong> [applicationDeadline]<br>
    <strong>Event Date:</strong> [eventDate]</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[eventLink]" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Apply Now</a>
    </p>

    <p>Best regards,<br>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 70,
  trigger_time: '10:00',
  filter_criteria: {},
  enabled_by_default: true
})

create_email(template, {
  name: '8 Weeks Before Deadline',
  position: 3,
  category: 'event_announcements',
  subject_template: 'Last Chance to Apply: [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>Just a friendly reminder that applications for <strong>[eventName]</strong> close in 8 weeks!</p>

    <p><strong>Key Details:</strong></p>
    <ul>
      <li>Event: [eventDate] at [eventVenue]</li>
      <li>Deadline: [applicationDeadline]</li>
      <li>Fee: [boothPrice]</li>
    </ul>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[eventLink]" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Submit Application</a>
    </p>

    <p>Questions? Reply to this email.</p>

    <p>[organizationName]</p>
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 56,
  trigger_time: '11:00',
  filter_criteria: {},
  enabled_by_default: true
})

create_email(template, {
  name: '12 Days Before Deadline',
  position: 4,
  category: 'event_announcements',
  subject_template: '⏰ Final Reminder: [eventName] Applications Close Soon',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>This is your final reminder!</strong></p>

    <p>Applications for <strong>[eventName]</strong> close in just <strong>12 days</strong> on [applicationDeadline].</p>

    <p>Don't miss this opportunity to be part of an amazing event at [eventVenue] on [eventDate].</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[eventLink]" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Apply Before It's Too Late</a>
    </p>

    <p>See you there!<br>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_deadline',
  trigger_value: 12,
  trigger_time: '09:00',
  filter_criteria: {},
  enabled_by_default: true
})

puts "      ✓ Added 4 announcement emails"

# ==============================================================================
# CATEGORY 2: APPLICATION UPDATES (1 email)
# ==============================================================================

puts "   📝 Application Updates..."

create_email(template, {
  name: 'Application Received',
  position: 5,
  category: 'application_updates',
  subject_template: 'Application Received - [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>Great news! We've received your application for <strong>[eventName]</strong>.</p>

    <h3>What's Next?</h3>
    <ol>
      <li>We'll review your application</li>
      <li>You'll hear from us by [applicationDeadline]</li>
      <li>If approved, payment will be due by [paymentDueDate]</li>
    </ol>

    <p><strong>Your Application Details:</strong></p>
    <ul>
      <li>Business Name: [businessName]</li>
      <li>Category: [vendorCategory]</li>
      <li>Booth Fee: [boothPrice]</li>
    </ul>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[dashboardLink]" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Your Dashboard</a>
    </p>

    <p>Thank you for applying!</p>

    <p>Best regards,<br>
    [organizationName]</p>
  HTML
  trigger_type: 'on_application_submit',
  trigger_value: 0,
  trigger_time: nil,
  filter_criteria: {},
  enabled_by_default: true
})

puts "      ✓ Added 1 application update email"

# ==============================================================================
# CATEGORY 3: PAYMENT REMINDERS (4 emails)
# ==============================================================================

puts "   💳 Payment Reminders..."

create_email(template, {
  name: 'Payment Details',
  position: 6,
  category: 'payment_reminders',
  subject_template: '🎉 Approved! Payment Details for [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>Congratulations!</strong> Your application for <strong>[eventName]</strong> has been approved!</p>

    <h3>Next Step: Complete Payment</h3>
    <p>Your booth fee of <strong>[boothPrice]</strong> is due by <strong>[paymentDueDate]</strong>.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[paymentLink]" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Pay Now</a>
    </p>

    <p><strong>Important:</strong> Your spot is reserved until [paymentDueDate]. After this date, unpaid spots may be released to waitlisted vendors.</p>

    <p>We're excited to have you at [eventName]!</p>

    <p>Best regards,<br>
    [organizationName]</p>
  HTML
  trigger_type: 'on_approval',
  trigger_value: 0,
  trigger_time: nil,
  filter_criteria: { status: [ 'approved' ] },
  enabled_by_default: true
})

create_email(template, {
  name: '1 Week Before Payment Due',
  position: 7,
  category: 'payment_reminders',
  subject_template: 'Reminder: Payment Due in 7 Days - [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>This is a friendly reminder that your payment for <strong>[eventName]</strong> is due in 7 days.</p>

    <p><strong>Amount Due:</strong> [boothPrice]<br>
    <strong>Payment Deadline:</strong> [paymentDueDate]</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[paymentLink]" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Complete Payment</a>
    </p>

    <p>Questions about payment? Reply to this email.</p>

    <p>Thank you,<br>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_payment_deadline',
  trigger_value: 7,
  trigger_time: '10:00',
  filter_criteria: { status: [ 'approved' ] },
  enabled_by_default: true
})

create_email(template, {
  name: '3 Days Before Payment Due',
  position: 8,
  category: 'payment_reminders',
  subject_template: '⚠️ Payment Due in 3 Days - [eventName]',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>Important:</strong> Your payment for <strong>[eventName]</strong> is due in 3 days on [paymentDueDate].</p>

    <p>Please complete your payment of <strong>[boothPrice]</strong> to secure your spot.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[paymentLink]" style="background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Pay Now</a>
    </p>

    <p><strong>Note:</strong> Unpaid spots may be released to our waitlist after the deadline.</p>

    <p>Thank you,<br>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_payment_deadline',
  trigger_value: 3,
  trigger_time: '09:00',
  filter_criteria: { status: [ 'approved' ] },
  enabled_by_default: true
})

create_email(template, {
  name: 'Payment Due Today',
  position: 9,
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

puts "      ✓ Added 4 payment reminder emails"

# ==============================================================================
# CATEGORY 4: EVENT COUNTDOWN (7 emails)
# ==============================================================================

puts "   ⏰ Event Countdown..."

create_email(template, {
  name: '33 Days Before Event',
  position: 10,
  category: 'event_countdown',
  subject_template: 'One Month Until [eventName]!',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>[eventName]</strong> is just one month away!</p>

    <p><strong>Mark Your Calendar:</strong><br>
    📅 [eventDate]<br>
    📍 [eventVenue], [eventLocation]<br>
    ⏰ [eventTime]</p>

    <h3>What to Expect:</h3>
    <ul>
      <li>Setup details coming soon</li>
      <li>Event day logistics</li>
      <li>Important vendor information</li>
    </ul>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[bulletinLink]" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Event Updates</a>
    </p>

    <p>See you soon!<br>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 33,
  trigger_time: '10:00',
  filter_criteria: { status: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

create_email(template, {
  name: '23 Days Before Event',
  position: 11,
  category: 'event_countdown',
  subject_template: '3 Weeks Until [eventName] - Important Updates',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>We're 3 weeks away from <strong>[eventName]</strong>!</p>

    <h3>Important Information:</h3>
    <ul>
      <li><strong>Setup Date:</strong> [installDate]</li>
      <li><strong>Setup Time:</strong> [installTime]</li>
      <li><strong>Event Start:</strong> [eventTime] on [eventDate]</li>
    </ul>

    <p><strong>What to Bring:</strong></p>
    <ul>
      <li>Business license (if applicable)</li>
      <li>Setup materials</li>
      <li>Marketing materials</li>
    </ul>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[bulletinLink]" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Full Details</a>
    </p>

    <p>Questions? Reply to this email.</p>

    <p>Best,<br>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 23,
  trigger_time: '11:00',
  filter_criteria: { status: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

create_email(template, {
  name: '10 Days Before Event',
  position: 12,
  category: 'event_countdown',
  subject_template: '10 Days to Go! [eventName] Prep Checklist',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>Only 10 days until <strong>[eventName]</strong>!</p>

    <h3>Pre-Event Checklist:</h3>
    <p>✅ Confirm you can attend<br>
    ✅ Prepare your booth setup<br>
    ✅ Review setup instructions<br>
    ✅ Gather necessary permits<br>
    ✅ Prep your inventory</p>

    <p><strong>Setup Details:</strong><br>
    📅 [installDate] at [installTime]<br>
    📍 [eventVenue]</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[bulletinLink]" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Setup Instructions</a>
    </p>

    <p>Getting excited!<br>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 10,
  trigger_time: '09:00',
  filter_criteria: { status: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

create_email(template, {
  name: '4 Days Before Event',
  position: 13,
  category: 'event_countdown',
  subject_template: 'This Weekend: [eventName] Final Details',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p><strong>[eventName]</strong> is this weekend!</p>

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

    <p>Can't wait to see you!<br>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 4,
  trigger_time: '16:00',
  filter_criteria: { status: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

create_email(template, {
  name: '2 Days Before Event',
  position: 14,
  category: 'event_countdown',
  subject_template: '2 Days Away! [eventName] Weather & Updates',
  body_template: <<~HTML,
    <p>Hi [firstName],</p>

    <p>Just 2 days until <strong>[eventName]</strong>!</p>

    <h3>Quick Reminders:</h3>
    <p>📅 <strong>Setup:</strong> [installDate] at [installTime]<br>
    🎪 <strong>Event:</strong> [eventDate] at [eventTime]<br>
    📍 <strong>Where:</strong> [eventVenue]</p>

    <p><strong>Weather Forecast:</strong> Check local weather and plan accordingly!</p>

    <p><strong>Last-Minute Questions?</strong><br>
    Contact us at [organizationEmail]</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="[bulletinLink]" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Check for Updates</a>
    </p>

    <p>Almost here!<br>
    [organizationName]</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 2,
  trigger_time: '17:00',
  filter_criteria: { status: [ 'approved', 'confirmed' ] },
  enabled_by_default: true
})

create_email(template, {
  name: 'Day of Event',
  position: 15,
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

    <p>See you soon!<br>
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
  position: 16,
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

puts "      ✓ Added 7 event countdown emails"

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
puts "   Application Updates: #{template.email_template_items.where(category: 'application_updates').count}"
puts "   Payment Reminders: #{template.email_template_items.where(category: 'payment_reminders').count}"
puts "   Event Countdown: #{template.email_template_items.where(category: 'event_countdown').count}"

puts "\n🎉 Ready to automate events!\n\n"
