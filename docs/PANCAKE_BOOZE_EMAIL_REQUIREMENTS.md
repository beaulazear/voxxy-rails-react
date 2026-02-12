# Pancake & Booze Email Sequence Requirements

## Overview

This document outlines the complete email sequence requirements for Pancake & Booze art show events. This is a **NEW** email campaign template that should be created as a separate sequence from the existing default event campaign flow.

**IMPORTANT**: Do NOT modify the existing "Default Event Campaign" that is currently in staging. This Pancake & Booze sequence should be implemented as a new, separate template that can be selected independently.

## Implementation Goals

1. Create a new `EmailCampaignTemplate` with:
   - `name`: "Pancake & Booze Event Campaign"
   - `template_type`: "system"
   - `is_default`: false
   - 30 email templates organized into 5 categories

2. Allow event creators to choose between:
   - Default Event Campaign (existing flow)
   - Pancake & Booze Event Campaign (this new flow)

3. Support vendor category filtering (Artists vs Vendors)
4. Support payment status filtering
5. Use existing variable resolution system

## Technical Architecture

### Email Campaign Template Structure

```ruby
EmailCampaignTemplate.create!(
  name: "Pancake & Booze Event Campaign",
  description: "Complete email sequence for Pancake & Booze art shows with separate flows for Artists and Vendors, including waitlist and rejection communications",
  template_type: "system",
  is_default: false
)
```

### Required Model Updates

**app/models/email_template_item.rb**

Add three new trigger types to the validation:

```ruby
validates :trigger_type, presence: true, inclusion: {
  in: %w[
    days_before_event
    days_after_event
    days_before_deadline
    on_event_date
    on_application_open
    on_application_submit
    on_approval
    on_waitlist          # NEW - triggered when applicant is waitlisted
    on_rejection         # NEW - triggered when applicant is rejected
    on_payment_received  # NEW - triggered when payment is confirmed
    days_before_payment_deadline
    on_payment_deadline
  ]
}
```

### Filter Criteria Structure

Filter criteria uses JSONB with this structure:

```ruby
{
  "vendor_category": ["Artists"],  # or ["Vendors"], or both, or omit for all
  "payment_status": ["paid"]       # or ["pending"], or ["unpaid"], or omit for all
}
```

**Examples:**
- Artists only, any payment status: `{"vendor_category": ["Artists"]}`
- Vendors only, paid: `{"vendor_category": ["Vendors"], "payment_status": ["paid"]}`
- All categories, paid: `{"payment_status": ["paid"]}`
- All categories, all statuses: `{}` or `nil`

## Variable Mapping

The email templates use the following variables from the existing system:

| Template Variable | System Variable | Description |
|------------------|-----------------|-------------|
| `[eventName]` | Event title | Full event name |
| `[greetingName]` | Contact first name | Recipient's first name |
| `[categoryPaymentLink]` | Category-specific payment URL | Link to pay for specific vendor category |
| `[eventCity]` | Event location city | City where event takes place |
| `[boothPrice]` | Vendor booth price | Cost per booth |
| `[installDate]` | Event install date | Date for booth setup |
| `[installTime]` | Event install time | Time for booth setup |
| `[venueName]` | Event venue name | Name of venue |
| `[venueAddress]` | Event venue address | Full venue address |
| `[eventDate]` | Event start date | Date of the event |

## Complete Email Sequence (30 Emails)

### Category 1: Initial Outreach (8 emails)

#### Email 1: Initial Invitation - Artists
- **Position**: 1
- **Category**: `initial_outreach`
- **Trigger**: `days_before_event`, value: `60`
- **Filter Criteria**: `{"vendor_category": ["Artists"]}`
- **Subject**: "Join Us at [eventName] - Artist Application Now Open!"
- **Body**:
```
Hi [greetingName],

We're excited to invite you to showcase your art at [eventName]!

This is your chance to connect with art lovers, sell your work, and be part of an unforgettable event in [eventCity].

**Event Details:**
- Date: [eventDate]
- Location: [venueName], [venueAddress]
- Booth Price: [boothPrice]

**What's Included:**
- 6ft table and 2 chairs
- High foot traffic event with 500+ attendees
- Promotion across our social media channels
- Complimentary drink ticket

**How to Apply:**
1. Click here to submit your application: [categoryPaymentLink]
2. Upload 3-5 images of your work
3. Pay your booth fee to secure your spot

Spaces are limited and fill up fast! Apply today to reserve your spot.

Looking forward to seeing your art at the show!

Best,
The Pancake & Booze Team
```

