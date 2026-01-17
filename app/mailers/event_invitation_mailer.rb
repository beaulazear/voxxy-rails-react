class EventInvitationMailer < ApplicationMailer
  # Send invitation email to vendor contact
  def invitation_email(event_invitation)
    @invitation = event_invitation
    @event = event_invitation.event
    @vendor_contact = event_invitation.vendor_contact
    @organization = @event.organization

    # Generate invitation URL
    @invitation_url = @invitation.invitation_url

    # Build location string for subject line
    location_parts = []
    location_parts << @event.location if @event.location.present?
    location_suffix = location_parts.any? ? " in #{location_parts.join(', ')}" : ""

    mail(
      to: @vendor_contact.email,
      subject: "#{@event.title} is coming#{location_suffix}"
    )
  end
end
