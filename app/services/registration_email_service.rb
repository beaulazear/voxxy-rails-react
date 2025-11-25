class RegistrationEmailService < BaseEmailService
  # Send confirmation email to the person who registered/submitted
  def self.send_confirmation(registration)
    Rails.logger.info "Sending registration confirmation email to: #{registration.email}"

    if registration.vendor_registration?
      send_vendor_submission_confirmation(registration)
    else
      send_event_registration_confirmation(registration)
    end
  rescue StandardError => e
    Rails.logger.error "Failed to send registration confirmation email: #{e.message}"
    raise
  end

  # Notify event owner about new vendor submission
  def self.notify_owner_of_submission(registration)
    return unless registration.vendor_registration?

    event = registration.event
    owner = event.organization.user

    # Check if owner can receive emails
    return unless can_send_email_to_user?(owner)

    Rails.logger.info "Notifying event owner #{owner.email} of new vendor submission"

    vendor_app = registration.vendor_application
    frontend_url = user_frontend_url(owner)
    submission_url = "#{frontend_url}/events/#{event.slug}/applications/#{vendor_app.id}/submissions"

    subject = "New Vendor Application for #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{owner.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        You have a new vendor application submission for <strong>#{event.title}</strong>!
      </p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9D60F8;">
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Business Name:</strong> #{registration.business_name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Category:</strong> #{registration.vendor_category}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Contact:</strong> #{registration.name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Email:</strong> #{registration.email}</p>
        #{registration.phone.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #4a5568;'><strong>Phone:</strong> #{registration.phone}</p>" : ""}
      </div>

      <p style="#{BASE_STYLES[:text]}">
        Review the submission and update its status (approve, reject, or waitlist) in your dashboard.
      </p>
    HTML

    email_html = build_simple_email_template(
      "New Vendor Application",
      content,
      "Review Submission",
      submission_url
    )

    # Use organization email if available, otherwise use owner's email
    recipient_email = event.organization.email.presence || owner.email

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "vendor-submission"]}',
      "Importance" => "high"
    }

    send_email(recipient_email, subject, email_html, headers)

    Rails.logger.info "Owner notification sent successfully to #{recipient_email}"
  rescue StandardError => e
    Rails.logger.error "Failed to send owner notification email: #{e.message}"
    raise
  end

  # Send status update email when vendor application status changes
  def self.send_status_update(registration)
    return unless registration.vendor_registration?

    Rails.logger.info "Sending status update email to: #{registration.email}"

    case registration.status
    when "approved"
      send_approval_email(registration)
    when "rejected"
      send_rejection_email(registration)
    when "waitlist"
      send_waitlist_notification(registration)
    else
      Rails.logger.info "No email needed for status: #{registration.status}"
    end
  rescue StandardError => e
    Rails.logger.error "Failed to send status update email: #{e.message}"
    raise
  end

  private

  # Send confirmation to vendor application submitter
  def self.send_vendor_submission_confirmation(registration)
    event = registration.event
    vendor_app = registration.vendor_application

    # Build tracking URL (public endpoint, no auth needed)
    if Rails.env.production?
      primary_domain = ENV.fetch("PRIMARY_DOMAIN", "voxxyai.com")
      if primary_domain.include?("voxxyai.com")
        frontend_url = "https://voxxy-presents-client-staging.onrender.com"
      else
        frontend_url = "https://www.voxxypresents.com"
      end
    else
      frontend_url = ENV.fetch("PRESENTS_FRONTEND_URL", "http://localhost:5173")
    end

    tracking_url = "#{frontend_url}/track/#{registration.ticket_code}"

    subject = "Application Received - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{registration.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thank you for applying to <strong>#{event.title}</strong>! We've received your vendor application and our team will review it soon.
      </p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9D60F8;">
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Application Type:</strong> #{vendor_app.name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Business Name:</strong> #{registration.business_name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Category:</strong> #{registration.vendor_category}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Status:</strong> Pending Review</p>
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Tracking Code:</strong> <code style="background: white; padding: 2px 6px; border-radius: 4px; font-family: monospace;">#{registration.ticket_code}</code></p>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        You can track your application status anytime using the button below or your tracking code.
      </p>
    HTML

    email_html = build_simple_email_template(
      "Application Received",
      content,
      "Track My Application",
      tracking_url
    )

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "application-confirmation"]}'
    }

    send_email(registration.email, subject, email_html, headers)

    Rails.logger.info "Vendor submission confirmation sent successfully to #{registration.email}"
  end

  # Send confirmation to regular event attendee
  def self.send_event_registration_confirmation(registration)
    event = registration.event

    # Build event URL
    if Rails.env.production?
      primary_domain = ENV.fetch("PRIMARY_DOMAIN", "voxxyai.com")
      if primary_domain.include?("voxxyai.com")
        frontend_url = "https://voxxy-presents-client-staging.onrender.com"
      else
        frontend_url = "https://www.voxxypresents.com"
      end
    else
      frontend_url = ENV.fetch("PRESENTS_FRONTEND_URL", "http://localhost:5173")
    end

    event_url = "#{frontend_url}/events/#{event.slug}"

    subject = "You're Registered - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{registration.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        You're all set for <strong>#{event.title}</strong>! We're excited to see you there.
      </p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9D60F8;">
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Event:</strong> #{event.title}</p>
        #{event.event_date.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #4a5568;'><strong>Date:</strong> #{event.event_date.strftime('%B %d, %Y at %I:%M %p')}</p>" : ""}
        #{event.location.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #4a5568;'><strong>Location:</strong> #{event.location}</p>" : ""}
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>Confirmation Code:</strong> <code style="background: white; padding: 2px 6px; border-radius: 4px; font-family: monospace;">#{registration.ticket_code}</code></p>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        Save this confirmation code — you may need it for check-in at the event.
      </p>
    HTML

    email_html = build_simple_email_template(
      "You're Registered!",
      content,
      "View Event Details",
      event_url
    )

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "event-registration"]}'
    }

    send_email(registration.email, subject, email_html, headers)

    Rails.logger.info "Event registration confirmation sent successfully to #{registration.email}"
  end

  # Send approval notification
  def self.send_approval_email(registration)
    event = registration.event

    subject = "🎉 Your Application Was Approved - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{registration.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Great news! Your vendor application for <strong>#{event.title}</strong> has been approved!
      </p>

      <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
        <p style="margin: 5px 0; font-size: 14px; color: #155724;"><strong>Status:</strong> Approved ✓</p>
        <p style="margin: 5px 0; font-size: 14px; color: #155724;"><strong>Business:</strong> #{registration.business_name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #155724;"><strong>Category:</strong> #{registration.vendor_category}</p>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        The event organizer will reach out soon with next steps and additional details.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you have any questions, feel free to respond to this email.
      </p>
    HTML

    email_html = build_simple_email_template(
      "Application Approved!",
      content
    )

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "application-approved"]}'
    }

    send_email(registration.email, subject, email_html, headers)

    Rails.logger.info "Approval email sent successfully to #{registration.email}"
  end

  # Send rejection notification
  def self.send_rejection_email(registration)
    event = registration.event

    subject = "Update on Your Application - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{registration.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thank you for your interest in <strong>#{event.title}</strong>. After careful review, we're unable to move forward with your application at this time.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We appreciate you taking the time to apply and encourage you to check out future opportunities with us.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you have any questions, feel free to respond to this email.
      </p>
    HTML

    email_html = build_simple_email_template(
      "Application Status Update",
      content
    )

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "application-rejected"]}'
    }

    send_email(registration.email, subject, email_html, headers)

    Rails.logger.info "Rejection email sent successfully to #{registration.email}"
  end

  # Send waitlist notification
  def self.send_waitlist_notification(registration)
    event = registration.event

    subject = "You're on the Waitlist - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{registration.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thank you for applying to <strong>#{event.title}</strong>! Your application has been added to our waitlist.
      </p>

      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 5px 0; font-size: 14px; color: #856404;"><strong>Status:</strong> Waitlisted</p>
        <p style="margin: 5px 0; font-size: 14px; color: #856404;"><strong>Business:</strong> #{registration.business_name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #856404;"><strong>Category:</strong> #{registration.vendor_category}</p>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        We'll notify you if a spot becomes available. Thank you for your patience!
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you have any questions, feel free to respond to this email.
      </p>
    HTML

    email_html = build_simple_email_template(
      "You're on the Waitlist",
      content
    )

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "application-waitlist"]}'
    }

    send_email(registration.email, subject, email_html, headers)

    Rails.logger.info "Waitlist notification sent successfully to #{registration.email}"
  end
end
