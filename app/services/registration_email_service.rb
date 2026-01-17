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
        You have received a new vendor application for <strong>#{event.title}</strong>.
      </p>

      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;">
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Business Name:</strong> #{registration.business_name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Category:</strong> #{registration.vendor_category}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Contact:</strong> #{registration.name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Email:</strong> #{registration.email}</p>
        #{registration.phone.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #333333;'><strong>Phone:</strong> #{registration.phone}</p>" : ""}
        #{registration.instagram_handle.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #333333;'><strong>Instagram:</strong> <a href='https://instagram.com/#{registration.instagram_handle.delete_prefix('@')}' style='#{BASE_STYLES[:link]}'>#{registration.instagram_handle}</a></p>" : ""}
        #{registration.tiktok_handle.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #333333;'><strong>TikTok:</strong> <a href='https://tiktok.com/@#{registration.tiktok_handle.delete_prefix('@')}' style='#{BASE_STYLES[:link]}'>#{registration.tiktok_handle}</a></p>" : ""}
        #{registration.website.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #333333;'><strong>Website:</strong> <a href='#{registration.website}' style='#{BASE_STYLES[:link]}'>#{registration.website}</a></p>" : ""}
      </div>

      #{registration.note_to_host.present? ?
        "<div style='background-color: #fffef0; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;'>
          <p style='margin: 0 0 8px 0; font-size: 14px; color: #333333; font-weight: 600;'>Message from Vendor:</p>
          <p style='margin: 0; font-size: 14px; color: #333333; font-style: italic;'>\"#{registration.note_to_host}\"</p>
        </div>" : ""
      }

      <p style="#{BASE_STYLES[:text]}">
        Review the submission and update its status in your dashboard: <a href='#{submission_url}' style='#{BASE_STYLES[:link]}'>#{submission_url}</a>
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
  def self.build_presents_email_template(title, content, link_text = nil, link_url = nil, organization = nil)
    <<~HTML
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>#{title}</title>
        </head>
        <body style="#{BASE_STYLES[:body]}">
          <div style="#{BASE_STYLES[:container]}">
            <div style="#{BASE_STYLES[:inner_container]}">
              <!-- Organization Header -->
              <div style="#{BASE_STYLES[:header]}">
                <strong style="font-size: 18px; color: #1a1a1a;">#{organization&.name || 'Event Organizer'}</strong>
              </div>

              <!-- Main Title -->
              <h1 style="#{BASE_STYLES[:title]}">#{title}</h1>

              <!-- Content -->
              <div>
                #{content}
              </div>

              <!-- Link -->
              #{link_text && link_url ?
                "<p style='#{BASE_STYLES[:text]}'>
                  <a href='#{link_url}' style='#{BASE_STYLES[:link]}'>#{link_url}</a>
                </p>" : ""
              }

              <!-- Footer -->
              <div style="#{BASE_STYLES[:footer]}">
                <p style="margin: 0 0 8px 0;">See you at the event.</p>
                <p style="margin: 0 0 12px 0;">
                  If you didn't expect this email, you can safely ignore it.
                </p>
                <p style="margin: 0; font-size: 12px; color: #aaaaaa;">
                  Powered by Voxxy Presents
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
        Thank you for applying to <strong>#{event.title}</strong>. We have received your application.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Event Date:</strong> #{event_date}<br/>
        <strong>Location:</strong> #{event.venue.present? ? "#{event.venue}, " : ""}#{event.location || "TBD"}<br/>
        <strong>Category:</strong> #{registration.vendor_category}
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We will review your application and contact you soon. Please keep an eye on your inbox for updates.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Best regards,<br/>
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

    subject = "Registration Confirmed - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{registration.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        You are registered for <strong>#{event.title}</strong>. We look forward to seeing you there.
      </p>

      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border: 1px solid #e0e0e0;">
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Event:</strong> #{event.title}</p>
        #{event.event_date.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #333333;'><strong>Date:</strong> #{event.event_date.strftime('%B %d, %Y at %I:%M %p')}</p>" : ""}
        #{event.location.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #333333;'><strong>Location:</strong> #{event.location}</p>" : ""}
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Confirmation Code:</strong> #{registration.ticket_code}</p>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        Please save this confirmation code. You may need it for check-in at the event.
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

    subject = "Your Application Was Approved - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{registration.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Good news. Your vendor application for <strong>#{event.title}</strong> has been approved.
      </p>

      <div style="background-color: #f0f9f0; padding: 15px; margin: 15px 0; border: 1px solid #c0e0c0;">
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Status:</strong> Approved</p>
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Business:</strong> #{registration.business_name}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Category:</strong> #{registration.vendor_category}</p>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        The event organizer will contact you soon with next steps and additional details.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you have any questions, please respond to this email.
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

    subject = "Application Status Update - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{registration.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thank you for your interest in <strong>#{event.title}</strong>. After careful review, we are unable to move forward with your application at this time.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We appreciate you taking the time to apply and encourage you to check out future opportunities.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you have any questions, please respond to this email.
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

    subject = "Waitlist Status - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{first_name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Payment was not received by the deadline for <strong>#{event.title}</strong>.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Your spot has been moved to the waitlist. If a spot becomes available and you would still like to participate, we will contact you.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you believe this is an error, please contact us at <a href="mailto:#{producer_email}" style="#{BASE_STYLES[:link]}">#{producer_email}</a>.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Best regards,<br/>
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

  # Send payment confirmation
  def self.send_payment_confirmation(registration)
    event = registration.event
    organization = event.organization
    vendor_app = registration.vendor_application

    # Parse first name from full name
    first_name = registration.name.to_s.split(" ").first || registration.name

    # Get producer name and email
    producer_name = organization.name || "Event Organizer"

    # Get category price (from vendor_application if available)
    category_price = vendor_app&.booth_price || event.ticket_price
    formatted_price = category_price.present? ? "$#{category_price.to_i}" : "TBD"

    # Format dates and times
    event_date = event.event_date.present? ? event.event_date.strftime("%B %d, %Y") : "TBD"
    install_date = vendor_app&.install_date.present? ? vendor_app.install_date.strftime("%B %d, %Y") : "TBD"

    install_time = if vendor_app&.install_start_time.present? && vendor_app&.install_end_time.present?
      "#{vendor_app.install_start_time} - #{vendor_app.install_end_time}"
    elsif vendor_app&.install_start_time.present?
      vendor_app.install_start_time
    else
      "TBD"
    end

    subject = "Payment Confirmed - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{first_name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Your payment for <strong>#{event.title}</strong> has been confirmed.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Category:</strong> #{registration.vendor_category}<br/>
        <strong>Amount Paid:</strong> #{formatted_price}
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Event:</strong> #{event_date}<br/>
        <strong>Location:</strong> #{event.venue.present? ? "#{event.venue}, " : ""}#{event.location || "TBD"}<br/>
        <strong>Install:</strong> #{install_date} at #{install_time}
      </p>

      <p style="#{BASE_STYLES[:text]}">
        You are all set. We will send more details as the event approaches.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Best regards,<br/>
        #{producer_name}
      </p>
    HTML

    email_html = build_presents_email_template(
      "Payment Confirmed",
      content,
      nil,
      nil,
      organization
    )

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "payment-confirmed"]}'
    }

    send_email(registration.email, subject, email_html, headers)

    Rails.logger.info "Payment confirmation sent successfully to #{registration.email}"
  end

  # Send category change notification
  def self.send_category_change_notification(registration, new_category_price = nil)
    event = registration.event
    organization = event.organization

    # Parse first name from full name
    first_name = registration.name.to_s.split(" ").first || registration.name

    # Get producer name and email
    producer_name = organization.name || "Event Organizer"
    producer_email = organization.email || organization.user&.email || "team@voxxypresents.com"

    # Get category price
    category_price = new_category_price || registration.vendor_application&.booth_price || event.ticket_price
    formatted_price = category_price.present? ? "$#{category_price.to_i}" : "TBD"

    subject = "Category Update - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{first_name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Your category for <strong>#{event.title}</strong> has been updated to: <strong>#{registration.vendor_category}</strong>
      </p>

      <p style="#{BASE_STYLES[:text]}">
        New pricing: #{formatted_price}
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you have questions about this change, please contact <a href="mailto:#{producer_email}" style="#{BASE_STYLES[:link]}">#{producer_email}</a>.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Best regards,<br/>
        #{producer_name}
      </p>
    HTML

    email_html = build_presents_email_template(
      "Category Update",
      content,
      nil,
      nil,
      organization
    )

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "category-changed"]}'
    }

    send_email(registration.email, subject, email_html, headers)

    Rails.logger.info "Category change notification sent successfully to #{registration.email}"
  end

  # Send event details changed notification to all registrations
  def self.send_event_details_changed_to_all(event)
    organization = event.organization
    producer_name = organization.name || "Event Organizer"
    producer_email = organization.email || organization.user&.email || "team@voxxypresents.com"

    # Format event details
    event_date = event.event_date.present? ? event.event_date.strftime("%B %d, %Y") : "TBD"
    event_time = event.start_time.present? ? event.start_time : "TBD"

    subject = "Event Update - #{event.title}"

    sent_count = 0
    failed_count = 0

    event.registrations.where(email_unsubscribed: false).find_each do |registration|
      begin
        # Parse first name
        first_name = registration.name.to_s.split(" ").first || registration.name

        content = <<~HTML
          <p style="#{BASE_STYLES[:text]}">
            Hi #{first_name},
          </p>

          <p style="#{BASE_STYLES[:text]}">
            There has been an update to <strong>#{event.title}</strong>. Please review the latest event details:
          </p>

          <p style="#{BASE_STYLES[:text]}">
            <strong>Event Date:</strong> #{event_date}<br/>
            <strong>Venue:</strong> #{event.venue.present? ? "#{event.venue}, " : ""}#{event.location || "TBD"}<br/>
            <strong>Time:</strong> #{event_time}
          </p>

          <p style="#{BASE_STYLES[:text]}">
            Please make note of any changes that may affect your participation.
          </p>

          <p style="#{BASE_STYLES[:text]}">
            If you have questions, contact <a href="mailto:#{producer_email}" style="#{BASE_STYLES[:link]}">#{producer_email}</a>.
          </p>

          <p style="#{BASE_STYLES[:text]}">
            Best regards,<br/>
            #{producer_name}
          </p>
        HTML

        email_html = build_presents_email_template(
          "Event Update",
          content,
          nil,
          nil,
          organization
        )

        headers = {
          "X-Entity-Ref-ID" => "event-#{event.id}",
          "X-SMTPAPI" => '{"category": ["transactional", "event-details-changed"]}'
        }

        send_email(registration.email, subject, email_html, headers)
        sent_count += 1
      rescue StandardError => e
        Rails.logger.error "Failed to send event details update to #{registration.email}: #{e.message}"
        failed_count += 1
      end
    end

    Rails.logger.info "Event details update sent to #{sent_count} recipients (#{failed_count} failed)"
    { sent: sent_count, failed: failed_count }
  end

  # Send event canceled notification to all registrations
  def self.send_event_canceled_to_all(event)
    organization = event.organization
    producer_name = organization.name || "Event Organizer"
    producer_email = organization.email || organization.user&.email || "team@voxxypresents.com"

    subject = "Event Canceled - #{event.title}"

    sent_count = 0
    failed_count = 0

    event.registrations.where(email_unsubscribed: false).find_each do |registration|
      begin
        # Parse first name
        first_name = registration.name.to_s.split(" ").first || registration.name

        content = <<~HTML
          <p style="#{BASE_STYLES[:text]}">
            Hi #{first_name},
          </p>

          <p style="#{BASE_STYLES[:text]}">
            We regret to inform you that <strong>#{event.title}</strong> has been canceled.
          </p>

          <p style="#{BASE_STYLES[:text]}">
            We apologize for any inconvenience this may cause. If you have already made a payment, you will receive a full refund within 5-7 business days.
          </p>

          <p style="#{BASE_STYLES[:text]}">
            For any questions regarding refunds or future events, please contact <a href="mailto:#{producer_email}" style="#{BASE_STYLES[:link]}">#{producer_email}</a>.
          </p>

          <p style="#{BASE_STYLES[:text]}">
            Thank you for your understanding, and we hope to see you at a future event.
          </p>

          <p style="#{BASE_STYLES[:text]}">
            Best regards,<br/>
            #{producer_name}
          </p>
        HTML

        email_html = build_presents_email_template(
          "Event Canceled",
          content,
          nil,
          nil,
          organization
        )

        headers = {
          "X-Entity-Ref-ID" => "event-#{event.id}",
          "X-SMTPAPI" => '{"category": ["transactional", "event-canceled"]}'
        }

        send_email(registration.email, subject, email_html, headers)
        sent_count += 1
      rescue StandardError => e
        Rails.logger.error "Failed to send event cancellation to #{registration.email}: #{e.message}"
        failed_count += 1
      end
    end

    Rails.logger.info "Event cancellation sent to #{sent_count} recipients (#{failed_count} failed)"
    { sent: sent_count, failed: failed_count }
  end
end