#### Email 2: Initial Invitation - Vendors
- **Position**: 2
- **Category**: `initial_outreach`
- **Trigger**: `days_before_event`, value: `60`
- **Filter Criteria**: `{"vendor_category": ["Vendors"]}`
- **Subject**: "Vendor Opportunity at [eventName] - Apply Now!"
- **Body**:
```
Hi [greetingName],

We're thrilled to invite your business to participate as a vendor at [eventName]!

Join us for an evening of art, food, and community in [eventCity].

**Event Details:**
- Date: [eventDate]
- Location: [venueName], [venueAddress]
- Vendor Booth: [boothPrice]

**What You Get:**
- 6ft table with tablecloth
- Access to 500+ event attendees
- Social media promotion before and during the event
- Networking opportunities with local businesses

**Next Steps:**
Apply here: [categoryPaymentLink]

Vendor spots are limited, so secure yours today!

Cheers,
The Pancake & Booze Team
```

#### Email 3: Reminder - Artists (45 days out)
- **Position**: 3
- **Category**: `initial_outreach`
- **Trigger**: `days_before_event`, value: `45`
- **Filter Criteria**: `{"vendor_category": ["Artists"]}`
- **Subject**: "Don't Miss Out - [eventName] Artist Spots Filling Fast!"
- **Body**:
```
Hi [greetingName],

Just a friendly reminder that artist applications for [eventName] are open, and spots are filling up quickly!

**Event**: [eventName]
**Date**: [eventDate]
**Location**: [eventCity]
**Booth Fee**: [boothPrice]

We'd love to have you join us. This is a fantastic opportunity to showcase your work to hundreds of art enthusiasts.

**Apply Now**: [categoryPaymentLink]

Don't wait - spaces are limited!

Best,
The Pancake & Booze Team
```

#### Email 4: Reminder - Vendors (45 days out)
- **Position**: 4
- **Category**: `initial_outreach`
- **Trigger**: `days_before_event`, value: `45`
- **Filter Criteria**: `{"vendor_category": ["Vendors"]}`
- **Subject**: "Last Chance to Join [eventName] as a Vendor!"
- **Body**:
```
Hi [greetingName],

Vendor spots for [eventName] are filling fast! We wanted to give you one more chance to join us.

**Event Details:**
- Date: [eventDate]
- Location: [venueName]
- Booth Fee: [boothPrice]

This is a great opportunity to connect with our community and promote your brand to 500+ attendees.

**Apply Now**: [categoryPaymentLink]

We hope to see you there!

Best,
The Pancake & Booze Team
```

#### Email 5: Final Call - Artists (30 days out)
- **Position**: 5
- **Category**: `initial_outreach`
- **Trigger**: `days_before_event`, value: `30`
- **Filter Criteria**: `{"vendor_category": ["Artists"]}`
- **Subject**: "Final Call: Artist Spots for [eventName]!"
- **Body**:
```
Hi [greetingName],

This is your FINAL reminder - artist applications for [eventName] close soon!

We have just a few spots left, and we'd love for you to be part of the show.

**Event**: [eventDate] in [eventCity]
**Booth Fee**: [boothPrice]

**Secure Your Spot**: [categoryPaymentLink]

Don't miss this opportunity to showcase your art!

Best,
The Pancake & Booze Team
```

