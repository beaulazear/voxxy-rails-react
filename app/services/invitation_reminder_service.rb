# Service to send scheduled email reminders to invited vendor contacts
# Used for application deadline reminder emails that target people who
# were invited but haven't applied yet (not registrations)
class InvitationReminderService < BaseEmailService
  attr_reader :scheduled_email, :event, :organization

  def initialize(scheduled_email)
    @scheduled_email = scheduled_email
    @event = scheduled_email.event
    @organization = event.organization
  end

  # Send reminder to all invited contacts who haven't applied yet
  def send_to_recipients
    recipients = filter_invitation_recipients

    if recipients.empty?
      Rails.logger.info("No invited contacts to remind for scheduled email ##{scheduled_email.id}")
      return { sent: 0, failed: 0 }
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
        Rails.logger.error("Failed to send reminder to #{event_invitation.vendor_contact.email}: #{e.message}")
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
    registered_contact_ids = event.registrations.where.not(vendor_contact_id: nil).pluck(:vendor_contact_id)
    invitations = invitations.where.not(vendor_contact_id: registered_contact_ids)

    # Exclude unsubscribed contacts
    # Check both old email_unsubscribed field and new EmailUnsubscribe table
    invitations.reject do |invitation|
      vendor_contact = invitation.vendor_contact

      # Check old unsubscribe field
      next true if vendor_contact.respond_to?(:email_unsubscribed?) && vendor_contact.email_unsubscribed?

      # Check new EmailUnsubscribe table
      EmailUnsubscribe.unsubscribed?(
        email: vendor_contact.email,
        event: event,
        organization: organization
      )
    end
  end

  # Send reminder email to a single invited vendor contact
  def send_to_invitation(event_invitation)
    vendor_contact = event_invitation.vendor_contact

    # Resolve variables in email templates
    resolver = InvitationVariableResolver.new(event, vendor_contact)
    subject = resolver.resolve(scheduled_email.subject_template)
    body = resolver.resolve(scheduled_email.body_template)

    # Send email
    send_email(
      vendor_contact.email,
      subject,
      body,
      {
        "X-Entity-Ref-ID" => "invitation-reminder-#{event_invitation.id}",
        "X-SMTPAPI" => { category: [ "scheduled", "invitation-reminder" ] }.to_json
      },
      from_name: organization.name
    )

    # Create delivery tracking record
    create_delivery_record(event_invitation)

    Rails.logger.info("✓ Invitation reminder sent to #{vendor_contact.email}")
  end

  # Create delivery tracking record for invitation reminder
  def create_delivery_record(event_invitation)
    EmailDelivery.create!(
      scheduled_email: scheduled_email,
      event: event,
      event_invitation: event_invitation,
      registration: nil,  # No registration yet - they're being reminded to apply
      sendgrid_message_id: "pending-#{SecureRandom.hex(8)}",  # Will be updated by webhook
      recipient_email: event_invitation.vendor_contact.email,
      status: "sent",
      sent_at: Time.current
    )
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error("Failed to create delivery record for invitation: #{e.message}")
  end
end
