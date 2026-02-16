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
        #{registration.instagram_handle.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #333333;'><strong>Instagram:</strong> <a href='https://www.instagram.com/#{registration.instagram_handle.delete_prefix('@')}' style='#{BASE_STYLES[:link]}'>@#{registration.instagram_handle.delete_prefix('@')}</a></p>" : ""}
        #{registration.tiktok_handle.present? ? "<p style='margin: 5px 0; font-size: 14px; color: #333333;'><strong>TikTok:</strong> <a href='https://www.tiktok.com/@#{registration.tiktok_handle.delete_prefix('@')}' style='#{BASE_STYLES[:link]}'>@#{registration.tiktok_handle.delete_prefix('@')}</a></p>" : ""}
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

    response = send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

    # Create EmailDelivery record to track this notification
    create_notification_delivery_record(registration, response, "application_received", subject)

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

    subject = "You're in - #{event.title}"

    # Use EmailVariableResolver to resolve all template variables
    resolver = EmailVariableResolver.new(event, registration)

    # Determine which template to use based on category name
    category_name = registration.vendor_category.to_s.downcase

    if category_name.include?("artist") || category_name.include?("gallery")
      content_template = artist_application_accepted_template
    elsif category_name.include?("vendor") || category_name.include?("table")
      content_template = vendor_table_application_accepted_template
    else
      # Fallback to generic template
      content_template = generic_application_accepted_template
    end

    # Resolve all variables in the template
    content = resolver.resolve(content_template)

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

    response = send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

    # Create EmailDelivery record to track this notification
    create_notification_delivery_record(registration, response, "approval", subject)

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

    response = send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

    # Create EmailDelivery record to track this notification
    create_notification_delivery_record(registration, response, "rejection", subject)

    Rails.logger.info "Rejection email sent successfully to #{registration.email}"
  end

  # Send waitlist notification
  def self.send_waitlist_notification(registration)
    event = registration.event
    organization = event.organization

    subject = "Waitlist - #{event.title}"

    # Use EmailVariableResolver to resolve all template variables
    resolver = EmailVariableResolver.new(event, registration)
    content = resolver.resolve(waitlist_template)

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

    response = send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

    # Create EmailDelivery record to track this notification
    create_notification_delivery_record(registration, response, "waitlist", subject)

    Rails.logger.info "Waitlist notification sent successfully to #{registration.email}"
  end

  # Send payment confirmation
  def self.send_payment_confirmation(registration)
    event = registration.event
    organization = event.organization

    subject = "Payment confirmed - #{event.title}"

    # Use EmailVariableResolver to resolve all template variables
    resolver = EmailVariableResolver.new(event, registration)
    content = resolver.resolve(payment_confirmed_template)

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

    response = send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

    # Create EmailDelivery record to track this notification
    create_notification_delivery_record(registration, response, "payment_confirmation", subject)

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

    response = send_email(
      registration.email,
      subject,
      email_html,
      headers,
      from_name: organization.name,
      reply_to_email: organization.reply_to_email,
      reply_to_name: organization.reply_to_name
    )

    # Create EmailDelivery record to track this notification
    create_notification_delivery_record(registration, response, "category_change", subject)

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

        response = send_email(
          registration.email,
          subject,
          email_html,
          headers,
          from_name: organization.name,
          reply_to_email: organization.reply_to_email,
          reply_to_name: organization.reply_to_name
        )

        # Create EmailDelivery record to track this notification
        create_notification_delivery_record(registration, response, "event_details_changed", subject)

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

        response = send_email(
          registration.email,
          subject,
          email_html,
          headers,
          from_name: organization.name,
          reply_to_email: organization.reply_to_email,
          reply_to_name: organization.reply_to_name
        )

        # Create EmailDelivery record to track this notification
        create_notification_delivery_record(registration, response, "event_canceled", subject)

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
        Hi [greetingName],
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thanks for submitting your application to participate in The [eventName] at [eventVenue] on [dateRange]. Please allow up to 10 days for us to review your submission and get back to you.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        In the meantime, please visit our Instagram page (@pancakesandbooze) and check out the "FAQs" in our Story Highlights for details on how our events work.
      </p>

      <h3 style="font-size: 0.95rem; font-weight: 600; margin: 1.25rem 0 0.6rem 0;">Exhibition Pricing Update</h3>

      <p style="#{BASE_STYLES[:text]}">
        We've updated our exhibition structure for 2026. We are now offering <strong>one free piece</strong> after your first paid exhibition space. And to keep our pricing transparent, <strong>we are now covering all ticketing and processing fees</strong>—the price you see below is exactly what you pay at checkout with no hidden service fees.
      </p>

      <h4 style="font-size: 0.9rem; font-weight: 600; margin: 1rem 0 0.4rem 0;">The Rate:</h4>

      <ul style="margin: 0.6rem 0; padding-left: 1.25rem;">
        <li style="margin-bottom: 0.4rem;"><strong>1st Piece:</strong> [boothPrice]</li>
        <li style="margin-bottom: 0.4rem;"><strong>2nd Piece:</strong> <strong>FREE</strong></li>
        <li style="margin-bottom: 0.4rem;"><strong>Pieces 3-10:</strong> [boothPrice] each</li>
        <li style="margin-bottom: 0.4rem;"><em>Note: If fees are paid after [paymentDueDate], the rate increases to $25 per piece (2nd piece remains free).</em></li>
      </ul>

      <h4 style="font-size: 0.9rem; font-weight: 600; margin: 1rem 0 0.4rem 0;">The Details:</h4>

      <ul style="margin: 0.6rem 0; padding-left: 1.25rem;">
        <li style="margin-bottom: 0.4rem;"><strong>NO COMMISSION:</strong> You manage your own sales and take 100% of what you sell.</li>
        <li style="margin-bottom: 0.4rem;"><strong>SIZE LIMIT:</strong> Each piece should not exceed 3ft x 3ft.</li>
        <li style="margin-bottom: 0.4rem;"><strong>INSTALLATION:</strong> Currently scheduled for [installDate] from [installTime].</li>
        <li style="margin-bottom: 0.4rem;"><strong>NO TABLES:</strong> Artists hanging artwork cannot use tables. Small bins/boxes on the floor are permitted.</li>
        <li style="margin-bottom: 0.4rem;"><strong>LOAD OUT:</strong> All artwork must be taken home at the end of the night. We are not responsible for items left behind.</li>
        <li style="margin-bottom: 0.4rem;"><strong>AGE POLICY:</strong> The venue enforces a strict [ageRestriction] age policy.</li>
      </ul>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Attention Live Painters:</strong> We love featuring live body painting and canvas work. If you'd like to paint live, let us know so we can coordinate promotion on our socials.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thanks,<br/>
        [organizationName]
      </p>

      <p style="font-size: 12px; color: #888888;">
        <em>If you're unable to participate, please <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">click here</a> to let us know.</em>
      </p>
    HTML
  end

  # Vendor Table Application Received Template (Updated)
  def self.vendor_table_application_received_template
    <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi [greetingName],
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We've received your request to set up a VENDOR TABLE at The [eventName] on [dateRange] at [eventVenue]. This is <strong>NOT</strong> an acceptance email. You will receive another email and text message with further information if you're selected.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>IMPORTANT:</strong> Vendor tables are strictly for non-hangable merchandise (clothing, jewelry, etc). If you have paintings or wall art, you have filled out the <strong>WRONG application</strong>. We do not permit canvas paintings, drawings, or prints larger than a greeting card on vendor tables. If this is you, please email us immediately so we can get you the correct artist information.
      </p>

      <h3 style="font-size: 0.95rem; font-weight: 600; margin: 1.25rem 0 0.6rem 0;">Selection & Pricing</h3>

      <p style="#{BASE_STYLES[:text]}">
        Table space is extremely limited and in high demand. If you are selected, <strong>PREPAYMENT IS REQUIRED</strong> to reserve your space. Your spot is only guaranteed once payment is received.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        The vending fee is <strong>[boothPrice]</strong>. To keep our pricing transparent, <strong>we now cover all ticketing and processing fees</strong>—the price you see is exactly what you pay at checkout with no hidden service fees.
      </p>

      <h4 style="font-size: 0.9rem; font-weight: 600; margin: 1rem 0 0.4rem 0;">The Details:</h4>

      <ul style="margin: 0.6rem 0; padding-left: 1.25rem;">
        <li style="margin-bottom: 0.4rem;"><strong>SPACE:</strong> Large enough for ONE 6ft table. No tents or multiple tables allowed.</li>
        <li style="margin-bottom: 0.4rem;"><strong>EQUIPMENT:</strong> You must provide your own table and chair. We do not provide them.</li>
        <li style="margin-bottom: 0.4rem;"><strong>LOAD-IN:</strong> Starts at [installTime] on the day of the show. Please do not arrive early.</li>
        <li style="margin-bottom: 0.4rem;"><strong>AGE POLICY:</strong> The venue enforces a strict [ageRestriction] age policy.</li>
      </ul>

      <p style="#{BASE_STYLES[:text]}">
        New to the event? Check us out @pancakesandbooze on Instagram and TikTok for a look at the vibe.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thanks,<br/>
        [organizationName]
      </p>

      <p style="font-size: 12px; color: #888888;">
        <em>If you're unable to participate, please <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">click here</a> to let us know.</em>
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

  # Artist Application Accepted Template
  def self.artist_application_accepted_template
    <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi [greetingName],
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Congratulations!</strong> You've been invited to exhibit at <strong>The [eventName]</strong> on [dateRange] at [eventVenue].
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We received a high volume of applications, and we're excited to have your work in the mix. Please note that <strong>we do not hold spots</strong>; your space is only officially secured once your exhibition fees are received.
      </p>

      <h3 style="font-size: 0.95rem; font-weight: 600; margin: 1.25rem 0 0.6rem 0;">Step 1: Secure Your Space</h3>

      <p style="#{BASE_STYLES[:text]}">
        <a href="[categoryPaymentLink]" style="#{BASE_STYLES[:link]}">PAYMENT LINK: CONFIRM YOUR EXHIBIT HERE</a>
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Exhibition Rates (No Hidden Fees):</strong><br/>
        - 1st Piece: <strong>[boothPrice]</strong><br/>
        - 2nd Piece: <strong>FREE</strong><br/>
        - Pieces 3-10: <strong>[boothPrice] each</strong><br/>
        - <em>Note: Prices increase to $25/piece after [paymentDueDate].</em>
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Cancellation Policy:</strong> Full refunds are available for cancellations made up to <strong>72 hours before the event</strong>. Cancellations within 72 hours are non-refundable.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <h4 style="font-size: 0.9rem; font-weight: 600; margin: 1rem 0 0.4rem 0;">What Happens Next?</h4>

      <p style="#{BASE_STYLES[:text]}">
        Once your payment is confirmed, keep an eye on your inbox for our <strong>Artist Roadmap</strong> series:
      </p>

      <ul style="margin: 0.6rem 0; padding-left: 1.25rem;">
        <li style="margin-bottom: 0.4rem;"><strong>30 Days Out:</strong> You'll receive a "Prep Guide" detailing our salon-style hanging requirements and hardware tips.</li>
        <li style="margin-bottom: 0.4rem;"><strong>14 Days Out:</strong> We'll launch our marketing blitz and send you the official promo toolkit to help drive sales.</li>
        <li style="margin-bottom: 0.4rem;"><strong>3-6 Days Out:</strong> Final logistics, load-in times, and venue updates will be sent via Eventbrite.</li>
      </ul>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <h4 style="font-size: 0.9rem; font-weight: 600; margin: 1rem 0 0.4rem 0;">Quick Guidelines:</h4>

      <ul style="margin: 0.6rem 0; padding-left: 1.25rem;">
        <li style="margin-bottom: 0.4rem;"><strong>NO COMMISSION:</strong> You keep 100% of your sales.</li>
        <li style="margin-bottom: 0.4rem;"><strong>SIZE LIMIT:</strong> Max 3ft x 3ft per piece. No exceptions.</li>
        <li style="margin-bottom: 0.4rem;"><strong>NO TABLES:</strong> Tables are for vendors only. Artists may use small floor bins for prints.</li>
        <li style="margin-bottom: 0.4rem;"><strong>AGE POLICY:</strong> Strict [ageRestriction] policy.</li>
      </ul>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Online Marketplace:</strong> P&B Artists can sell year-round at <a href="https://district.net/pancakesandbooze" style="#{BASE_STYLES[:link]}">district.net/pancakesandbooze</a>.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thanks,<br/>
        [organizationName]
      </p>

      <p style="font-size: 12px; color: #888888;">
        <em>Plans changed? <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">Click here</a> to release your space to the next artist on our waitlist.</em>
      </p>
    HTML
  end

  # Vendor Table Application Accepted Template
  def self.vendor_table_application_accepted_template
    <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi [greetingName],
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Congratulations!</strong> You've been approved to vend at <strong>The [eventName]</strong> on [dateRange] at [eventVenue].
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We received a high volume of applications for this show, and we're excited to have your brand in the mix. Because vendor space is extremely limited, <strong>we do not hold spots.</strong> Your space is only officially reserved once payment is completed through the link below.
      </p>

      <h3 style="font-size: 0.95rem; font-weight: 600; margin: 1.25rem 0 0.6rem 0;">Step 1: Secure Your Space</h3>

      <p style="#{BASE_STYLES[:text]}">
        The vending fee is <strong>[boothPrice]</strong>. To keep our pricing transparent, <strong>we now cover all ticketing and processing fees</strong>—the price you see is exactly what you pay at checkout.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <a href="[categoryPaymentLink]" style="#{BASE_STYLES[:link]}">PAYMENT LINK: SECURE YOUR TABLE HERE</a>
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Cancellation Policy:</strong> We understand that life happens. We offer full refunds for cancellations made up to <strong>72 hours before the event</strong>. This allows us time to offer the space to a vendor on our waitlist. Cancellations made within 72 hours of the show are non-refundable.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <h4 style="font-size: 0.9rem; font-weight: 600; margin: 1rem 0 0.4rem 0;">Step 2: Spread the Word</h4>

      <p style="#{BASE_STYLES[:text]}">
        The most successful shows happen when we all hustle together. Tag <strong>@pancakesandbooze</strong> and use <strong>#pancakesandbooze</strong> in your posts so we can find and feature your work leading up to the event.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <h4 style="font-size: 0.9rem; font-weight: 600; margin: 1rem 0 0.4rem 0;">Event Day Details:</h4>

      <ul style="margin: 0.6rem 0; padding-left: 1.25rem;">
        <li style="margin-bottom: 0.4rem;"><strong>Location:</strong> [eventVenue] — [eventLocation]</li>
        <li style="margin-bottom: 0.4rem;"><strong>Load-In:</strong> [installDate] at [installTime]. (The venue will not be open for setup prior to this time).</li>
        <li style="margin-bottom: 0.4rem;"><strong>Setup:</strong> You are allowed ONE 6ft table. You must provide your own table and chair. Grid walls and racks are permitted if they fit within your approx. 8ft x 5ft footprint.</li>
        <li style="margin-bottom: 0.4rem;"><strong>Staffing:</strong> Your space includes entry for one person (you). All assistants or guests must purchase a general admission ticket.</li>
        <li style="margin-bottom: 0.4rem;"><strong>Load-Out:</strong> Must be completed by the end of the event. We are not responsible for items left behind.</li>
        <li style="margin-bottom: 0.4rem;"><strong>Merchandise:</strong> Strictly non-hangable items only. No wall art/paintings permitted at vendor tables.</li>
        <li style="margin-bottom: 0.4rem;"><strong>Age Policy:</strong> You must be [ageRestriction] to participate.</li>
      </ul>

      <p style="#{BASE_STYLES[:text]}">
        If you have any questions, feel free to reply to this email.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thanks,<br/>
        [organizationName]
      </p>

      <p style="font-size: 12px; color: #888888;">
        <em>If your plans have changed and you can no longer participate, please <a href="[unsubscribeLink]" style="color: #888888; text-decoration: underline;">click here</a> to release your spot to the next person on our waitlist.</em>
      </p>
    HTML
  end

  # Generic Application Accepted Template
  def self.generic_application_accepted_template
    <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi [greetingName],
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Great news - your application to <strong>[eventName]</strong> has been approved!
      </p>

      <p style="#{BASE_STYLES[:text]}">
        You can now access your event portal to view event details, your category information, load-in times, and payment instructions:<br/>
        <a href="[dashboardLink]" style="#{BASE_STYLES[:link]}">[dashboardLink]</a>
      </p>

      <p style="#{BASE_STYLES[:text]}">
        To sign in, use the email address you applied with: [email]
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Once you've completed payment, you'll be fully confirmed for the event. If you have any questions, contact us at [organizationEmail].
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We're excited to have you!
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Best,<br/>
        [organizationName]
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>

      <p style="font-size: 12px; color: #888888;">
        Questions? Reply to this email or contact team@voxxypresents.com directly.
      </p>
    HTML
  end

  # Waitlist Template
  def self.waitlist_template
    <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi [greetingName],
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Thank you for your interest in [eventName].
      </p>

      <p style="#{BASE_STYLES[:text]}">
        After careful review, we've placed you on the waitlist. If a spot opens up, we'll contact you right away.
      </p>

      <ul style="margin: 0.6rem 0; padding-left: 1.25rem;">
        <li style="margin-bottom: 0.4rem;"><strong>Event:</strong> [eventDate]</li>
        <li style="margin-bottom: 0.4rem;"><strong>Location:</strong> [eventLocation]</li>
      </ul>

      <p style="#{BASE_STYLES[:text]}">
        We truly appreciate your interest and encourage you to stay tuned for updates.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Best,<br/>
        [organizationName]
      </p>
    HTML
  end

  # Payment Confirmed Template
  def self.payment_confirmed_template
    <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi [greetingName],
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We've received your payment—you're officially confirmed for The [eventName] at [eventVenue] on [eventDate]!
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We're pumped to have you with us.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>Your Entry Ticket:</strong> You should have already received a confirmation email from Eventbrite. That email includes your QR code, which we'll scan when you arrive to install your work. You can bring it on your phone, print it out, or we can look you up by name—the QR code is just the fastest option for check-in.
      </p>

      <h4 style="font-size: 0.9rem; font-weight: 600; margin: 1rem 0 0.4rem 0;">What Happens Next?</h4>

      <ul style="margin: 0.6rem 0; padding-left: 1.25rem;">
        <li style="margin-bottom: 0.4rem;"><strong>Confirmation:</strong> You are all set for now! You don't need to send us anything else today.</li>
        <li style="margin-bottom: 0.4rem;"><strong>Deep Details:</strong> Over the next couple of weeks, you'll receive the "Deep Detail" emails covering setup times, parking, wall assignments, and exactly what to expect on show day.</li>
        <li style="margin-bottom: 0.4rem;"><strong>Promotion:</strong> We are pushing the show hard on socials. Tag @pancakesandbooze in your process shots or finished pieces so we can repost your work to our followers.</li>
      </ul>

      <p style="#{BASE_STYLES[:text]}">
        Thanks again for being a part of the show. We'll be in touch soon with the logistics!
      </p>

      <p style="#{BASE_STYLES[:text]}">
        [organizationName]
      </p>
    HTML
  end

  private

  # Helper method to create EmailDelivery record for system notification emails
  def self.create_notification_delivery_record(registration, response, notification_type, subject)
    return unless registration && response

    begin
      # Extract SendGrid message ID from response headers
      # IMPORTANT: SendGrid returns x-message-id as an array, so we need to extract the first element
      message_id = Array(response.headers["x-message-id"]).first

      # If no message ID in headers, generate a temporary one
      # (SendGrid webhooks will update this later when they arrive)
      message_id ||= "notification-#{registration.id}-#{Time.current.to_i}"

      EmailDelivery.create!(
        event: registration.event,
        registration: registration,
        sendgrid_message_id: message_id,
        recipient_email: registration.email,
        subject: subject,
        status: response.status_code.to_i == 202 ? "sent" : "failed",
        email_type: "notification",
        sent_at: Time.current
      )

      Rails.logger.info "✓ Created EmailDelivery record for #{notification_type} notification to #{registration.email} (subject: #{subject}, message_id: #{message_id})"
    rescue StandardError => e
      # Log error but don't fail the email send
      Rails.logger.error "Failed to create EmailDelivery record for #{notification_type}: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
    end
  end
end