#### Email 6: Final Call - Vendors (30 days out)
- **Position**: 6
- **Category**: `initial_outreach`
- **Trigger**: `days_before_event`, value: `30`
- **Filter Criteria**: `{"vendor_category": ["Vendors"]}`
- **Subject**: "Final Call: Vendor Spots for [eventName]!"
- **Body**:
```
Hi [greetingName],

This is your last chance to join [eventName] as a vendor!

We have very limited spots remaining, and we'd love to have you participate.

**Event**: [eventDate]
**Location**: [venueName]

**Apply Now**: [categoryPaymentLink]

Don't miss out on this great opportunity!

Best,
The Pancake & Booze Team
```

#### Email 7: Application Received - All Categories
- **Position**: 7
- **Category**: `initial_outreach`
- **Trigger**: `on_application_submit`
- **Filter Criteria**: `{}`
- **Subject**: "We Received Your Application for [eventName]!"
- **Body**:
```
Hi [greetingName],

Thanks for applying to [eventName]! We've received your application and are reviewing it now.

**What's Next:**
1. We'll review your application within 3-5 business days
2. If approved, you'll receive a payment link to secure your spot
3. Once payment is received, you're all set!

We'll be in touch soon!

Best,
The Pancake & Booze Team
```

#### Email 8: Application Approved - All Categories
- **Position**: 8
- **Category**: `initial_outreach`
- **Trigger**: `on_approval`
- **Filter Criteria**: `{}`
- **Subject**: "Approved! Reserve Your Spot at [eventName]"
- **Body**:
```
Hi [greetingName],

Great news! Your application for [eventName] has been APPROVED!

**Next Step**: Pay your booth fee to secure your spot: [categoryPaymentLink]

**Booth Fee**: [boothPrice]

Once we receive your payment, you're officially confirmed for the event. Spots are limited, so please complete your payment soon to reserve your space.

We can't wait to have you at the show!

Best,
The Pancake & Booze Team
```

### Category 2: Pre-Event Communication (10 emails)

#### Email 9: Payment Confirmation - Artists
- **Position**: 9
- **Category**: `pre_event_communication`
- **Trigger**: `on_payment_received`
- **Filter Criteria**: `{"vendor_category": ["Artists"], "payment_status": ["paid"]}`
- **Subject**: "Payment Received - You're Confirmed for [eventName]!"
- **Body**:
```
Hi [greetingName],

Your payment has been received and you're officially confirmed for [eventName]!

**Event Details:**
- Date: [eventDate]
- Location: [venueName], [venueAddress]
- Install Time: [installDate] at [installTime]

**What to Bring:**
- Your artwork ready to display
- Business cards and price lists
- Any additional display materials you need

We'll send you more details about load-in and setup in the coming weeks.

See you soon!

Best,
The Pancake & Booze Team
```

#### Email 10: Payment Confirmation - Vendors
- **Position**: 10
- **Category**: `pre_event_communication`
- **Trigger**: `on_payment_received`
- **Filter Criteria**: `{"vendor_category": ["Vendors"], "payment_status": ["paid"]}`
- **Subject**: "Payment Received - You're Confirmed for [eventName]!"
- **Body**:
```
Hi [greetingName],

Your payment has been received and you're all set for [eventName]!

**Event Details:**
- Date: [eventDate]
- Venue: [venueName], [venueAddress]
- Load-In: [installDate] at [installTime]

**What's Provided:**
- 6ft table with tablecloth
- 2 chairs
- Access to power (limited - first come, first served)

We'll send setup instructions and day-of details soon!

Thanks,
The Pancake & Booze Team
```

