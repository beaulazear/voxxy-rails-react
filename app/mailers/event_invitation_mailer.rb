class EventInvitationMailer < ApplicationMailer
  # Send invitation email to vendor contact
  def invitation_email(event_invitation)
    @invitation = event_invitation
    @event = event_invitation.event
    @vendor_contact = event_invitation.vendor_contact
    @organization = @event.organization

    # Generate invitation URL
    @invitation_url = @invitation.invitation_url

    # Generate unsubscribe token and URL
    begin
      unsubscribe_token = UnsubscribeTokenService.generate_token(
        email: @vendor_contact.email,
        event: @event,
        organization: @organization
      )
      @unsubscribe_url = UnsubscribeTokenService.generate_unsubscribe_url(unsubscribe_token.token)
    rescue => e
      Rails.logger.error("Failed to generate unsubscribe link for invitation: #{e.message}")
      # Fallback to empty string if token generation fails
      @unsubscribe_url = ""
    end

    # Build subject line with event location
    location_text = @event.location.present? ? @event.location : "your area"
    subject_line = "#{@event.title} is coming in #{location_text}"

    # Add SendGrid custom tracking args for webhook bounce processing
    headers["X-SMTPAPI"] = smtp_api_header.to_json

    # Use organization name in from field with verified email
    from_name = @organization.name || "Voxxy Presents"

    mail(
      to: @vendor_contact.email,
      from: "#{from_name} <noreply@voxxypresents.com>",
      reply_to: "#{@organization.reply_to_name} <#{@organization.reply_to_email}>",
      subject: subject_line
    )
  end

  private

  def smtp_api_header
    {
      unique_args: {
        event_id: @event.id.to_s,
        event_invitation_id: @invitation.id.to_s,
        email_type: "invitation"
      }
    }
  end
end
