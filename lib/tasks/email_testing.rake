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

    org = test_user.organizations.first || Organization.create!(
      user: test_user,
      name: "Test Email Org",
      slug: "test-email-org-#{SecureRandom.hex(4)}",
      email: "testorg@voxxyai.com"
    )
    puts "   ✅ Organization: #{org.name}"
    puts ""

    # Step 3: Create test event
    puts "📅 Creating test event..."
    event = Event.create!(
      title: "TEST EMAIL FILTERING EVENT",
      slug: "test-email-#{Time.now.to_i}",
      event_date: 30.days.from_now,
      application_deadline: 15.days.from_now,
      payment_deadline: 20.days.from_now,
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

    # Step 5: Create vendor contacts with REAL email addresses
    puts "👥 Creating vendor contacts (REAL EMAILS)..."
    contact1 = VendorContact.find_or_create_by!(
      organization: org,
      email: "beau09946@gmail.com"
    ) do |c|
      c.name = "Beau Lazear (Gmail 1)"
      c.business_name = "Test Business 1"
      c.contact_type = "vendor"
      c.status = "new"
    end
    puts "   ✅ Contact 1: #{contact1.email}"

    contact2 = VendorContact.find_or_create_by!(
      organization: org,
      email: "beaulazear@gmail.com"
    ) do |c|
      c.name = "Beau Lazear (Gmail 2)"
      c.business_name = "Test Business 2"
      c.contact_type = "vendor"
      c.status = "new"
    end
    puts "   ✅ Contact 2: #{contact2.email}"
    puts ""

    # Step 6: Create and send invitations
    puts "✉️  Creating and sending invitations (EMAILS WILL BE SENT)..."

    inv1 = EventInvitation.create!(
      event: event,
      vendor_contact: contact1
    )

    inv2 = EventInvitation.create!(
      event: event,
      vendor_contact: contact2
    )

    # Send actual emails via mailer
    begin
      EventInvitationMailer.invitation_email(inv1).deliver_now
      puts "   ✅ Email sent to: beau09946@gmail.com"
    rescue => e
      puts "   ❌ Failed to send email to beau09946@gmail.com: #{e.message}"
    end

    begin
      EventInvitationMailer.invitation_email(inv2).deliver_now
      puts "   ✅ Email sent to: beaulazear@gmail.com"
    rescue => e
      puts "   ❌ Failed to send email to beaulazear@gmail.com: #{e.message}"
    end

    # Mark as sent
    inv1.mark_as_sent!
    inv2.mark_as_sent!

    puts "   📧 Invitation URLs:"
    puts "      #{inv1.invitation_url}"
    puts "      #{inv2.invitation_url}"
    puts ""

    # Step 7: Create test registrations (linked to specific applications)
    puts "📋 Creating test registrations..."

    reg1 = event.registrations.create!(
      name: "Approved Unpaid Vendor",
      email: "approved-unpaid@test.com",
      business_name: "Unpaid Food Truck",
      vendor_category: "Food",
      status: "approved",
      payment_status: "pending",
      vendor_application: food_app  # Links to Food app ($150)
    )
    puts "   ✅ Registration 1: Food + Approved + Unpaid ($150) - should get payment reminders"

    reg2 = event.registrations.create!(
      name: "Approved Paid Vendor",
      email: "approved-paid@test.com",
      business_name: "Paid Art Gallery",
      vendor_category: "Art",
      status: "approved",
      payment_status: "confirmed",
      payment_confirmed_at: Time.current,
      vendor_application: art_app  # Links to Art app ($100)
    )
    puts "   ✅ Registration 2: Art + Approved + Paid ($100) - should NOT get payment reminders"

    reg3 = event.registrations.create!(
      name: "Pending Vendor",
      email: "pending@test.com",
      business_name: "Pending Music Band",
      vendor_category: "Music",
      status: "pending",
      payment_status: "pending",
      vendor_application: music_app  # Links to Music app ($200)
    )
    puts "   ✅ Registration 3: Music + Pending ($200) - should NOT get payment reminders"

    reg4 = event.registrations.create!(
      name: "Overdue Vendor",
      email: "overdue@test.com",
      business_name: "Overdue Catering Co",
      vendor_category: "Food",
      status: "approved",
      payment_status: "overdue",
      vendor_application: food_app  # Links to Food app ($150)
    )
    puts "   ✅ Registration 4: Food + Approved + Overdue ($150) - should get payment reminders"
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
    puts "📧 INVITATIONS SENT TO:"
    puts "   - beau09946@gmail.com"
    puts "   - beaulazear@gmail.com"
    puts ""
    puts "   Total Invitations: #{event.event_invitations.count}"
    puts "   Sent Count (NEW method): #{event.event_invitations.where.not(sent_at: nil).count}"
    puts "   Sent Count (OLD method): #{event.event_invitations.sent.count}"
    puts ""
    puts "📋 REGISTRATIONS CREATED: #{event.registrations.count}"
    puts "   - Food (Approved + Unpaid): 1 vendor @ $150"
    puts "   - Food (Approved + Overdue): 1 vendor @ $150"
    puts "   - Art (Approved + Paid): 1 vendor @ $100"
    puts "   - Music (Pending): 1 vendor @ $200"
    puts ""
    puts "   Approved + Unpaid: #{event.registrations.where(status: 'approved', payment_status: [ 'pending', 'overdue' ]).count} (should get payment reminders)"
    puts "   Approved + Paid: #{event.registrations.where(status: 'approved', payment_status: [ 'confirmed', 'paid' ]).count} (should NOT get payment reminders)"
    puts "   Pending: #{event.registrations.where(status: 'pending').count} (should NOT get payment reminders)"
    puts ""
    puts "✅ CHECK YOUR INBOX: Invitation emails have been sent!"
    puts ""
    puts "🧪 TO TEST:"
    puts "   1. Check your Gmail inbox for invitation emails"
    puts "   2. In UI, verify 3 vendor applications with different prices ($150, $100, $200)"
    puts "   3. Verify invitation count shows 2 (and stays 2 after viewing)"
    puts "   4. Test payment reminder filtering with RecipientFilterService"
    puts "   5. Verify each registration links to correct vendor_application_id"
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

    # Delete test events
    puts "🗑️  Deleting TEST EMAIL events..."
    event_count = Event.where("title LIKE ?", "%TEST EMAIL%").count
    Event.where("title LIKE ?", "%TEST EMAIL%").destroy_all
    puts "   ✅ Deleted #{event_count} test event(s)"
    puts ""

    # Delete vendor contacts with test emails
    puts "🗑️  Deleting test vendor contacts..."
    contact_count = VendorContact.where(email: [ "beau09946@gmail.com", "beaulazear@gmail.com" ])
                                  .or(VendorContact.where("email LIKE ?", "%@test.com"))
                                  .count
    VendorContact.where(email: [ "beau09946@gmail.com", "beaulazear@gmail.com" ])
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