#### Email 11: Welcome Email - Artists (14 days out)
- **Position**: 11
- **Category**: `pre_event_communication`
- **Trigger**: `days_before_event`, value: `14`
- **Filter Criteria**: `{"vendor_category": ["Artists"], "payment_status": ["paid"]}`
- **Subject**: "Welcome to [eventName] - Important Info for Artists"
- **Body**:
```
Hi [greetingName],

We're just 2 weeks away from [eventName]! Here's everything you need to know:

**Load-In Details:**
- Date: [installDate]
- Time: [installTime]
- Location: [venueName], [venueAddress]

**Setup Instructions:**
- Each artist gets a 6ft table and 2 chairs
- Please arrive during load-in time to set up your space
- Bring your own display materials (easels, frames, etc.)

**Event Guidelines:**
- Display price tags clearly
- Be prepared to accept cash, Venmo, or card payments
- Engage with attendees - this is a social event!

**Parking:**
Street parking is available nearby. Please allow extra time to find parking and unload.

Looking forward to seeing you and your art!

Best,
The Pancake & Booze Team
```

#### Email 12: Welcome Email - Vendors (14 days out)
- **Position**: 12
- **Category**: `pre_event_communication`
- **Trigger**: `days_before_event`, value: `14`
- **Filter Criteria**: `{"vendor_category": ["Vendors"], "payment_status": ["paid"]}`
- **Subject**: "Welcome to [eventName] - Vendor Information"
- **Body**:
```
Hi [greetingName],

[eventName] is just 2 weeks away! Here's what you need to know:

**Load-In:**
- Date: [installDate]
- Time: [installTime]
- Venue: [venueName], [venueAddress]

**What's Provided:**
- 6ft table with tablecloth
- 2 chairs
- Limited power access (first come, first served)

**What to Bring:**
- Your products/samples
- Marketing materials (business cards, flyers)
- Payment processing equipment if needed
- Any additional display materials

**Event Tips:**
- Bring plenty of business cards
- Be ready to engage with 500+ attendees
- Have a clear display and pricing

See you soon!

Best,
The Pancake & Booze Team
```

#### Email 13: Load-In Reminder - Artists (7 days out)
- **Position**: 13
- **Category**: `pre_event_communication`
- **Trigger**: `days_before_event`, value: `7`
- **Filter Criteria**: `{"vendor_category": ["Artists"], "payment_status": ["paid"]}`
- **Subject**: "1 Week Away! Load-In Reminder for [eventName]"
- **Body**:
```
Hi [greetingName],

We're 1 week away from [eventName]! Here's a quick reminder about load-in:

**Load-In:**
- Date: [installDate]
- Time: [installTime]
- Location: [venueName], [venueAddress]

**Checklist:**
- ✓ Artwork ready to display
- ✓ Price tags/labels
- ✓ Business cards
- ✓ Payment processing method
- ✓ Display materials (easels, frames, etc.)

**Important:**
Please arrive during the load-in window to set up your booth. Late arrivals may lose their table space.

Parking can be tight, so plan to arrive early!

See you next week!

Best,
The Pancake & Booze Team
```

#### Email 14: Load-In Reminder - Vendors (7 days out)
- **Position**: 14
- **Category**: `pre_event_communication`
- **Trigger**: `days_before_event`, value: `7`
- **Filter Criteria**: `{"vendor_category": ["Vendors"], "payment_status": ["paid"]}`
- **Subject**: "1 Week Away! Load-In Details for [eventName]"
- **Body**:
```
Hi [greetingName],

Only 1 week until [eventName]! Here are your load-in details:

**Load-In:**
- Date: [installDate]
- Time: [installTime]
- Venue: [venueName], [venueAddress]

**Vendor Checklist:**
- ✓ Products/samples
- ✓ Marketing materials
- ✓ Business cards
- ✓ Display setup
- ✓ Payment equipment (if needed)

**Reminder:**
Arrive during load-in time to claim your table. Limited power is available first-come, first-served.

We're excited to have you!

Best,
The Pancake & Booze Team
```

