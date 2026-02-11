#!/usr/bin/env ruby
# frozen_string_literal: true

# Test Data Setup Script for Performance Testing
# Creates a realistic test environment matching production scale:
# - 1 test user/organization
# - 1 active event
# - 500 vendor applications
# - 300 network contacts with invitations
#
# Usage:
#   rails runner lib/scripts/setup_test_event.rb
#   rails runner lib/scripts/setup_test_event.rb cleanup  # Remove test data

require 'faker'

class TestEventSetup
  TEST_EMAIL = "test-producer@voxxypresents.com"
  TEST_ORG_NAME = "Test Event Organization"

  COLORS = {
    red: "\e[31m",
    green: "\e[32m",
    yellow: "\e[33m",
    blue: "\e[34m",
    purple: "\e[35m",
    cyan: "\e[36m",
    reset: "\e[0m"
  }

  def initialize(cleanup: false)
    @cleanup = cleanup
  end

  def run
    if @cleanup
      cleanup_test_data
    else
      create_test_data
    end
  end

  private

  def log(message, color: :cyan)
    puts "#{COLORS[color]}#{message}#{COLORS[:reset]}"
  end

  def log_header(message)
    puts "\n#{COLORS[:purple]}#{'=' * 80}#{COLORS[:reset]}"
    puts "#{COLORS[:purple]}#{message.center(80)}#{COLORS[:reset]}"
    puts "#{COLORS[:purple]}#{'=' * 80}#{COLORS[:reset]}\n"
  end

  def cleanup_test_data
    log_header("CLEANUP: Removing Test Data")

    user = User.find_by(email: TEST_EMAIL)
    unless user
      log("✓ No test user found. Nothing to clean up.", color: :green)
      return
    end

    org = user.organizations.find_by(name: TEST_ORG_NAME)

    if org
      log("Deleting organization and all associated data...", color: :yellow)

      # Events will cascade delete:
      # - event_invitations
      # - vendor_applications & registrations
      # - scheduled_emails & email_deliveries
      # - bulletins
      # - budgets
      # - event_portal
      event_count = org.events.count
      contact_count = org.vendor_contacts.count

      org.destroy!

      log("✓ Deleted organization with #{event_count} events and #{contact_count} contacts", color: :green)
    end

    user.destroy!
    log("✓ Deleted test user: #{TEST_EMAIL}", color: :green)
    log_header("CLEANUP COMPLETE")
  end

  def create_test_data
    log_header("CREATING TEST DATA FOR PERFORMANCE TESTING")

    # Step 1: Create test user
    user = create_test_user
    log("✓ Created test user: #{user.email}", color: :green)

    # Step 2: Create organization
    org = create_organization(user)
    log("✓ Created organization: #{org.name}", color: :green)

    # Step 3: Create network contacts (300)
    log("\nCreating 300 network contacts...", color: :yellow)
    contacts = create_network_contacts(org, 300)
    log("✓ Created #{contacts.count} network contacts", color: :green)

    # Step 4: Create event
    event = create_event(org)
    log("✓ Created event: #{event.title} (#{event.slug})", color: :green)

    # Step 5: Create vendor applications
    vendor_apps = create_vendor_applications(event)
    log("✓ Created #{vendor_apps.count} vendor application categories", color: :green)

    # Step 6: Invite network contacts (creates invitations)
    log("\nCreating invitations for network contacts...", color: :yellow)
    invitations = create_invitations(event, contacts.first(200)) # Invite 200 out of 300
    log("✓ Created #{invitations.count} invitations", color: :green)

    # Step 7: Create vendor application submissions (500 total)
    # 200 from invited contacts (50% conversion)
    # 300 net new applicants
    log("\nCreating 500 vendor application submissions...", color: :yellow)
    registrations = create_registrations(event, vendor_apps, contacts, invitations)
    log("✓ Created #{registrations.count} registrations", color: :green)

    # Step 8: Summary
    print_summary(user, org, event, contacts, invitations, registrations)
  end

  def create_test_user
    User.find_or_create_by!(email: TEST_EMAIL) do |u|
      u.password = "TestPassword123!"
      u.password_confirmation = "TestPassword123!"
      u.role = "venue_owner"
      u.first_name = "Test"
      u.last_name = "Producer"
      u.email_verified = true
    end
  end

  def create_organization(user)
    Organization.find_or_create_by!(user: user, name: TEST_ORG_NAME) do |o|
      o.email = TEST_EMAIL
      o.slug = "test-event-org"
      o.description = "Test organization for performance testing"
      o.reply_to_email = TEST_EMAIL
      o.reply_to_name = "Test Producer"
    end
  end

  def create_network_contacts(org, count)
    log("  Progress: ", color: :yellow)
    contacts = []

    count.times do |i|
      contact = VendorContact.create!(
        organization: org,
        name: Faker::Name.name,
        email: Faker::Internet.unique.email,
        phone: Faker::PhoneNumber.phone_number,
        business_name: Faker::Company.name,
        instagram_handle: "@#{Faker::Internet.username}",
        tiktok_handle: rand > 0.3 ? "@#{Faker::Internet.username}" : nil,
        website: rand > 0.5 ? Faker::Internet.url : nil,
        location: "#{Faker::Address.city}, #{Faker::Address.state_abbr}",
        contact_type: "vendor",
        status: "new",
        source: ["returning", "past_event", "new"].sample,
        tags: ["art", "food", "jewelry", "local", "featured"].sample(rand(1..3)),
        notes: rand > 0.7 ? Faker::Lorem.sentence : nil
      )
      contacts << contact

      print "." if (i + 1) % 50 == 0
    end

    puts " Done!"
    contacts
  end

  def create_event(org)
    Event.create!(
      organization: org,
      title: "Test Art & Vendor Market #{Date.today.year}",
      slug: "test-market-#{Date.today.strftime('%Y%m%d')}",
      description: "Large-scale test event for performance testing with 500+ applicants",
      event_date: 30.days.from_now,
      event_end_date: 30.days.from_now,
      start_time: "10:00",
      end_time: "18:00",
      venue: "Test Convention Center",
      location: "San Francisco, CA",
      application_deadline: 15.days.from_now,
      payment_deadline: 25.days.from_now,
      published: true,
      status: "published"
    )
  end

  def create_vendor_applications(event)
    categories = [
      { name: "Visual Artists", description: "Paintings, prints, photography" },
      { name: "Handmade Crafts", description: "Jewelry, pottery, textiles" },
      { name: "Food Vendors", description: "Prepared foods and beverages" },
      { name: "Vintage & Antiques", description: "Vintage goods and collectibles" }
    ]

    categories.map do |cat|
      VendorApplication.create!(
        event: event,
        name: cat[:name],
        description: cat[:description],
        status: "active",
        categories: [cat[:name]],
        booth_price: [50, 75, 100, 150].sample
      )
    end
  end

  def create_invitations(event, contacts)
    invitations = []
    contacts.each do |contact|
      invitation = EventInvitation.create!(
        event: event,
        vendor_contact: contact,
        status: "sent",
        sent_at: rand(10..30).days.ago
      )
      invitations << invitation
    end
    invitations
  end

  def create_registrations(event, vendor_apps, all_contacts, invitations)
    registrations = []
    log("  Progress: ", color: :yellow)

    # Part 1: Create 100 registrations from invited contacts (50% conversion of 200 invites)
    invited_contacts = invitations.sample(100).map(&:vendor_contact)
    invited_contacts.each_with_index do |contact, i|
      registration = create_single_registration(event, vendor_apps, contact, from_invitation: true)
      registrations << registration if registration
      print "." if (i + 1) % 25 == 0
    end

    # Part 2: Create 400 net new registrations (not from network contacts)
    400.times do |i|
      registration = create_single_registration(event, vendor_apps, nil, from_invitation: false)
      registrations << registration if registration
      print "." if (i + 1) % 50 == 0
    end

    puts " Done!"
    registrations.compact
  end

  def create_single_registration(event, vendor_apps, contact = nil, from_invitation: false)
    vendor_app = vendor_apps.sample

    # Use contact info if provided, otherwise generate fake data
    if contact
      name = contact.name
      email = contact.email
      business_name = contact.business_name
      phone = contact.phone
      instagram = contact.instagram_handle
      tiktok = contact.tiktok_handle
      website = contact.website
    else
      name = Faker::Name.name
      email = Faker::Internet.unique.email
      business_name = Faker::Company.name
      phone = Faker::PhoneNumber.phone_number
      instagram = rand > 0.3 ? "@#{Faker::Internet.username}" : nil
      tiktok = rand > 0.5 ? "@#{Faker::Internet.username}" : nil
      website = rand > 0.4 ? Faker::Internet.url : nil
    end

    # Assign realistic statuses
    status = case rand
             when 0..0.5 then "pending"    # 50% pending (not reviewed yet)
             when 0.5..0.8 then "approved"  # 30% approved
             when 0.8..0.95 then "waitlist" # 15% waitlist
             else "rejected"                 # 5% rejected
             end

    payment_status = if status == "approved"
                       ["paid", "pending", "overdue"].sample
                     else
                       "pending"
                     end

    Registration.create!(
      event: event,
      vendor_application: vendor_app,
      name: name,
      email: email,
      business_name: business_name,
      phone: phone,
      instagram_handle: instagram,
      tiktok_handle: tiktok,
      website: website,
      vendor_category: vendor_app.categories.first,
      portfolio: rand > 0.5 ? Faker::Internet.url : nil,
      status: status,
      payment_status: payment_status,
      submitted_at: rand(5..25).days.ago
    )
  rescue ActiveRecord::RecordInvalid => e
    log("    Warning: Skipped registration due to validation error: #{e.message}", color: :red)
    nil
  end

  def print_summary(user, org, event, contacts, invitations, registrations)
    log_header("TEST DATA SETUP COMPLETE")

    puts "#{COLORS[:cyan]}Login Credentials:#{COLORS[:reset]}"
    puts "  Email:    #{COLORS[:green]}#{user.email}#{COLORS[:reset]}"
    puts "  Password: #{COLORS[:green]}TestPassword123!#{COLORS[:reset]}"
    puts ""
    puts "#{COLORS[:cyan]}Organization:#{COLORS[:reset]}"
    puts "  Name: #{org.name}"
    puts "  ID:   #{org.id}"
    puts ""
    puts "#{COLORS[:cyan]}Event:#{COLORS[:reset]}"
    puts "  Title: #{event.title}"
    puts "  Slug:  #{event.slug}"
    puts "  ID:    #{event.id}"
    puts "  URL:   #{COLORS[:blue]}http://localhost:5173/events/#{event.slug}#{COLORS[:reset]}"
    puts ""
    puts "#{COLORS[:cyan]}Network Contacts:#{COLORS[:reset]}"
    puts "  Total:   #{contacts.count}"
    puts "  Invited: #{invitations.count}"
    puts ""
    puts "#{COLORS[:cyan]}Vendor Applications:#{COLORS[:reset]}"
    puts "  Total Registrations: #{registrations.count}"

    status_breakdown = registrations.group_by(&:status).transform_values(&:count)
    puts "  Breakdown:"
    puts "    Pending:  #{status_breakdown['pending'] || 0}"
    puts "    Approved: #{status_breakdown['approved'] || 0}"
    puts "    Waitlist: #{status_breakdown['waitlist'] || 0}"
    puts "    Rejected: #{status_breakdown['rejected'] || 0}"
    puts ""

    payment_breakdown = registrations.where(status: 'approved').group_by(&:payment_status).transform_values(&:count)
    if payment_breakdown.any?
      puts "  Payment Status (Approved only):"
      puts "    Paid:    #{payment_breakdown['paid'] || 0}"
      puts "    Pending: #{payment_breakdown['pending'] || 0}"
      puts "    Overdue: #{payment_breakdown['overdue'] || 0}"
    end

    puts ""
    puts "#{COLORS[:yellow]}⚡ Performance Testing Notes:#{COLORS[:reset]}"
    puts "  - Invites Tab should paginate (50 per page = #{(invitations.count / 50.0).ceil} pages)"
    puts "  - Applicants Tab has #{registrations.count} submissions"
    puts "  - Network Tab has #{contacts.count} contacts"
    puts ""
    puts "#{COLORS[:green]}✓ Ready for testing!#{COLORS[:reset]}"
    puts ""
    puts "#{COLORS[:yellow]}To remove this test data later:#{COLORS[:reset]}"
    puts "  #{COLORS[:blue]}rails runner lib/scripts/setup_test_event.rb cleanup#{COLORS[:reset]}"
    puts ""
  end
end

# Run the script
cleanup_mode = ARGV.include?("cleanup")
TestEventSetup.new(cleanup: cleanup_mode).run
