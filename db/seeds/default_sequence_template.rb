# Default Sequence Email Campaign Template Seed Data
# Creates a comprehensive sequence with 22 category-specific emails
# for Artist vs Vendor categories with art calls, payment reminders, and countdown
#
# Category Filtering:
# - Artist emails: filter_criteria: { vendor_category: 'Artist' }
# - Vendor emails: filter_criteria: { vendor_category: 'Vendor' }

puts "\nSeeding Default Sequence Email Campaign Template...\n"

# Check if default sequence template already exists
existing_sequence = EmailCampaignTemplate.find_by(
  template_type: 'system',
  name: 'Default Sequence'
)

if existing_sequence
  puts "Default Sequence template already exists (ID: #{existing_sequence.id})"
  puts "Skipping creation."
  exit 0
end

# Create the Default Sequence system template
puts "\n1. Creating Default Sequence Template..."
template = EmailCampaignTemplate.create!(
  template_type: 'system',
  name: 'Default Sequence',
  description: 'Comprehensive email sequence with 22 category-specific emails including art calls, payment reminders, and event countdown for Artist and Vendor categories',
  is_default: false
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

position = 1

# ==============================================================================
# CATEGORY 1: ART CALLS (4 emails - Artists only)
# ==============================================================================

puts "   Art Calls (Artists)..."

create_email(template, {
  name: 'Art Call #1 - 6 Weeks Out',
  position: position,
  category: 'art_calls',
  subject_template: 'Call for Artists: [eventName] in [eventCity]',
  body_template: <<~HTML,
    <p>Hi there,</p>

    <p>We're excited to announce the <strong>[organizationName]</strong> is coming to <strong>[eventLocation]</strong> on <strong>[dateRange]</strong>!</p>

    <p>We're looking for talented artists to showcase their work at this unique art party experience.</p>

    <p><strong>Event Details:</strong><br/>
    <strong>Date:</strong> [dateRange]<br/>
    <strong>Location:</strong> [eventLocation]<br/>
    <strong>Age Restriction:</strong> [ageRestriction]+<br/>
    <strong>Application Deadline:</strong> [applicationDeadline]</p>

    <p><strong>What We're Looking For:</strong><br/>
    Original artwork, paintings, prints, photography, mixed media, and more. All styles and mediums welcome.</p>

    <p><strong>Exhibition Pricing:</strong><br/>
    <strong>Early Rate:</strong> $20 for your first two pieces (if paid by [paymentDueDate])<br/>
    <strong>Late Rate:</strong> $25 for your first two pieces (if paid after [paymentDueDate])<br/>
    <strong>Additional Work:</strong> All additional pieces (3–10) follow the same rate based on your payment date.</p>

    <p>Apply now: <a href="[applicationLink]" style="color: #0066cc; text-decoration: underline;">[applicationLink]</a></p>

    <p>Best,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 42, # 6 weeks
  trigger_time: '10:00',
  filter_criteria: { vendor_category: 'Artist' },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Art Call #2 - 5 Weeks Out',
  position: position,
  category: 'art_calls',
  subject_template: 'Artists: Apply Now for [eventName]',
  body_template: <<~HTML,
    <p>Hi Artist,</p>

    <p>Applications are still open for the <strong>[organizationName]</strong> in <strong>[eventCity]</strong>!</p>

    <p><strong>Event Date:</strong> [dateRange]<br/>
    <strong>Location:</strong> [eventVenue], [eventLocation]<br/>
    <strong>Age Policy:</strong> [ageRestriction]+</p>

    <p><strong>Exhibition Details:</strong><br/>
    • Display 2–10 original pieces<br/>
    • No commission - keep 100% of sales<br/>
    • Size limit: 3ft x 3ft per piece<br/>
    • Early bird pricing available until [paymentDueDate]</p>

    <p>View full details and apply: <a href="[applicationLink]" style="color: #0066cc; text-decoration: underline;">[applicationLink]</a></p>

    <p>Don't miss out on this opportunity!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 35, # 5 weeks
  trigger_time: '14:00',
  filter_criteria: { vendor_category: 'Artist' },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Art Call #3 - 4 Weeks Out',
  position: position,
  category: 'art_calls',
  subject_template: 'Final Weeks to Apply: [eventName]',
  body_template: <<~HTML,
    <p>Hi there,</p>

    <p>Time is running out to apply for the <strong>[organizationName]</strong> in <strong>[eventCity]</strong>.</p>

    <p><strong>Application Deadline:</strong> [applicationDeadline]<br/>
    <strong>Event Date:</strong> [dateRange]<br/>
    <strong>Location:</strong> [eventLocation]</p>

    <p><strong>Why Participate:</strong><br/>
    • Showcase your work to hundreds of art enthusiasts<br/>
    • Network with fellow artists and collectors<br/>
    • No commission on sales<br/>
    • Affordable exhibition fees with early bird pricing</p>

    <p>Apply before the deadline: <a href="[applicationLink]" style="color: #0066cc; text-decoration: underline;">[applicationLink]</a></p>

    <p>We'd love to feature your work!</p>

    <p>Best,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 28, # 4 weeks
  trigger_time: '11:00',
  filter_criteria: { vendor_category: 'Artist' },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Art Call #4 - Last Chance',
  position: position,
  category: 'art_calls',
  subject_template: 'LAST CHANCE: Artist Applications Close Soon',
  body_template: <<~HTML,
    <p>Hi Artist,</p>

    <p>This is your last chance to apply for the <strong>[organizationName]</strong> in <strong>[eventCity]</strong>!</p>

    <p><strong>Application Deadline:</strong> [applicationDeadline]<br/>
    <strong>Event Date:</strong> [dateRange]<br/>
    <strong>Location:</strong> [eventVenue]</p>

    <p>Don't miss this opportunity to showcase your work at one of the most exciting art events of the year.</p>

    <p><strong>Quick Reminder:</strong><br/>
    • $20-$25 per piece (based on payment date)<br/>
    • No commission<br/>
    • Display 2–10 pieces<br/>
    • Applications close [applicationDeadline]</p>

    <p><strong>Apply NOW:</strong> <a href="[applicationLink]" style="color: #0066cc; text-decoration: underline;">[applicationLink]</a></p>

    <p>This is your final reminder!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 21, # 3 weeks
  trigger_time: '09:00',
  filter_criteria: { vendor_category: 'Artist' },
  enabled_by_default: true
})
position += 1

puts "      Added 4 art call emails"

# ==============================================================================
# CATEGORY 2: ARTIST PAYMENT REMINDERS (6 emails)
# ==============================================================================

puts "   Artist Payment Reminders..."

create_email(template, {
  name: 'Artist Payment - Early Rate Announcement',
  position: position,
  category: 'artist_payment',
  subject_template: 'Early Bird Pricing: Lock in $20/piece for [eventName]',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>Congratulations on being accepted to the <strong>[organizationName]</strong>!</p>

    <p>Early bird pricing is now available. Pay by <strong>[paymentDueDate]</strong> to lock in the $20/piece rate.</p>

    <p><strong>Pricing:</strong><br/>
    <strong>Early Rate:</strong> $20/piece (pay by [paymentDueDate])<br/>
    <strong>Late Rate:</strong> $25/piece (after [paymentDueDate])</p>

    <p><strong>Payment Link:</strong> <a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">[categoryPaymentLink]</a></p>

    <p>Save money by paying early!</p>

    <p>Best,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 60,
  trigger_time: '10:00',
  filter_criteria: {
    vendor_category: 'Artist',
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Artist Payment - Early Rate Reminder',
  position: position,
  category: 'artist_payment',
  subject_template: 'Reminder: Early Rate Ends Soon for [eventName]',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>Just a friendly reminder that early bird pricing for <strong>[eventName]</strong> ends on <strong>[paymentDueDate]</strong>.</p>

    <p>Pay by [paymentDueDate] to get the $20/piece rate instead of $25/piece.</p>

    <p><strong>Pay Now:</strong> <a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">[categoryPaymentLink]</a></p>

    <p>Don't miss out on the discount!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 45,
  trigger_time: '14:00',
  filter_criteria: {
    vendor_category: 'Artist',
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Artist Payment - Early Rate Last Chance',
  position: position,
  category: 'artist_payment',
  subject_template: 'LAST CHANCE: Early Rate Ends Soon',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>This is your last chance to lock in the early bird rate of $20/piece for <strong>[eventName]</strong>.</p>

    <p><strong>Deadline:</strong> [paymentDueDate]<br/>
    <strong>Early Rate:</strong> $20/piece<br/>
    <strong>Late Rate (after deadline):</strong> $25/piece</p>

    <p><strong>Pay Now:</strong> <a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">[categoryPaymentLink]</a></p>

    <p>Act fast to save $5 per piece!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 30,
  trigger_time: '09:00',
  filter_criteria: {
    vendor_category: 'Artist',
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Artist Payment - Late Rate Notice',
  position: position,
  category: 'artist_payment',
  subject_template: 'Payment Reminder: [eventName]',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>We haven't received your payment yet for <strong>[eventName]</strong>.</p>

    <p>The late rate of $25/piece is now in effect. Please submit payment to secure your spot.</p>

    <p><strong>Pay Now:</strong> <a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">[categoryPaymentLink]</a></p>

    <p>If you've already paid, please disregard this email.</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 15,
  trigger_time: '11:00',
  filter_criteria: {
    vendor_category: 'Artist',
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Artist Payment - Late Rate Last Chance',
  position: position,
  category: 'artist_payment',
  subject_template: 'URGENT: Payment Required for [eventName]',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>We still haven't received your payment for <strong>[eventName]</strong>.</p>

    <p>Please submit payment ASAP to maintain your spot. Unpaid spots may be released to waitlist artists.</p>

    <p><strong>Pay Now:</strong> <a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">[categoryPaymentLink]</a></p>

    <p>Questions? Contact us at [organizationEmail].</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 7,
  trigger_time: '09:00',
  filter_criteria: {
    vendor_category: 'Artist',
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Artist Payment - Final Deadline',
  position: position,
  category: 'artist_payment',
  subject_template: 'FINAL NOTICE: Payment Deadline for [eventName]',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>This is your final notice. Payment is due immediately for <strong>[eventName]</strong>.</p>

    <p>If we don't receive payment within 48 hours, your spot will be released.</p>

    <p><strong>Pay Now:</strong> <a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">[categoryPaymentLink]</a></p>

    <p>Act now to keep your spot.</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 3,
  trigger_time: '08:00',
  filter_criteria: {
    vendor_category: 'Artist',
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
  enabled_by_default: true
})
position += 1

puts "      Added 6 artist payment reminder emails"

# ==============================================================================
# CATEGORY 3: VENDOR PAYMENT REMINDERS (4 emails)
# ==============================================================================

puts "   Vendor Payment Reminders..."

create_email(template, {
  name: 'Vendor Payment - Reminder #1',
  position: position,
  category: 'vendor_payment',
  subject_template: 'Payment Reminder: Reserve Your Table for [eventName]',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>Congratulations on being accepted for a vendor table at <strong>[eventName]</strong>!</p>

    <p><strong>Table Fee:</strong> [boothPrice]<br/>
    <strong>Event Date:</strong> [eventDate]<br/>
    <strong>Location:</strong> [eventLocation]</p>

    <p><strong>IMPORTANT:</strong> Table space is limited and we CANNOT hold your table without prepayment.</p>

    <p><strong>Pay Now to Secure Your Spot:</strong> <a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">[categoryPaymentLink]</a></p>

    <p>We look forward to having you!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 60,
  trigger_time: '10:00',
  filter_criteria: {
    vendor_category: 'Vendor',
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Vendor Payment - Reminder #2',
  position: position,
  category: 'vendor_payment',
  subject_template: 'Secure Your Table: Payment Due for [eventName]',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>We still need your payment to confirm your vendor table for <strong>[eventName]</strong>.</p>

    <p><strong>Table Fee:</strong> [boothPrice]<br/>
    <strong>Event Date:</strong> [eventDate]</p>

    <p>Table space is filling up fast. Submit payment now to guarantee your spot.</p>

    <p><strong>Pay Now:</strong> <a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">[categoryPaymentLink]</a></p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 30,
  trigger_time: '14:00',
  filter_criteria: {
    vendor_category: 'Vendor',
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Vendor Payment - Last Chance',
  position: position,
  category: 'vendor_payment',
  subject_template: 'LAST CHANCE: Pay Now or Lose Your Table',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>This is your last chance to secure your vendor table for <strong>[eventName]</strong>.</p>

    <p>If we don't receive payment soon, your table will be released to someone on the waitlist.</p>

    <p><strong>Pay Immediately:</strong> <a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">[categoryPaymentLink]</a></p>

    <p>Don't miss out!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 7,
  trigger_time: '09:00',
  filter_criteria: {
    vendor_category: 'Vendor',
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Vendor Payment - Final Deadline',
  position: position,
  category: 'vendor_payment',
  subject_template: 'FINAL NOTICE: Payment Deadline for [eventName]',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>This is your FINAL notice. Your vendor table will be released in 48 hours if we don't receive payment.</p>

    <p><strong>Pay NOW:</strong> <a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">[categoryPaymentLink]</a></p>

    <p>This is your last opportunity.</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 3,
  trigger_time: '08:00',
  filter_criteria: {
    vendor_category: 'Vendor',
    statuses: [ 'approved' ],
    payment_status: [ 'pending', 'overdue' ]
  },
  enabled_by_default: true
})
position += 1

puts "      Added 4 vendor payment reminder emails"

# ==============================================================================
# CATEGORY 4: ARTIST COUNTDOWN (4 emails)
# ==============================================================================

puts "   Artist Event Countdown..."

create_email(template, {
  name: 'Artist Countdown - 2 Weeks Out',
  position: position,
  category: 'artist_countdown',
  subject_template: '2 Weeks Until [eventName]!',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>Just 2 weeks until <strong>[eventName]</strong>!</p>

    <p><strong>Event Date:</strong> [eventDate]<br/>
    <strong>Location:</strong> [eventVenue], [eventLocation]<br/>
    <strong>Load-in Time:</strong> [installTime]</p>

    <p><strong>Quick Reminders:</strong><br/>
    • Bring 2–10 pieces (max 3ft x 3ft each)<br/>
    • No tables in gallery space<br/>
    • Arrive during your load-in window<br/>
    • All work must be taken home at end of night</p>

    <p>Questions? Check your dashboard: <a href="[dashboardLink]" style="color: #0066cc; text-decoration: underline;">[dashboardLink]</a></p>

    <p>See you soon!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 14,
  trigger_time: '10:00',
  filter_criteria: {
    vendor_category: 'Artist',
    statuses: [ 'approved', 'confirmed' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Artist Countdown - 1 Week Out',
  position: position,
  category: 'artist_countdown',
  subject_template: '1 Week Until [eventName]!',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>One week to go until <strong>[eventName]</strong>!</p>

    <p><strong>Event Details:</strong><br/>
    <strong>Date:</strong> [eventDate]<br/>
    <strong>Time:</strong> [eventTime]<br/>
    <strong>Venue:</strong> [eventVenue]<br/>
    <strong>Load-in:</strong> [installTime]</p>

    <p>Make sure you're prepared and have everything you need!</p>

    <p>See you next week!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 7,
  trigger_time: '15:00',
  filter_criteria: {
    vendor_category: 'Artist',
    statuses: [ 'approved', 'confirmed' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Artist Countdown - Final Prep',
  position: position,
  category: 'artist_countdown',
  subject_template: 'Final Prep: [eventName] This Weekend',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p><strong>[eventName]</strong> is just 3 days away!</p>

    <p><strong>Final Checklist:</strong><br/>
    ✓ Artwork ready (2–10 pieces, max 3ft x 3ft)<br/>
    ✓ Know your load-in time: [installTime]<br/>
    ✓ Venue address saved: [eventVenue], [eventLocation]<br/>
    ✓ Plan for transporting artwork home</p>

    <p><strong>Age Restriction:</strong> [ageRestriction]+</p>

    <p>We're excited to see your work!</p>

    <p>Best,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 3,
  trigger_time: '11:00',
  filter_criteria: {
    vendor_category: 'Artist',
    statuses: [ 'approved', 'confirmed' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Artist Countdown - See You Tomorrow',
  position: position,
  category: 'artist_countdown',
  subject_template: 'Tomorrow: [eventName] - Final Details',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p><strong>[eventName]</strong> is TOMORROW!</p>

    <p><strong>Load-in Time:</strong> [installTime]<br/>
    <strong>Venue:</strong> [eventVenue]<br/>
    <strong>Address:</strong> [eventLocation]<br/>
    <strong>Event Time:</strong> [eventTime]</p>

    <p><strong>Tomorrow:</strong><br/>
    • Arrive during your load-in window<br/>
    • Check in at artist desk<br/>
    • Set up your work<br/>
    • Sell your art (keep 100%!)<br/>
    • Take everything home at end of night</p>

    <p>See you tomorrow!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 1,
  trigger_time: '17:00',
  filter_criteria: {
    vendor_category: 'Artist',
    statuses: [ 'approved', 'confirmed' ]
  },
  enabled_by_default: true
})
position += 1

puts "      Added 4 artist countdown emails"

# ==============================================================================
# CATEGORY 5: VENDOR COUNTDOWN (4 emails)
# ==============================================================================

puts "   Vendor Event Countdown..."

create_email(template, {
  name: 'Vendor Countdown - 2 Weeks Out',
  position: position,
  category: 'vendor_countdown',
  subject_template: '2 Weeks Until [eventName]!',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>Just 2 weeks until <strong>[eventName]</strong>!</p>

    <p><strong>Event Date:</strong> [eventDate]<br/>
    <strong>Location:</strong> [eventVenue], [eventLocation]<br/>
    <strong>Setup Time:</strong> [installTime]</p>

    <p><strong>Vendor Reminders:</strong><br/>
    • One 6ft table area<br/>
    • Bring your own table and chair<br/>
    • Arrive during your setup window<br/>
    • No canvases or large prints allowed on tables</p>

    <p>Questions? Check your dashboard: <a href="[dashboardLink]" style="color: #0066cc; text-decoration: underline;">[dashboardLink]</a></p>

    <p>See you in 2 weeks!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 14,
  trigger_time: '10:00',
  filter_criteria: {
    vendor_category: 'Vendor',
    statuses: [ 'approved', 'confirmed' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Vendor Countdown - 1 Week Out',
  position: position,
  category: 'vendor_countdown',
  subject_template: '1 Week Until [eventName]!',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p>One week to go until <strong>[eventName]</strong>!</p>

    <p><strong>Event Details:</strong><br/>
    <strong>Date:</strong> [eventDate]<br/>
    <strong>Time:</strong> [eventTime]<br/>
    <strong>Venue:</strong> [eventVenue]<br/>
    <strong>Setup:</strong> [installTime]</p>

    <p>Start preparing your merchandise and table setup!</p>

    <p>See you next week!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 7,
  trigger_time: '15:00',
  filter_criteria: {
    vendor_category: 'Vendor',
    statuses: [ 'approved', 'confirmed' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Vendor Countdown - Final Details',
  position: position,
  category: 'vendor_countdown',
  subject_template: 'Final Details: [eventName] This Weekend',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p><strong>[eventName]</strong> is just 3 days away!</p>

    <p><strong>Final Checklist:</strong><br/>
    ✓ Table and chair ready<br/>
    ✓ Merchandise organized<br/>
    ✓ Know your setup time: [installTime]<br/>
    ✓ Venue address saved: [eventVenue], [eventLocation]<br/>
    ✓ Payment method for customers</p>

    <p><strong>Age Restriction:</strong> [ageRestriction]+</p>

    <p>Ready to sell? We are!</p>

    <p>Best,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 3,
  trigger_time: '11:00',
  filter_criteria: {
    vendor_category: 'Vendor',
    statuses: [ 'approved', 'confirmed' ]
  },
  enabled_by_default: true
})
position += 1

create_email(template, {
  name: 'Vendor Countdown - See You Tomorrow',
  position: position,
  category: 'vendor_countdown',
  subject_template: 'Tomorrow: [eventName] - Setup & Sell',
  body_template: <<~HTML,
    <p>Hi [greetingName],</p>

    <p><strong>[eventName]</strong> is TOMORROW!</p>

    <p><strong>Setup Time:</strong> [installTime]<br/>
    <strong>Venue:</strong> [eventVenue]<br/>
    <strong>Address:</strong> [eventLocation]<br/>
    <strong>Event Time:</strong> [eventTime]</p>

    <p><strong>Tomorrow:</strong><br/>
    • Arrive during setup window<br/>
    • Bring table and chair<br/>
    • Check in at vendor desk<br/>
    • Set up your merchandise<br/>
    • Sell and have fun!</p>

    <p>See you tomorrow!</p>

    <p>Thanks,<br/>
    [organizationName]</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

    <p style="font-size: 12px; color: #888888;">
      <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
    </p>

    <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
  HTML
  trigger_type: 'days_before_event',
  trigger_value: 1,
  trigger_time: '17:00',
  filter_criteria: {
    vendor_category: 'Vendor',
    statuses: [ 'approved', 'confirmed' ]
  },
  enabled_by_default: true
})
position += 1

puts "      Added 4 vendor countdown emails"

puts "\nDefault Sequence Template Setup Complete!"
puts "Total: 22 email templates created"
puts "\nBreakdown:"
puts "  - 4 Art Calls (Artists only)"
puts "  - 6 Artist Payment Reminders"
puts "  - 4 Vendor Payment Reminders"
puts "  - 4 Artist Event Countdown"
puts "  - 4 Vendor Event Countdown"
puts "\nThis template can now be selected during event creation."