#### Email 15: Day-Before Reminder - Artists
- **Position**: 15
- **Category**: `pre_event_communication`
- **Trigger**: `days_before_event`, value: `1`
- **Filter Criteria**: `{"vendor_category": ["Artists"], "payment_status": ["paid"]}`
- **Subject**: "Tomorrow! Final Details for [eventName]"
- **Body**:
```
Hi [greetingName],

[eventName] is TOMORROW! Here are your final details:

**Load-In:**
- Tomorrow: [installDate]
- Time: [installTime]
- Venue: [venueName], [venueAddress]

**Event Start:** Doors open at [eventDate]

**What to Bring:**
- Your art, ready to display
- Price tags clearly visible
- Business cards
- Payment processing setup

**Tips for Success:**
- Engage with attendees - smile and say hello!
- Be ready to talk about your work
- Have a variety of price points if possible
- Network with other artists

Can't wait to see you tomorrow!

Best,
The Pancake & Booze Team
```

#### Email 16: Day-Before Reminder - Vendors
- **Position**: 16
- **Category**: `pre_event_communication`
- **Trigger**: `days_before_event`, value: `1`
- **Filter Criteria**: `{"vendor_category": ["Vendors"], "payment_status": ["paid"]}`
- **Subject**: "Tomorrow! Final Reminders for [eventName]"
- **Body**:
```
Hi [greetingName],

[eventName] is TOMORROW! Here's what you need to know:

**Load-In:**
- Date: Tomorrow, [installDate]
- Time: [installTime]
- Venue: [venueName], [venueAddress]

**Event Starts:** [eventDate]

**Final Checklist:**
- ✓ Products/samples ready
- ✓ Business cards
- ✓ Display materials
- ✓ Marketing collateral

**Day-Of Tips:**
- Arrive early for best parking
- Bring cash for making change
- Be friendly and engaging
- Collect email sign-ups if you can

See you tomorrow!

Best,
The Pancake & Booze Team
```

#### Email 17: Day-Of Reminder - All Categories
- **Position**: 17
- **Category**: `pre_event_communication`
- **Trigger**: `on_event_date`
- **Filter Criteria**: `{"payment_status": ["paid"]}`
- **Subject**: "TODAY! See You at [eventName]"
- **Body**:
```
Hi [greetingName],

Today's the day! [eventName] is happening TODAY!

**Load-In:** [installTime] at [venueName]
**Address:** [venueAddress]

**Remember:**
- Arrive during load-in to set up
- Parking may be limited - arrive early
- Bring everything you need for your booth
- Have fun and connect with attendees!

We're so excited to have you. See you in a few hours!

Best,
The Pancake & Booze Team
```

#### Email 18: Payment Reminder - 21 Days Before Event
- **Position**: 18
- **Category**: `pre_event_communication`
- **Trigger**: `days_before_event`, value: `21`
- **Filter Criteria**: `{"payment_status": ["pending", "unpaid"]}`
- **Subject**: "Complete Your Payment for [eventName]"
- **Body**:
```
Hi [greetingName],

Your application for [eventName] has been approved, but we haven't received your payment yet.

**Event Date:** [eventDate]
**Booth Fee:** [boothPrice]

**Pay Now:** [categoryPaymentLink]

Spaces are filling up fast! Complete your payment within the next 7 days to guarantee your spot.

If you have any questions or issues with payment, please let us know.

Best,
The Pancake & Booze Team
```

### Category 3: Waitlist Emails (4 emails)

#### Email 19: Waitlist Notification - Artists
- **Position**: 19
- **Category**: `waitlist`
- **Trigger**: `on_waitlist`
- **Filter Criteria**: `{"vendor_category": ["Artists"]}`
- **Subject**: "You're on the Waitlist for [eventName]"
- **Body**:
```
Hi [greetingName],

Thank you for your interest in [eventName]!

Unfortunately, all artist spots are currently full. However, we've added you to our waitlist, and we'll notify you immediately if a spot opens up.

**Event Details:**
- Date: [eventDate]
- Location: [eventCity]

**What Happens Next:**
If a spot becomes available, you'll receive an email with instructions to claim it. Spots are offered on a first-come, first-served basis to waitlisted artists.

We'll also keep you in mind for future Pancake & Booze events in [eventCity].

Thanks for your understanding!

Best,
The Pancake & Booze Team
```

