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

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9D60F8; text-align: left;">
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;"><strong>Business Name:</strong> #{registration.business_name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;"><strong>Category:</strong> #{registration.vendor_category}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;"><strong>Contact:</strong> #{registration.name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;"><strong>Email:</strong> #{registration.email}</p>
        #{registration.phone.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;'><strong>Phone:</strong> #{registration.phone}</p>" : ""}
        #{registration.instagram_handle.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;'><strong>Instagram:</strong> <a href='https://instagram.com/#{registration.instagram_handle.delete_prefix('@')}' style='color: #9D60F8; text-decoration: none;'>#{registration.instagram_handle}</a></p>" : ""}
        #{registration.tiktok_handle.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;'><strong>TikTok:</strong> <a href='https://tiktok.com/@#{registration.tiktok_handle.delete_prefix('@')}' style='color: #9D60F8; text-decoration: none;'>#{registration.tiktok_handle}</a></p>" : ""}
        #{registration.website.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;'><strong>Website:</strong> <a href='#{registration.website}' style='color: #9D60F8; text-decoration: none;'>#{registration.website}</a></p>" : ""}
      </div>

      #{registration.note_to_host.present? ?
        "<div style='background: #fffbea; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;'>
          <p style='margin: 0 0 8px 0; font-size: 14px; color: #92400e; font-weight: 600;'>Message from Vendor:</p>
          <p style='margin: 0; font-size: 14px; color: #78350f; font-style: italic;'>\"#{registration.note_to_host}\"</p>
        </div>" : ""
      }

      <p style="#{BASE_STYLES[:text]}">
        Review the submission and update its status (approve, reject, or waitlist) in your dashboard.
      </p>
    HTML

    email_html = build_presents_email_template(
      "New Vendor Application",
      content,
      "Review Submission",
      submission_url,
      event.organization
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

  # Build email template with organization branding
  def self.build_presents_email_template(title, content, button_text = nil, button_url = nil, organization = nil)
    <<~HTML
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>#{title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="#{BASE_STYLES[:body]}">
          <div style="#{BASE_STYLES[:container]}">
            <div style="#{BASE_STYLES[:inner_container]}">
              <!-- Organization Header -->
              <div style="#{BASE_STYLES[:header]}">
                <h2 style="margin: 0; color: #9D60F8; font-size: 24px; font-weight: 700;">#{organization&.name || 'Event Organizer'}</h2>
              </div>

              <!-- Main Title -->
              <h1 style="#{BASE_STYLES[:title]}">#{title}</h1>

              <!-- Content -->
              <div>
                #{content}
              </div>

              <!-- Button -->
              #{button_text && button_url ?
                "<div style='text-align: center; margin: 30px 0;'>
                  <a href='#{button_url}' style='#{BASE_STYLES[:button]}'>#{button_text}</a>
                </div>" : ""
              }

              <!-- Footer -->
              <div style="#{BASE_STYLES[:footer]}">
                <p style="margin: 0 0 10px 0;">See you at the event! ✨</p>
                <p style="font-size: 12px; color: #a0aec0; margin: 0;">
                  If you didn't expect this email, you can safely ignore it.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    HTML
  end

  # Send confirmation to vendor application submitter
  def self.send_vendor_submission_confirmation(registration)
    event = registration.event
    organization = event.organization

    # Parse first name from full name
    first_name = registration.name.to_s.split(" ").first || registration.name

    # Get producer name and email
    producer_name = organization.name || "Event Organizer"
    producer_email = organization.email || organization.user&.email || "team@voxxypresents.com"

    # Format event date
    event_date = event.event_date.present? ? event.event_date.strftime("%B %d, %Y") : "TBD"

    subject = "Application Received - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{first_name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thank you for applying to <strong>#{event.title}</strong>! We've received your application.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        📅 <strong>Event Date:</strong> #{event_date}<br/>
        📍 <strong>Location:</strong> #{event.venue.present? ? "#{event.venue}, " : ""}#{event.location || "TBD"}<br/>
        🏷️ <strong>Category:</strong> #{registration.vendor_category}
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We'll review your application and get back to you soon. Keep an eye on your inbox for updates.
      </p>

      <p style="#{BASE_STYLES[:text]}; margin-top: 30px;">
        Best,<br/>
        #{producer_name}
      </p>
    HTML

    email_html = build_presents_email_template(
      "Application Received",
      content,
      nil,
      nil,
      organization
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

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9D60F8; text-align: left;">
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;"><strong>Event:</strong> #{event.title}</p>
        #{event.event_date.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;'><strong>Date:</strong> #{event.event_date.strftime('%B %d, %Y at %I:%M %p')}</p>" : ""}
        #{event.location.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;'><strong>Location:</strong> #{event.location}</p>" : ""}
        <p style="margin: 5px 0; font-size: 14px; color: #4a5568; text-align: left;"><strong>Confirmation Code:</strong> <code style="background: white; padding: 2px 6px; border-radius: 4px; font-family: monospace;">#{registration.ticket_code}</code></p>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        Save this confirmation code — you may need it for check-in at the event.
      </p>
    HTML

    email_html = build_presents_email_template(
      "You're Registered!",
      content,
      "View Event Details",
      event_url,
      event.organization
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

      <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; text-align: left;">
        <p style="margin: 5px 0; font-size: 14px; color: #155724; text-align: left;"><strong>Status:</strong> Approved ✓</p>
        <p style="margin: 5px 0; font-size: 14px; color: #155724; text-align: left;"><strong>Business:</strong> #{registration.business_name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #155724; text-align: left;"><strong>Category:</strong> #{registration.vendor_category}</p>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        The event organizer will reach out soon with next steps and additional details.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you have any questions, feel free to respond to this email.
      </p>
    HTML

    email_html = build_presents_email_template(
      "Application Approved!",
      content,
      nil,
      nil,
      event.organization
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

    email_html = build_presents_email_template(
      "Application Status Update",
      content,
      nil,
      nil,
      event.organization
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
    organization = event.organization

    # Parse first name from full name
    first_name = registration.name.to_s.split(" ").first || registration.name

    # Get producer name and email
    producer_name = organization.name || "Event Organizer"
    producer_email = organization.email || organization.user&.email || "team@voxxypresents.com"

    subject = "You're on the Waitlist - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{first_name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We noticed payment wasn't received by the deadline for <strong>#{event.title}</strong>.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Your spot has been moved to the waitlist. If a spot becomes available and you'd still like to participate, we'll reach out.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you believe this is an error, please contact us immediately at <a href="mailto:#{producer_email}" style="color: #9D60F8; text-decoration: none;">#{producer_email}</a>.
      </p>

      <p style="#{BASE_STYLES[:text]}; margin-top: 30px;">
        Best,<br/>
        #{producer_name}
      </p>
    HTML

    email_html = build_presents_email_template(
      "You're on the Waitlist",
      content,
      nil,
      nil,
      organization
    )

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "application-waitlist"]}'
    }

    send_email(registration.email, subject, email_html, headers)

    Rails.logger.info "Waitlist notification sent successfully to #{registration.email}"
  end
end
