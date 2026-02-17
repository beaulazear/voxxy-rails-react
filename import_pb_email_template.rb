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

  # Must delete/nullify in FK order:
  # events.email_campaign_template_id → email_deliveries → scheduled_emails → email_template_items

  # Nullify events referencing this template (preserves events, just clears the link)
  nullified_events = Event.where(email_campaign_template_id: existing.id).update_all(email_campaign_template_id: nil)
  puts "   🗑  Nullified email_campaign_template_id on #{nullified_events} event(s)" if nullified_events > 0

  item_ids = existing.email_template_items.pluck(:id)
  if item_ids.any?
    se_ids = ScheduledEmail.where(email_template_item_id: item_ids).pluck(:id)
    if se_ids.any?
      deleted_ed = EmailDelivery.where(scheduled_email_id: se_ids).delete_all
      puts "   🗑  Deleted #{deleted_ed} email_deliver(ies) referencing old scheduled emails"
      deleted_se = ScheduledEmail.where(id: se_ids).delete_all
      puts "   🗑  Deleted #{deleted_se} scheduled_email(s) referencing old template items"
    end
  end

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

# Shared unsubscribe footer appended to every email
FOOTER = <<~HTML
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

  <p style="font-size: 12px; color: #888888;">
    <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
  </p>

  <p style="font-size: 12px; color: #aaaaaa;">Powered by Voxxy Presents</p>
HTML