#### Email 20: Waitlist Notification - Vendors
- **Position**: 20
- **Category**: `waitlist`
- **Trigger**: `on_waitlist`
- **Filter Criteria**: `{"vendor_category": ["Vendors"]}`
- **Subject**: "You're on the Waitlist for [eventName]"
- **Body**:
```
Hi [greetingName],

Thanks for applying to [eventName]!

All vendor spots are currently filled, but we've placed you on our waitlist. If a spot opens up, we'll contact you right away.

**Event:** [eventDate] in [eventCity]

**Next Steps:**
If a vendor cancels, you'll receive an email with a link to claim the spot. Please respond quickly, as waitlist spots are offered first-come, first-served.

We appreciate your interest and will keep you in our system for future events!

Best,
The Pancake & Booze Team
```

#### Email 21: Spot Available From Waitlist - Artists
- **Position**: 21
- **Category**: `waitlist`
- **Trigger**: `on_approval`
- **Filter Criteria**: `{"vendor_category": ["Artists"]}`
- **Subject**: "A Spot Opened Up! Claim Your Artist Booth for [eventName]"
- **Body**:
```
Hi [greetingName],

Great news! An artist spot has opened up for [eventName]!

**You have 48 hours to claim this spot.**

**Event Details:**
- Date: [eventDate]
- Location: [venueName], [venueAddress]
- Booth Fee: [boothPrice]

**Claim Your Spot:** [categoryPaymentLink]

Please complete your payment within 48 hours to secure your space. If we don't hear from you, we'll offer the spot to the next person on the waitlist.

Looking forward to having you at the show!

Best,
The Pancake & Booze Team
```

#### Email 22: Spot Available From Waitlist - Vendors
- **Position**: 22
- **Category**: `waitlist`
- **Trigger**: `on_approval`
- **Filter Criteria**: `{"vendor_category": ["Vendors"]}`
- **Subject**: "A Vendor Spot Opened Up for [eventName]!"
- **Body**:
```
Hi [greetingName],

Exciting news! A vendor booth just became available for [eventName]!

**You have 48 hours to claim this spot.**

**Event Details:**
- Date: [eventDate]
- Venue: [venueName]
- Booth Fee: [boothPrice]

**Secure Your Spot:** [categoryPaymentLink]

Complete your payment within 48 hours to confirm. If we don't receive payment, we'll move to the next vendor on our waitlist.

We hope you can join us!

Best,
The Pancake & Booze Team
```

### Category 4: Rejection Emails (2 emails)

#### Email 23: Application Declined - Artists
- **Position**: 23
- **Category**: `rejection`
- **Trigger**: `on_rejection`
- **Filter Criteria**: `{"vendor_category": ["Artists"]}`
- **Subject**: "Update on Your [eventName] Application"
- **Body**:
```
Hi [greetingName],

Thank you for applying to showcase your art at [eventName].

After careful review, we've decided not to move forward with your application for this event. We receive many applications and have limited space, so this decision was difficult.

**We'd Love to See You at Future Events:**
We host Pancake & Booze art shows regularly in [eventCity] and other cities. We encourage you to apply for our next event!

**Stay Connected:**
Follow us on social media to stay updated on upcoming shows and opportunities.

We appreciate your interest and hope to work with you in the future.

Best,
The Pancake & Booze Team
```

#### Email 24: Application Declined - Vendors
- **Position**: 24
- **Category**: `rejection`
- **Trigger**: `on_rejection`
- **Filter Criteria**: `{"vendor_category": ["Vendors"]}`
- **Subject**: "Update on Your [eventName] Vendor Application"
- **Body**:
```
Hi [greetingName],

Thank you for your interest in participating as a vendor at [eventName].

After reviewing all applications, we've decided not to move forward with your business for this particular event. We have limited vendor spots and try to curate a diverse mix of offerings.

**Future Opportunities:**
We host events regularly and would love to consider you for future shows. Please apply again for our next event in [eventCity]!

**Stay in Touch:**
Follow us on social media for announcements about upcoming events.

Thank you for your interest!

Best,
The Pancake & Booze Team
```

