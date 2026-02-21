# Service to send scheduled email reminders to invited vendor contacts
# Used for application deadline reminder emails that target people who
# were invited but haven't applied yet (not registrations)
class InvitationReminderService
  attr_reader :scheduled_email, :event, :organization

  def initialize(scheduled_email)
    @scheduled_email = scheduled_email
    @event = scheduled_email.event
    @organization = event.organization
  end

  # Send reminder to all invited contacts who haven't applied yet
  def send_to_recipients
    recipients = filter_invitation_recipients

    # CRITICAL: Log recipient count prominently for debugging
    total_invitations = event.event_invitations.count
    filtered_count = recipients.count
    Rails.logger.info("📊 Recipient Count - Total invitations: #{total_invitations}, After filters: #{filtered_count}")

    if recipients.empty?
      warning_msg = "⚠️  ZERO RECIPIENTS for invitation reminder ##{scheduled_email.id} (#{scheduled_email.name})"
      Rails.logger.warn(warning_msg)
      Rails.logger.warn("   Filter criteria: #{scheduled_email.filter_criteria.inspect}")
      Rails.logger.warn("   Total invitations for event: #{total_invitations}")

      # Mark as failed instead of sent when no recipients
      scheduled_email.update(
        status: "failed",
        error_message: "No recipients matched filter criteria. Total invitations: #{total_invitations}"
      )
      return { sent: 0, failed: 0 }
    end

    # Warn if very few recipients (possible filter misconfiguration)
    if filtered_count < 3 && total_invitations > 10
      Rails.logger.warn("⚠️  LOW RECIPIENT COUNT: Only #{filtered_count} recipients from #{total_invitations} total invitations")
      Rails.logger.warn("   Filter criteria: #{scheduled_email.filter_criteria.inspect}")
    end

    sent_count = 0
    failed_count = 0
    last_error = nil

    recipients.each do |event_invitation|
      begin
        send_to_invitation(event_invitation)
        sent_count += 1
      rescue => e
        last_error = e.message
        # Enhanced error logging with full context
        vendor_contact = event_invitation.vendor_contact
        Rails.logger.error("❌ INVITATION REMINDER FAILED")
        Rails.logger.error("   Scheduled Email ID: #{scheduled_email.id}")
        Rails.logger.error("   Event: #{event.title} (ID: #{event.id})")
        Rails.logger.error("   Recipient: #{vendor_contact&.email || 'UNKNOWN'} (Invitation ID: #{event_invitation.id})")
        Rails.logger.error("   Error: #{e.class}: #{e.message}")
        Rails.logger.error("   Backtrace: #{e.backtrace.first(5).join("\n   ")}")
        failed_count += 1
      end
    end

    # Update scheduled email status
    if sent_count > 0
      scheduled_email.update!(
        status: "sent",
        sent_at: Time.current,
        recipient_count: sent_count
      )
      Rails.logger.info("✓ Sent invitation reminder ##{scheduled_email.id} to #{sent_count} contacts (#{failed_count} failed)")
    else
      scheduled_email.update!(
        status: "failed",
        error_message: "Failed to send to all #{failed_count} contacts. Last error: #{last_error}"
      )
      Rails.logger.error("✗ Failed to send invitation reminder ##{scheduled_email.id} - all #{failed_count} contacts failed")
    end

    { sent: sent_count, failed: failed_count }
  end

  private

  # Get invited vendor contacts who haven't applied yet
  def filter_invitation_recipients
    # Get all event invitations
    invitations = event.event_invitations.includes(:vendor_contact)

    # Filter by invitation status if specified
    if scheduled_email.filter_criteria.present? && scheduled_email.filter_criteria["invitation_status"].present?
      statuses = Array(scheduled_email.filter_criteria["invitation_status"])
      invitations = invitations.where(status: statuses)
    end

    # Exclude vendor contacts who already registered/applied
    # Match by email address since registrations don't have vendor_contact_id
    registered_emails = event.registrations.pluck(:email).compact.map(&:downcase)
    invitations = invitations.joins(:vendor_contact).where.not("LOWER(vendor_contacts.email) IN (?)", registered_emails) if registered_emails.any?

    # Exclude unsubscribed contacts
    # Check both old email_unsubscribed field and new EmailUnsubscribe table
    invitations.reject do |invitation|
      vendor_contact = invitation.vendor_contact

      # Check old unsubscribe field
      next true if vendor_contact.respond_to?(:email_unsubscribed?) && vendor_contact.email_unsubscribed?

      # Check new EmailUnsubscribe table
      EmailUnsubscribe.unsubscribed_from_event?(vendor_contact.email, event)
    end
  end

  # Send reminder email to a single invited vendor contact
  def send_to_invitation(event_invitation)
    vendor_contact = event_invitation.vendor_contact

    # Resolve variables in email templates
    resolver = InvitationVariableResolver.new(event, vendor_contact)
    subject = resolver.resolve(scheduled_email.subject_template)
    body = resolver.resolve(scheduled_email.body_template)

    # Send via SendGrid
    response = send_via_sendgrid(
      to_email: vendor_contact.email,
      to_name: vendor_contact.name,
      subject: subject,
      body: body,
      scheduled_email_id: scheduled_email.id,
      event_id: event.id,
      event_invitation_id: event_invitation.id
    )

    # Create delivery tracking record
    create_delivery_record(event_invitation, response)

    Rails.logger.info("✓ Invitation reminder sent to #{vendor_contact.email}")
  end

  def send_via_sendgrid(to_email:, to_name:, subject:, body:, scheduled_email_id:, event_id:, event_invitation_id:)
    mail = SendGrid::Mail.new

    # From address - always use verified sender email with organization branding
    from_email = "noreply@voxxypresents.com"
    from_name = organization.name || "Voxxy Presents"
    mail.from = SendGrid::Email.new(email: from_email, name: from_name)

    # Reply-To address - allows recipients to reply directly to organization
    mail.reply_to = SendGrid::Email.new(
      email: organization.reply_to_email,
      name: organization.reply_to_name
    )

    # Subject
    mail.subject = subject

    # Recipient
    personalization = SendGrid::Personalization.new
    personalization.add_to(SendGrid::Email.new(email: to_email, name: to_name))

    # CRITICAL: Add custom tracking args so webhook can identify this email
    personalization.add_custom_arg(SendGrid::CustomArg.new(
      key: "scheduled_email_id",
      value: scheduled_email_id.to_s
    ))
    personalization.add_custom_arg(SendGrid::CustomArg.new(
      key: "event_id",
      value: event_id.to_s
    ))
    personalization.add_custom_arg(SendGrid::CustomArg.new(
      key: "event_invitation_id",
      value: event_invitation_id.to_s
    ))

    mail.add_personalization(personalization)

    # Email content (HTML)
    mail.add_content(SendGrid::Content.new(
      type: "text/html",
      value: body
    ))

    # Add List-Unsubscribe headers for better deliverability (RFC 8058)
    # Helps prevent spam classification by Gmail/Outlook
    if event_invitation_id
      base_url = Rails.env.production? ? "https://voxxypresents.com" : "http://localhost:3000"
      unsubscribe_url = "#{base_url}/api/v1/unsubscribe?email=#{CGI.escape(to_email)}&event_id=#{event_id}&token=#{event_invitation_id}"

      # List-Unsubscribe header (link-based unsubscribe)
      mail.add_header(SendGrid::Header.new(
        key: "List-Unsubscribe",
        value: "<#{unsubscribe_url}>"
      ))

      # List-Unsubscribe-Post header (one-click unsubscribe for Gmail)
      mail.add_header(SendGrid::Header.new(
        key: "List-Unsubscribe-Post",
        value: "List-Unsubscribe=One-Click"
      ))

      Rails.logger.debug("📧 Added List-Unsubscribe headers for invitation #{to_email}")
    end

    # Send via SendGrid API
    sg = SendGrid::API.new(api_key: ENV["VoxxyKeyAPI"])
    response = sg.client.mail._("send").post(request_body: mail.to_json)

    # Check response
    unless response.status_code.to_i.between?(200, 299)
      error_msg = "SendGrid API error: #{response.status_code} - #{response.body}"
      Rails.logger.error("❌ SENDGRID ERROR")
      Rails.logger.error("   Status Code: #{response.status_code}")
      Rails.logger.error("   Response Body: #{response.body}")
      Rails.logger.error("   Recipient: #{to_email}")
      Rails.logger.error("   Scheduled Email ID: #{scheduled_email_id}")
      Rails.logger.error("   Event Invitation ID: #{event_invitation_id}")
      raise error_msg
    end

    Rails.logger.info("✓ Email sent to #{to_email} (SendGrid status: #{response.status_code})")

    response
  end

  # Create delivery tracking record for invitation reminder
  def create_delivery_record(event_invitation, response)
    # Extract SendGrid message ID from response headers
    message_id = response.headers["x-message-id"]
    message_id = message_id.first if message_id.is_a?(Array)

    unless message_id
      error_msg = "No X-Message-Id in SendGrid response - cannot track delivery"
      Rails.logger.error("❌ TRACKING ERROR: #{error_msg}")
      # CRITICAL: If we can't track delivery, treat as send failure
      raise ArgumentError, error_msg
    end

    delivery = EmailDelivery.create!(
      scheduled_email: scheduled_email,
      event: event,
      event_invitation: event_invitation,
      registration: nil,  # No registration yet - they're being reminded to apply
      sendgrid_message_id: message_id,
      recipient_email: event_invitation.vendor_contact.email,
      status: "sent",
      sent_at: Time.current
    )

    Rails.logger.info("✓ Delivery record created (ID: #{delivery.id}, Message ID: #{message_id})")
    delivery
  rescue ActiveRecord::RecordInvalid => e
    # CRITICAL: Failed tracking = failed email (cannot verify delivery)
    error_msg = "Failed to create delivery record for invitation: #{e.message}"
    Rails.logger.error("❌ TRACKING ERROR: #{error_msg}")
    Rails.logger.error("   Validation errors: #{e.record.errors.full_messages.join(', ')}")
    raise e # Re-raise to fail the entire send operation
  end
end
