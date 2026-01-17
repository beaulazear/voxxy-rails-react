# Service for creating test data and sending test emails
# Used by both admin and venue owner email testing features
class Admin::EmailTestService
  attr_reader :user

  def initialize(user)
    @user = user
  end

  # Create or reuse test data for email testing
  def setup_test_data(skip_callbacks: false)
    # Use existing test data or create new
    test_user = find_or_create_test_producer
    organization = find_or_create_test_organization(test_user)
    event = find_or_create_test_event(organization, skip_callbacks: skip_callbacks)
    vendor_app = find_or_create_vendor_application(event)
    registration = find_or_create_test_registration(event, vendor_app, skip_callbacks: skip_callbacks)
    vendor_contact = find_or_create_vendor_contact(organization)
    invitation = find_or_create_invitation(event, vendor_contact)

    {
      user: test_user,
      organization: organization,
      event: event,
      vendor_application: vendor_app,
      registration: registration,
      vendor_contact: vendor_contact,
      invitation: invitation
    }
  end

  # Send all scheduled emails (7 emails) to user's email
  def send_scheduled_emails_to_user
    test_data = setup_test_data
    results = []
    recipient_email = user.email

    # Override registration email to send to test user
    test_registration = test_data[:registration]
    original_email = test_registration.email
    test_registration.update_column(:email, recipient_email)

    begin
      results << send_email("1 Day Before Application Deadline") do
        send_scheduled_email_template(test_data, 1, recipient_email)
      end

      results << send_email("Application Deadline Day") do
        send_scheduled_email_template(test_data, 2, recipient_email)
      end

      results << send_email("1 Day Before Payment Due") do
        test_registration.update_column(:status, "approved")
        send_scheduled_email_template(test_data, 3, recipient_email)
      end

      results << send_email("Payment Due Today") do
        send_scheduled_email_template(test_data, 4, recipient_email)
      end

      results << send_email("1 Day Before Event") do
        test_registration.update_column(:status, "confirmed")
        send_scheduled_email_template(test_data, 5, recipient_email)
      end

      results << send_email("Day of Event") do
        send_scheduled_email_template(test_data, 6, recipient_email)
      end

      results << send_email("Day After Event - Thank You") do
        send_scheduled_email_template(test_data, 7, recipient_email)
      end
    ensure
      # Restore original email
      test_registration.update_column(:email, original_email)
    end

    results
  end

  # Send all 21 emails to admin user's email (admin only)
  def send_all_emails_to_admin
    return { error: "Admin access required" } unless user.admin?

    test_data = setup_test_data
    results = []
    recipient_email = user.email

    # Category A: Scheduled Emails (7)
    results.concat(send_scheduled_emails_to_user)

    # Override registration email temporarily
    test_registration = test_data[:registration]
    original_email = test_registration.email
    test_registration.update_column(:email, recipient_email)

    begin
      # Category B: Vendor Application Emails (4)
      results << send_email("Application Confirmation") do
        RegistrationEmailService.send_confirmation(test_registration)
      end

      results << send_email("Application Approved") do
        test_registration.update_column(:status, "approved")
        RegistrationEmailService.send_approval_email(test_registration)
      end

      results << send_email("Application Rejected") do
        test_registration.update_column(:status, "rejected")
        RegistrationEmailService.send_rejection_email(test_registration)
      end

      results << send_email("Moved to Waitlist") do
        test_registration.update_column(:status, "waitlist")
        RegistrationEmailService.send_waitlist_notification(test_registration)
      end

      # Category C: Event Invitation Emails (5)
      invitation = test_data[:invitation]
      vendor_contact = test_data[:vendor_contact]
      original_vendor_email = vendor_contact.email
      vendor_contact.update_column(:email, recipient_email)

      results << send_email("Vendor Invitation") do
        EventInvitationMailer.invitation_email(invitation).deliver_now
      end

      results << send_email("Invitation Accepted - Vendor Confirmation") do
        invitation.update!(status: "accepted", responded_at: Time.current)
        EventInvitationMailer.accepted_confirmation_vendor(invitation).deliver_now
      end

      results << send_email("Invitation Accepted - Producer Notification") do
        EventInvitationMailer.accepted_notification_producer(invitation).deliver_now
      end

      results << send_email("Invitation Declined - Vendor Confirmation") do
        invitation.update!(status: "declined", responded_at: Time.current)
        EventInvitationMailer.declined_confirmation_vendor(invitation).deliver_now
      end

      results << send_email("Invitation Declined - Producer Notification") do
        EventInvitationMailer.declined_notification_producer(invitation).deliver_now
      end

      vendor_contact.update_column(:email, original_vendor_email)

      # Category D: Admin/Producer Notification Emails (5)
      results << send_email("New Vendor Submission Notification") do
        test_registration.update_column(:status, "pending")
        RegistrationEmailService.notify_owner_of_submission(test_registration)
      end

      results << send_email("Payment Confirmed") do
        test_registration.update_column(:payment_status, "paid")
        RegistrationEmailService.send_payment_confirmation(test_registration)
      end

      results << send_email("Category Changed") do
        RegistrationEmailService.send_category_change_notification(test_registration, 200)
      end

      results << send_email("Event Details Changed") do
        RegistrationEmailService.send_event_details_changed_to_all(test_data[:event])
      end

      results << send_email("Event Canceled") do
        RegistrationEmailService.send_event_canceled_to_all(test_data[:event])
      end
    ensure
      # Restore original email
      test_registration.update_column(:email, original_email)
    end

    results
  end

  # Cleanup test data
  def cleanup_test_data
    Event.where("title LIKE ?", "TEST -%").destroy_all
    Organization.where("name LIKE ?", "TEST -%").destroy_all
    User.where("email LIKE ?", "test.%@voxxypresents.com").destroy_all
    VendorContact.where("email LIKE ?", "test.%@voxxypresents.com").destroy_all
    Registration.where("email LIKE ?", "test.%@voxxypresents.com").destroy_all
  end

  private

  def send_email(name)
    begin
      yield
      { name: name, status: "sent", timestamp: Time.current }
    rescue => e
      Rails.logger.error "Failed to send test email '#{name}': #{e.message}"
      { name: name, status: "failed", error: e.message }
    end
  end

  def send_scheduled_email_template(test_data, position, recipient_email)
    # Find the email template item
    template = EmailCampaignTemplate.find_by(is_default: true)
    return unless template

    email_item = template.email_template_items.find_by(position: position)
    return unless email_item

    event = test_data[:event]
    registration = test_data[:registration]

    # Resolve variables
    resolver = EmailVariableResolver.new(event, registration)
    subject = resolver.resolve(email_item.subject_template)
    body = resolver.resolve(email_item.body_template)

    # Send via base service
    BaseEmailService.send_email(recipient_email, subject, body, {
      "X-Entity-Ref-ID" => "test-email-#{position}",
      "X-SMTPAPI" => '{"category": ["test", "scheduled-email"]}'
    })
  end

  def find_or_create_test_producer
    User.find_or_create_by!(email: "test.producer@voxxypresents.com") do |u|
      u.name = "Test Producer"
      password = SecureRandom.hex(16)
      u.password = password
      u.password_confirmation = password
      u.role = "venue_owner"
      u.confirmed_at = Time.current
      u.product_context = "presents"
    end
  end

  def find_or_create_test_organization(test_user)
    Organization.find_or_create_by!(name: "TEST - Sample Venue", user: test_user) do |org|
      org.description = "Test organization for email testing"
      org.email = "venue@voxxypresents.com"
      org.city = "Raleigh"
      org.state = "NC"
      org.slug = "test-sample-venue-#{SecureRandom.hex(4)}"
      org.active = true
    end
  end

  def find_or_create_test_event(organization, skip_callbacks: false)
    # Find existing test event first to avoid creating duplicates
    existing_event = Event.find_by(
      title: "TEST - Summer Market 2026",
      organization: organization
    )

    return existing_event if existing_event

    # Create new event with callbacks control
    event = Event.new(
      title: "TEST - Summer Market 2026",
      organization: organization,
      description: "Test event for email testing purposes",
      event_date: 1.month.from_now,
      application_deadline: 1.week.from_now,
      payment_deadline: 3.weeks.from_now,
      venue: "Downtown Art Gallery",
      location: "Raleigh, NC",
      published: true,
      slug: "test-summer-market-2026-#{SecureRandom.hex(4)}",
      start_time: "10:00 AM",
      end_time: "6:00 PM",
      capacity: 50,
      age_restriction: "All Ages"
    )

    if skip_callbacks
      # Skip callbacks during creation
      Event.skip_callback(:create, :after, :assign_email_template_and_generate_emails)
      begin
        event.save!
      ensure
        Event.set_callback(:create, :after, :assign_email_template_and_generate_emails)
      end
    else
      event.save!
    end

    event
  end

  def find_or_create_vendor_application(event)
    VendorApplication.find_or_create_by!(
      event: event,
      name: "Vendor Application Form"
    ) do |va|
      va.description = "Test vendor application"
      va.categories = [ "Food", "Art", "Entertainment" ]
      va.booth_price = 150.00
      va.status = "active"
      va.shareable_code = "TEST#{SecureRandom.hex(4).upcase}"
      va.install_date = event.event_date - 1.day
      va.install_start_time = "8:00 AM"
      va.install_end_time = "10:00 AM"
    end
  end

  def find_or_create_test_registration(event, vendor_app, skip_callbacks: false)
    # Find existing test registration first
    existing_registration = Registration.find_by(
      email: "test.vendor@voxxypresents.com",
      event: event
    )

    return existing_registration if existing_registration

    # Create new registration with callbacks control
    registration = Registration.new(
      email: "test.vendor@voxxypresents.com",
      event: event,
      name: "Test Vendor",
      business_name: "Test Artisan Goods",
      vendor_category: "Art",
      status: "pending",
      payment_status: "pending",
      vendor_application: vendor_app,
      phone: "919-555-0123",
      instagram_handle: "@testartisan",
      note_to_host: "Looking forward to participating in this event!",
      ticket_code: "TEST#{SecureRandom.hex(4).upcase}"
    )

    if skip_callbacks
      # Skip callbacks during creation (prevents confirmation email from sending)
      Registration.skip_callback(:create, :after, :send_confirmation_email)
      begin
        registration.save!
      ensure
        Registration.set_callback(:create, :after, :send_confirmation_email)
      end
    else
      registration.save!
    end

    registration
  end

  def find_or_create_vendor_contact(organization)
    VendorContact.find_or_create_by!(
      email: "test.contact@voxxypresents.com",
      organization: organization
    ) do |vc|
      vc.name = "Test Contact"
      vc.business_name = "Test Business Co"
      vc.contact_type = "vendor"
      vc.status = "new"
      vc.source = "manual"
      vc.phone = "919-555-0456"
      vc.tags = [ "art", "local" ]
    end
  end

  def find_or_create_invitation(event, vendor_contact)
    EventInvitation.find_or_create_by!(
      event: event,
      vendor_contact: vendor_contact
    ) do |inv|
      inv.status = "pending"
      inv.invitation_token = SecureRandom.urlsafe_base64(32)
      inv.expires_at = 2.weeks.from_now
    end
  end
end
