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

    send_email(
      recipient_email,
      subject,
      email_html,
      headers,
      from_name: event.organization.name,
      reply_to_email: registration.email,  # Vendor's email - owner can reply directly to vendor
      reply_to_name: registration.name
    )

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
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #888888;">
                  <a href="mailto:unsubscribe@voxxypresents.com" style="#{BASE_STYLES[:link]}">Unsubscribe from these emails</a>
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

    subject = "Application Received - #{event.title}"

    # Use EmailVariableResolver to resolve all template variables
    resolver = EmailVariableResolver.new(event, registration)

    # Determine which template to use based on category name
    category_name = registration.vendor_category.to_s.downcase

    if category_name.include?("artist") || category_name.include?("gallery")
      content_template = artist_application_received_template
    elsif category_name.include?("vendor") || category_name.include?("table")
      content_template = vendor_table_application_received_template
    else
      # Fallback to generic template
      content_template = generic_application_received_template
    end

    # Resolve all variables in the template
    content = resolver.resolve(content_template)

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

    send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

    Rails.logger.info "Vendor submission confirmation sent successfully to #{registration.email}"
  end

  # Send confirmation to regular event attendee
  def self.send_event_registration_confirmation(registration)
    event = registration.event

    # Build event URL using centralized helper
    frontend_url = FrontendUrlHelper.presents_frontend_url
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

    send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: event.organization.name,
      reply_to_email: event.organization.reply_to_email,
      reply_to_name: event.organization.reply_to_name
    )

    Rails.logger.info "Event registration confirmation sent successfully to #{registration.email}"
  end

  # Send approval notification
  def self.send_approval_email(registration)
    event = registration.event
    organization = event.organization

    # Get greeting name (businessName preferred, fallback to firstName)
    greeting_name = if registration.business_name.present?
      registration.business_name
    else
      registration.name.to_s.split(" ").first || registration.name
    end

    # Get producer email
    producer_email = organization.email || organization.user&.email || "team@voxxypresents.com"

    # Build event portal link using token-based URL
    portal = event.event_portal || event.create_event_portal!
    dashboard_link = portal.portal_url

    subject = "You're in - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{greeting_name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Great news - your application to <strong>#{event.title}</strong> has been approved!
      </p>

      <p style="#{BASE_STYLES[:text]}">
        You can now access your event portal to view event details, your category information, load-in times, and payment instructions:<br/>
        <a href="#{dashboard_link}" style="color: #0066cc; text-decoration: underline;">#{dashboard_link}</a>
      </p>

      <p style="#{BASE_STYLES[:text]}">
        To sign in, use the email address you applied with: #{registration.email}
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Once you've completed payment, you'll be fully confirmed for the event. If you have any questions, contact us at #{producer_email}.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We're excited to have you!
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Best,<br/>
        #{organization.name || "Event Organizer"}
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="font-size: 12px; color: #888888;">
        Questions? Reply to this email or contact team@voxxypresents.com directly.
      </p>
    HTML

    email_html = build_presents_email_template(
      "You're in!",
      content,
      nil,
      nil,
      organization
    )

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "application-approved"]}'
    }

    send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

    Rails.logger.info "Approval email sent successfully to #{registration.email}"
  end

  # Send rejection notification
  def self.send_rejection_email(registration)
    event = registration.event
    organization = event.organization

    # Get greeting name (businessName preferred, fallback to firstName)
    greeting_name = if registration.business_name.present?
      registration.business_name
    else
      registration.name.to_s.split(" ").first || registration.name
    end

    # Get producer email
    producer_email = organization.email || organization.user&.email || "team@voxxypresents.com"

    subject = "Update on your application - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{greeting_name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thank you for applying to <strong>#{event.title}</strong>. After reviewing all applications, we weren't able to offer you a spot this time.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We appreciate your interest and hope you'll consider applying to future events.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Best,<br/>
        #{organization.name || "Event Organizer"}
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="font-size: 12px; color: #888888;">
        Questions? Reply to this email or contact team@voxxypresents.com directly.
      </p>
    HTML

    email_html = build_presents_email_template(
      "Application Update",
      content,
      nil,
      nil,
      organization
    )

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "application-rejected"]}'
    }

    send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

    Rails.logger.info "Rejection email sent successfully to #{registration.email}"
  end

  # Send waitlist notification
  def self.send_waitlist_notification(registration)
    event = registration.event
    organization = event.organization

    # Get greeting name (businessName preferred, fallback to firstName)
    greeting_name = if registration.business_name.present?
      registration.business_name
    else
      registration.name.to_s.split(" ").first || registration.name
    end

    # Get producer email
    producer_email = organization.email || organization.user&.email || "team@voxxypresents.com"

    subject = "Waitlist update - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{greeting_name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Your payment for <strong>#{event.title}</strong> was not received by the deadline.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Your spot has been moved to the waitlist. If a spot becomes available and you would still like to participate, we will contact you.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you believe this is an error, please contact us at #{producer_email}.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Best regards,<br/>
        #{organization.name || "Event Organizer"}
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="font-size: 12px; color: #888888;">
        Questions? Reply to this email or contact team@voxxypresents.com directly.
      </p>
    HTML

    email_html = build_presents_email_template(
      "Waitlist Update",
      content,
      nil,
      nil,
      organization
    )

    headers = {
      "X-Entity-Ref-ID" => "registration-#{registration.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "application-waitlist"]}'
    }

    send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

    Rails.logger.info "Waitlist notification sent successfully to #{registration.email}"
  end

  # Send payment confirmation
  def self.send_payment_confirmation(registration)
    event = registration.event
    organization = event.organization

    # Get greeting name (businessName preferred, fallback to firstName)
    greeting_name = if registration.business_name.present?
      registration.business_name
    else
      registration.name.to_s.split(" ").first || registration.name
    end

    # Get producer email
    producer_email = organization.email || organization.user&.email || "team@voxxypresents.com"

    # Format event date and location
    event_date = event.event_date.present? ? event.event_date.strftime("%B %d, %Y") : "TBD"
    location = [ event.venue, event.location ].compact.join(", ")
    location = "TBD" if location.blank?

    # Build event portal link using token-based URL
    portal = event.event_portal || event.create_event_portal!
    dashboard_link = portal.portal_url

    subject = "Payment confirmed - #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{greeting_name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Your payment for <strong>#{event.title}</strong> has been confirmed. You're all set.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Category:</strong> #{registration.vendor_category}<br/>
        <strong>Event Date:</strong> #{event_date}<br/>
        <strong>Location:</strong> #{location}
      </p>

      <p style="#{BASE_STYLES[:text]}">
        View all event details on your dashboard:<br/>
        <a href="#{dashboard_link}" style="color: #0066cc; text-decoration: underline;">#{dashboard_link}</a>
      </p>

      <p style="#{BASE_STYLES[:text]}">
        See you at the event.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        #{organization.name || "Event Organizer"}
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="font-size: 12px; color: #888888;">
        Questions? Reply to this email or contact team@voxxypresents.com directly.
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

    send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

    Rails.logger.info "Payment confirmation sent successfully to #{registration.email}"
  end

  # Send category change notification
  def self.send_category_change_notification(registration, new_category_price = nil)
    event = registration.event
    organization = event.organization

    # Get greeting name (businessName preferred, fallback to firstName)
    greeting_name = if registration.business_name.present?
      registration.business_name
    else
      registration.name.to_s.split(" ").first || registration.name
    end

    # Get producer email
    producer_email = organization.email || organization.user&.email || "team@voxxypresents.com"

    # Build event portal link using token-based URL
    portal = event.event_portal || event.create_event_portal!
    dashboard_link = portal.portal_url

    subject = "Category update for #{event.title}"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{greeting_name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We've made a change to your category for <strong>#{event.title}</strong>.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>New Category:</strong> #{registration.vendor_category}
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Please review the update on your event portal:<br/>
        <a href="#{dashboard_link}" style="color: #0066cc; text-decoration: underline;">#{dashboard_link}</a>
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you have any questions, contact us at #{producer_email}.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thanks,<br/>
        #{organization.name || "Event Organizer"}
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="font-size: 12px; color: #888888;">
        Questions? Reply to this email or contact team@voxxypresents.com directly.
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

    send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

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

        send_email(
          registration.email,
          subject,
          email_html,
          headers,
          from_name: organization.name,
          reply_to_email: organization.reply_to_email,
          reply_to_name: organization.reply_to_name
        )
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

        send_email(
          registration.email,
          subject,
          email_html,
          headers,
          from_name: organization.name,
          reply_to_email: organization.reply_to_email,
          reply_to_name: organization.reply_to_name
        )
        sent_count += 1
      rescue StandardError => e
        Rails.logger.error "Failed to send event cancellation to #{registration.email}: #{e.message}"
        failed_count += 1
      end
    end

    Rails.logger.info "Event cancellation sent to #{sent_count} recipients (#{failed_count} failed)"
    { sent: sent_count, failed: failed_count }
  end

  # Artist Application Received Template (Updated)
  def self.artist_application_received_template
    <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi [firstName],
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We've received your application for the [organizationName] at [eventLocation]. Please allow up to 10 days for our team to review your submission.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>IMPORTANT:</strong> This is NOT an acceptance email. You will receive a follow-up email and text message with further instructions if you're selected.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        In the meantime, check out the "FAQs" in our Instagram Story Highlights (@pancakesandbooze) for a look at how our events work.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="#{BASE_STYLES[:text]}"><strong>Exhibition Pricing</strong></p>

      <p style="#{BASE_STYLES[:text]}">
        We now cover all ticketing and processing fees—the price you see below is exactly what you pay at checkout.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Exhibition Rates:</strong><br/>
        <strong>Early Rate:</strong> $20 for your first two pieces (if paid by [paymentDueDate]).<br/>
        <strong>Late Rate:</strong> $25 for your first two pieces (if paid after [paymentDueDate]).<br/>
        <strong>Additional Work:</strong> All additional pieces (3–10) follow the same $20 or $25 rate based on your payment date.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="#{BASE_STYLES[:text]}"><strong>The Details:</strong></p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>NO COMMISSION:</strong> You manage your own sales and keep 100% of the profit.<br/>
        <strong>SIZE LIMIT:</strong> Each piece should not exceed 3ft x 3ft.<br/>
        <strong>NO TABLES:</strong> Tables are not allowed in the gallery space. Small bins or boxes on the floor are permitted for prints.<br/>
        <strong>LOAD OUT:</strong> All artwork must be taken home at the end of the night. Pancakes & Booze nor the [eventVenue] are responsible for any artwork left at the venue.<br/>
        <strong>AGE POLICY:</strong> The venue enforces a strict [ageRestriction] age policy.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Attention Live Painters:</strong> We love featuring live body painting and canvas work. If you'd like to paint live, let us know and we will get you details.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="#{BASE_STYLES[:text]}">
        Thanks,<br/>
        [organizationName]
      </p>

      <p style="font-size: 12px; color: #888888;">
        If you're unable to participate, please <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">click here</a> to withdraw your application.
      </p>
    HTML
  end

  # Vendor Table Application Received Template (Updated)
  def self.vendor_table_application_received_template
    <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi [firstName],
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We've received your application for the [organizationName] at [eventLocation]. Please allow up to 10 days for our team to review your submission.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>IMPORTANT:</strong> This is NOT an acceptance email. You will receive another email and text message with further information if your application is approved.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>PLEASE NOTE:</strong> Vendor tables are strictly for non-hangable merchandise (clothing, jewelry, etc). If you intend to display paintings or wall art, please note that we do not permit canvases or prints larger than a greeting card on vendor tables. If you need to switch to an Artist Application, please email us as soon as possible.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="#{BASE_STYLES[:text]}"><strong>Selection & Pricing</strong></p>

      <p style="#{BASE_STYLES[:text]}">
        Table space is extremely limited. If you are selected, <strong>PREPAYMENT IS REQUIRED</strong> to reserve your space.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We now cover all ticketing and processing fees—the price you see is exactly what you pay at checkout with no hidden service fees.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="#{BASE_STYLES[:text]}"><strong>The Details:</strong></p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>SPACE:</strong> One 6ft table area. No tents or multiple tables allowed.<br/>
        <strong>EQUIPMENT:</strong> You must provide your own table and chair.<br/>
        <strong>AGE POLICY:</strong> The venue enforces a strict [ageRestriction] age policy.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        New to the event? Check us out @pancakesandbooze on Instagram and TikTok.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="#{BASE_STYLES[:text]}">
        Thanks,<br/>
        [organizationName]
      </p>

      <p style="font-size: 12px; color: #888888;">
        If you're unable to participate, please <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">click here</a> to withdraw your application.
      </p>
    HTML
  end

  # Generic fallback template for other categories
  def self.generic_application_received_template
    <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi [firstName],
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thanks for submitting your application to participate in <strong>[eventName]</strong> at <strong>[eventVenue]</strong> on <strong>[eventDate]</strong>.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>IMPORTANT:</strong> This is NOT an acceptance email. Please allow up to 10 days for us to review your submission. You will receive another email with further details if you're selected.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="#{BASE_STYLES[:text]}"><strong>PRICING & PAYMENT</strong></p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Note:</strong> If fees are paid after [paymentDueDate], rates may increase. Payment is required to reserve your space.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="#{BASE_STYLES[:text]}"><strong>EVENT DETAILS</strong></p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>AGE POLICY:</strong> The venue enforces a strict [ageRestriction] age policy
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>CATEGORY:</strong> You applied as [vendorCategory]
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="#{BASE_STYLES[:text]}"><strong>IMPORTANT GUIDELINES</strong></p>

      <p style="#{BASE_STYLES[:text]}">
        Please review these requirements for your category:
      </p>

      <p style="#{BASE_STYLES[:text]}">
        • <strong>SIZE & SPACE:</strong> Check your vendor portal for specific dimensions<br/>
        • <strong>EQUIPMENT:</strong> Confirm what you need to bring vs what's provided<br/>
        • <strong>LOAD OUT:</strong> All items must be removed at end of event<br/>
        • <strong>NO COMMISSION:</strong> You keep 100% of your sales
      </p>

      <p style="#{BASE_STYLES[:text]}">
        For complete event information, category-specific rules, and updates, visit your vendor portal:<br/>
        <a href="[dashboardLink]" style="#{BASE_STYLES[:link]}">[dashboardLink]</a>
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="#{BASE_STYLES[:text]}">
        Thanks,<br/>
        [organizationName]
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="font-size: 12px; color: #888888;">
        Questions? Reply to this email or contact team@voxxypresents.com directly.
      </p>

      <p style="font-size: 12px; color: #888888;">
        <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>
    HTML
  end
end
