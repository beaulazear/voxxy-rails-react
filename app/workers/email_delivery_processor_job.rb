# Background job to process SendGrid webhook events
# Handles: delivered, bounce, dropped, deferred, unsubscribe

class EmailDeliveryProcessorJob
  include Sidekiq::Job

  sidekiq_options queue: :email_delivery, retry: 3

  def perform(event_data)
    event_type = event_data["event"]
    sg_message_id = extract_message_id(event_data)

    unless sg_message_id
      Rails.logger.warn("No message ID in SendGrid event: #{event_type}")
      return
    end

    # Try to find existing EmailDelivery record
    delivery = EmailDelivery.find_by(sendgrid_message_id: sg_message_id)

    # If not found and this is an invitation, create delivery record on-the-fly
    # Note: SendGrid flattens custom args to top level of webhook payload
    if delivery.nil? && event_data["event_invitation_id"].present?
      Rails.logger.info("Creating delivery record for invitation email (message: #{sg_message_id})")
      delivery = create_invitation_delivery(event_data, sg_message_id)
    end

    unless delivery
      Rails.logger.info("No delivery record found for SendGrid message: #{sg_message_id}")
      return
    end

    Rails.logger.info("Processing #{event_type} event for delivery ##{delivery.id}")

    case event_type
    when "delivered"
      handle_delivered(delivery, event_data)
    when "bounce"
      handle_bounce(delivery, event_data)
    when "dropped"
      handle_dropped(delivery, event_data)
    when "deferred"
      handle_deferred(delivery, event_data)
    when "unsubscribe", "spamreport"
      handle_unsubscribe(delivery, event_data)
    else
      Rails.logger.info("Unknown event type: #{event_type}")
    end
  end

  private

  def extract_message_id(event)
    # SendGrid sends message ID in different formats depending on event type
    event["sg_message_id"] || event["smtp-id"]&.gsub(/[<>]/, "")
  end

  def handle_delivered(delivery, event)
    delivery.update!(
      status: "delivered",
      delivered_at: Time.at(event["timestamp"].to_i)
    )

    Rails.logger.info("✓ Email delivered to #{delivery.recipient_email}")
  end

  def handle_bounce(delivery, event)
    # Determine bounce type (hard or soft)
    bounce_type = determine_bounce_type(event)

    delivery.update!(
      status: "bounced",
      bounce_type: bounce_type,
      bounce_reason: event["reason"],
      bounced_at: Time.at(event["timestamp"].to_i)
    )

    Rails.logger.warn("✗ Email bounced (#{bounce_type}): #{delivery.recipient_email} - #{event['reason']}")

    # Schedule retry for soft bounces
    schedule_retry(delivery) if delivery.retryable?
  end

  def handle_dropped(delivery, event)
    delivery.update!(
      status: "dropped",
      drop_reason: event["reason"],
      dropped_at: Time.current
    )

    Rails.logger.warn("⊘ Email dropped: #{delivery.recipient_email} - #{event['reason']}")
  end

  def handle_deferred(delivery, event)
    # Deferred means temporary failure (e.g., recipient's server is down)
    # Don't update status, just log it
    Rails.logger.info("⏳ Email deferred: #{delivery.recipient_email} - #{event['reason']}")
  end

  def handle_unsubscribe(delivery, event)
    delivery.update!(
      status: "unsubscribed",
      unsubscribed_at: Time.current
    )

    # Mark registration as globally unsubscribed (old system - backwards compatibility)
    if delivery.registration
      delivery.registration.update(email_unsubscribed: true)
    end

    # Create global unsubscribe record (new system)
    # This allows them to re-subscribe through user preferences later if desired
    begin
      EmailUnsubscribe.create_or_find_unsubscribe(
        email: delivery.recipient_email,
        scope: 'global',
        source: 'sendgrid_webhook'
      )
      Rails.logger.info("⊗ User globally unsubscribed via SendGrid: #{delivery.recipient_email}")
    rescue => e
      Rails.logger.error("Failed to create global unsubscribe record: #{e.message}")
    end
  end

  def determine_bounce_type(event)
    # Hard bounce: permanent failure (invalid email, domain doesn't exist)
    # Soft bounce: temporary failure (mailbox full, server down)

    classification = event["bounce_classification"] || event["type"]
    reason = event["reason"].to_s.downcase

    # Hard bounce indicators
    if classification == "hard" ||
       reason.include?("does not exist") ||
       reason.include?("invalid") ||
       reason.include?("unknown user") ||
       reason.include?("no such user")
      "hard"
    else
      "soft"
    end
  end

  def schedule_retry(delivery)
    # Don't retry if already at max retries
    return if delivery.retry_count >= delivery.max_retries

    # Exponential backoff: 1 hour, 4 hours, 24 hours
    retry_delays = [ 1.hour, 4.hours, 24.hours ]
    next_delay = retry_delays[delivery.retry_count] || 24.hours

    delivery.update!(
      retry_count: delivery.retry_count + 1,
      next_retry_at: next_delay.from_now
    )

    # Schedule the retry job
    EmailRetryJob.perform_in(next_delay, delivery.id)

    Rails.logger.info("↻ Retry ##{delivery.retry_count} scheduled for #{delivery.next_retry_at}")
  end

  def create_invitation_delivery(event_data, sg_message_id)
    # SendGrid flattens custom args to top level of webhook payload
    event_id = event_data["event_id"]
    invitation_id = event_data["event_invitation_id"]

    return nil unless event_id && invitation_id

    invitation = EventInvitation.find_by(id: invitation_id)
    return nil unless invitation

    # Try to find a related ScheduledEmail for this invitation
    # Event Announcements are sent via EventInvitationMailer but tracked as ScheduledEmails
    scheduled_email = find_scheduled_email_for_invitation(event_id, event_data["timestamp"])

    delivery_params = {
      event_id: event_id,
      event_invitation_id: invitation_id,
      sendgrid_message_id: sg_message_id,
      recipient_email: event_data["email"],
      status: "sent",
      sent_at: Time.at(event_data["timestamp"].to_i)
    }

    # If we found a matching scheduled email, link to it
    # This allows ScheduledEmail.undelivered_count to find these records
    if scheduled_email
      delivery_params[:scheduled_email_id] = scheduled_email.id
      # Remove event_invitation_id to satisfy the check constraint
      delivery_params.delete(:event_invitation_id)
      Rails.logger.info("Linking invitation delivery to ScheduledEmail ##{scheduled_email.id}")
    end

    EmailDelivery.create!(delivery_params)
  rescue => e
    Rails.logger.error("Failed to create invitation delivery: #{e.message}")
    nil
  end

  def find_scheduled_email_for_invitation(event_id, timestamp)
    # Look for Event Announcement scheduled emails sent around the same time
    # Event Announcements are typically "on_application_open" trigger type
    sent_time = Time.at(timestamp.to_i)
    time_window = 10.minutes # Allow 10 minute window for matching

    ScheduledEmail.where(event_id: event_id)
                  .where(status: "sent")
                  .where("sent_at BETWEEN ? AND ?", sent_time - time_window, sent_time + time_window)
                  .where("trigger_type = ? OR name ILIKE ?", "on_application_open", "%announcement%")
                  .first
  end
end
