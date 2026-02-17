#!/usr/bin/env ruby
# Script to import Pancake & Booze 2026 email template with proper HTML formatting
# Usage: bundle exec rails runner import_pb_email_template.rb

puts "🚀 Starting Pancake & Booze Email Template Import..."

# Step 1: Create the EmailCampaignTemplate
template_name = "Pancake & Booze 2026 Email Campaign"

# Check if template already exists and delete it (for re-runs)
existing = EmailCampaignTemplate.find_by(name: template_name)
if existing
  puts "⚠️  Found existing template '#{template_name}' (ID: #{existing.id}), deleting it..."
  existing.destroy!
  puts "✅ Old template deleted"
end

puts "\n📋 Creating template: #{template_name}"

template = EmailCampaignTemplate.create!(
  name: template_name,
  description: "Complete email sequence for Pancake & Booze events including invitations, art calls, application confirmations, payment reminders, and countdown emails",
  template_type: "system",  # Available to all users
  is_default: false          # Won't auto-select, but users can choose it
)

puts "✅ Template created with ID: #{template.id}"

# Step 2: Define all emails with proper HTML bodies
puts "\n📧 Creating email template items..."

emails = [
  # ─── Invitation ───
  {
    name: "Invitation Email",
    subject_template: "Submissions Open - [eventName]",
    trigger_type: "on_application_open",
    trigger_value: 0,
    category: "invitation",
    position: 1,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We're pumped to announce that submissions are officially open for the next [eventName] at [venue] on [date].</p><br>
      <p>Submit your work below:</p><br>
      <p><strong>ARTIST / GALLERY SUBMISSIONS</strong><br>For artists exhibiting artwork on the walls<br><a href="[category.applicationLink]">Apply Here</a></p><br>
      <p><strong>TABLE VENDOR SUBMISSIONS</strong><br>For those setting up a TABLE space (Clothing, jewelry, and other table merch)<br><a href="[category.applicationLink]">Apply Here</a></p><br>
      <p>I'm looking forward to your submission.</p><br>
      <p>Thanks,<br>[organizationName]</p><br>
      <p>P.S. If you can't make the date, please <a href="#">let us know here</a>.</p><br>
    HTML
  },

  # ─── Application Received ───
  {
    name: "Application Received - Artist",
    subject_template: "Application Received - [eventName]",
    trigger_type: "on_application_submit",
    trigger_value: 0,
    category: "artist",
    position: 2,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>Thanks for submitting your application to participate in The [eventName] at [venue] on [date_range]. Please allow up to 10 days for us to review your submission and get back to you.</p><br>
      <p>In the meantime, please visit our Instagram page (@pancakesandbooze) and check out the "FAQs" in our Story Highlights for details on how our events work.</p><br>
      <h3>Exhibition Pricing Update</h3><br>
      <p>We've updated our exhibition structure for 2026. We are now offering <strong>one free piece</strong> after your first paid exhibition space. And to keep our pricing transparent, <strong>we are now covering all ticketing and processing fees</strong>—the price you see below is exactly what you pay at checkout with no hidden service fees.</p><br>
      <h4>The Rate:</h4><br>
      <ul>
        <li><strong>1st Piece:</strong> [category_price]</li>
        <li><strong>2nd Piece:</strong> <strong>FREE</strong></li>
        <li><strong>Pieces 3-10:</strong> [category_price] each</li>
        <li><em>Note: If fees are paid after [paymentDueDate], the rate increases to $25 per piece (2nd piece remains free).</em></li>
      </ul><br>
      <h4>The Details:</h4><br>
      <ul>
        <li><strong>NO COMMISSION:</strong> You manage your own sales and take 100% of what you sell.</li>
        <li><strong>SIZE LIMIT:</strong> Each piece should not exceed 3ft x 3ft.</li>
        <li><strong>INSTALLATION:</strong> Currently scheduled for [category_install_date] from [category_install_time].</li>
        <li><strong>NO TABLES:</strong> Artists hanging artwork cannot use tables. Small bins/boxes on the floor are permitted.</li>
        <li><strong>LOAD OUT:</strong> All artwork must be taken home at the end of the night. We are not responsible for items left behind.</li>
        <li><strong>AGE POLICY:</strong> The venue enforces a strict [age] age policy.</li>
      </ul><br>
      <p><strong>Attention Live Painters:</strong> We love featuring live body painting and canvas work. If you'd like to paint live, let us know so we can coordinate promotion on our socials.</p><br>
      <p>Thanks,<br>[organizationName]</p><br>
      <p><em>If you're unable to participate, please <a href="#">click here</a> to let us know.</em></p><br>
    HTML
  },
  {
    name: "Application Received - Vendor",
    subject_template: "Vendor Application Received - [eventName]",
    trigger_type: "on_application_submit",
    trigger_value: 0,
    category: "vendor",
    position: 3,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We've received your request to set up a VENDOR TABLE at The [eventName] on [date_range] at [venue]. This is <strong>NOT</strong> an acceptance email. You will receive another email and text message with further information if you're selected.</p><br>
      <p><strong>IMPORTANT:</strong> Vendor tables are strictly for non-hangable merchandise (clothing, jewelry, etc). If you have paintings or wall art, you have filled out the <strong>WRONG application</strong>. We do not permit canvas paintings, drawings, or prints larger than a greeting card on vendor tables. If this is you, please email us immediately so we can get you the correct artist information.</p><br>
      <h3>Selection &amp; Pricing</h3><br>
      <p>Table space is extremely limited and in high demand. If you are selected, <strong>PREPAYMENT IS REQUIRED</strong> to reserve your space. Your spot is only guaranteed once payment is received.</p><br>
      <p>The vending fee is <strong>[category_price]</strong>. To keep our pricing transparent, <strong>we now cover all ticketing and processing fees</strong>—the price you see is exactly what you pay at checkout with no hidden service fees.</p><br>
      <h4>The Details:</h4><br>
      <ul>
        <li><strong>SPACE:</strong> Large enough for ONE 6ft table. No tents or multiple tables allowed.</li>
        <li><strong>EQUIPMENT:</strong> You must provide your own table and chair. We do not provide them.</li>
        <li><strong>LOAD-IN:</strong> Starts at [category_install_time] on the day of the show. Please do not arrive early.</li>
        <li><strong>AGE POLICY:</strong> The venue enforces a strict [age] age policy.</li>
      </ul><br>
      <p>New to the event? Check us out @pancakesandbooze on Instagram and TikTok for a look at the vibe.</p><br>
      <p>Thanks,<br>[organizationName]</p><br>
      <p><em>If you're unable to participate, please <a href="#">click here</a> to let us know.</em></p><br>
    HTML
  },

  # ─── Application Accepted ───
  {
    name: "Application Accepted - Artist",
    subject_template: "You're In! [eventName]",
    trigger_type: "on_approval",
    trigger_value: 0,
    category: "artist",
    position: 4,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p><strong>Congratulations!</strong> You've been invited to exhibit at <strong>The [eventName]</strong> on [date_range] at [venue].</p><br>
      <p>We received a high volume of applications, and we're excited to have your work in the mix. Please note that <strong>we do not hold spots</strong>; your space is only officially secured once your exhibition fees are received.</p><br>
      <h3>Step 1: Secure Your Space</h3><br>
      <p><a href="[category.paymentLink]">PAYMENT LINK: CONFIRM YOUR EXHIBIT HERE</a></p><br>
      <p><strong>Exhibition Rates (No Hidden Fees):</strong><br>
      - 1st Piece: <strong>[category_price]</strong><br>
      - 2nd Piece: <strong>FREE</strong><br>
      - Pieces 3-10: <strong>[category_price] each</strong><br>
      - <em>Note: Prices increase to $25/piece after [paymentDueDate].</em></p><br>
      <p><strong>Cancellation Policy:</strong> Full refunds are available for cancellations made up to <strong>72 hours before the event</strong>. Cancellations within 72 hours are non-refundable.</p><br>
      <hr><br>
      <h4>What Happens Next?</h4><br>
      <p>Once your payment is confirmed, keep an eye on your inbox for our <strong>Artist Roadmap</strong> series:</p><br>
      <ul>
        <li><strong>30 Days Out:</strong> You'll receive a "Prep Guide" detailing our salon-style hanging requirements and hardware tips.</li>
        <li><strong>14 Days Out:</strong> We'll launch our marketing blitz and send you the official promo toolkit to help drive sales.</li>
        <li><strong>3-6 Days Out:</strong> Final logistics, load-in times, and venue updates will be sent via Eventbrite.</li>
      </ul><br>
      <hr><br>
      <h4>Quick Guidelines:</h4><br>
      <ul>
        <li><strong>NO COMMISSION:</strong> You keep 100% of your sales.</li>
        <li><strong>SIZE LIMIT:</strong> Max 3ft x 3ft per piece. No exceptions.</li>
        <li><strong>NO TABLES:</strong> Tables are for vendors only. Artists may use small floor bins for prints.</li>
        <li><strong>AGE POLICY:</strong> Strict [age] policy.</li>
      </ul><br>
      <p><strong>Online Marketplace:</strong> P&amp;B Artists can sell year-round at <a href="#">district.net/pancakesandbooze</a>.</p><br>
      <p>Thanks,<br>[organizationName]</p><br>
      <p><em>Plans changed? <a href="#">Click here</a> to release your space to the next artist on our waitlist.</em></p><br>
    HTML
  },
  {
    name: "Application Accepted - Vendor",
    subject_template: "You're Approved! [eventName]",
    trigger_type: "on_approval",
    trigger_value: 0,
    category: "vendor",
    position: 5,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p><strong>Congratulations!</strong> You've been approved to vend at <strong>The [eventName]</strong> on [date_range] at [venue].</p><br>
      <p>We received a high volume of applications for this show, and we're excited to have your brand in the mix. Because vendor space is extremely limited, <strong>we do not hold spots.</strong> Your space is only officially reserved once payment is completed through the link below.</p><br>
      <h3>Step 1: Secure Your Space</h3><br>
      <p>The vending fee is <strong>[category_price]</strong>. To keep our pricing transparent, <strong>we now cover all ticketing and processing fees</strong>—the price you see is exactly what you pay at checkout.</p><br>
      <p><a href="[category.paymentLink]">PAYMENT LINK: SECURE YOUR TABLE HERE</a></p><br>
      <p><strong>Cancellation Policy:</strong> We understand that life happens. We offer full refunds for cancellations made up to <strong>72 hours before the event</strong>. This allows us time to offer the space to a vendor on our waitlist. Cancellations made within 72 hours of the show are non-refundable.</p><br>
      <hr><br>
      <h4>Step 2: Spread the Word</h4><br>
      <p>The most successful shows happen when we all hustle together. Tag <strong>@pancakesandbooze</strong> and use <strong>#pancakesandbooze</strong> in your posts so we can find and feature your work leading up to the event.</p><br>
      <hr><br>
      <h4>Event Day Details:</h4><br>
      <ul>
        <li><strong>Location:</strong> [venue] — [address], [eventName]</li>
        <li><strong>Load-In:</strong> [category_install_date] at [category_install_time]. (The venue will not be open for setup prior to this time).</li>
        <li><strong>Setup:</strong> You are allowed ONE 6ft table. You must provide your own table and chair. Grid walls and racks are permitted if they fit within your approx. 8ft x 5ft footprint.</li>
        <li><strong>Staffing:</strong> Your space includes entry for one person (you). All assistants or guests must purchase a general admission ticket.</li>
        <li><strong>Load-Out:</strong> Must be completed by the end of the event. We are not responsible for items left behind.</li>
        <li><strong>Merchandise:</strong> Strictly non-hangable items only. No wall art/paintings permitted at vendor tables.</li>
        <li><strong>Age Policy:</strong> You must be [age] to participate.</li>
      </ul><br>
      <p>If you have any questions, feel free to reply to this email.</p><br>
      <p>Thanks,<br>[organizationName]</p><br>
      <p><em>If your plans have changed and you can no longer participate, please <a href="#">click here</a> to release your spot to the next person on our waitlist.</em></p><br>
    HTML
  },

  # ─── Waitlist ───
  {
    name: "Waitlist Email",
    subject_template: "You're on the Waitlist - [eventName]",
    trigger_type: "on_waitlist",
    trigger_value: 0,
    category: "artist",
    position: 6,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>Thank you for your interest in [eventName].</p><br>
      <p>After careful review, we've placed you on the waitlist. If a spot opens up, we'll contact you right away.</p><br>
      <ul>
        <li><strong>Event:</strong> [eventDate]</li>
        <li><strong>Location:</strong> [eventLocation]</li>
      </ul><br>
      <p>We truly appreciate your interest and encourage you to stay tuned for updates.</p><br>
      <p>Best,<br>[producerName]</p><br>
    HTML
  },

  # ─── Art Calls ───
  {
    name: "Art Call Email #1 - 10 Weeks Out",
    subject_template: "Submissions Open - [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 70,
    category: "artist",
    position: 7,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>[organizationName] is back in [location] and submissions are open for our upcoming show at [venue] on [date_range].</p><br>
      <p>Your first TWO pieces are just [category_price] total if your exhibition fee is paid by [paymentDueDate].</p><br>
      <p>We'd be stoked to have you back. Please follow the appropriate link below to get your application in:</p><br>
      <p><strong>GALLERY EXHIBITION (Wall Space)</strong><br>Paintings, Photography, Mixed Media, &amp; Sculptures<br><a href="[category.applicationLink]">Artists Apply Here</a></p><br>
      <p><strong>VENDOR MARKET (Table Space)</strong><br>Clothing, Jewelry, Handcrafted Goods, &amp; Small Merch (No wall art)<br><a href="[category.applicationLink]">Vendors Apply Here</a></p><br>
      <p>We look forward to your submission!</p><br>
      <p>[organizationName]</p><br>
      <p>P.S. - If you can't make this show and want to stop receiving reminders for this specific date, please <a href="#">let us know</a>.</p><br>
    HTML
  },
  {
    name: "Art Call Email #2 - 8 Weeks Out",
    subject_template: "Two Months Out - [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 56,
    category: "artist",
    position: 8,
    body_template: <<~HTML
      <p>Hey [greetingName],</p><br>
      <p>Ready for another round of [organizationName]? We're back in [location] at [venue] on [date_range] and we'd love to have you there.</p><br>
      <p>We are officially two months out, so now is the time to lock in your spot.</p><br>
      <p><strong>The Deal:</strong> Your first TWO pieces are just [category_price] total if your exhibition fee is paid by [paymentDueDate].</p><br>
      <p>We have your info on file, so applying is easy—just visit the appropriate link below and click "Yes, Sign Me Up." It takes two seconds.</p><br>
      <p><strong>GALLERY EXHIBITION (Wall Space)</strong><br>Paintings, Photography, Mixed Media, &amp; Sculptures<br><a href="[category.applicationLink]">ARTIST SUBMISSIONS - Apply Here</a></p><br>
      <p><strong>VENDOR MARKET (Table Space)</strong><br>Clothing, Jewelry, Handcrafted Goods, &amp; Small Merch (No wall art)<br><a href="[category.applicationLink]">VENDOR SUBMISSIONS - Apply Here</a></p><br>
      <p>If you have any questions, just hit reply and let me know.</p><br>
      <p>Thanks,<br>[organizationName]</p><br>
      <p>P.S. - If you can't make this show and want to stop receiving reminders for this specific date, please <a href="#">let us know</a>.</p><br>
    HTML
  },
  {
    name: "Art Call Email #3 - 4 Weeks Out",
    subject_template: "Nearly at Capacity - [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 28,
    category: "artist",
    position: 9,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>The [eventName] on [date_range] is now just weeks away.</p><br>
      <p>We've received an insane response for this event and are nearly at capacity. This is likely your final opportunity to submit and lock in the [category_price] rate for your first two pieces before we are completely full.</p><br>
      <p>If you want in, please use the appropriate link below to secure your spot ASAP:</p><br>
      <p><strong>GALLERY EXHIBITION (Wall Space)</strong><br>Paintings, Photography, Mixed Media, &amp; Sculptures<br><a href="[category.applicationLink]">ARTIST SUBMISSIONS - Apply Here</a></p><br>
      <p><strong>VENDOR MARKET (Table Space)</strong><br>Clothing, Jewelry, Handcrafted Goods, &amp; Small Merch (No wall art)<br><a href="[category.applicationLink]">VENDOR SUBMISSIONS - Apply Here</a></p><br>
      <p>Hit me back as soon as possible to let me know if you're joining us.</p><br>
      <p>Thanks,<br>[organizationName]</p><br>
    HTML
  },
  {
    name: "Art Call Email #4 - 12 Days Out",
    subject_template: "Submissions Closing Soon - [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 12,
    category: "artist",
    position: 10,
    body_template: <<~HTML
      <p>What's up [greetingName]?</p><br>
      <p>Just a heads up that submissions for The [eventName] on [date_range] at [venue] will be closing soon.</p><br>
      <p>This is the last time I'll reach out for this specific show, so please hit the link below now if you want to ensure you have a spot on the floor or the walls.</p><br>
      <p><strong>GALLERY EXHIBITION (Wall Space)</strong><br>Paintings, Photography, Mixed Media, &amp; Sculptures<br><a href="[category.applicationLink]">ARTIST SUBMISSIONS - Apply Here</a></p><br>
      <p><strong>VENDOR MARKET (Table Space)</strong><br>Clothing, Jewelry, Handcrafted Goods, &amp; Small Merch (No wall art)<br><a href="[category.applicationLink]">VENDOR SUBMISSIONS - Apply Here</a></p><br>
      <p>Good Vibes,<br>[organizationName]</p><br>
    HTML
  },

  # ─── Payment Reminders - Artists ───
  {
    name: "Payment Reminder - Artist (39 Days)",
    subject_template: "Ramping up for [eventName]! (Confirm your spot)",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 39,
    category: "artist",
    position: 11,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We're starting to ramp things up for The [eventName] at [venue].</p><br>
      <p>We wanted to remind you that your spot is not confirmed until your payment is completed. Once you're locked in, you'll start receiving the "Deep Detail" emails covering load-in times and setup guidelines.</p><br>
      <p><strong>The Early Bird Rate:</strong><br>[category_price] for your first two pieces.<br>Pieces 3-10 are [category_price] each</p><br>
      <p>This discounted rate is only available until [paymentDueDate] (one week before the show).</p><br>
      <p><a href="[category.paymentLink]">RESERVE YOUR SPACE</a></p><br>
      <p>On the promo side: We're seeing a huge surge in engagement across our socials, and the local buzz for the [eventName] show is already high. We're pushing hard to get your work in front of as many eyes as possible—keep an eye out for the event flyer on your feed and tag us (@pancakesandbooze) for a chance to have your work reposted.</p><br>
      <p>[organizationName]</p><br>
    HTML
  },
  {
    name: "Payment Reminder - Artist (26 Days)",
    subject_template: "[eventName]: 4 weeks to go!",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 26,
    category: "artist",
    position: 12,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We are officially less than a month away from The [eventName]!</p><br>
      <p>The local buzz is building, and we're seeing a huge surge in engagement across our socials. We're pushing hard to get the word out—keep an eye out for the event flyer on your feed and feel free to share it with your own followers to let them know where you'll be.</p><br>
      <p>If you haven't secured your space yet, now is the time. You still have plenty of time to lock in the Early Bird rate, but spots are being claimed quickly.</p><br>
      <p><strong>The Current Rate:</strong><br>[category_price] for your first two pieces<br>Pieces 3-10 are [category_price] each<br>This rate is valid until [paymentDueDate]</p><br>
      <p><a href="[category.paymentLink]">RESERVE YOUR SPACE HERE</a></p><br>
      <p><strong>Quick Reminder:</strong><br>0% Commission: You keep 100% of your sales.<br>3' x 3' size maximum per piece you exhibit.</p><br>
      <p>We're looking forward to working together and making this an incredible night!</p><br>
      <p>[organizationName]</p><br>
    HTML
  },
  {
    name: "Payment Reminder - Artist (16 Days)",
    subject_template: "Early bird pricing ends in 10 days",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 16,
    category: "artist",
    position: 13,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We're getting closer! The [eventName] show is officially less than three weeks away, and we're currently finalizing the layout of the space.</p><br>
      <p>This is your 10-day warning to lock in the early-bird rate. If you want to exhibit, make sure you've secured your space before the price increase kicks in.</p><br>
      <p><strong>The Early Bird Deadline:</strong><br>Current Rate: [category_price] for your first two pieces.<br>Deadline: This rate expires on [paymentDueDate].<br>After the Deadline: The price jumps to $25 per piece.</p><br>
      <p><a href="[category.paymentLink]">SECURE YOUR SPACE &amp; SAVE</a></p><br>
      <p><strong>Quick Recap:</strong><br>No Commission: You keep 100% of your sales.<br>Live Painting: Still highly encouraged! It's a great way to engage the crowd.<br>Socials: Don't forget to tag @pancakesandbooze in your process shots so we can show our followers what you're bringing to the show.</p><br>
      <p>[organizationName]</p><br>
    HTML
  },
  {
    name: "Payment Reminder - Artist (8 Days)",
    subject_template: "Early bird Exhibition rates end tomorrow",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 8,
    category: "artist",
    position: 14,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>Just a quick heads-up: The early bird discount for The [eventName] expires on [discount_ends]. This is your last chance to grab the [category_price] rate for your first two pieces.</p><br>
      <p><a href="[category.paymentLink]">SECURE YOUR SPACE NOW</a></p><br>
      <p>Starting [paymentDueDate] morning, the rate for your first two pieces will jump to $25 per piece. Please complete your payment before the deadline to ensure you are included in the show at the lower rate.</p><br>
      <p>See you soon,<br>[organizationName]</p><br>
    HTML
  },
  {
    name: "Payment Reminder - Artist (4 Days)",
    subject_template: "You can still exhibit at the [eventName]",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 4,
    category: "artist",
    position: 15,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We are 4 days out from The [eventName] and we are finalizing the artist lineup and wall layout today.</p><br>
      <p>We still haven't seen your payment come through. If you still plan to participate, payment must be completed immediately to ensure you are included in the floor plan.</p><br>
      <p><strong>The Current Rate:</strong><br>Exhibition fees are now $25 per piece (2nd piece remains free).<br>Pieces 3-10 are $25 per piece.</p><br>
      <p><a href="[category.paymentLink]">SECURE YOUR SPACE NOW</a></p><br>
      <p>Once your payment is complete, you will receive the final "Deep Detail" email with your specific load-in times, parking info, and setup instructions.</p><br>
      <p>[organizationName]</p><br>
    HTML
  },
  {
    name: "Payment Reminder - Artist (1 Day)",
    subject_template: "Last call to Secure your spot for the [eventName]",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 1,
    category: "artist",
    position: 16,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>The show is tomorrow at [venue], and we have just a few artist spaces still open.</p><br>
      <p>If you want to exhibit, payment must be completed today. Unpaid spots are not guaranteed and will be given to walk-in artists or those on the waitlist once we hit capacity.</p><br>
      <p><a href="[category.paymentLink]">RESERVE THE LAST REMAINING SPACE</a></p><br>
      <p>Once payment is processed, you'll get the final load-in instructions immediately. Let's make it a big one!</p><br>
      <p>[organizationName]</p><br>
    HTML
  },

  # ─── Payment Reminders - Vendors ───
  {
    name: "Payment Reminder - Vendor (29 Days)",
    subject_template: "Nudge: Your Vendor Spot for [eventName]",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 29,
    category: "vendor",
    position: 17,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We're ramping up for The [eventName] at [venue] on [date] and we would love to have you in our vendor lineup!</p><br>
      <p>As a reminder, your vendor space is not confirmed or held until your payment is completed. Because we are very limited on our vendor spaces, these spots tend to fill up fast as we get closer to the event.</p><br>
      <p><strong>HOW TO SECURE YOUR SPACE</strong></p><br>
      <p><a href="[category.paymentLink]">CLICK HERE TO RESERVE YOUR SPACE</a><br>Select "Get Tickets"<br>Scroll down to the "VENDOR TICKET" option<br>Complete checkout through Eventbrite</p><br>
      <p>Vendor Fee: [category_price]</p><br>
      <p><strong>QUICK VENDOR DETAILS</strong></p><br>
      <ul>
        <li>Approved Items: Jewelry, clothing, stickers, etc. No wall-hanging art.</li>
        <li>Space Size: Roughly 8ft wide x 5ft deep (Fits one 6ft table).</li>
        <li>Equipment: You must bring your own 6ft table and chair.</li>
        <li>Setup Rules: No tents. No multiple-table setups. Grid walls/racks must fit inside your space.</li>
        <li>Entry: Includes one (1) free entry for the vendor.</li>
        <li>Age Policy: You must be [age]+ to participate.</li>
      </ul><br>
      <p>Once your payment is processed, your space is officially locked in. We typically see our vendor market hit capacity about two weeks before the show—don't miss the window to join us!</p><br>
      <p>[organizationName]</p><br>
      <p>P.S. — If your plans have changed and you're no longer able to attend, please <a href="#">click here</a> to let us know so we can release the space to the next person on the waitlist.</p><br>
    HTML
  },
  {
    name: "Payment Reminder - Vendor (15 Days)",
    subject_template: "Update: [eventName] Vendor Space Availability",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 15,
    category: "vendor",
    position: 18,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We're getting into the home stretch for The [eventName] at [venue] on [date].</p><br>
      <p>I'm reaching out because we are officially entering the final two weeks before the show. As we've mentioned previously, we are limited on the total number of vendors we can host, and we typically see our remaining spaces fill up completely right around this time.</p><br>
      <p>If you are still planning to exhibit your work, please complete your payment now to ensure you don't lose your spot. Once we hit our capacity, the payment link will disappear.</p><br>
      <p><a href="[category.paymentLink]">SECURE YOUR VENDOR SPACE</a></p><br>
      <p><strong>Quick Reminders:</strong></p><br>
      <ul>
        <li>Your Space: Approx. 8ft wide x 5ft deep.</li>
        <li>Your Gear: You must bring your own 6ft table and chair.</li>
        <li>Setup: No tents or multiple-table setups.</li>
        <li>Items: This space is for non-hangable items (jewelry, clothing, stickers, etc.).</li>
      </ul><br>
      <p>Once payment is confirmed, you are officially on the floor plan. We're looking forward to having you!</p><br>
      <p>[organizationName]</p><br>
      <p>P.S. — If you are no longer able to make it, please let us know so we can offer the space to someone else on the waiting list.</p><br>
    HTML
  },
  {
    name: "Payment Reminder - Vendor (9 Days)",
    subject_template: "Final Call: [eventName] Vendor Availability",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 9,
    category: "vendor",
    position: 19,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We are now just over a week away from The [eventName]!</p><br>
      <p>As we've mentioned, we are strictly limited on the number of vendor spaces available at [venue]. We are currently down to our final remaining spots, and we expect the payment link to deactivate shortly as we hit capacity.</p><br>
      <p>If you still intend to vend at this show, please secure your space immediately. Once the link disappears, we will be unable to add any additional vendors to the floor plan.</p><br>
      <p><a href="[category.paymentLink]">SECURE YOUR VENDOR SPACE NOW</a></p><br>
      <p><strong>Final Checklist:</strong></p><br>
      <ul>
        <li>Space: Approx. 8ft wide x 5ft deep.</li>
        <li>Table: You must bring your own 6ft table and chair.</li>
        <li>Rules: No tents. No multiple-table setups.</li>
        <li>Load-in: Instructions will be sent once payment is confirmed.</li>
      </ul><br>
      <p>We'd love to have you out there with us, but we can't hold the space without payment. Hope to see you next week!</p><br>
      <p>[organizationName]</p><br>
    HTML
  },
  {
    name: "Payment Reminder - Vendor (3 Days)",
    subject_template: "URGENT: Is your [eventName] vendor space confirmed?",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 3,
    category: "vendor",
    position: 20,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We are just 72 hours away from The [eventName] at [venue].</p><br>
      <p>We are currently finalizing the physical floor layout and we have a very small number of vendor spaces left. If you still intend to participate, this is your final opportunity to secure your spot before the payment link is deactivated for good.</p><br>
      <p><a href="[category.paymentLink]">RESERVE THE LAST REMAINING SPACE</a></p><br>
      <p><strong>Important:</strong> Once we hit our final capacity (which usually happens within hours of this final notice), we cannot accommodate any more vendors. There are no walk-in vendor spots available.</p><br>
      <p><strong>Reminder for Thursday:</strong></p><br>
      <ul>
        <li>Load-in starts at [category_install_time].</li>
        <li>You must bring your own 6ft table and chair.</li>
        <li>No tents or multiple-table setups are permitted.</li>
      </ul><br>
      <p>If your payment has already been processed, please disregard this message and keep an eye out for the final logistics email.</p><br>
      <p>[organizationName]</p><br>
    HTML
  },

  # ─── Payment Confirmed ───
  {
    name: "Payment Confirmed",
    subject_template: "Confirmed: You're in for [eventName]!",
    trigger_type: "on_payment_received",
    trigger_value: 0,
    category: "artist",
    position: 21,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We've received your payment—you're officially confirmed for The [eventName] at [venue] on [date]!</p><br>
      <p>We're pumped to have you with us.</p><br>
      <p><strong>Your Entry Ticket:</strong> You should have already received a confirmation email from Eventbrite. That email includes your QR code, which we'll scan when you arrive to install your work. You can bring it on your phone, print it out, or we can look you up by name—the QR code is just the fastest option for check-in.</p><br>
      <p><strong>What Happens Next?</strong></p><br>
      <ul>
        <li><strong>Confirmation:</strong> You are all set for now! You don't need to send us anything else today.</li>
        <li><strong>Deep Details:</strong> Over the next couple of weeks, you'll receive the "Deep Detail" emails covering setup times, parking, wall assignments, and exactly what to expect on show day.</li>
        <li><strong>Promotion:</strong> We are pushing the show hard on socials. Tag @pancakesandbooze in your process shots or finished pieces so we can repost your work to our followers.</li>
      </ul><br>
      <p>Thanks again for being a part of the show. We'll be in touch soon with the logistics!</p><br>
      <p>[organizationName]</p><br>
    HTML
  },

  # ─── Countdown - Artists ───
  {
    name: "Countdown - Artist (17 Days)",
    subject_template: "Artist Guide: Size, Hanging, & Sales for [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 17,
    category: "artist",
    position: 22,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>As we get closer to The [eventName] at [venue], we want to share the "Playbook" regarding artwork size, hanging, and setup so you know exactly what to expect on install day.</p><br>
      <p>This is a salon-style show and wall space is shared—please read through these guidelines carefully.</p><br>
      <h3>1. SIZE &amp; HANGING GUIDELINES</h3><br>
      <ul>
        <li><strong>Size Limit:</strong> Each piece must not exceed 3ft x 3ft (90cm x 90cm).</li>
        <li><strong>The Walls:</strong> Artwork is hung salon-style on 8ft x 4ft drywall panels. Wall space is shared; please be prepared to coordinate with your neighbors respectfully.</li>
        <li><strong>Placement:</strong> Locations are assigned first-come, first-served at load-in. If you are particular about where you hang, arrive early.</li>
        <li><strong>Method:</strong> Wired artwork is highly preferred, though we can work with most methods.</li>
        <li><strong>Tools:</strong> We provide walls, screws, and screw guns. Tools are shared, so if you're in a rush, feel free to bring your own screw gun.</li>
        <li><strong>CRITICAL:</strong> Hammers and nails are NOT allowed.</li>
      </ul><br>
      <h3>2. SALES, PRICING &amp; MERCH</h3><br>
      <ul>
        <li><strong>0% Commission:</strong> 100% of your sales are yours. We do not take a cut.</li>
        <li><strong>Payments:</strong> You must handle your own sales. Please have your Venmo/Zelle/Square QR codes ready for buyers.</li>
        <li><strong>Merch:</strong> You may sell prints or small merch from a small bin/box on the floor directly under your artwork.</li>
        <li><strong>NO TABLES:</strong> Tables are not permitted for artists hanging in the gallery space.</li>
      </ul><br>
      <h3>3. TITLE CARDS</h3><br>
      <p>Please provide your own title cards (roughly 4"x6" / postcard size). We recommend including:</p><br>
      <ul>
        <li>Name of Artwork, Medium, and Price.</li>
        <li>A QR code linking to your Instagram or payment handle.</li>
      </ul><br>
      <h3>4. ENTRY &amp; LOAD-OUT</h3><br>
      <ul>
        <li><strong>Artist Entry:</strong> You are on the guest list for free entry. Assistants and guests must purchase a ticket to attend.</li>
        <li><strong>Load-Out:</strong> All artwork must be removed immediately after the show (Midnight). Neither the venue nor [organizationName] can store artwork. Do not leave for the night without your work!</li>
      </ul><br>
      <p>We'll be sending another email soon with a walkthrough of the "Day-Of" experience, followed by final load-in times.</p><br>
      <p>Thanks for being prepared—we're looking forward to a great night in [location]!</p><br>
      <p>[organizationName]</p><br>
    HTML
  },
  {
    name: "Countdown - Artist (11 Days)",
    subject_template: "What to expect: Your day at the [eventName] Art Show",
    trigger_type: "days_before_event",
    trigger_value: 11,
    category: "artist",
    position: 23,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>As we get closer to The [eventName], we wanted to walk through how the day typically works so you can plan accordingly.</p><br>
      <p>This email focuses on the general flow and expectations. Final, confirmed logistics (load-in times/parking) will be sent closer to the show.</p><br>
      <h3>INSTALLATION TIMING</h3><br>
      <ul>
        <li>Artwork installation typically takes place on the day of the show, usually between 1:00 PM – 5:00 PM.</li>
        <li><strong>Pre-Show:</strong> Installation happens before doors open to the public.</li>
        <li><strong>Confirming Times:</strong> Exact timing for your city will be reconfirmed in a later email.</li>
        <li><strong>Placement:</strong> Wall space is first-come, first-served. If you have a specific spot in mind, we recommend arriving early.</li>
      </ul><br>
      <h3>SALON-STYLE EXHIBITION</h3><br>
      <p>This is a salon-style show, which means we utilize the wall space from top to bottom.</p><br>
      <ul>
        <li>You will likely be sharing wall space with other artists.</li>
        <li>Plan your layout with flexibility and space efficiency in mind.</li>
        <li><strong>Staff Note:</strong> If spacing becomes an issue, our staff may ask for adjustments to ensure everyone fits.</li>
      </ul><br>
      <h3>HANGING YOUR ARTWORK</h3><br>
      <p>You are responsible for hanging your own work (though our staff is nearby to assist).</p><br>
      <ul>
        <li><strong>Ready to Hang:</strong> Please bring your art ready to be mounted.</li>
        <li><strong>Wiring:</strong> Wired artwork is preferred, but stretched canvas is fine without wiring.</li>
        <li><strong>Tools:</strong> We provide screws and screw guns onsite.</li>
        <li><strong>PROHIBITED:</strong> Hammers and nails are not allowed.</li>
      </ul><br>
      <h3>LIVE ART &amp; BODY PAINTING</h3><br>
      <p>If you plan to do live painting or body painting:</p><br>
      <ul>
        <li><strong>Timing:</strong> Setup may begin only after the event starts. Please do not set up earlier as production changes may be happening.</li>
        <li><strong>Guest List:</strong> Participating body painters and models get free entry.</li>
        <li><strong>Note:</strong> Sorry—no free entry for assistants or plus-ones.</li>
      </ul><br>
      <h3>SALES &amp; PAYMENTS</h3><br>
      <p>You manage your own sales and keep 100% of what you sell.</p><br>
      <ul>
        <li>We recommend having at least one digital payment option (Venmo, CashApp, Zelle).</li>
        <li>Ideally, include a QR code on your title card to make it easy for buyers to pay you instantly.</li>
      </ul><br>
      <p>For additional day-of questions, please review the FAQs on our website or check our Instagram Story Highlights.</p><br>
      <p>Thanks for being prepared and flexible—we're looking forward to a great night!</p><br>
      <p>[organizationName]</p><br>
    HTML
  },
  {
    name: "Countdown - Artist (3 Days)",
    subject_template: "Final Details for [eventName]!",
    trigger_type: "days_before_event",
    trigger_value: 3,
    category: "artist",
    position: 24,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>The [eventName] is only a few days away! We are finalizing the venue prep and wanted to share this final checklist to ensure everything goes smoothly for you on show day.</p><br>
      <h3>INSTALLATION &amp; TIMING</h3><br>
      <ul>
        <li><strong>Install Window:</strong> Day of the show, typically between [category_install_time].</li>
        <li><strong>Be Ready:</strong> Please arrive with your work ready to hang immediately.</li>
        <li><strong>Load-Out:</strong> All artwork must be removed immediately after the event. No storage is available.</li>
      </ul><br>
      <h3>ARTWORK &amp; HANGING</h3><br>
      <ul>
        <li><strong>Max Size:</strong> Each piece must not exceed 3ft x 3ft. No exceptions due to wall size constraints.</li>
        <li><strong>Hanging:</strong> Wired artwork is preferred; stretched canvas is fine without wiring.</li>
        <li><strong>The Layout:</strong> This is a salon-style exhibition. Wall space is shared and utilized from top to bottom—not all work will be at eye level.</li>
        <li><strong>Tools:</strong> We provide screws and screw guns. Hammers and nails are NOT allowed.</li>
      </ul><br>
      <h3>SALES &amp; MERCH</h3><br>
      <ul>
        <li><strong>Commission:</strong> You keep 100% of your sales.</li>
        <li><strong>Merch:</strong> Bins or boxes for prints/merch are allowed on the floor beneath your work.</li>
        <li><strong>Tables:</strong> No tables are permitted for artists hanging in the gallery space.</li>
        <li><strong>Title Cards:</strong> Please bring your own (index-card size is best).</li>
      </ul><br>
      <h3>LIVE ART &amp; BODY PAINTING</h3><br>
      <ul>
        <li><strong>Setup:</strong> May begin only after the event starts. Please do not set up during the gallery installation window.</li>
        <li><strong>Guests:</strong> Participating body painters and models are on the guest list. No assistants or plus-ones are included.</li>
      </ul><br>
      <h3>ENTRY &amp; GUESTS</h3><br>
      <ul>
        <li><strong>Artists:</strong> You are on the guest list for free entry.</li>
        <li><strong>Others:</strong> Everyone else, including assistants, must have a ticket or pay the cover charge.</li>
      </ul><br>
      <p>For any last-minute questions, please review the FAQs on our website or check our Instagram Story Highlights.</p><br>
      <p>Thanks for being prepared and flexible—we'll see you at [venue]!</p><br>
      <p>[organizationName]</p><br>
    HTML
  },
  {
    name: "Countdown - Artist (Day Of)",
    subject_template: "TODAY: [eventName]!",
    trigger_type: "on_event_date",
    trigger_value: 0,
    category: "artist",
    position: 25,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>The day is finally here! The [eventName] is TODAY at [venue]. We can't wait to see your work on the walls.</p><br>
      <h3>SHOW DAY ESSENTIALS</h3><br>
      <ul>
        <li><strong>Installation:</strong> Takes place today between [category_install_time].</li>
        <li><strong>Check-In:</strong> Have your Eventbrite QR code ready on your phone (or printed) for the fastest scan-in.</li>
        <li><strong>The Gear:</strong> We provide screws and screw guns. Hammers and nails are NOT allowed.</li>
        <li><strong>Size Check:</strong> Max size per piece is 3ft x 3ft.</li>
      </ul><br>
      <h3>QUICK REMINDERS</h3><br>
      <ul>
        <li><strong>Hanging:</strong> Arrive with your artwork ready to hang. This is a salon-style show; wall space is shared.</li>
        <li><strong>Sales:</strong> You keep 100% of your sales! Ensure your payment QR codes are ready for your buyers.</li>
        <li><strong>Merch:</strong> Prints/merch can be sold from a small bin on the floor. No tables for hanging artists.</li>
        <li><strong>Entry:</strong> You get in free. All guests and assistants must have a ticket.</li>
      </ul><br>
      <p><strong>Event Hours:</strong> [event_time]</p><br>
      <p>We're excited to have you with us—let's make it a great night!</p><br>
      <p>[organizationName]</p><br>
    HTML
  },

  # ─── Countdown - Vendors ───
  {
    name: "Countdown - Vendor (12 Days)",
    subject_template: "Vendor Guide: Setup, Gear, & Expectations for [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 12,
    category: "vendor",
    position: 26,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>Now that you're officially confirmed for The [eventName], we want to walk through the logistical "Playbook" so you can prep your setup.</p><br>
      <p>Because we are limited on the number of vendors we can host at [venue], space is optimized for flow and visibility. Please review these requirements carefully.</p><br>
      <h3>1. YOUR SPACE &amp; FOOTPRINT</h3><br>
      <ul>
        <li><strong>Dimensions:</strong> Your space is approximately 8ft wide x 5ft deep.</li>
        <li><strong>Placement:</strong> Locations are assigned first-come, first-served during load-in. If you want a specific spot, arrive early.</li>
        <li><strong>No Wall Art:</strong> This space is for non-hangable items (jewelry, apparel, etc.). You cannot use the gallery walls for canvases or hanging art unless you have also been accepted as an artist and have already paid your exhibition fees.</li>
      </ul><br>
      <h3>2. EQUIPMENT: WHAT TO BRING</h3><br>
      <p>We do not provide any furniture or display hardware. You are responsible for:</p><br>
      <ul>
        <li><strong>Table &amp; Chair:</strong> One 6ft table and your own seating.</li>
        <li><strong>Displays:</strong> Grid walls or clothing racks are permitted as long as they stay within your 8x5 footprint.</li>
        <li><strong>Lighting:</strong> The venues are often "moody" (dim). We highly recommend bringing battery-powered lights for your display.</li>
        <li><strong>Power:</strong> Outlets are not guaranteed at every spot. If you need power, please bring a long extension cord and power strip.</li>
      </ul><br>
      <h3>3. PROHIBITED ITEMS</h3><br>
      <ul>
        <li><strong>No Tents:</strong> Tents/canopies are not permitted indoors.</li>
        <li><strong>No Wall Damage:</strong> Do not drill, glue, or attach anything to the venue walls.</li>
      </ul><br>
      <h3>4. SALES &amp; ENTRY</h3><br>
      <ul>
        <li><strong>0% Commission:</strong> You keep 100% of your sales. Please have your Venmo/Square/Zelle QR codes ready.</li>
        <li><strong>Entry:</strong> Your space includes one (1) free entry for yourself. All assistants, staff, or guests must purchase a ticket to enter.</li>
      </ul><br>
      <p><strong>What's Next?</strong> We will send a final email 2–3 days before the show with the specific load-in address, parking instructions, and final arrival times.</p><br>
      <p>[organizationName]</p><br>
    HTML
  },
  {
    name: "Countdown - Vendor (7 Days)",
    subject_template: "1 Week Out: Vendor Checklist for [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 7,
    category: "vendor",
    position: 27,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We're just one week away from The [eventName]! This isn't the final load-in email (that's coming in a few days), but this checklist will ensure you're 100% prepared.</p><br>
      <p>Now is the perfect time to push your involvement on social media! Tag @pancakesandbooze and use #pancakesandbooze so we can repost your work to our community.</p><br>
      <h3>EVENT BASICS</h3><br>
      <ul>
        <li><strong>Load-in:</strong> [category_install_date] starting at [category_install_time].</li>
        <li><strong>Event Hours:</strong> [event_time].</li>
        <li><strong>Address:</strong> [address].</li>
        <li><strong>Check-in:</strong> Our team will be stationed at the main entrance.</li>
        <li><strong>Setup:</strong> Locations are first-come, first-served.</li>
      </ul><br>
      <h3>PREP CHECKLIST</h3><br>
      <p>Since we DO NOT provide tables, chairs, or display hardware for vendors, please ensure you have the following:</p><br>
      <ul>
        <li><strong>Your Gear:</strong> Table (6ft max), chairs, grid walls, or racks.</li>
        <li><strong>Lighting:</strong> The venue can be dim; battery-powered display lights are highly recommended.</li>
        <li><strong>Power:</strong> We provide access, but please bring your own long extension cords and power strips.</li>
        <li><strong>Sales Supplies:</strong> Signage, business cards, and your digital payment QR codes.</li>
      </ul><br>
      <h3>RESTRICTIONS</h3><br>
      <p>To keep the event smooth and safe, please do not bring:</p><br>
      <ul>
        <li><strong>Tents:</strong> No pop-up tents or canopies are allowed indoors.</li>
        <li><strong>Wall Attachments:</strong> No drilling, gluing, or attaching anything to venue surfaces.</li>
        <li><strong>Prohibited:</strong> No open flames, generators, outside alcohol, or loose confetti/glitter.</li>
      </ul><br>
      <h3>FINAL LOGISTICS COMING SOON</h3><br>
      <p>In our next email, you'll receive the "Day-Of" specifics, including:</p><br>
      <ul>
        <li>Parking &amp; Unloading details.</li>
        <li>Entry Points for vendors.</li>
        <li>Venue-specific updates.</li>
      </ul><br>
      <p>If you have any questions in the meantime, just hit reply to this email!</p><br>
      <p>[organizationName]</p><br>
    HTML
  },
  {
    name: "Countdown - Vendor (3 Days)",
    subject_template: "Final Instructions: [eventName] Vendor Load-In & Parking",
    trigger_type: "days_before_event",
    trigger_value: 3,
    category: "vendor",
    position: 28,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>We're just a few days out from The [eventName] at [venue]! Promo is running across all channels, and local interest is massive—this is shaping up to be an incredible night.</p><br>
      <p>Below is everything you need for a smooth load-in, plus a few "Pro Tips" to help you maximize your sales during the event.</p><br>
      <h3>PRO TIPS</h3><br>
      <ul>
        <li><strong>Eye-Level Signage:</strong> In a crowded room, making sure your brand name is visible above the crowd is key.</li>
        <li><strong>Warm Lighting:</strong> The venue is "moody" (dim); battery-powered clip lights or warm LEDs instantly increase booth dwell time.</li>
        <li><strong>Payment Readiness:</strong> Have your card readers and QR codes (Venmo/CashApp/Zelle) displayed prominently for quick transactions.</li>
        <li><strong>The "Hook":</strong> A small, featured item or a bundle deal at the front of your table helps draw people in.</li>
      </ul><br>
      <h3>LOAD-IN INSTRUCTIONS</h3><br>
      <ul>
        <li><strong>Where:</strong> [venue] | [address]</li>
        <li><strong>Load-In Time:</strong> [category_install_time]</li>
        <li><strong>Event Hours:</strong> [event_time]</li>
        <li><strong>Check-In:</strong> Enter through the main entrance. Our team will be stationed there to scan your Eventbrite QR code.</li>
        <li><strong>Setup Location:</strong> Spaces are first-come, first-served.</li>
        <li><strong>Parking:</strong> Paid street parking and nearby lots are available.</li>
      </ul><br>
      <h3>WHAT TO BRING</h3><br>
      <p>We DO NOT provide tables, chairs, or display hardware. Please bring:</p><br>
      <ul>
        <li><strong>Table &amp; Chair:</strong> One 6ft table and your own seating.</li>
        <li><strong>Display Gear:</strong> Grid walls, racks, and signage.</li>
        <li><strong>Power:</strong> We provide access, but bring your own long extension cords and power strips just in case.</li>
        <li><strong>Supplies:</strong> Bags, change/cash, and any branding materials.</li>
      </ul><br>
      <h3>RULES &amp; RESTRICTIONS</h3><br>
      <p>To keep the event safe and ensure we can return to this venue, please avoid:</p><br>
      <ul>
        <li><strong>No Tents:</strong> Tents and pop-up canopies are not permitted indoors.</li>
        <li><strong>No Wall Damage:</strong> Do not drill, glue, or attach anything to venue surfaces.</li>
        <li><strong>Prohibited:</strong> No open flames, cooking appliances, amplified sound, or loose glitter/confetti.</li>
      </ul><br>
      <p>We're ramping up the promo all week. If you haven't shared the flyer yet, now is the perfect time—tag @pancakesandbooze so we can repost!</p><br>
      <p>If any last-minute questions pop up, just reply here. We'll see you soon!</p><br>
      <p>[organizationName]</p><br>
    HTML
  },
  {
    name: "Countdown - Vendor (Day Of)",
    subject_template: "TODAY: [eventName] Vendor Load-In Info!",
    trigger_type: "on_event_date",
    trigger_value: 0,
    category: "vendor",
    position: 29,
    body_template: <<~HTML
      <p>Hi [greetingName],</p><br>
      <p>The day is here! Here is the TL;DR info for today's vendor load-in at [venue].</p><br>
      <h3>THE BASICS:</h3><br>
      <ul>
        <li><strong>Load-in:</strong> [category_install_time].</li>
        <li><strong>Check-in:</strong> Front door—have your Eventbrite QR code ready.</li>
        <li><strong>Setup:</strong> First-come, first-served.</li>
        <li><strong>Parking:</strong> Paid street + nearby lots. Unload quickly, then move your car.</li>
      </ul><br>
      <h3>REMEMBER TO BRING:</h3><br>
      <ul>
        <li>One 6ft table and your own chair(s).</li>
        <li>Gear: Displays, lighting, and long extension cords.</li>
        <li>Sales: Your digital payment QR codes and any supplies for your customers.</li>
      </ul><br>
      <h3>QUICK RULES:</h3><br>
      <ul>
        <li><strong>NO Tents:</strong> Indoor shows do not allow pop-up canopies.</li>
        <li><strong>NO Wall Art:</strong> Vendor spaces are for non-hangable items only.</li>
        <li><strong>NO Tables Provided:</strong> If you don't bring a table, you won't have a display surface!</li>
      </ul><br>
      <p>Full Details &amp; FAQs: https://www.pancakesandbooze.com/[location]</p><br>
      <p>We'll see you in a few hours!</p><br>
      <p>[organizationName]</p><br>
    HTML
  }
]

# Step 3: Create all email template items
created_count = 0
failed_count = 0

emails.each do |email_data|
  begin
    template.email_template_items.create!(
      name: email_data[:name],
      subject_template: email_data[:subject_template],
      body_template: email_data[:body_template].strip,
      trigger_type: email_data[:trigger_type],
      trigger_value: email_data[:trigger_value],
      trigger_time: "09:00",
      category: email_data[:category],
      position: email_data[:position],
      enabled_by_default: true
    )
    puts "   ✅ #{email_data[:name]} (Position #{email_data[:position]})"
    created_count += 1
  rescue => e
    puts "   ❌ Failed: #{email_data[:name]}: #{e.message}"
    failed_count += 1
  end
end

# Step 4: Summary
puts "\n" + "=" * 80
puts "✅ Import Complete!"
puts "=" * 80
puts "Template: #{template.name}"
puts "Template ID: #{template.id}"
puts "Emails Created: #{created_count}"
puts "Emails Failed: #{failed_count}"
puts "Total Items: #{template.email_template_items.count}"
puts ""
puts "🎉 Template is now available system-wide for all users to select when creating events!"
puts ""
