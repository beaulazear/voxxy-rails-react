# Service to send emails via SendGrid with delivery tracking
# Handles variable resolution, tracking ID injection, and delivery record creation

class EmailSenderService
  attr_reader :scheduled_email, :event, :organization

  def initialize(scheduled_email)
    @scheduled_email = scheduled_email
    @event = scheduled_email.event
    @organization = event.organization
  end

  # Send email to all matching recipients
  def send_to_recipients
    filter_service = RecipientFilterService.new(event, scheduled_email.filter_criteria)
    recipients = filter_service.filter_recipients

    # CRITICAL: Log recipient count prominently for debugging
    total_registrations = event.registrations.count
    filtered_count = recipients.count
    Rails.logger.info("📊 Recipient Count - Total registrations: #{total_registrations}, After filters: #{filtered_count}")

    if recipients.empty?
      warning_msg = "⚠️  ZERO RECIPIENTS for scheduled email ##{scheduled_email.id} (#{scheduled_email.name})"
      Rails.logger.warn(warning_msg)
      Rails.logger.warn("   Filter criteria: #{scheduled_email.filter_criteria.inspect}")
      Rails.logger.warn("   Total registrations for event: #{total_registrations}")

      # Mark as failed instead of sent when no recipients
      scheduled_email.update(
        status: "failed",
        error_message: "No recipients matched filter criteria. Total registrations: #{total_registrations}"
      )
      return { sent: 0, failed: 0 }
    end

    # Warn if very few recipients (possible filter misconfiguration)
    if filtered_count < 3 && total_registrations > 10
      Rails.logger.warn("⚠️  LOW RECIPIENT COUNT: Only #{filtered_count} recipients from #{total_registrations} total registrations")
      Rails.logger.warn("   Filter criteria: #{scheduled_email.filter_criteria.inspect}")
    end

    sent_count = 0
    failed_count = 0
    last_error = nil

    recipients.each do |registration|
      begin
        send_to_registration(registration)
        sent_count += 1
      rescue => e
        last_error = e.message
        # Enhanced error logging with full context
        Rails.logger.error("❌ EMAIL SEND FAILED")
        Rails.logger.error("   Scheduled Email ID: #{scheduled_email.id}")
        Rails.logger.error("   Event: #{event.title} (ID: #{event.id})")
        Rails.logger.error("   Recipient: #{registration.email} (Registration ID: #{registration.id})")
        Rails.logger.error("   Error: #{e.class}: #{e.message}")
        Rails.logger.error("   Backtrace: #{e.backtrace.first(5).join("\n   ")}")
        failed_count += 1
      end
    end

    # Update scheduled email status
    # Only mark as "sent" if at least one email was successfully delivered
    if sent_count > 0
      scheduled_email.update!(
        status: "sent",
        sent_at: Time.current,
        recipient_count: sent_count
      )
      Rails.logger.info("✓ Sent scheduled email ##{scheduled_email.id} to #{sent_count} recipients (#{failed_count} failed)")
    else
      # All recipients failed - mark as failed with error message
      scheduled_email.update!(
        status: "failed",
        error_message: "Failed to send to all #{failed_count} recipients. Last error: #{last_error}"
      )
      Rails.logger.error("✗ Failed to send scheduled email ##{scheduled_email.id} - all #{failed_count} recipients failed")
    end

    { sent: sent_count, failed: failed_count }
  end

  # Send email to a single registration
  def send_to_registration(registration)
    # Skip if user unsubscribed
    if registration.email_unsubscribed?
      Rails.logger.info("Skipping unsubscribed user: #{registration.email}")
      return nil
    end

    # Resolve variables
    resolver = EmailVariableResolver.new(event, registration)
    subject = resolver.resolve(scheduled_email.subject_template)
    body = resolver.resolve(scheduled_email.body_template)

    # Send via SendGrid
    response = send_via_sendgrid(
      to_email: registration.email,
      to_name: registration.name,
      subject: subject,
      body: body,
      scheduled_email_id: scheduled_email.id,
      event_id: event.id,
      registration_id: registration.id
    )

    # Create delivery tracking record
    create_delivery_record(registration, response)

    response
  end

  # Retry a previously failed delivery
  def self.retry_delivery(delivery)
    service = new(delivery.scheduled_email)
    service.send_to_registration(delivery.registration)
  end

  private

  def send_via_sendgrid(to_email:, to_name:, subject:, body:, scheduled_email_id:, event_id:, registration_id:)
    mail = SendGrid::Mail.new

    # From address - always use verified sender email with organization branding
    from_email = "noreply@voxxypresents.com"
    from_name = organization.name || "Voxxy Presents"
    mail.from = SendGrid::Email.new(email: from_email, name: from_name)

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
      key: "registration_id",
      value: registration_id.to_s
    ))

    mail.add_personalization(personalization)

    # Email content (HTML)
    mail.add_content(SendGrid::Content.new(
      type: "text/html",
      value: body
    ))

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
      raise error_msg
    end

    Rails.logger.info("✓ Email sent to #{to_email} (SendGrid status: #{response.status_code})")

    response
  end

  def create_delivery_record(registration, response)
    # Extract SendGrid message ID from response headers
    # Note: Net::HTTP stores all header keys in lowercase
    message_id = response.headers["x-message-id"]
    # Net::HTTP stores header values as arrays, extract first element
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
      registration: registration,
      sendgrid_message_id: message_id,
      recipient_email: registration.email,
      status: "sent",
      sent_at: Time.current
    )

    Rails.logger.info("✓ Delivery record created (ID: #{delivery.id}, Message ID: #{message_id})")
    delivery
  rescue ActiveRecord::RecordInvalid => e
    # CRITICAL: Failed tracking = failed email (cannot verify delivery)
    error_msg = "Failed to create delivery record: #{e.message}"
    Rails.logger.error("❌ TRACKING ERROR: #{error_msg}")
    Rails.logger.error("   Validation errors: #{e.record.errors.full_messages.join(', ')}")
    raise e # Re-raise to fail the entire send operation
  end
end