emails = [
  # ─── Application Received ───
  {
    name: "Application Received - Artist",
    subject_template: "Application Received - [eventName]",
    trigger_type: "on_application_submit",
    trigger_value: 0,
    category: "artist",
    position: 1,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>Thanks for submitting your application to participate in The [eventName] at [eventVenue] on [dateRange]. Please allow up to 10 days for us to review your submission and get back to you.</p>
      <p>In the meantime, please visit our Instagram page (@pancakesandbooze) and check out the "FAQs" in our Story Highlights for details on how our events work.</p>
      <h3>Exhibition Pricing Update</h3>
      <p>We've updated our exhibition structure for 2026. We are now offering <strong>one free piece</strong> after your first paid exhibition space. And to keep our pricing transparent, <strong>we are now covering all ticketing and processing fees</strong>—the price you see below is exactly what you pay at checkout with no hidden service fees.</p>
      <h4>The Rate:</h4>
      <ul>
        <li><strong>1st Piece:</strong> [boothPrice]</li>
        <li><strong>2nd Piece:</strong> FREE</li>
        <li><strong>Pieces 3–10:</strong> [boothPrice] each</li>
        <li><em>Note: If fees are paid after [paymentDueDate], the rate increases to $25 per piece (2nd piece remains free).</em></li>
      </ul>
      <h4>The Details:</h4>
      <ul>
        <li><strong>NO COMMISSION:</strong> You manage your own sales and take 100% of what you sell.</li>
        <li><strong>SIZE LIMIT:</strong> Each piece should not exceed 3ft x 3ft.</li>
        <li><strong>INSTALLATION:</strong> Currently scheduled for [installDate] from [installTime].</li>
        <li><strong>NO TABLES:</strong> Artists hanging artwork cannot use tables. Small bins/boxes on the floor are permitted.</li>
        <li><strong>LOAD OUT:</strong> All artwork must be taken home at the end of the night. We are not responsible for items left behind.</li>
        <li><strong>AGE POLICY:</strong> The venue enforces a strict [ageRestriction] age policy.</li>
      </ul>
      <p><strong>Attention Live Painters:</strong> We love featuring live body painting and canvas work. If you'd like to paint live, let us know so we can coordinate promotion on our socials.</p>
      <p>Thanks,<br>[organizationName]</p>
      <p><em>If you're unable to participate, please <a href="#">click here</a> to let us know.</em></p>
      #{FOOTER}
    HTML
  },
  {
    name: "Application Received - Vendor",
    subject_template: "Vendor Application Received - [eventName]",
    trigger_type: "on_application_submit",
    trigger_value: 0,
    category: "vendor",
    position: 2,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We've received your request to set up a VENDOR TABLE at The [eventName] on [dateRange] at [eventVenue]. This is <strong>NOT</strong> an acceptance email. You will receive another email and text message with further information if you're selected.</p>
      <p><strong>IMPORTANT:</strong> Vendor tables are strictly for non-hangable merchandise (clothing, jewelry, etc). If you have paintings or wall art, you have filled out the <strong>WRONG application</strong>. We do not permit canvas paintings, drawings, or prints larger than a greeting card on vendor tables. If this is you, please email us immediately so we can get you the correct artist information.</p>
      <h3>Selection &amp; Pricing</h3>
      <p>Table space is extremely limited and in high demand. If you are selected, <strong>PREPAYMENT IS REQUIRED</strong> to reserve your space. Your spot is only guaranteed once payment is received.</p>
      <p>The vending fee is <strong>[boothPrice]</strong>. To keep our pricing transparent, <strong>we now cover all ticketing and processing fees</strong>—the price you see is exactly what you pay at checkout with no hidden service fees.</p>
      <h4>The Details:</h4>
      <ul>
        <li><strong>SPACE:</strong> Large enough for ONE 6ft table. No tents or multiple tables allowed.</li>
        <li><strong>EQUIPMENT:</strong> You must provide your own table and chair. We do not provide them.</li>
        <li><strong>LOAD-IN:</strong> Starts at [installTime] on the day of the show. Please do not arrive early.</li>
        <li><strong>AGE POLICY:</strong> The venue enforces a strict [ageRestriction] age policy.</li>
      </ul>
      <p>New to the event? Check us out @pancakesandbooze on Instagram and TikTok for a look at the vibe.</p>
      <p>Thanks,<br>[organizationName]</p>
      <p><em>If you're unable to participate, please <a href="#">click here</a> to let us know.</em></p>
      #{FOOTER}
    HTML
  },

  # ─── Application Accepted ───
  {
    name: "Application Accepted - Artist",
    subject_template: "You're In! [eventName]",
    trigger_type: "on_approval",
    trigger_value: 0,
    category: "artist",
    position: 3,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p><strong>Congratulations!</strong> You've been invited to exhibit at <strong>The [eventName]</strong> on [dateRange] at [eventVenue].</p>
      <p>We received a high volume of applications, and we're excited to have your work in the mix. Please note that <strong>we do not hold spots</strong>; your space is only officially secured once your exhibition fees are received.</p>
      <h3>Step 1: Secure Your Space</h3>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">PAYMENT LINK: CONFIRM YOUR EXHIBIT HERE</a></p>
      <p><strong>Exhibition Rates (No Hidden Fees):</strong><br>
      – 1st Piece: <strong>[boothPrice]</strong><br>
      – 2nd Piece: <strong>FREE</strong><br>
      – Pieces 3–10: <strong>[boothPrice] each</strong><br>
      – <em>Prices increase to $25/piece after [paymentDueDate].</em></p>
      <p><strong>Cancellation Policy:</strong> Full refunds are available for cancellations made up to <strong>72 hours before the event</strong>. Cancellations within 72 hours are non-refundable.</p>
      <hr>
      <h4>What Happens Next?</h4>
      <p>Once your payment is confirmed, keep an eye on your inbox for our <strong>Artist Roadmap</strong> series:</p>
      <ul>
        <li><strong>30 Days Out:</strong> You'll receive a "Prep Guide" detailing our salon-style hanging requirements and hardware tips.</li>
        <li><strong>14 Days Out:</strong> We'll launch our marketing blitz and send you the official promo toolkit to help drive sales.</li>
        <li><strong>3–6 Days Out:</strong> Final logistics, load-in times, and venue updates will be sent via Eventbrite.</li>
      </ul>
      <hr>
      <h4>Quick Guidelines:</h4>
      <ul>
        <li><strong>NO COMMISSION:</strong> You keep 100% of your sales.</li>
        <li><strong>SIZE LIMIT:</strong> Max 3ft x 3ft per piece. No exceptions.</li>
        <li><strong>NO TABLES:</strong> Tables are for vendors only. Artists may use small floor bins for prints.</li>
        <li><strong>AGE POLICY:</strong> Strict [ageRestriction] policy.</li>
      </ul>
      <p><strong>Online Marketplace:</strong> P&amp;B Artists can sell year-round at <a href="#">district.net/pancakesandbooze</a>.</p>
      <p>Thanks,<br>[organizationName]</p>
      <p><em>Plans changed? <a href="#">Click here</a> to release your space to the next artist on our waitlist.</em></p>
      #{FOOTER}
    HTML
  },
  {
    name: "Application Accepted - Vendor",
    subject_template: "You're Approved! [eventName]",
    trigger_type: "on_approval",
    trigger_value: 0,
    category: "vendor",
    position: 4,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p><strong>Congratulations!</strong> You've been approved to vend at <strong>The [eventName]</strong> on [dateRange] at [eventVenue].</p>
      <p>We received a high volume of applications for this show, and we're excited to have your brand in the mix. Because vendor space is extremely limited, <strong>we do not hold spots.</strong> Your space is only officially reserved once payment is completed through the link below.</p>
      <h3>Step 1: Secure Your Space</h3>
      <p>The vending fee is <strong>[boothPrice]</strong>. To keep our pricing transparent, <strong>we now cover all ticketing and processing fees</strong>—the price you see is exactly what you pay at checkout.</p>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">PAYMENT LINK: SECURE YOUR TABLE HERE</a></p>
      <p><strong>Cancellation Policy:</strong> We understand that life happens. We offer full refunds for cancellations made up to <strong>72 hours before the event</strong>. This allows us time to offer the space to a vendor on our waitlist. Cancellations made within 72 hours of the show are non-refundable.</p>
      <hr>
      <h4>Step 2: Spread the Word</h4>
      <p>The most successful shows happen when we all hustle together. Tag <strong>@pancakesandbooze</strong> and use <strong>#pancakesandbooze</strong> in your posts so we can find and feature your work leading up to the event.</p>
      <hr>
      <h4>Event Day Details:</h4>
      <ul>
        <li><strong>Location:</strong> [eventVenue] — [address]</li>
        <li><strong>Load-In:</strong> [installDate] at [installTime]. (The venue will not be open for setup prior to this time).</li>
        <li><strong>Setup:</strong> You are allowed ONE 6ft table. You must provide your own table and chair. Grid walls and racks are permitted if they fit within your approx. 8ft x 5ft footprint.</li>
        <li><strong>Staffing:</strong> Your space includes entry for one person (you). All assistants or guests must purchase a general admission ticket.</li>
        <li><strong>Load-Out:</strong> Must be completed by the end of the event. We are not responsible for items left behind.</li>
        <li><strong>Merchandise:</strong> Strictly non-hangable items only. No wall art/paintings permitted at vendor tables.</li>
        <li><strong>Age Policy:</strong> You must be [ageRestriction] to participate.</li>
      </ul>
      <p>If you have any questions, feel free to reply to this email.</p>
      <p>Thanks,<br>[organizationName]</p>
      <p><em>If your plans have changed and you can no longer participate, please <a href="#">click here</a> to release your spot to the next person on our waitlist.</em></p>
      #{FOOTER}
    HTML
  },

  # ─── Art Calls ───
  {
    name: "Art Call Email #1 - 10 Weeks Out",
    subject_template: "Submissions Open - [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 70,
    category: "artist",
    position: 5,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>[organizationName] is back in [eventCity] and submissions are open for our upcoming show at [eventVenue] on [dateRange].</p>
      <p>Your first TWO pieces are just $20 total if your exhibition fee is paid by [paymentDueDate].</p>
      <p>We'd be stoked to have you back. Please follow the appropriate link below to get your application in:</p>
      <p><strong>GALLERY EXHIBITION (Wall Space)</strong><br>
      Paintings, Photography, Mixed Media, &amp; Sculptures<br>
      <a href="[artistApplicationLink]" style="color: #0066cc; text-decoration: underline;">Artists Apply Here</a></p>
      <p><strong>VENDOR MARKET (Table Space)</strong><br>
      Clothing, Jewelry, Handcrafted Goods, &amp; Small Merch (No wall art)<br>
      <a href="[vendorApplicationLink]" style="color: #0066cc; text-decoration: underline;">Vendors Apply Here</a></p>
      <p>We look forward to your submission!</p>
      <p>[organizationName]</p>
      <p>P.S. — If you can't make this show and want to stop receiving reminders for this specific date, please <a href="#">let us know</a>.</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Art Call Email #2 - 8 Weeks Out",
    subject_template: "Two Months Out - [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 56,
    category: "artist",
    position: 6,
    body_template: <<~HTML
      <p>Hey [greetingName],</p>
      <p>Ready for another round of [organizationName]? We're back in [eventCity] at [eventVenue] on [dateRange] and we'd love to have you there.</p>
      <p>We are officially two months out, so now is the time to lock in your spot.</p>
      <p><strong>The Deal:</strong> Your first TWO pieces are just $20 total if your exhibition fee is paid by [paymentDueDate].</p>
      <p>We have your info on file, so applying is easy—just visit the appropriate link below and click "Yes, Sign Me Up." It takes two seconds.</p>
      <p><strong>GALLERY EXHIBITION (Wall Space)</strong><br>
      Paintings, Photography, Mixed Media, &amp; Sculptures<br>
      <a href="[artistApplicationLink]" style="color: #0066cc; text-decoration: underline;">ARTIST SUBMISSIONS - Apply Here</a></p>
      <p><strong>VENDOR MARKET (Table Space)</strong><br>
      Clothing, Jewelry, Handcrafted Goods, &amp; Small Merch (No wall art)<br>
      <a href="[vendorApplicationLink]" style="color: #0066cc; text-decoration: underline;">VENDOR SUBMISSIONS - Apply Here</a></p>
      <p>If you have any questions, just hit reply and let me know.</p>
      <p>Thanks,<br>[organizationName]</p>
      <p>P.S. — If you can't make this show and want to stop receiving reminders for this specific date, please <a href="#">let us know</a>.</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Art Call Email #3 - 4 Weeks Out",
    subject_template: "Nearly at Capacity - [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 28,
    category: "artist",
    position: 7,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>The [eventName] on [dateRange] is now just weeks away.</p>
      <p>We've received an insane response for this event and are nearly at capacity. This is likely your final opportunity to submit and lock in the $20 rate for your first two pieces before we are completely full.</p>
      <p>If you want in, please use the appropriate link below to secure your spot ASAP:</p>
      <p><strong>GALLERY EXHIBITION (Wall Space)</strong><br>
      Paintings, Photography, Mixed Media, &amp; Sculptures<br>
      <a href="[artistApplicationLink]" style="color: #0066cc; text-decoration: underline;">ARTIST SUBMISSIONS - Apply Here</a></p>
      <p><strong>VENDOR MARKET (Table Space)</strong><br>
      Clothing, Jewelry, Handcrafted Goods, &amp; Small Merch (No wall art)<br>
      <a href="[vendorApplicationLink]" style="color: #0066cc; text-decoration: underline;">VENDOR SUBMISSIONS - Apply Here</a></p>
      <p>Hit me back as soon as possible to let me know if you're joining us.</p>
      <p>Thanks,<br>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Art Call Email #4 - 12 Days Out",
    subject_template: "Submissions Closing Soon - [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 12,
    category: "artist",
    position: 8,
    body_template: <<~HTML
      <p>What's up [greetingName]?</p>
      <p>Just a heads up that submissions for The [eventName] on [dateRange] at [eventVenue] will be closing soon.</p>
      <p>This is the last time I'll reach out for this specific show, so please hit the link below now if you want to ensure you have a spot on the floor or the walls.</p>
      <p><strong>GALLERY EXHIBITION (Wall Space)</strong><br>
      Paintings, Photography, Mixed Media, &amp; Sculptures<br>
      <a href="[artistApplicationLink]" style="color: #0066cc; text-decoration: underline;">ARTIST SUBMISSIONS - Apply Here</a></p>
      <p><strong>VENDOR MARKET (Table Space)</strong><br>
      Clothing, Jewelry, Handcrafted Goods, &amp; Small Merch (No wall art)<br>
      <a href="[vendorApplicationLink]" style="color: #0066cc; text-decoration: underline;">VENDOR SUBMISSIONS - Apply Here</a></p>
      <p>Good Vibes,<br>[organizationName]</p>
      #{FOOTER}
    HTML
  },

  # ─── Payment Reminders - Artists ───
  {
    name: "Payment Reminder - Artist (39 Days)",
    subject_template: "Ramping up for [eventName]! (Confirm your spot)",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 39,
    category: "artist",
    position: 9,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We're starting to ramp things up for The [eventName] at [eventVenue].</p>
      <p>We wanted to remind you that your spot is not confirmed until your payment is completed. Once you're locked in, you'll start receiving the "Deep Detail" emails covering load-in times and setup guidelines.</p>
      <p><strong>The Early Bird Rate:</strong><br>
      [boothPrice] for your first two pieces.<br>
      Pieces 3–10 are [boothPrice] each.</p>
      <p>This discounted rate is only available until [paymentDueDate].</p>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">RESERVE YOUR SPACE</a></p>
      <p>On the promo side: We're seeing a huge surge in engagement across our socials, and the local buzz for the [eventName] show is already high. We're pushing hard to get your work in front of as many eyes as possible—keep an eye out for the event flyer on your feed and tag us (@pancakesandbooze) for a chance to have your work reposted.</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Payment Reminder - Artist (26 Days)",
    subject_template: "[eventName]: 4 weeks to go!",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 26,
    category: "artist",
    position: 10,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We are officially less than a month away from The [eventName]!</p>
      <p>The local buzz is building, and we're seeing a huge surge in engagement across our socials. We're pushing hard to get the word out—keep an eye out for the event flyer on your feed and feel free to share it with your own followers to let them know where you'll be.</p>
      <p>If you haven't secured your space yet, now is the time. You still have plenty of time to lock in the Early Bird rate, but spots are being claimed quickly.</p>
      <p><strong>The Current Rate:</strong><br>
      [boothPrice] for your first two pieces.<br>
      Pieces 3–10 are [boothPrice] each.<br>
      This rate is valid until [paymentDueDate].</p>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">RESERVE YOUR SPACE HERE</a></p>
      <p><strong>Quick Reminder:</strong><br>
      0% Commission: You keep 100% of your sales.<br>
      3' x 3' size maximum per piece you exhibit.</p>
      <p>We're looking forward to working together and making this an incredible night!</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Payment Reminder - Artist (16 Days)",
    subject_template: "Early bird pricing ends in 10 days",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 16,
    category: "artist",
    position: 11,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We're getting closer! The [eventName] show is officially less than three weeks away, and we're currently finalizing the layout of the space.</p>
      <p>This is your 10-day warning to lock in the early-bird rate. If you want to exhibit, make sure you've secured your space before the price increase kicks in.</p>
      <p><strong>The Early Bird Deadline:</strong><br>
      Current Rate: [boothPrice] for your first two pieces.<br>
      Deadline: This rate expires on [paymentDueDate].<br>
      After the Deadline: The price jumps to $25 per piece.</p>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">SECURE YOUR SPACE &amp; SAVE</a></p>
      <p><strong>Quick Recap:</strong><br>
      No Commission: You keep 100% of your sales.<br>
      Live Painting: Still highly encouraged! It's a great way to engage the crowd.<br>
      Socials: Don't forget to tag @pancakesandbooze in your process shots so we can show our followers what you're bringing to the show.</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Payment Reminder - Artist (8 Days)",
    subject_template: "Early bird Exhibition rates end tomorrow",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 8,
    category: "artist",
    position: 12,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>Just a quick heads-up: The early bird discount for The [eventName] expires on [paymentDueDate]. This is your last chance to grab the [boothPrice] rate for your first two pieces.</p>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">SECURE YOUR SPACE NOW</a></p>
      <p>Starting the day after [paymentDueDate], the rate for your first two pieces will jump to $25 per piece. Please complete your payment before the deadline to ensure you are included in the show at the lower rate.</p>
      <p>See you soon,<br>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Payment Reminder - Artist (4 Days)",
    subject_template: "You can still exhibit at the [eventName]",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 4,
    category: "artist",
    position: 13,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We are 4 days out from The [eventName] and we are finalizing the artist lineup and wall layout today.</p>
      <p>We still haven't seen your payment come through. If you still plan to participate, payment must be completed immediately to ensure you are included in the floor plan.</p>
      <p><strong>The Current Rate:</strong><br>
      Exhibition fees are now $25 per piece (2nd piece remains free).<br>
      Pieces 3–10 are $25 per piece.</p>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">SECURE YOUR SPACE NOW</a></p>
      <p>Once your payment is complete, you will receive the final "Deep Detail" email with your specific load-in times, parking info, and setup instructions.</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Payment Reminder - Artist (1 Day)",
    subject_template: "Last call to Secure your spot for the [eventName]",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 1,
    category: "artist",
    position: 14,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>The show is tomorrow at [eventVenue], and we have just a few artist spaces still open.</p>
      <p>If you want to exhibit, payment must be completed today. Unpaid spots are not guaranteed and will be given to walk-in artists or those on the waitlist once we hit capacity.</p>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">RESERVE THE LAST REMAINING SPACE</a></p>
      <p>Once payment is processed, you'll get the final load-in instructions immediately. Let's make it a big one!</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },

  # ─── Payment Reminders - Vendors ───
  {
    name: "Payment Reminder - Vendor (29 Days)",
    subject_template: "Nudge: Your Vendor Spot for [eventName]",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 29,
    category: "vendor",
    position: 15,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We're ramping up for The [eventName] at [eventVenue] on [eventDate] and we would love to have you in our vendor lineup!</p>
      <p>As a reminder, your vendor space is not confirmed or held until your payment is completed. Because we are very limited on our vendor spaces, these spots tend to fill up fast as we get closer to the event.</p>
      <p><strong>HOW TO SECURE YOUR SPACE</strong></p>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">CLICK HERE TO RESERVE YOUR SPACE</a><br>
      Select "Get Tickets"<br>
      Scroll down to the "VENDOR TICKET" option<br>
      Complete checkout through Eventbrite</p>
      <p>Vendor Fee: [boothPrice]</p>
      <p><strong>QUICK VENDOR DETAILS</strong></p>
      <ul>
        <li>Approved Items: Jewelry, clothing, stickers, etc. No wall-hanging art.</li>
        <li>Space Size: Roughly 8ft wide x 5ft deep (Fits one 6ft table).</li>
        <li>Equipment: You must bring your own 6ft table and chair.</li>
        <li>Setup Rules: No tents. No multiple-table setups. Grid walls/racks must fit inside your space.</li>
        <li>Entry: Includes one (1) free entry for the vendor.</li>
        <li>Age Policy: You must be [ageRestriction]+ to participate.</li>
      </ul>
      <p>Once your payment is processed, your space is officially locked in. We typically see our vendor market hit capacity about two weeks before the show—don't miss the window to join us!</p>
      <p>[organizationName]</p>
      <p>P.S. — If your plans have changed and you're no longer able to attend, please <a href="#">click here</a> to let us know so we can release the space to the next person on the waitlist.</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Payment Reminder - Vendor (15 Days)",
    subject_template: "Update: [eventName] Vendor Space Availability",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 15,
    category: "vendor",
    position: 16,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We're getting into the home stretch for The [eventName] at [eventVenue] on [eventDate].</p>
      <p>I'm reaching out because we are officially entering the final two weeks before the show. As we've mentioned previously, we are limited on the total number of vendors we can host, and we typically see our remaining spaces fill up completely right around this time.</p>
      <p>If you are still planning to exhibit your work, please complete your payment now to ensure you don't lose your spot. Once we hit our capacity, the payment link will disappear.</p>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">SECURE YOUR VENDOR SPACE</a></p>
      <p><strong>Quick Reminders:</strong></p>
      <ul>
        <li>Your Space: Approx. 8ft wide x 5ft deep.</li>
        <li>Your Gear: You must bring your own 6ft table and chair.</li>
        <li>Setup: No tents or multiple-table setups.</li>
        <li>Items: This space is for non-hangable items (jewelry, clothing, stickers, etc.).</li>
      </ul>
      <p>Once payment is confirmed, you are officially on the floor plan. We're looking forward to having you!</p>
      <p>[organizationName]</p>
      <p>P.S. — If you are no longer able to make it, please let us know so we can offer the space to someone else on the waiting list.</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Payment Reminder - Vendor (9 Days)",
    subject_template: "Final Call: [eventName] Vendor Availability",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 9,
    category: "vendor",
    position: 17,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We are now just over a week away from The [eventName]!</p>
      <p>As we've mentioned, we are strictly limited on the number of vendor spaces available at [eventVenue]. We are currently down to our final remaining spots, and we expect the payment link to deactivate shortly as we hit capacity.</p>
      <p>If you still intend to vend at this show, please secure your space immediately. Once the link disappears, we will be unable to add any additional vendors to the floor plan.</p>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">SECURE YOUR VENDOR SPACE NOW</a></p>
      <p><strong>Final Checklist:</strong></p>
      <ul>
        <li>Space: Approx. 8ft wide x 5ft deep.</li>
        <li>Table: You must bring your own 6ft table and chair.</li>
        <li>Rules: No tents. No multiple-table setups.</li>
        <li>Load-in: Instructions will be sent once payment is confirmed.</li>
      </ul>
      <p>We'd love to have you out there with us, but we can't hold the space without payment. Hope to see you next week!</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Payment Reminder - Vendor (3 Days)",
    subject_template: "URGENT: Is your [eventName] vendor space confirmed?",
    trigger_type: "days_before_payment_deadline",
    trigger_value: 3,
    category: "vendor",
    position: 18,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We are just 72 hours away from The [eventName] at [eventVenue].</p>
      <p>We are currently finalizing the physical floor layout and we have a very small number of vendor spaces left. If you still intend to participate, this is your final opportunity to secure your spot before the payment link is deactivated for good.</p>
      <p><a href="[categoryPaymentLink]" style="color: #0066cc; text-decoration: underline;">RESERVE THE LAST REMAINING SPACE</a></p>
      <p><strong>Important:</strong> Once we hit our final capacity (which usually happens within hours of this final notice), we cannot accommodate any more vendors. There are no walk-in vendor spots available.</p>
      <p><strong>Reminder for Show Day:</strong></p>
      <ul>
        <li>Load-in starts at [installTime].</li>
        <li>You must bring your own 6ft table and chair.</li>
        <li>No tents or multiple-table setups are permitted.</li>
      </ul>
      <p>If your payment has already been processed, please disregard this message and keep an eye out for the final logistics email.</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },

  # ─── Payment Confirmed ───
  {
    name: "Payment Confirmed",
    subject_template: "Confirmed: You're in for [eventName]!",
    trigger_type: "on_payment_received",
    trigger_value: 0,
    category: "artist",
    position: 19,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We've received your payment—you're officially confirmed for The [eventName] at [eventVenue] on [eventDate]!</p>
      <p>We're pumped to have you with us.</p>
      <p><strong>Your Entry Ticket:</strong> You should have already received a confirmation email from Eventbrite. That email includes your QR code, which we'll scan when you arrive to install your work. You can bring it on your phone, print it out, or we can look you up by name—the QR code is just the fastest option for check-in.</p>
      <p><strong>What Happens Next?</strong></p>
      <ul>
        <li><strong>Confirmation:</strong> You are all set for now! You don't need to send us anything else today.</li>
        <li><strong>Deep Details:</strong> Over the next couple of weeks, you'll receive the "Deep Detail" emails covering setup times, parking, wall assignments, and exactly what to expect on show day.</li>
        <li><strong>Promotion:</strong> We are pushing the show hard on socials. Tag @pancakesandbooze in your process shots or finished pieces so we can repost your work to our followers.</li>
      </ul>
      <p>Thanks again for being a part of the show. We'll be in touch soon with the logistics!</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },

  # ─── Countdown - Artists ───
  {
    name: "Countdown - Artist (17 Days)",
    subject_template: "Artist Guide: Size, Hanging, & Sales for [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 17,
    category: "artist",
    position: 20,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>As we get closer to The [eventName] at [eventVenue], we want to share the "Playbook" regarding artwork size, hanging, and setup so you know exactly what to expect on install day.</p>
      <p>This is a salon-style show and wall space is shared—please read through these guidelines carefully.</p>
      <h3>1. SIZE &amp; HANGING GUIDELINES</h3>
      <ul>
        <li><strong>Size Limit:</strong> Each piece must not exceed 3ft x 3ft (90cm x 90cm).</li>
        <li><strong>The Walls:</strong> Artwork is hung salon-style on 8ft x 4ft drywall panels. Wall space is shared; please be prepared to coordinate with your neighbors respectfully.</li>
        <li><strong>Placement:</strong> Locations are assigned first-come, first-served at load-in. If you are particular about where you hang, arrive early.</li>
        <li><strong>Method:</strong> Wired artwork is highly preferred, though we can work with most methods.</li>
        <li><strong>Tools:</strong> We provide walls, screws, and screw guns. Tools are shared, so if you're in a rush, feel free to bring your own screw gun.</li>
        <li><strong>CRITICAL:</strong> Hammers and nails are NOT allowed.</li>
      </ul>
      <h3>2. SALES, PRICING &amp; MERCH</h3>
      <ul>
        <li><strong>0% Commission:</strong> 100% of your sales are yours. We do not take a cut.</li>
        <li><strong>Payments:</strong> You must handle your own sales. Please have your Venmo/Zelle/Square QR codes ready for buyers.</li>
        <li><strong>Merch:</strong> You may sell prints or small merch from a small bin/box on the floor directly under your artwork.</li>
        <li><strong>NO TABLES:</strong> Tables are not permitted for artists hanging in the gallery space.</li>
      </ul>
      <h3>3. TITLE CARDS</h3>
      <p>Please provide your own title cards (roughly 4"x6" / postcard size). We recommend including:</p>
      <ul>
        <li>Name of Artwork, Medium, and Price.</li>
        <li>A QR code linking to your Instagram or payment handle.</li>
      </ul>
      <h3>4. ENTRY &amp; LOAD-OUT</h3>
      <ul>
        <li><strong>Artist Entry:</strong> You are on the guest list for free entry. Assistants and guests must purchase a ticket to attend.</li>
        <li><strong>Load-Out:</strong> All artwork must be removed immediately after the show (Midnight). Neither the venue nor [organizationName] can store artwork. Do not leave for the night without your work!</li>
      </ul>
      <p>We'll be sending another email soon with a walkthrough of the "Day-Of" experience, followed by final load-in times.</p>
      <p>Thanks for being prepared—we're looking forward to a great night in [eventCity]!</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Countdown - Artist (11 Days)",
    subject_template: "What to expect: Your day at the [eventName] Art Show",
    trigger_type: "days_before_event",
    trigger_value: 11,
    category: "artist",
    position: 21,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>As we get closer to The [eventName], we wanted to walk through how the day typically works so you can plan accordingly.</p>
      <p>This email focuses on the general flow and expectations. Final, confirmed logistics (load-in times/parking) will be sent closer to the show.</p>
      <h3>INSTALLATION TIMING</h3>
      <ul>
        <li>Artwork installation typically takes place on the day of the show, usually between 1:00 PM – 5:00 PM.</li>
        <li><strong>Pre-Show:</strong> Installation happens before doors open to the public.</li>
        <li><strong>Confirming Times:</strong> Exact timing for your city will be reconfirmed in a later email.</li>
        <li><strong>Placement:</strong> Wall space is first-come, first-served. If you have a specific spot in mind, we recommend arriving early.</li>
      </ul>
      <h3>SALON-STYLE EXHIBITION</h3>
      <p>This is a salon-style show, which means we utilize the wall space from top to bottom.</p>
      <ul>
        <li>You will likely be sharing wall space with other artists.</li>
        <li>Plan your layout with flexibility and space efficiency in mind.</li>
        <li><strong>Staff Note:</strong> If spacing becomes an issue, our staff may ask for adjustments to ensure everyone fits.</li>
      </ul>
      <h3>HANGING YOUR ARTWORK</h3>
      <p>You are responsible for hanging your own work (though our staff is nearby to assist).</p>
      <ul>
        <li><strong>Ready to Hang:</strong> Please bring your art ready to be mounted.</li>
        <li><strong>Wiring:</strong> Wired artwork is preferred, but stretched canvas is fine without wiring.</li>
        <li><strong>Tools:</strong> We provide screws and screw guns onsite.</li>
        <li><strong>PROHIBITED:</strong> Hammers and nails are not allowed.</li>
      </ul>
      <h3>LIVE ART &amp; BODY PAINTING</h3>
      <p>If you plan to do live painting or body painting:</p>
      <ul>
        <li><strong>Timing:</strong> Setup may begin only after the event starts. Please do not set up earlier as production changes may be happening.</li>
        <li><strong>Guest List:</strong> Participating body painters and models get free entry.</li>
        <li><strong>Note:</strong> Sorry—no free entry for assistants or plus-ones.</li>
      </ul>
      <h3>SALES &amp; PAYMENTS</h3>
      <p>You manage your own sales and keep 100% of what you sell.</p>
      <ul>
        <li>We recommend having at least one digital payment option (Venmo, CashApp, Zelle).</li>
        <li>Ideally, include a QR code on your title card to make it easy for buyers to pay you instantly.</li>
      </ul>
      <p>For additional day-of questions, please review the FAQs on our website or check our Instagram Story Highlights.</p>
      <p>Thanks for being prepared and flexible—we're looking forward to a great night!</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Countdown - Artist (3 Days)",
    subject_template: "Final Details for [eventName]!",
    trigger_type: "days_before_event",
    trigger_value: 3,
    category: "artist",
    position: 22,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>The [eventName] is only a few days away! We are finalizing the venue prep and wanted to share this final checklist to ensure everything goes smoothly for you on show day.</p>
      <h3>INSTALLATION &amp; TIMING</h3>
      <ul>
        <li><strong>Install Window:</strong> Day of the show, typically between [installTime].</li>
        <li><strong>Be Ready:</strong> Please arrive with your work ready to hang immediately.</li>
        <li><strong>Load-Out:</strong> All artwork must be removed immediately after the event. No storage is available.</li>
      </ul>
      <h3>ARTWORK &amp; HANGING</h3>
      <ul>
        <li><strong>Max Size:</strong> Each piece must not exceed 3ft x 3ft. No exceptions due to wall size constraints.</li>
        <li><strong>Hanging:</strong> Wired artwork is preferred; stretched canvas is fine without wiring.</li>
        <li><strong>The Layout:</strong> This is a salon-style exhibition. Wall space is shared and utilized from top to bottom—not all work will be at eye level.</li>
        <li><strong>Tools:</strong> We provide screws and screw guns. Hammers and nails are NOT allowed.</li>
      </ul>
      <h3>SALES &amp; MERCH</h3>
      <ul>
        <li><strong>Commission:</strong> You keep 100% of your sales.</li>
        <li><strong>Merch:</strong> Bins or boxes for prints/merch are allowed on the floor beneath your work.</li>
        <li><strong>Tables:</strong> No tables are permitted for artists hanging in the gallery space.</li>
        <li><strong>Title Cards:</strong> Please bring your own (index-card size is best).</li>
      </ul>
      <h3>LIVE ART &amp; BODY PAINTING</h3>
      <ul>
        <li><strong>Setup:</strong> May begin only after the event starts. Please do not set up during the gallery installation window.</li>
        <li><strong>Guests:</strong> Participating body painters and models are on the guest list. No assistants or plus-ones are included.</li>
      </ul>
      <h3>ENTRY &amp; GUESTS</h3>
      <ul>
        <li><strong>Artists:</strong> You are on the guest list for free entry.</li>
        <li><strong>Others:</strong> Everyone else, including assistants, must have a ticket or pay the cover charge.</li>
      </ul>
      <p>For any last-minute questions, please review the FAQs on our website or check our Instagram Story Highlights.</p>
      <p>Thanks for being prepared and flexible—we'll see you at [eventVenue]!</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Countdown - Artist (Day Of)",
    subject_template: "TODAY: [eventName]!",
    trigger_type: "on_event_date",
    trigger_value: 0,
    category: "artist",
    position: 23,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>The day is finally here! The [eventName] is TODAY at [eventVenue]. We can't wait to see your work on the walls.</p>
      <h3>SHOW DAY ESSENTIALS</h3>
      <ul>
        <li><strong>Installation:</strong> Takes place today between [installTime].</li>
        <li><strong>Check-In:</strong> Have your Eventbrite QR code ready on your phone (or printed) for the fastest scan-in.</li>
        <li><strong>The Gear:</strong> We provide screws and screw guns. Hammers and nails are NOT allowed.</li>
        <li><strong>Size Check:</strong> Max size per piece is 3ft x 3ft.</li>
      </ul>
      <h3>QUICK REMINDERS</h3>
      <ul>
        <li><strong>Hanging:</strong> Arrive with your artwork ready to hang. This is a salon-style show; wall space is shared.</li>
        <li><strong>Sales:</strong> You keep 100% of your sales! Ensure your payment QR codes are ready for your buyers.</li>
        <li><strong>Merch:</strong> Prints/merch can be sold from a small bin on the floor. No tables for hanging artists.</li>
        <li><strong>Entry:</strong> You get in free. All guests and assistants must have a ticket.</li>
      </ul>
      <p><strong>Event Hours:</strong> [eventTime]</p>
      <p>We're excited to have you with us—let's make it a great night!</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },

  # ─── Countdown - Vendors ───
  {
    name: "Countdown - Vendor (12 Days)",
    subject_template: "Vendor Guide: Setup, Gear, & Expectations for [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 12,
    category: "vendor",
    position: 24,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>Now that you're officially confirmed for The [eventName], we want to walk through the logistical "Playbook" so you can prep your setup.</p>
      <p>Because we are limited on the number of vendors we can host at [eventVenue], space is optimized for flow and visibility. Please review these requirements carefully.</p>
      <h3>1. YOUR SPACE &amp; FOOTPRINT</h3>
      <ul>
        <li><strong>Dimensions:</strong> Your space is approximately 8ft wide x 5ft deep.</li>
        <li><strong>Placement:</strong> Locations are assigned first-come, first-served during load-in. If you want a specific spot, arrive early.</li>
        <li><strong>No Wall Art:</strong> This space is for non-hangable items (jewelry, apparel, etc.). You cannot use the gallery walls for canvases or hanging art unless you have also been accepted as an artist and have already paid your exhibition fees.</li>
      </ul>
      <h3>2. EQUIPMENT: WHAT TO BRING</h3>
      <p>We do not provide any furniture or display hardware. You are responsible for:</p>
      <ul>
        <li><strong>Table &amp; Chair:</strong> One 6ft table and your own seating.</li>
        <li><strong>Displays:</strong> Grid walls or clothing racks are permitted as long as they stay within your 8x5 footprint.</li>
        <li><strong>Lighting:</strong> The venues are often "moody" (dim). We highly recommend bringing battery-powered lights for your display.</li>
        <li><strong>Power:</strong> Outlets are not guaranteed at every spot. If you need power, please bring a long extension cord and power strip.</li>
      </ul>
      <h3>3. PROHIBITED ITEMS</h3>
      <ul>
        <li><strong>No Tents:</strong> Tents/canopies are not permitted indoors.</li>
        <li><strong>No Wall Damage:</strong> Do not drill, glue, or attach anything to the venue walls.</li>
      </ul>
      <h3>4. SALES &amp; ENTRY</h3>
      <ul>
        <li><strong>0% Commission:</strong> You keep 100% of your sales. Please have your Venmo/Square/Zelle QR codes ready.</li>
        <li><strong>Entry:</strong> Your space includes one (1) free entry for yourself. All assistants, staff, or guests must purchase a ticket to enter.</li>
      </ul>
      <p><strong>What's Next?</strong> We will send a final email 2–3 days before the show with the specific load-in address, parking instructions, and final arrival times.</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Countdown - Vendor (7 Days)",
    subject_template: "1 Week Out: Vendor Checklist for [eventName]",
    trigger_type: "days_before_event",
    trigger_value: 7,
    category: "vendor",
    position: 25,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We're just one week away from The [eventName]! This isn't the final load-in email (that's coming in a few days), but this checklist will ensure you're 100% prepared.</p>
      <p>Now is the perfect time to push your involvement on social media! Tag @pancakesandbooze and use #pancakesandbooze so we can repost your work to our community.</p>
      <h3>EVENT BASICS</h3>
      <ul>
        <li><strong>Load-in:</strong> [installDate] starting at [installTime].</li>
        <li><strong>Event Hours:</strong> [eventTime].</li>
        <li><strong>Address:</strong> [address].</li>
        <li><strong>Check-in:</strong> Our team will be stationed at the main entrance.</li>
        <li><strong>Setup:</strong> Locations are first-come, first-served.</li>
      </ul>
      <h3>PREP CHECKLIST</h3>
      <p>Since we DO NOT provide tables, chairs, or display hardware for vendors, please ensure you have the following:</p>
      <ul>
        <li><strong>Your Gear:</strong> Table (6ft max), chairs, grid walls, or racks.</li>
        <li><strong>Lighting:</strong> The venue can be dim; battery-powered display lights are highly recommended.</li>
        <li><strong>Power:</strong> We provide access, but please bring your own long extension cords and power strips.</li>
        <li><strong>Sales Supplies:</strong> Signage, business cards, and your digital payment QR codes.</li>
      </ul>
      <h3>RESTRICTIONS</h3>
      <p>To keep the event smooth and safe, please do not bring:</p>
      <ul>
        <li><strong>Tents:</strong> No pop-up tents or canopies are allowed indoors.</li>
        <li><strong>Wall Attachments:</strong> No drilling, gluing, or attaching anything to venue surfaces.</li>
        <li><strong>Prohibited:</strong> No open flames, generators, outside alcohol, or loose confetti/glitter.</li>
      </ul>
      <h3>FINAL LOGISTICS COMING SOON</h3>
      <p>In our next email, you'll receive the "Day-Of" specifics, including:</p>
      <ul>
        <li>Parking &amp; Unloading details.</li>
        <li>Entry Points for vendors.</li>
        <li>Venue-specific updates.</li>
      </ul>
      <p>If you have any questions in the meantime, just hit reply to this email!</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Countdown - Vendor (3 Days)",
    subject_template: "Final Instructions: [eventName] Vendor Load-In & Parking",
    trigger_type: "days_before_event",
    trigger_value: 3,
    category: "vendor",
    position: 26,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>We're just a few days out from The [eventName] at [eventVenue]! Promo is running across all channels, and local interest is massive—this is shaping up to be an incredible night.</p>
      <p>Below is everything you need for a smooth load-in, plus a few "Pro Tips" to help you maximize your sales during the event.</p>
      <h3>PRO TIPS</h3>
      <ul>
        <li><strong>Eye-Level Signage:</strong> In a crowded room, making sure your brand name is visible above the crowd is key.</li>
        <li><strong>Warm Lighting:</strong> The venue is "moody" (dim); battery-powered clip lights or warm LEDs instantly increase booth dwell time.</li>
        <li><strong>Payment Readiness:</strong> Have your card readers and QR codes (Venmo/CashApp/Zelle) displayed prominently for quick transactions.</li>
        <li><strong>The "Hook":</strong> A small, featured item or a bundle deal at the front of your table helps draw people in.</li>
      </ul>
      <h3>LOAD-IN INSTRUCTIONS</h3>
      <ul>
        <li><strong>Where:</strong> [eventVenue] | [address]</li>
        <li><strong>Load-In Time:</strong> [installTime]</li>
        <li><strong>Event Hours:</strong> [eventTime]</li>
        <li><strong>Check-In:</strong> Enter through the main entrance. Our team will be stationed there to scan your Eventbrite QR code.</li>
        <li><strong>Setup Location:</strong> Spaces are first-come, first-served.</li>
        <li><strong>Parking:</strong> Paid street parking and nearby lots are available.</li>
      </ul>
      <h3>WHAT TO BRING</h3>
      <p>We DO NOT provide tables, chairs, or display hardware. Please bring:</p>
      <ul>
        <li><strong>Table &amp; Chair:</strong> One 6ft table and your own seating.</li>
        <li><strong>Display Gear:</strong> Grid walls, racks, and signage.</li>
        <li><strong>Power:</strong> We provide access, but bring your own long extension cords and power strips just in case.</li>
        <li><strong>Supplies:</strong> Bags, change/cash, and any branding materials.</li>
      </ul>
      <h3>RULES &amp; RESTRICTIONS</h3>
      <p>To keep the event safe and ensure we can return to this venue, please avoid:</p>
      <ul>
        <li><strong>No Tents:</strong> Tents and pop-up canopies are not permitted indoors.</li>
        <li><strong>No Wall Damage:</strong> Do not drill, glue, or attach anything to venue surfaces.</li>
        <li><strong>Prohibited:</strong> No open flames, cooking appliances, amplified sound, or loose glitter/confetti.</li>
      </ul>
      <p>We're ramping up the promo all week. If you haven't shared the flyer yet, now is the perfect time—tag @pancakesandbooze so we can repost!</p>
      <p>If any last-minute questions pop up, just reply here. We'll see you soon!</p>
      <p>[organizationName]</p>
      #{FOOTER}
    HTML
  },
  {
    name: "Countdown - Vendor (Day Of)",
    subject_template: "TODAY: [eventName] Vendor Load-In Info!",
    trigger_type: "on_event_date",
    trigger_value: 0,
    category: "vendor",
    position: 27,
    body_template: <<~HTML
      <p>Hi [greetingName],</p>
      <p>The day is here! Here is the TL;DR info for today's vendor load-in at [eventVenue].</p>
      <h3>THE BASICS</h3>
      <ul>
        <li><strong>Load-in:</strong> [installTime].</li>
        <li><strong>Check-in:</strong> Front door—have your Eventbrite QR code ready.</li>
        <li><strong>Setup:</strong> First-come, first-served.</li>
        <li><strong>Parking:</strong> Paid street + nearby lots. Unload quickly, then move your car.</li>
      </ul>
      <h3>REMEMBER TO BRING</h3>
      <ul>
        <li>One 6ft table and your own chair(s).</li>
        <li>Gear: Displays, lighting, and long extension cords.</li>
        <li>Sales: Your digital payment QR codes and any supplies for your customers.</li>
      </ul>
      <h3>QUICK RULES</h3>
      <ul>
        <li><strong>NO Tents:</strong> Indoor shows do not allow pop-up canopies.</li>
        <li><strong>NO Wall Art:</strong> Vendor spaces are for non-hangable items only.</li>
        <li><strong>NO Tables Provided:</strong> If you don't bring a table, you won't have a display surface!</li>
      </ul>
      <p>Full Details &amp; FAQs: <a href="https://www.pancakesandbooze.com/[eventCity]">pancakesandbooze.com/[eventCity]</a></p>
      <p>We'll see you in a few hours!</p>
      <p>[organizationName]</p>
      #{FOOTER}
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