### Category 5: Event Day & Follow-Up (6 emails)

#### Email 25: Good Morning Event Day - Artists
- **Position**: 25
- **Category**: `event_day_follow_up`
- **Trigger**: `on_event_date`
- **Filter Criteria**: `{"vendor_category": ["Artists"], "payment_status": ["paid"]}`
- **Subject**: "Good Morning! [eventName] is TODAY!"
- **Body**:
```
Good morning [greetingName]!

TODAY is the day! We're so excited to see you and your art at [eventName]!

**Quick Reminders:**
- Load-In: [installTime]
- Venue: [venueName], [venueAddress]
- Bring your art, business cards, and payment processing setup
- Arrive early for parking

**Tips for a Great Show:**
- Smile and engage with attendees
- Have your prices clearly marked
- Bring business cards to collect leads
- Take photos to share on social media (tag us!)

Can't wait to see you!

Best,
The Pancake & Booze Team
```

#### Email 26: Good Morning Event Day - Vendors
- **Position**: 26
- **Category**: `event_day_follow_up`
- **Trigger**: `on_event_date`
- **Filter Criteria**: `{"vendor_category": ["Vendors"], "payment_status": ["paid"]}`
- **Subject**: "Good Morning! [eventName] is TODAY!"
- **Body**:
```
Good morning [greetingName]!

[eventName] is HERE! We're thrilled to have you joining us today!

**Today's Schedule:**
- Load-In: [installTime]
- Venue: [venueName], [venueAddress]
- Event Start: [eventDate]

**Quick Reminders:**
- Bring all your products and marketing materials
- Have business cards ready
- Be prepared to engage with 500+ attendees
- Take photos and tag us on social media!

Have a fantastic event!

Best,
The Pancake & Booze Team
```

#### Email 27: Thank You - Artists (1 day after)
- **Position**: 27
- **Category**: `event_day_follow_up`
- **Trigger**: `days_after_event`, value: `1`
- **Filter Criteria**: `{"vendor_category": ["Artists"], "payment_status": ["paid"]}`
- **Subject**: "Thank You for Making [eventName] Amazing!"
- **Body**:
```
Hi [greetingName],

Thank you so much for being part of [eventName]! Your art made the event truly special.

**We'd Love Your Feedback:**
How was your experience? Did you meet your goals? We'd love to hear your thoughts - just reply to this email!

**Share Your Success:**
If you took any photos or had great sales, we'd love to see! Tag us on social media or send us your highlights.

**What's Next:**
We have more Pancake & Booze events coming to [eventCity] and other cities. We'd love to have you back! Stay tuned for future opportunities.

Thanks again for being part of our community!

Best,
The Pancake & Booze Team
```

#### Email 28: Thank You - Vendors (1 day after)
- **Position**: 28
- **Category**: `event_day_follow_up`
- **Trigger**: `days_after_event`, value: `1`
- **Filter Criteria**: `{"vendor_category": ["Vendors"], "payment_status": ["paid"]}`
- **Subject**: "Thank You for Joining [eventName]!"
- **Body**:
```
Hi [greetingName],

Thank you for being a vendor at [eventName]! We hope you had a great experience and made some valuable connections.

**We Want Your Feedback:**
How did the event go for you? Any suggestions for next time? Reply to this email and let us know!

**Stay Connected:**
We have upcoming events in [eventCity] and would love to have you participate again. Follow us on social media for announcements!

**Share the Love:**
If you captured any photos or moments from the event, tag us on social media - we'd love to see them!

Thanks again for being part of the Pancake & Booze family!

Best,
The Pancake & Booze Team
```

