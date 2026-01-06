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

    if recipients.empty?
      Rails.logger.info("No recipients match filter criteria for scheduled email ##{scheduled_email.id}")
      return { sent: 0, failed: 0 }
    end

    sent_count = 0
    failed_count = 0

    recipients.each do |registration|
      begin
        send_to_registration(registration)
        sent_count += 1
      rescue => e
        Rails.logger.error("Failed to send email to #{registration.email}: #{e.message}")
        failed_count += 1
      end
    end

    # Update scheduled email status
    scheduled_email.update!(
      status: "sent",
      sent_at: Time.current,
      recipient_count: sent_count
    )

    Rails.logger.info("✓ Sent scheduled email ##{scheduled_email.id} to #{sent_count} recipients (#{failed_count} failed)")

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

    # From address
    from_email = organization.email || ENV["SENDER_EMAIL"] || "team@voxxypresents.com"
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
      raise "SendGrid API error: #{response.status_code} - #{response.body}"
    end

    Rails.logger.info("✓ Email sent to #{to_email} (SendGrid status: #{response.status_code})")

    response
  end

  def create_delivery_record(registration, response)
    # Extract SendGrid message ID from response headers
    message_id = response.headers["X-Message-Id"]

    unless message_id
      Rails.logger.warn("No X-Message-Id in SendGrid response - delivery tracking may fail")
      message_id = "unknown-#{SecureRandom.hex(8)}"
    end

    EmailDelivery.create!(
      scheduled_email: scheduled_email,
      event: event,
      registration: registration,
      sendgrid_message_id: message_id,
      recipient_email: registration.email,
      status: "sent",
      sent_at: Time.current
    )
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error("Failed to create delivery record: #{e.message}")
  end
end
