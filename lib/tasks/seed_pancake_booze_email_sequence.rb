# Seed script to create the Pancake & Booze Email Campaign Template
# Run this with: rails runner lib/tasks/seed_pancake_booze_email_sequence.rb
#
# This creates a complete 30-email sequence for Pancake & Booze events

class PancakeBoozeSeedService
  def self.create_template!
    template = EmailCampaignTemplate.create!(
      name: "Pancake & Booze Event Campaign",
      description: "Complete email sequence for Pancake & Booze art shows, including invitations, reminders, payment follow-ups, and event countdown emails for both artists and vendors.",
      template_type: "system",
      is_default: false
    )

    puts "Created template: #{template.name} (ID: #{template.id})"

    # Create all 30 email template items
    create_emails(template)

    puts "Successfully created #{template.email_template_items.count} email templates!"
    template
  end

  private

  def self.create_emails(template)
    position = 1

    # 1. INVITATION EMAIL (Initial Outreach)
    create_email!(template, position, {
      name: "Initial Invitation - Applications Open",
      category: "pre_application",
      trigger_type: "on_application_open",
      trigger_value: nil,
      filter_criteria: nil,
      subject: "Submissions Open: [eventName] at [eventVenue]",
      body: <<~BODY
        Hi [greetingName],

        We're pumped to announce that submissions are officially open for the next [eventName] at [eventVenue] on [eventDate].

        This show is going to be MASSIVE. Over 1,000 guests. A huge wall space for artwork. Live music. A full breakfast bar. And, of course, an open bar all night long.

        We want YOU in the mix.

        Here's the TL;DR:
        • Where: [eventVenue] – [eventLocation]
        • When: [eventDate]
        • Artist booth: [boothPrice]
        • Vendor tables also available

        [categoryList]

        Sound good? Hit the link below to lock in your spot.

        [eventLink]

        Submissions are first-come, first-served and spots are already filling up fast. Don't sleep on this.

        Let's make it happen.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 2. APPLICATION RECEIVED - ARTISTS
    create_email!(template, position, {
      name: "Application Received - Artists",
      category: "application",
      trigger_type: "on_application_submit",
      trigger_value: nil,
      filter_criteria: { vendor_category: [ "Artists" ] }.to_json,
      subject: "Application Received - [eventName]",
      body: <<~BODY
        Hi [greetingName],

        Thanks for submitting your application to participate in [eventName] at [eventVenue] on [eventDate].

        We'll review your submission and get back to you ASAP. In the meantime, feel free to check out the event page for all the details, booth pricing, setup times, and more.

        [eventLink]

        We'll be in touch soon.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 3. APPLICATION RECEIVED - VENDORS
    create_email!(template, position, {
      name: "Application Received - Vendors",
      category: "application",
      trigger_type: "on_application_submit",
      trigger_value: nil,
      filter_criteria: { vendor_category: [ "Vendors" ] }.to_json,
      subject: "Vendor Application Received - [eventName]",
      body: <<~BODY
        Hi [greetingName],

        We've received your request to set up a VENDOR TABLE at [eventName] on [eventDate] at [eventVenue].

        We're currently reviewing all vendor submissions and will get back to you shortly with next steps.

        In the meantime, check out the full event page for details on setup, booth specs, and what to expect:

        [eventLink]

        Talk soon.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 4. APPLICATION ACCEPTED - ARTISTS
    create_email!(template, position, {
      name: "Application Accepted - Artists",
      category: "application",
      trigger_type: "on_approval",
      trigger_value: nil,
      filter_criteria: { vendor_category: [ "Artists" ] }.to_json,
      subject: "Congratulations! You're Invited to [eventName]",
      body: <<~BODY
        Hi [greetingName],

        Congratulations! You've been invited to exhibit at [eventName] on [eventDate] at [eventVenue].

        This is going to be an incredible night—live music, a full breakfast bar, open bar, and over 1,000+ guests walking through to see YOUR work on the walls.

        Next Steps:
        1. Confirm your spot by completing payment: [categoryPaymentLink]
        2. Review the artist guide and setup details: [eventLink]
        3. Mark your calendar: [eventDate]

        Early bird pricing is available for a limited time, so lock in your spot ASAP.

        Let us know if you have any questions. We're stoked to have you in the lineup.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 5. APPLICATION ACCEPTED - VENDORS
    create_email!(template, position, {
      name: "Application Accepted - Vendors",
      category: "application",
      trigger_type: "on_approval",
      trigger_value: nil,
      filter_criteria: { vendor_category: [ "Vendors" ] }.to_json,
      subject: "You're Approved to Vend at [eventName]",
      body: <<~BODY
        Hi [greetingName],

        Congratulations! You've been approved to vend at [eventName] on [eventDate] at [eventVenue].

        We're expecting 1,000+ attendees, so this is a killer opportunity to get in front of a huge, engaged crowd.

        Next Steps:
        1. Confirm your vendor table: [categoryPaymentLink]
        2. Review vendor setup guide: [eventLink]
        3. Save the date: [eventDate]

        Vendor spots are limited and filling fast. Get your payment in to secure your table.

        Looking forward to working with you.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 6. WAITLIST NOTIFICATION
    create_email!(template, position, {
      name: "Application Waitlisted",
      category: "application",
      trigger_type: "on_waitlist",
      trigger_value: nil,
      filter_criteria: nil,
      subject: "Waitlist Update - [eventName]",
      body: <<~BODY
        Hi [greetingName],

        Thank you for your interest in [eventName].

        After careful review, we've placed you on the waitlist. If a spot opens up, we'll contact you right away.

        Event: [eventDate]
        Location: [eventLocation]

        We truly appreciate your interest and encourage you to stay tuned for updates.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 7. REJECTION EMAIL
    create_email!(template, position, {
      name: "Application Rejected",
      category: "application",
      trigger_type: "on_rejection",
      trigger_value: nil,
      filter_criteria: nil,
      subject: "Thank You for Applying - [eventName]",
      body: <<~BODY
        Hi [greetingName],

        Thank you for your interest in [eventName].

        After careful review, we're unable to offer you a spot at this event. We truly appreciate the time you took to apply.

        We encourage you to apply to future events — we'd love to work with you!

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # EVENT ANNOUNCEMENTS (To Network Contacts)
    # 8. EVENT ANNOUNCEMENT - 10 WEEKS OUT
    create_email!(template, position, {
      name: "Event Announcement - 10 Weeks Out",
      category: "pre_application",
      trigger_type: "days_before_event",
      trigger_value: 70,
      filter_criteria: nil,
      subject: "[eventName] - Submissions Now Open",
      body: <<~BODY
        Hi [greetingName],

        Pancakes & Booze is back in [eventCity] and submissions are open for our upcoming show at [eventVenue] on [eventDate].

        If you've never been to one of our shows, here's the vibe: 1,000+ people. Incredible art. Live music. A full breakfast spread. An open bar. And an electric energy that lasts all night.

        We're looking for:
        [categoryList]

        Lock in your spot here: [eventLink]

        Submissions are first-come, first-served, so don't wait.

        Let's do this.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 9. EVENT ANNOUNCEMENT - 8 WEEKS OUT
    create_email!(template, position, {
      name: "Event Announcement - 8 Weeks Out",
      category: "pre_application",
      trigger_type: "days_before_event",
      trigger_value: 56,
      filter_criteria: nil,
      subject: "Ready for [eventName]? Lock In Your Spot",
      body: <<~BODY
        Hey [greetingName],

        Ready for another round of Pancakes & Booze? We're back in [eventCity] at [eventVenue] on [eventDate].

        If you want in, now's the time to apply. We've already gotten a massive response and spots are filling up FAST.

        What we're looking for:
        [categoryList]

        Submit here: [eventLink]

        Early bird pricing ends soon, so don't sleep on this.

        Talk soon.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 10. EVENT ANNOUNCEMENT - 4 WEEKS OUT
    create_email!(template, position, {
      name: "Event Announcement - 4 Weeks Out",
      category: "pre_application",
      trigger_type: "days_before_event",
      trigger_value: 28,
      filter_criteria: nil,
      subject: "Nearly Full - Final Call for [eventName]",
      body: <<~BODY
        Hi [greetingName],

        [eventName] on [eventDate] is now just weeks away. We've received an insane response and we're down to our last few artist and vendor spots.

        If you've been thinking about applying—now is the time.

        Final spots available for:
        [categoryList]

        Apply here: [eventLink]

        This is your last call.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 11. EVENT ANNOUNCEMENT - 12 DAYS OUT
    create_email!(template, position, {
      name: "Event Announcement - 12 Days Out",
      category: "pre_application",
      trigger_type: "days_before_event",
      trigger_value: 12,
      filter_criteria: nil,
      subject: "Last Chance - [eventName] Submissions Closing",
      body: <<~BODY
        What's up [greetingName]?

        Just a heads up that submissions for [eventName] on [eventDate] at [eventVenue] will be closing soon.

        We're literally down to the wire here—just a handful of spots left.

        If you want in, apply NOW: [eventLink]

        This is it.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # PAYMENT REMINDERS - ARTISTS
    # 12. ARTIST PAYMENT REMINDER - 39 DAYS OUT
    create_email!(template, position, {
      name: "Artist Payment Reminder - 39 Days Out",
      category: "payment",
      trigger_type: "days_before_event",
      trigger_value: 39,
      filter_criteria: { vendor_category: [ "Artists" ], payment_status: [ "pending", "overdue" ] }.to_json,
      subject: "Ramping Up for [eventName] - Confirm Your Spot",
      body: <<~BODY
        Hi [greetingName],

        We're starting to ramp things up for [eventName] at [eventVenue]. We wanted to remind you that your spot is not confirmed until your payment is completed.

        Complete your payment here: [categoryPaymentLink]

        The early bird discount is still available, but it won't last much longer. Lock in your spot and save.

        Questions? Just reply to this email.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 13. ARTIST PAYMENT REMINDER - 26 DAYS OUT
    create_email!(template, position, {
      name: "Artist Payment Reminder - 26 Days Out",
      category: "payment",
      trigger_type: "days_before_event",
      trigger_value: 26,
      filter_criteria: { vendor_category: [ "Artists" ], payment_status: [ "pending", "overdue" ] }.to_json,
      subject: "[eventName] - 4 Weeks to Go!",
      body: <<~BODY
        Hi [greetingName],

        We are officially less than a month away from [eventName]! The local buzz is building and we're finalizing the artist lineup.

        Quick reminder: your spot isn't locked until payment is received.

        Complete payment here: [categoryPaymentLink]

        Early bird pricing expires in 10 days, so now's the time to act.

        Looking forward to seeing your work on the walls.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 14. ARTIST PAYMENT REMINDER - 16 DAYS OUT
    create_email!(template, position, {
      name: "Artist Payment Reminder - 16 Days Out",
      category: "payment",
      trigger_type: "days_before_event",
      trigger_value: 16,
      filter_criteria: { vendor_category: [ "Artists" ], payment_status: [ "pending", "overdue" ] }.to_json,
      subject: "Early Bird Pricing Ends in 10 Days - [eventName]",
      body: <<~BODY
        Hi [greetingName],

        We're getting closer! [eventName] is officially less than three weeks away and we're locking in the final artist roster.

        Early bird pricing ends in 10 days. After that, booth prices go up.

        Secure your spot now: [categoryPaymentLink]

        Don't miss out on the discount.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 15. ARTIST PAYMENT REMINDER - 8 DAYS OUT
    create_email!(template, position, {
      name: "Artist Payment Reminder - 8 Days Out",
      category: "payment",
      trigger_type: "days_before_event",
      trigger_value: 8,
      filter_criteria: { vendor_category: [ "Artists" ], payment_status: [ "pending", "overdue" ] }.to_json,
      subject: "Final Hours - Early Bird Rates End Tomorrow",
      body: <<~BODY
        Hi [greetingName],

        Just a quick heads-up: The early bird discount for [eventName] expires tomorrow.

        If you want to lock in the lower rate, you need to complete payment TODAY.

        Pay now: [categoryPaymentLink]

        After tomorrow, the price increases and spots become VERY limited.

        Act fast.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 16. ARTIST PAYMENT REMINDER - 4 DAYS OUT
    create_email!(template, position, {
      name: "Artist Payment Reminder - 4 Days Out",
      category: "payment",
      trigger_type: "days_before_event",
      trigger_value: 4,
      filter_criteria: { vendor_category: [ "Artists" ], payment_status: [ "pending", "overdue" ] }.to_json,
      subject: "You Can Still Exhibit at [eventName]",
      body: <<~BODY
        Hi [greetingName],

        We are 4 days out from [eventName] and we are finalizing the artist lineup and wall layout today.

        If you still want to exhibit, there's a small window to get in—but you need to confirm payment NOW.

        Complete payment: [categoryPaymentLink]

        After today, we cannot guarantee availability.

        This is your last shot.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 17. ARTIST PAYMENT REMINDER - 1 DAY OUT
    create_email!(template, position, {
      name: "Artist Payment Reminder - 1 Day Out",
      category: "payment",
      trigger_type: "days_before_event",
      trigger_value: 1,
      filter_criteria: { vendor_category: [ "Artists" ], payment_status: [ "pending", "overdue" ] }.to_json,
      subject: "Last Call - Secure Your Spot for Tomorrow",
      body: <<~BODY
        Hi [greetingName],

        The show is tomorrow at [eventVenue], and we have just a few artist spaces still open.

        If you want in, you need to complete payment RIGHT NOW.

        Pay here: [categoryPaymentLink]

        This is the absolute final call.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # PAYMENT REMINDERS - VENDORS
    # 18. VENDOR PAYMENT REMINDER - 29 DAYS OUT
    create_email!(template, position, {
      name: "Vendor Payment Reminder - 29 Days Out",
      category: "payment",
      trigger_type: "days_before_event",
      trigger_value: 29,
      filter_criteria: { vendor_category: [ "Vendors" ], payment_status: [ "pending", "overdue" ] }.to_json,
      subject: "Your Vendor Spot for [eventName]",
      body: <<~BODY
        Hi [greetingName],

        We're ramping up for [eventName] at [eventVenue] on [eventDate] and we would love to have you in our vendor lineup.

        Just a reminder: your table isn't confirmed until payment is received.

        Confirm your spot: [categoryPaymentLink]

        We're expecting 1,000+ attendees, so this is a huge opportunity. Don't miss out.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 19. VENDOR PAYMENT REMINDER - 15 DAYS OUT
    create_email!(template, position, {
      name: "Vendor Payment Reminder - 15 Days Out",
      category: "payment",
      trigger_type: "days_before_event",
      trigger_value: 15,
      filter_criteria: { vendor_category: [ "Vendors" ], payment_status: [ "pending", "overdue" ] }.to_json,
      subject: "Update: [eventName] Vendor Space Availability",
      body: <<~BODY
        Hi [greetingName],

        We're getting into the home stretch for [eventName] at [eventVenue] on [eventDate].

        Vendor tables are filling up FAST and we're down to just a few spots. If you want in, now's the time to lock it in.

        Secure your table: [categoryPaymentLink]

        Once we're full, we're full. Don't wait.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 20. VENDOR PAYMENT REMINDER - 9 DAYS OUT
    create_email!(template, position, {
      name: "Vendor Payment Reminder - 9 Days Out",
      category: "payment",
      trigger_type: "days_before_event",
      trigger_value: 9,
      filter_criteria: { vendor_category: [ "Vendors" ], payment_status: [ "pending", "overdue" ] }.to_json,
      subject: "Final Call: [eventName] Vendor Availability",
      body: <<~BODY
        Hi [greetingName],

        We are now just over a week away from [eventName]! As we've mentioned, we are strictly limited on the number of vendor spaces we can accommodate.

        Right now, we are down to our LAST FEW TABLES.

        If you want to vend at this event, complete payment NOW: [categoryPaymentLink]

        After this, we're sold out.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 21. VENDOR PAYMENT REMINDER - 3 DAYS OUT
    create_email!(template, position, {
      name: "Vendor Payment Reminder - 3 Days Out",
      category: "payment",
      trigger_type: "days_before_event",
      trigger_value: 3,
      filter_criteria: { vendor_category: [ "Vendors" ], payment_status: [ "pending", "overdue" ] }.to_json,
      subject: "URGENT: Is Your Vendor Space Confirmed?",
      body: <<~BODY
        Hi [greetingName],

        We are just 72 hours away from [eventName] at [eventVenue]. We are currently finalizing the physical floor layout and vendor assignments.

        If you have NOT completed payment, your table will be given away in the next 24 hours.

        Confirm NOW: [categoryPaymentLink]

        This is your absolute final notice.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # PAYMENT CONFIRMATION (ALL)
    # 22. PAYMENT CONFIRMATION
    create_email!(template, position, {
      name: "Payment Confirmation - You're In!",
      category: "system",
      trigger_type: "on_payment_received",
      trigger_value: nil,
      filter_criteria: nil,
      subject: "Confirmed: You're In for [eventName]!",
      body: <<~BODY
        Hi [greetingName],

        We've received your payment—you're officially confirmed for [eventName] at [eventVenue] on [eventDate]!

        Here's what happens next:
        • You'll receive detailed setup instructions closer to the event
        • Load-in info, parking details, and booth assignments coming soon
        • Check the event page anytime for updates: [eventLink]

        Get excited. This is going to be an incredible show.

        See you soon!

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # EVENT COUNTDOWN - ARTISTS (PAID)
    # 23. ARTIST COUNTDOWN - 17 DAYS OUT
    create_email!(template, position, {
      name: "Artist Guide - Setup & Sales Info",
      category: "pre_event",
      trigger_type: "days_before_event",
      trigger_value: 17,
      filter_criteria: { vendor_category: [ "Artists" ], payment_status: [ "paid" ] }.to_json,
      subject: "Artist Guide: Size, Hanging & Sales for [eventName]",
      body: <<~BODY
        Hi [greetingName],

        As we get closer to [eventName] at [eventVenue], we want to share the Playbook regarding artwork size, hanging, and setup.

        Artwork Guidelines:
        • Recommended size: 18x24 to 24x36 inches
        • Larger pieces welcome (just let us know in advance)
        • All work must be ready to hang (wire, sawtooth, or D-rings)
        • We provide hooks and basic hanging materials

        Sales & Pricing:
        • Price your work however you want
        • Bring business cards, postcards, or promo materials
        • Venmo/Cash App/Square recommended for easy transactions
        • You keep 100% of all sales

        Setup Details:
        • Load-in: [installDate] from [installTime]
        • We'll have a team on-site to help with hanging

        Questions? Reply to this email.

        More details coming soon.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 24. ARTIST COUNTDOWN - 11 DAYS OUT
    create_email!(template, position, {
      name: "Artist Countdown - What to Expect",
      category: "pre_event",
      trigger_type: "days_before_event",
      trigger_value: 11,
      filter_criteria: { vendor_category: [ "Artists" ], payment_status: [ "paid" ] }.to_json,
      subject: "What to Expect: Your Day at [eventName]",
      body: <<~BODY
        Hi [greetingName],

        As we get closer to [eventName], we wanted to walk through how the day typically works so you can plan accordingly.

        Event Flow:
        • Load-in: [installDate], [installTime]
        • Doors open: [eventTime]
        • Peak crowd: Usually 9pm–11pm
        • Event ends: Around midnight
        • Breakdown: Immediately after close (or next morning)

        What to Bring:
        • Your artwork (ready to hang)
        • Business cards / postcards / promo materials
        • Payment tools (Venmo, Cash App, Square, etc.)
        • Your good vibes

        Parking & Access:
        Parking info and load-in instructions will be sent in the next email. For now, just mark your calendar and start getting your work ready.

        This is going to be a killer show. See you soon.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 25. ARTIST COUNTDOWN - 3 DAYS OUT
    create_email!(template, position, {
      name: "Artist Final Details - 3 Days Out",
      category: "pre_event",
      trigger_type: "days_before_event",
      trigger_value: 3,
      filter_criteria: { vendor_category: [ "Artists" ], payment_status: [ "paid" ] }.to_json,
      subject: "Final Details for [eventName]!",
      body: <<~BODY
        Hi [greetingName],

        [eventName] is only a few days away! We are finalizing the venue prep and wanted to share this final checklist.

        Load-In Details:
        • Date: [installDate]
        • Time: [installTime]
        • Location: [eventVenue], [eventLocation]
        • Parking: Street parking available nearby; load-in zone in front of venue

        What to Bring:
        ✓ Artwork (ready to hang)
        ✓ Business cards / promo materials
        ✓ Payment processing setup (Venmo, etc.)

        Day-Of Timeline:
        • Doors: [eventTime]
        • Peak: 9pm–11pm
        • Close: ~Midnight

        We'll have a crew on-site to help with hanging and setup. Just show up ready to showcase your work.

        This is going to be an amazing night. Let's make it happen.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 26. ARTIST DAY-OF
    create_email!(template, position, {
      name: "Artist Day-Of Instructions",
      category: "event_day",
      trigger_type: "on_event_date",
      trigger_value: nil,
      filter_criteria: { vendor_category: [ "Artists" ], payment_status: [ "paid" ] }.to_json,
      subject: "TODAY: [eventName] - Let's Do This!",
      body: <<~BODY
        Hi [greetingName],

        The day is finally here! [eventName] is TODAY at [eventVenue]. We can't wait to see your work on the walls.

        Quick Reminders:
        • Load-in: [installTime]
        • Doors open: [eventTime]
        • Bring your artwork, business cards, and payment tools

        Parking: Street parking or use the load-in zone in front of the venue.

        Our team will be there to help you get set up. Just check in when you arrive.

        Let's make this an unforgettable show.

        See you in a few hours!

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # EVENT COUNTDOWN - VENDORS (PAID)
    # 27. VENDOR COUNTDOWN - 12 DAYS OUT
    create_email!(template, position, {
      name: "Vendor Guide - Setup & Gear",
      category: "pre_event",
      trigger_type: "days_before_event",
      trigger_value: 12,
      filter_criteria: { vendor_category: [ "Vendors" ], payment_status: [ "paid" ] }.to_json,
      subject: "Vendor Guide: Setup, Gear & Expectations for [eventName]",
      body: <<~BODY
        Hi [greetingName],

        Now that you're officially confirmed for [eventName], we want to walk through the logistical Playbook.

        What's Provided:
        • One 6-foot table
        • Two chairs
        • Access to power (limited—let us know if you need it)

        What to Bring:
        • Your products / merch / materials
        • Tablecloth / signage / display materials
        • Business cards / promo materials
        • Payment processing (Venmo, Square, etc.)
        • Any additional lighting or displays you want

        Setup & Breakdown:
        • Load-in: [installDate], [installTime]
        • Doors: [eventTime]
        • Breakdown: Right after the event ends (~midnight)

        Parking and final load-in details coming in the next email.

        Questions? Just reply.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 28. VENDOR COUNTDOWN - 7 DAYS OUT
    create_email!(template, position, {
      name: "Vendor Countdown - 1 Week Out",
      category: "pre_event",
      trigger_type: "days_before_event",
      trigger_value: 7,
      filter_criteria: { vendor_category: [ "Vendors" ], payment_status: [ "paid" ] }.to_json,
      subject: "1 Week Out: Vendor Checklist for [eventName]",
      body: <<~BODY
        Hi [greetingName],

        We're just one week away from [eventName]! This isn't the final load-in email (that's coming in a few days), but we wanted to give you a quick checklist to help you prep.

        Vendor Checklist:
        ✓ Products / merchandise ready to sell
        ✓ Tablecloth, signage, and display materials
        ✓ Business cards / promo materials
        ✓ Payment tools (Venmo, Cash App, Square, etc.)
        ✓ Any special lighting or decor you want to bring

        Setup Info:
        • Load-in: [installDate], [installTime]
        • Event start: [eventTime]
        • Expected attendance: 1,000+ guests

        Final load-in and parking details will be sent in the next 48 hours.

        Get ready—this is going to be a huge night.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 29. VENDOR COUNTDOWN - 3 DAYS OUT
    create_email!(template, position, {
      name: "Vendor Final Instructions - Load-In & Parking",
      category: "pre_event",
      trigger_type: "days_before_event",
      trigger_value: 3,
      filter_criteria: { vendor_category: [ "Vendors" ], payment_status: [ "paid" ] }.to_json,
      subject: "Final Instructions: [eventName] Load-In & Parking",
      body: <<~BODY
        Hi [greetingName],

        We're just a few days out from [eventName] at [eventVenue]! Promo is running across all channels and the buzz is building.

        Load-In Details:
        • Date: [installDate]
        • Time: [installTime]
        • Location: [eventVenue], [eventLocation]
        • Parking: Street parking or use the load-in zone in front of the venue

        What You'll Get:
        • One 6-foot table
        • Two chairs
        • Your assigned spot (we'll direct you when you arrive)

        What to Bring:
        ✓ Products / merch
        ✓ Tablecloth, signage, displays
        ✓ Business cards
        ✓ Payment tools

        We'll have a team on-site to help direct you to your table and get you set up.

        This is going to be an epic event. See you in a few days.

        Best,
        [organizationName]
      BODY
    })
    position += 1

    # 30. VENDOR DAY-OF
    create_email!(template, position, {
      name: "Vendor Day-Of Load-In Info",
      category: "event_day",
      trigger_type: "on_event_date",
      trigger_value: nil,
      filter_criteria: { vendor_category: [ "Vendors" ], payment_status: [ "paid" ] }.to_json,
      subject: "TODAY: [eventName] Vendor Load-In!",
      body: <<~BODY
        Hi [greetingName],

        The day is here! Here is the TL;DR info for today's vendor load-in at [eventVenue].

        Load-In:
        • Time: [installTime]
        • Location: [eventVenue], [eventLocation]
        • Parking: Street or load-in zone

        Event Start: [eventTime]

        Our team will be on-site to help you find your table and get set up. Just check in when you arrive.

        Let's make this a great show.

        See you soon!

        Best,
        [organizationName]
      BODY
    })
  end

  def self.create_email!(template, position, attrs)
    email = template.email_template_items.create!(
      name: attrs[:name],
      category: attrs[:category],
      position: position,
      subject_template: attrs[:subject],
      body_template: attrs[:body],
      trigger_type: attrs[:trigger_type],
      trigger_value: attrs[:trigger_value],
      filter_criteria: attrs[:filter_criteria],
      enabled_by_default: true
    )
    puts "  #{position}. Created: #{attrs[:name]}"
    email
  end
end

# Run the seed
if __FILE__ == $0 || defined?(Rails::Console)
  puts "\n🥞 Creating Pancake & Booze Email Campaign Template...\n\n"
  template = PancakeBoozeSeedService.create_template!
  puts "\n✅ Done! Template ID: #{template.id}"
  puts "📊 Total emails: #{template.email_template_items.count}"
end
