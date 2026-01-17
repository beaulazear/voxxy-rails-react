# Admin controller for testing all 21 Voxxy Presents emails
# Admin-only access - sends emails to admin's own email address
class Admin::EmailsController < ApplicationController
  before_action :authorized
  before_action :require_admin

  # GET /admin/emails
  def index
    @test_email = current_user.email
    @email_categories = email_categories_data

    respond_to do |format|
      format.html # Render HTML view
      format.json do
        render json: {
          test_email: @test_email,
          email_categories: @email_categories,
          total_emails: 21
        }
      end
    end
  end

  # POST /admin/emails/send_all
  def send_all
    service = Admin::EmailTestService.new(current_user)
    @results = service.send_all_emails_to_admin

    respond_to do |format|
      format.json { render json: { results: @results, recipient: current_user.email } }
      format.html do
        flash[:notice] = "Sending all 21 emails to #{current_user.email}. Check your inbox in a few minutes."
        redirect_to admin_emails_path
      end
    end
  rescue => e
    respond_to do |format|
      format.json { render json: { error: e.message }, status: :unprocessable_entity }
      format.html do
        flash[:alert] = "Error sending emails: #{e.message}"
        redirect_to admin_emails_path
      end
    end
  end

  # POST /admin/emails/send_scheduled
  def send_scheduled
    service = Admin::EmailTestService.new(current_user)
    @results = service.send_scheduled_emails_to_user

    respond_to do |format|
      format.json { render json: { results: @results, recipient: current_user.email } }
      format.html do
        flash[:notice] = "Sending 7 scheduled emails to #{current_user.email}. Check your inbox in a few minutes."
        redirect_to admin_emails_path
      end
    end
  rescue => e
    respond_to do |format|
      format.json { render json: { error: e.message }, status: :unprocessable_entity }
      format.html do
        flash[:alert] = "Error sending scheduled emails: #{e.message}"
        redirect_to admin_emails_path
      end
    end
  end

  # POST /admin/emails/setup_test_data
  def setup_test_data
    service = Admin::EmailTestService.new(current_user)
    @test_data = service.setup_test_data

    respond_to do |format|
      format.json { render json: { message: "Test data created successfully", data: @test_data } }
      format.html do
        flash[:notice] = "Test data created successfully"
        redirect_to admin_emails_path
      end
    end
  rescue => e
    respond_to do |format|
      format.json { render json: { error: e.message }, status: :unprocessable_entity }
      format.html do
        flash[:alert] = "Error creating test data: #{e.message}"
        redirect_to admin_emails_path
      end
    end
  end

  # DELETE /admin/emails/cleanup_test_data
  def cleanup_test_data
    service = Admin::EmailTestService.new(current_user)
    service.cleanup_test_data

    respond_to do |format|
      format.json { render json: { message: "Test data cleaned up successfully" } }
      format.html do
        flash[:notice] = "Test data cleaned up successfully"
        redirect_to admin_emails_path
      end
    end
  rescue => e
    respond_to do |format|
      format.json { render json: { error: e.message }, status: :unprocessable_entity }
      format.html do
        flash[:alert] = "Error cleaning up test data: #{e.message}"
        redirect_to admin_emails_path
      end
    end
  end

  # POST /admin/emails/preview
  def preview
    email_type = params[:email_type]
    service = Admin::EmailTestService.new(current_user)
    # Skip callbacks to prevent sending actual emails during preview
    test_data = service.setup_test_data(skip_callbacks: true)

    html_content = case email_type
    # Scheduled emails (1-7)
    when "scheduled_1"
      preview_scheduled_email(test_data, 1)
    when "scheduled_2"
      preview_scheduled_email(test_data, 2)
    when "scheduled_3"
      preview_scheduled_email(test_data, 3)
    when "scheduled_4"
      preview_scheduled_email(test_data, 4)
    when "scheduled_5"
      preview_scheduled_email(test_data, 5)
    when "scheduled_6"
      preview_scheduled_email(test_data, 6)
    when "scheduled_7"
      preview_scheduled_email(test_data, 7)

    # Vendor application emails
    when "application_confirmation"
      preview_registration_email(test_data[:registration], :confirmation)
    when "application_approved"
      test_data[:registration].update_column(:status, "approved")
      preview_registration_email(test_data[:registration], :approval)
    when "application_rejected"
      test_data[:registration].update_column(:status, "rejected")
      preview_registration_email(test_data[:registration], :rejection)
    when "application_waitlist"
      test_data[:registration].update_column(:status, "waitlist")
      preview_registration_email(test_data[:registration], :waitlist)

    # Event invitation emails
    when "invitation_vendor"
      preview_invitation_email(test_data[:invitation], :invitation)
    when "invitation_accepted_vendor"
      test_data[:invitation].update!(status: "accepted", responded_at: Time.current)
      preview_invitation_email(test_data[:invitation], :accepted_vendor)
    when "invitation_accepted_producer"
      preview_invitation_email(test_data[:invitation], :accepted_producer)
    when "invitation_declined_vendor"
      test_data[:invitation].update!(status: "declined", responded_at: Time.current)
      preview_invitation_email(test_data[:invitation], :declined_vendor)
    when "invitation_declined_producer"
      preview_invitation_email(test_data[:invitation], :declined_producer)

    # Admin/Producer notification emails
    when "new_submission"
      test_data[:registration].update_column(:status, "pending")
      preview_registration_email(test_data[:registration], :submission_notification)
    when "payment_confirmed"
      test_data[:registration].update_column(:payment_status, "paid")
      preview_registration_email(test_data[:registration], :payment_confirmation)
    when "category_changed"
      preview_category_change(test_data[:registration])
    when "event_updated"
      preview_event_update(test_data[:event])
    when "event_canceled"
      preview_event_canceled(test_data[:event])
    else
      raise "Unknown email type: #{email_type}"
    end

    render json: { html: html_content }
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def require_admin
    unless current_user&.admin?
      respond_to do |format|
        format.json { render json: { error: "Admin access required" }, status: :forbidden }
        format.html do
          flash[:alert] = "Admin access required"
          redirect_to root_path
        end
      end
    end
  end

  def email_categories_data
    [
      {
        name: "Scheduled Automated Emails",
        description: "Time-based automated emails sent throughout the event lifecycle",
        count: 7,
        emails: [
          { name: "1 Day Before Application Deadline", subject: "Last Chance: Applications Close Tomorrow" },
          { name: "Application Deadline Day", subject: "URGENT: Applications Close Today" },
          { name: "1 Day Before Payment Due", subject: "Reminder: Payment Due Tomorrow" },
          { name: "Payment Due Today", subject: "URGENT: Payment Due Today" },
          { name: "1 Day Before Event", subject: "Tomorrow: Final Details" },
          { name: "Day of Event", subject: "Today: Event Name" },
          { name: "Day After Event - Thank You", subject: "Thank You for Participating" }
        ]
      },
      {
        name: "Vendor Application Emails",
        description: "Emails sent when vendors apply and receive status updates",
        count: 4,
        emails: [
          { name: "Application Confirmation", subject: "Application Received" },
          { name: "Application Approved", subject: "Your Application Was Approved" },
          { name: "Application Rejected", subject: "Application Status Update" },
          { name: "Moved to Waitlist", subject: "Waitlist Status" }
        ]
      },
      {
        name: "Event Invitation Emails",
        description: "Emails for inviting vendors and tracking responses",
        count: 5,
        emails: [
          { name: "Vendor Invitation", subject: "Event Name is coming" },
          { name: "Invitation Accepted - Vendor Confirmation", subject: "Thank You for Accepting" },
          { name: "Invitation Accepted - Producer Notification", subject: "Vendor accepted invitation" },
          { name: "Invitation Declined - Vendor Confirmation", subject: "Invitation Declined" },
          { name: "Invitation Declined - Producer Notification", subject: "Vendor declined invitation" }
        ]
      },
      {
        name: "Admin/Producer Notification Emails",
        description: "Emails sent to producers for important updates",
        count: 5,
        emails: [
          { name: "New Vendor Submission Notification", subject: "New Vendor Application" },
          { name: "Payment Confirmed", subject: "Payment Confirmed" },
          { name: "Category Changed", subject: "Category Update" },
          { name: "Event Details Changed (Bulk)", subject: "Event Update" },
          { name: "Event Canceled (Bulk)", subject: "Event Canceled" }
        ]
      }
    ]
  end

  def preview_scheduled_email(test_data, position)
    template = EmailCampaignTemplate.find_by(is_default: true)
    return "<p>No default template found</p>" unless template

    email_item = template.email_template_items.find_by(position: position)
    return "<p>Email template item not found</p>" unless email_item

    event = test_data[:event]
    registration = test_data[:registration]

    resolver = EmailVariableResolver.new(event, registration)
    subject = resolver.resolve(email_item.subject_template)
    body = resolver.resolve(email_item.body_template)

    # Build HTML with BASE_STYLES (using positional arguments)
    BaseEmailService.build_simple_email_template(
      subject,
      body,
      "View Event Details",
      "https://voxxypresents.com/events/#{event.slug}"
    )
  end

  def preview_registration_email(registration, type)
    # These methods generate and return HTML using BaseEmailService
    # We'll generate the HTML directly here
    event = registration.event

    case type
    when :confirmation
      subject = "Application Received"
      message = "Thank you for applying to #{event.title}. We have received your application and will review it shortly."
      BaseEmailService.build_simple_email_template(
        subject,
        message,
        "Track Your Application",
        "https://voxxypresents.com/applications/track/#{registration.ticket_code}"
      )
    when :approval
      subject = "Your Application Was Approved"
      message = "Congratulations! Your application to #{event.title} has been approved."
      BaseEmailService.build_simple_email_template(
        subject,
        message,
        "View Details",
        "https://voxxypresents.com/applications/track/#{registration.ticket_code}"
      )
    when :rejection
      subject = "Application Status Update"
      message = "Thank you for your interest in #{event.title}. Unfortunately, we are unable to accept your application at this time."
      BaseEmailService.build_simple_email_template(
        subject,
        message,
        "View Other Events",
        "https://voxxypresents.com/events"
      )
    when :waitlist
      subject = "Waitlist Status"
      message = "Your application to #{event.title} has been placed on the waitlist. We will notify you if a spot becomes available."
      BaseEmailService.build_simple_email_template(
        subject,
        message,
        "Track Your Application",
        "https://voxxypresents.com/applications/track/#{registration.ticket_code}"
      )
    when :submission_notification
      subject = "New Vendor Application"
      message = "A new vendor application has been submitted for #{event.title}."
      BaseEmailService.build_simple_email_template(
        subject,
        message,
        "View Application",
        "https://voxxypresents.com/producer/pending"
      )
    when :payment_confirmation
      subject = "Payment Confirmed"
      message = "Your payment for #{event.title} has been confirmed. We look forward to seeing you at the event!"
      BaseEmailService.build_simple_email_template(
        subject,
        message,
        "View Details",
        "https://voxxypresents.com/applications/track/#{registration.ticket_code}"
      )
    end
  end

  def preview_invitation_email(invitation, type)
    case type
    when :invitation
      EventInvitationMailer.invitation_email(invitation).body.to_s
    when :accepted_vendor
      EventInvitationMailer.accepted_confirmation_vendor(invitation).body.to_s
    when :accepted_producer
      EventInvitationMailer.accepted_notification_producer(invitation).body.to_s
    when :declined_vendor
      EventInvitationMailer.declined_confirmation_vendor(invitation).body.to_s
    when :declined_producer
      EventInvitationMailer.declined_notification_producer(invitation).body.to_s
    end
  end

  def preview_category_change(registration)
    event = registration.event
    subject = "Category Update"
    message = "Your booth category for #{event.title} has been updated. The new fee is $200."
    BaseEmailService.build_simple_email_template(
      subject,
      message,
      "View Details",
      "https://voxxypresents.com/applications/track/#{registration.ticket_code}"
    )
  end

  def preview_event_update(event)
    subject = "Event Update"
    message = "Important updates have been made to #{event.title}. Please review the changes."
    BaseEmailService.build_simple_email_template(
      subject,
      message,
      "View Event Details",
      "https://voxxypresents.com/events/#{event.slug}"
    )
  end

  def preview_event_canceled(event)
    subject = "Event Canceled"
    message = "We regret to inform you that #{event.title} has been canceled. Refunds will be processed automatically."
    BaseEmailService.build_simple_email_template(
      subject,
      message,
      "View Other Events",
      "https://voxxypresents.com/events"
    )
  end
end
