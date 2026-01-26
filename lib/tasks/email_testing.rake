namespace :email_testing do
  desc "Create test event with multiple vendor applications and send real invitation emails"
  task setup: :environment do
    puts ""
    puts "=" * 80
    puts "📧 EMAIL TESTING SETUP - Multiple Applications Architecture"
    puts "=" * 80
    puts ""

    # Step 1: Cleanup old test events
    puts "🧹 Cleaning up old test events..."
    Event.where("title LIKE ?", "%TEST EMAIL%").destroy_all
    puts "   ✅ Old test events removed"
    puts ""

    # Step 2: Find or create organization
    puts "👤 Setting up test organization..."
    test_user = User.find_by(email: "beaulazear@gmail.com")

    unless test_user
      puts "   ❌ Error: User beaulazear@gmail.com not found"
      puts "   Please create a user account first"
      next
    end

    # Use user's actual organization so events appear in their account
    org = test_user.organizations.first

    unless org
      puts "   ❌ Error: User has no organizations"
      next
    end

    # Update email to noreply@voxxypresents.com for consistency (if not already set)
    # Note: EmailSenderService now always uses noreply@voxxypresents.com regardless of this setting
    if org.email != "noreply@voxxypresents.com"
      org.update!(email: "noreply@voxxypresents.com")
    end

    puts "   ✅ Organization: #{org.name}"
    puts "   📧 Email: #{org.email}"
    puts ""

    # Step 3: Create test event
    puts "📅 Creating test event..."
    event = Event.create!(
      title: "TEST EMAIL FILTERING EVENT",
      slug: "test-email-#{Time.now.to_i}",
      event_date: 8.days.from_now,
      application_deadline: 5.days.from_now,
      payment_deadline: 7.days.from_now,
      start_time: "10:00 AM",
      location: "Test Venue, Test City, CA",
      venue: "Test Venue",
      organization: org,
      published: true,
      description: "Test event for email filtering fixes"
    )
    puts "   ✅ Event created: #{event.title}"
    puts "   📝 Slug: #{event.slug}"
    puts ""

    # Step 4: Create multiple vendor applications (one per category)
    puts "📋 Creating vendor applications (multiple with different prices)..."

    food_app = VendorApplication.create!(
      event: event,
      name: "Food Vendor Application",
      categories: [ "Food" ],
      booth_price: 150.00,
      install_date: event.event_date - 1.day,
      install_start_time: "6:00 AM",
      install_end_time: "9:00 AM",
      payment_link: "https://payment.example.com/food",
      status: "active",
      description: "Apply as a food vendor"
    )
    puts "   ✅ Food Vendor Application: $150, Install: #{food_app.install_date.strftime('%b %d')} @ 6-9 AM"

    art_app = VendorApplication.create!(
      event: event,
      name: "Art Vendor Application",
      categories: [ "Art" ],
      booth_price: 100.00,
      install_date: event.event_date - 1.day,
      install_start_time: "7:00 AM",
      install_end_time: "10:00 AM",
      payment_link: "https://payment.example.com/art",
      status: "active",
      description: "Apply as an art vendor"
    )
    puts "   ✅ Art Vendor Application: $100, Install: #{art_app.install_date.strftime('%b %d')} @ 7-10 AM"

    music_app = VendorApplication.create!(
      event: event,
      name: "Music Vendor Application",
      categories: [ "Music" ],
      booth_price: 200.00,
      install_date: event.event_date - 2.days,
      install_start_time: "5:00 PM",
      install_end_time: "8:00 PM",
      payment_link: "https://payment.example.com/music",
      status: "active",
      description: "Apply as a music/entertainment vendor"
    )
    puts "   ✅ Music Vendor Application: $200, Install: #{music_app.install_date.strftime('%b %d')} @ 5-8 PM"
    puts ""

    # Step 5: Create vendor contacts (10 total - mix of real and test emails)
    puts "👥 Creating 10 vendor contacts..."

    contacts = []

    # Contact 1: Real email
    contacts << VendorContact.find_or_create_by!(
      organization: org,
      email: "beau09946@gmail.com"
    ) do |c|
      c.name = "Beau Lazear (Gmail 1)"
      c.business_name = "Test Food Truck"
      c.contact_type = "vendor"
      c.status = "new"
    end
    puts "   ✅ Contact 1: beau09946@gmail.com"

    # Contact 2: Real email
    contacts << VendorContact.find_or_create_by!(
      organization: org,
      email: "beaulazear@gmail.com"
    ) do |c|
      c.name = "Beau Lazear (Gmail 2)"
      c.business_name = "Test Art Gallery"
      c.contact_type = "vendor"
      c.status = "new"
    end
    puts "   ✅ Contact 2: beaulazear@gmail.com"

    # Contact 3: BOUNCE TEST - Invalid email
    contacts << VendorContact.find_or_create_by!(
      organization: org,
      email: "courtneygreer@voxxyai.com"
    ) do |c|
      c.name = "Courtney Greer (WILL BOUNCE)"
      c.business_name = "Bounce Test Co"
      c.contact_type = "vendor"
      c.status = "new"
    end
    puts "   ✅ Contact 3: courtneygreer@voxxyai.com (WILL BOUNCE - for testing)"

    # Contacts 4-10: Test emails for variety
    test_contacts = [
      { email: "vendor1@test.com", name: "Sarah Martinez", business: "Martinez Jewelry" },
      { email: "vendor2@test.com", name: "James Chen", business: "Chen's Pottery Studio" },
      { email: "vendor3@test.com", name: "Maria Rodriguez", business: "Rodriguez Bakery" },
      { email: "vendor4@test.com", name: "David Kim", business: "Kim's Coffee Roasters" },
      { email: "vendor5@test.com", name: "Emily Johnson", business: "Handmade Soaps Co" },
      { email: "vendor6@test.com", name: "Michael Brown", business: "Brown's BBQ" },
      { email: "vendor7@test.com", name: "Lisa Anderson", business: "Anderson Photography" }
    ]

    test_contacts.each_with_index do |contact_data, index|
      contacts << VendorContact.find_or_create_by!(
        organization: org,
        email: contact_data[:email]
      ) do |c|
        c.name = contact_data[:name]
        c.business_name = contact_data[:business]
        c.contact_type = "vendor"
        c.status = "new"
      end
      puts "   ✅ Contact #{index + 4}: #{contact_data[:email]}"
    end
    puts ""

    # Step 6: Create and send invitations (10 total)
    puts "✉️  Creating and sending invitations to all 10 contacts..."

    invitations = []
    sent_count = 0
    failed_count = 0

    contacts.each_with_index do |contact, index|
      invitation = EventInvitation.create!(
        event: event,
        vendor_contact: contact
      )
      invitations << invitation

      # Send actual emails via mailer
      begin
        EventInvitationMailer.invitation_email(invitation).deliver_now
        invitation.mark_as_sent!
        sent_count += 1
        puts "   ✅ Email #{index + 1} sent to: #{contact.email}"
      rescue => e
        failed_count += 1
        puts "   ❌ Failed to send email to #{contact.email}: #{e.message}"
      end
    end

    puts ""
    puts "   📊 Invitation Summary:"
    puts "      ✅ Successfully sent: #{sent_count}"
    puts "      ❌ Failed: #{failed_count}"
    puts "      📧 Total invitations: #{invitations.count}"
    puts ""
    puts "   🔗 Sample Invitation URLs:"
    invitations.first(3).each do |inv|
      puts "      #{inv.invitation_url}"
    end
    puts ""

    # Step 7: Create 15 test registrations (variety of statuses and payment states)
    puts "📋 Creating 15 test registrations (vendors who have applied)..."

    registrations_data = [
      { name: "Approved Unpaid Vendor 1", email: "approved-unpaid-1@test.com", business: "Unpaid Food Truck", category: "Food", status: "approved", payment: "pending", app: food_app },
      { name: "Approved Paid Vendor 1", email: "approved-paid-1@test.com", business: "Paid Art Gallery", category: "Art", status: "approved", payment: "confirmed", app: art_app },
      { name: "Pending Vendor 1", email: "pending-1@test.com", business: "Pending Music Band", category: "Music", status: "pending", payment: "pending", app: music_app },
      { name: "Overdue Vendor 1", email: "overdue-1@test.com", business: "Overdue Catering Co", category: "Food", status: "approved", payment: "overdue", app: food_app },
      { name: "Approved Unpaid Vendor 2", email: "approved-unpaid-2@test.com", business: "Taco Paradise", category: "Food", status: "approved", payment: "pending", app: food_app },
      { name: "Approved Paid Vendor 2", email: "approved-paid-2@test.com", business: "Sculpture Studio", category: "Art", status: "approved", payment: "confirmed", app: art_app },
      { name: "Pending Vendor 2", email: "pending-2@test.com", business: "Jazz Quartet", category: "Music", status: "pending", payment: "pending", app: music_app },
      { name: "Waitlist Vendor", email: "waitlist@test.com", business: "Waitlist Jewelry", category: "Art", status: "waitlist", payment: "pending", app: art_app },
      { name: "Rejected Vendor", email: "rejected@test.com", business: "Rejected Coffee", category: "Food", status: "rejected", payment: "pending", app: food_app },
      { name: "Confirmed Paid Vendor", email: "confirmed-paid@test.com", business: "Premium Art Co", category: "Art", status: "confirmed", payment: "confirmed", app: art_app },
      { name: "Approved Unpaid Vendor 3", email: "approved-unpaid-3@test.com", business: "Burger Station", category: "Food", status: "approved", payment: "pending", app: food_app },
      { name: "Overdue Vendor 2", email: "overdue-2@test.com", business: "Late Payment Band", category: "Music", status: "approved", payment: "overdue", app: music_app },
      { name: "Cancelled Vendor", email: "cancelled@test.com", business: "Cancelled Vendor", category: "Food", status: "cancelled", payment: "pending", app: food_app },
      { name: "Approved Paid Vendor 3", email: "approved-paid-3@test.com", business: "DJ Services", category: "Music", status: "approved", payment: "confirmed", app: music_app },
      { name: "Approved Unpaid Vendor 4", email: "approved-unpaid-4@test.com", business: "Ice Cream Truck", category: "Food", status: "approved", payment: "pending", app: food_app }
    ]

    registrations_data.each_with_index do |reg_data, index|
      reg = event.registrations.create!(
        name: reg_data[:name],
        email: reg_data[:email],
        business_name: reg_data[:business],
        vendor_category: reg_data[:category],
        status: reg_data[:status],
        payment_status: reg_data[:payment],
        payment_confirmed_at: (reg_data[:payment] == "confirmed" ? Time.current : nil),
        vendor_application: reg_data[:app]
      )

      payment_reminder = (reg_data[:status] == "approved" && %w[pending overdue].include?(reg_data[:payment])) ? "YES" : "NO"
      puts "   ✅ Registration #{index + 1}: #{reg_data[:category]} + #{reg_data[:status]} + #{reg_data[:payment]} - Payment reminders: #{payment_reminder}"
    end
    puts ""

    # Summary
    puts "=" * 80
    puts "🎉 TEST EVENT SETUP COMPLETE!"
    puts "=" * 80
    puts ""
    puts "📊 EVENT SUMMARY:"
    puts "   Event ID: #{event.id}"
    puts "   Event Slug: #{event.slug}"
    puts "   Event Title: #{event.title}"
    puts ""
    puts "📋 VENDOR APPLICATIONS CREATED: #{event.vendor_applications.count}"
    puts "   1. Food Vendor Application: $150 (Install: #{food_app.install_date.strftime('%b %d')} @ 6-9 AM)"
    puts "   2. Art Vendor Application: $100 (Install: #{art_app.install_date.strftime('%b %d')} @ 7-10 AM)"
    puts "   3. Music Vendor Application: $200 (Install: #{music_app.install_date.strftime('%b %d')} @ 5-8 PM)"
    puts ""
    puts "📧 INVITATIONS SENT: #{event.event_invitations.count} total"
    puts "   Real emails (will deliver):"
    puts "     - beau09946@gmail.com"
    puts "     - beaulazear@gmail.com"
    puts ""
    puts "   🚨 BOUNCE TEST EMAIL:"
    puts "     - courtneygreer@voxxyai.com (WILL BOUNCE - great for testing!)"
    puts ""
    puts "   Test emails (may not deliver):"
    puts "     - vendor1@test.com through vendor7@test.com"
    puts ""
    puts "   Total Invitations: #{event.event_invitations.count}"
    puts "   Sent Count: #{event.event_invitations.where.not(sent_at: nil).count}"
    puts ""
    puts "📋 REGISTRATIONS (VENDORS) CREATED: #{event.registrations.count} total"
    puts ""
    puts "   By Status:"
    puts "     - Approved: #{event.registrations.where(status: 'approved').count} vendors"
    puts "     - Pending: #{event.registrations.where(status: 'pending').count} vendors"
    puts "     - Confirmed: #{event.registrations.where(status: 'confirmed').count} vendors"
    puts "     - Waitlist: #{event.registrations.where(status: 'waitlist').count} vendors"
    puts "     - Rejected: #{event.registrations.where(status: 'rejected').count} vendors"
    puts "     - Cancelled: #{event.registrations.where(status: 'cancelled').count} vendors"
    puts ""
    puts "   By Payment Status:"
    puts "     - Pending: #{event.registrations.where(payment_status: 'pending').count} vendors"
    puts "     - Confirmed: #{event.registrations.where(payment_status: 'confirmed').count} vendors"
    puts "     - Overdue: #{event.registrations.where(payment_status: 'overdue').count} vendors"
    puts ""
    puts "   📬 Payment Reminder Targeting:"
    puts "     - Should get reminders: #{event.registrations.where(status: 'approved', payment_status: [ 'pending', 'overdue' ]).count} vendors"
    puts "     - Should NOT get reminders: #{event.registrations.where.not(status: 'approved').or(event.registrations.where(payment_status: [ 'confirmed', 'paid' ])).count} vendors"
    puts ""
    puts "✅ CHECK YOUR INBOX: #{sent_count} invitation emails were sent (including 1 that will bounce)!"
    puts ""
    puts "🧪 TO TEST:"
    puts "   1. Check Gmail for 2 real invitation emails"
    puts "   2. Wait ~1 minute for courtneygreer@voxxyai.com to bounce"
    puts "   3. Check webhook logs for bounce event processing"
    puts "   4. Verify EmailDelivery record created for bounce"
    puts "   5. In UI, verify invitation count shows 10"
    puts "   6. In UI, verify vendor count shows 15"
    puts "   7. Test payment reminder filtering (should target ~6 vendors)"
    puts "   8. Visualize data in email dashboard with more variety"
    puts ""
    puts "🔍 TO CHECK BOUNCE TRACKING:"
    puts "   Rails console:"
    puts "   EmailDelivery.find_by(recipient_email: 'courtneygreer@voxxyai.com')"
    puts ""
    puts "🧹 TO CLEANUP:"
    puts "   rails email_testing:cleanup"
    puts ""
    puts "=" * 80
  end

  desc "Clean up test email data (events and vendor contacts)"
  task cleanup: :environment do
    puts ""
    puts "=" * 80
    puts "🧹 CLEANING UP TEST EMAIL DATA"
    puts "=" * 80
    puts ""

    # Find test events first
    test_events = Event.where("title LIKE ?", "%TEST EMAIL%")
    event_count = test_events.count

    if event_count > 0
      event_ids = test_events.pluck(:id)

      # Delete EmailDelivery records first (they reference event_invitations)
      puts "🗑️  Deleting EmailDelivery records for test events..."
      delivery_count = EmailDelivery.where(event_id: event_ids).count
      EmailDelivery.where(event_id: event_ids).delete_all
      puts "   ✅ Deleted #{delivery_count} email delivery record(s)"
      puts ""

      # Delete UnsubscribeToken records (they reference events)
      puts "🗑️  Deleting UnsubscribeToken records for test events..."
      token_count = UnsubscribeToken.where(event_id: event_ids).count
      UnsubscribeToken.where(event_id: event_ids).delete_all
      puts "   ✅ Deleted #{token_count} unsubscribe token(s)"
      puts ""

      # Now delete test events (this will cascade to invitations, registrations, etc.)
      puts "🗑️  Deleting TEST EMAIL events..."
      test_events.destroy_all
      puts "   ✅ Deleted #{event_count} test event(s)"
      puts ""
    else
      puts "   ℹ️  No test events found"
      puts ""
    end

    # Delete vendor contacts with test emails
    puts "🗑️  Deleting test vendor contacts..."
    test_emails = [
      "beau09946@gmail.com",
      "beaulazear@gmail.com",
      "courtneygreer@voxxyai.com"
    ]

    contact_count = VendorContact.where(email: test_emails)
                                  .or(VendorContact.where("email LIKE ?", "%@test.com"))
                                  .count
    VendorContact.where(email: test_emails)
                 .or(VendorContact.where("email LIKE ?", "%@test.com"))
                 .destroy_all
    puts "   ✅ Deleted #{contact_count} vendor contact(s)"
    puts ""

    # Optionally delete test organization
    puts "🗑️  Checking for test organization..."
    test_org = Organization.where("slug LIKE ?", "%test-email-org%")
    if test_org.any?
      org_count = test_org.count
      test_org.destroy_all
      puts "   ✅ Deleted #{org_count} test organization(s)"
    else
      puts "   ℹ️  No test organizations found"
    end
    puts ""

    puts "=" * 80
    puts "✅ CLEANUP COMPLETE!"
    puts "=" * 80
    puts ""
  end

  desc "Send a test invitation email for an existing event"
  task :send_invitation, [ :event_slug, :email ] => :environment do |t, args|
    puts ""
    puts "=" * 80
    puts "📧 SENDING TEST INVITATION"
    puts "=" * 80
    puts ""

    # Validate arguments
    unless args[:event_slug]
      puts "❌ Error: Please provide an event slug"
      puts ""
      puts "Usage:"
      puts "   rails email_testing:send_invitation[event-slug,email@example.com]"
      puts ""
      puts "Example:"
      puts "   rails email_testing:send_invitation[summer-market-2026,beau09946@gmail.com]"
      puts ""
      next
    end

    unless args[:email]
      puts "❌ Error: Please provide an email address"
      puts ""
      puts "Usage:"
      puts "   rails email_testing:send_invitation[event-slug,email@example.com]"
      puts ""
      next
    end

    # Find event
    puts "🔍 Looking for event..."
    event = Event.find_by(slug: args[:event_slug])
    unless event
      puts "   ❌ Error: Event not found with slug '#{args[:event_slug]}'"
      puts ""
      puts "Available events:"
      Event.order(created_at: :desc).limit(5).each do |e|
        puts "   - #{e.slug} (#{e.title})"
      end
      puts ""
      next
    end
    puts "   ✅ Found event: #{event.title}"
    puts ""

    # Find or create vendor contact
    puts "👤 Finding or creating vendor contact..."
    contact = VendorContact.find_or_create_by!(
      organization: event.organization,
      email: args[:email]
    ) do |c|
      c.name = "Test Contact"
      c.business_name = "Test Business"
      c.contact_type = "vendor"
      c.status = "new"
    end
    puts "   ✅ Contact: #{contact.email}"
    puts ""

    # Create invitation
    puts "✉️  Creating invitation..."
    invitation = EventInvitation.create!(
      event: event,
      vendor_contact: contact
    )
    puts "   ✅ Invitation created"
    puts ""

    # Send email
    puts "📧 Sending email..."
    begin
      EventInvitationMailer.invitation_email(invitation).deliver_now
      invitation.mark_as_sent!

      puts "   ✅ Email sent successfully!"
      puts ""
      puts "📋 INVITATION DETAILS:"
      puts "   Recipient: #{contact.email}"
      puts "   Event: #{event.title}"
      puts "   Invitation URL: #{invitation.invitation_url}"
      puts ""
    rescue => e
      puts "   ❌ Error sending email: #{e.message}"
      puts ""
    end

    puts "=" * 80
    puts "✅ DONE!"
    puts "=" * 80
    puts ""
  end
end