#### Email 29: Future Events Invitation - Artists (30 days after)
- **Position**: 29
- **Category**: `event_day_follow_up`
- **Trigger**: `days_after_event`, value: `30`
- **Filter Criteria**: `{"vendor_category": ["Artists"], "payment_status": ["paid"]}`
- **Subject**: "We Loved Having You! Join Our Next Event in [eventCity]"
- **Body**:
```
Hi [greetingName],

We loved having your art at [eventName]! We hope you had a great experience.

**Our Next Event is Coming:**
We're planning our next Pancake & Booze event in [eventCity], and we'd love to have you back!

**Early Access:**
As a past participant, you'll get early access to apply before we open applications to the general public. Watch your inbox for details!

**Stay in Touch:**
Follow us on Instagram and Facebook for updates on upcoming shows, artist spotlights, and more.

We can't wait to see you again soon!

Best,
The Pancake & Booze Team
```

#### Email 30: Future Events Invitation - Vendors (30 days after)
- **Position**: 30
- **Category**: `event_day_follow_up`
- **Trigger**: `days_after_event`, value: `30`
- **Filter Criteria**: `{"vendor_category": ["Vendors"], "payment_status": ["paid"]}`
- **Subject**: "Join Us Again! Next Pancake & Booze Event in [eventCity]"
- **Body**:
```
Hi [greetingName],

Thank you for being a vendor at [eventName]! We hope it was a valuable experience for your business.

**We're Planning Our Next Event:**
Pancake & Booze is coming back to [eventCity], and we'd love to have you participate again!

**Early Bird Access:**
As a previous vendor, you'll get priority access to apply before we open spots to new vendors. Stay tuned!

**Follow Us:**
Keep up with our events and announcements by following us on social media.

Looking forward to working with you again!

Best,
The Pancake & Booze Team
```

## Implementation Notes

### Database Structure

Each email should be created as an `EmailTemplateItem` with:
- `email_campaign_template_id`: Foreign key to the Pancake & Booze template
- `name`: Descriptive name (e.g., "Initial Invitation - Artists")
- `category`: One of the 5 categories above
- `position`: Sequential number 1-30
- `subject_template`: Email subject line with variables
- `body_template`: Email body content with variables
- `trigger_type`: One of the trigger types listed above
- `trigger_value`: Integer for day-based triggers, null for event-based triggers
- `filter_criteria`: JSONB with vendor_category and/or payment_status arrays
- `enabled_by_default`: true for all emails

### Backend Logic Required

1. **Template Selection**: Allow event creators to choose which email campaign template to use when creating an event

2. **Variable Resolution**: Implement variable replacement for all system variables listed in the Variable Mapping section

3. **Trigger Processing**: Handle all trigger types:
   - Time-based: Calculate send dates based on event date
   - Event-based: Send immediately when trigger event occurs (application submit, approval, payment, etc.)

4. **Filter Evaluation**: Before sending an email, check if the recipient matches the filter criteria:
   - Check `vendor_category` against applicant's category
   - Check `payment_status` against applicant's current payment status

5. **Payment Link Generation**: Implement category-specific payment links for the `[categoryPaymentLink]` variable

### Testing Checklist

After implementation, verify:

- [ ] Pancake & Booze template appears in template selection UI
- [ ] All 30 emails are created with correct positions
- [ ] Time-based triggers calculate correct send dates
- [ ] Event-based triggers fire on correct actions
- [ ] Filter criteria correctly target Artists vs Vendors
- [ ] Payment status filters work correctly
- [ ] All variables resolve to actual event/contact data
- [ ] Category-specific payment links generate correctly
- [ ] Default Event Campaign is still available and unchanged

### Migration Strategy

1. Create the new email campaign template
2. Seed all 30 email template items
3. Update UI to show template selection dropdown
4. Test with a new test event
5. Verify existing events still use Default Event Campaign
6. Deploy to staging for QA

### Future Enhancements (Out of Scope)

These were discussed but are not part of the initial requirements:

- Time-delayed automated emails (e.g., send 3 days after payment)
- Post-event follow-up surveys
- Automated feedback collection
- A/B testing different email subject lines
- Analytics dashboard for email open/click rates

## Questions or Clarifications

If you have questions while implementing this, please reach out. The key principle is: **Do NOT modify the existing Default Event Campaign**. This should be a completely new, separate template that event creators can opt into.
