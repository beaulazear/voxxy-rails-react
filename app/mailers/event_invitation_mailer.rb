class EventInvitationMailer < ApplicationMailer
  # Send invitation email to vendor contact
  def invitation_email(event_invitation)
    @invitation = event_invitation
    @event = event_invitation.event
    @vendor_contact = event_invitation.vendor_contact
    @organization = @event.organization

    # Generate invitation URL
    @invitation_url = @invitation.invitation_url

    # Format deadline
    @deadline = @invitation.expires_at&.strftime("%B %d, %Y at %I:%M %p")

    mail(
      to: @vendor_contact.email,
      subject: "You're invited to participate in #{@event.title}"
    )
  end

  # Send acceptance confirmation to vendor
  def accepted_confirmation_vendor(event_invitation)
    @invitation = event_invitation
    @event = event_invitation.event
    @vendor_contact = event_invitation.vendor_contact
    @organization = @event.organization

    mail(
      to: @vendor_contact.email,
      subject: "Thank you for accepting - #{@event.title}"
    )
  end

  # Notify producer that vendor accepted invitation
  def accepted_notification_producer(event_invitation)
    @invitation = event_invitation
    @event = event_invitation.event
    @vendor_contact = event_invitation.vendor_contact
    @organization = @event.organization
    @producer = @organization.user

    mail(
      to: @producer.email,
      subject: "#{@vendor_contact.name} accepted your invitation to #{@event.title}"
    )
  end

  # Send decline confirmation to vendor
  def declined_confirmation_vendor(event_invitation)
    @invitation = event_invitation
    @event = event_invitation.event
    @vendor_contact = event_invitation.vendor_contact

    mail(
      to: @vendor_contact.email,
      subject: "Invitation declined - #{@event.title}"
    )
  end

  # Notify producer that vendor declined invitation
  def declined_notification_producer(event_invitation)
    @invitation = event_invitation
    @event = event_invitation.event
    @vendor_contact = event_invitation.vendor_contact
    @organization = @event.organization
    @producer = @organization.user

    mail(
      to: @producer.email,
      subject: "#{@vendor_contact.name} declined invitation to #{@event.title}"
    )
  end
end
