# Preview all emails at http://localhost:3000/rails/mailers/event_invitation_mailer
class EventInvitationMailerPreview < ActionMailer::Preview
  # Preview invitation email
  # Visit: http://localhost:3000/rails/mailers/event_invitation_mailer/invitation_email
  def invitation_email
    # Find or create sample data
    user = User.find_or_create_by!(email: 'test.producer@example.com') do |u|
      u.name = 'Test Producer'
      u.password = 'password123'
      u.role = 'venue_owner'
      u.confirmed_at = Time.current
      u.product_context = 'presents'
    end

    organization = Organization.find_or_create_by!(name: 'Voxxy Presents Team', user: user) do |org|
      org.description = 'Premier event organization company'
      org.city = 'Raleigh'
      org.state = 'NC'
    end

    event = Event.find_or_create_by!(
      title: 'Pancake & Booze Art Show',
      organization: organization
    ) do |e|
      e.description = 'A curated art show featuring local artists'
      e.event_date = Date.parse('2026-04-11')
      e.application_deadline = Date.parse('2026-01-09')
      e.venue = 'The Art Gallery'
      e.location = 'Raleigh, NC'
      e.published = true
    end

    vendor_contact = VendorContact.find_or_create_by!(
      email: 'artist@example.com',
      organization: organization
    ) do |vc|
      vc.contact_name = 'Jane Artist'
      vc.business_name = 'Jane\'s Artworks'
      vc.contact_type = 'vendor'
      vc.status = 'new'
      vc.source = 'manual'
    end

    # Create invitation
    invitation = EventInvitation.find_or_create_by!(
      event: event,
      vendor_contact: vendor_contact
    ) do |inv|
      inv.status = 'pending'
    end

    # Generate the email
    EventInvitationMailer.invitation_email(invitation)
  end

  # Preview acceptance confirmation to vendor
  def accepted_confirmation_vendor
    invitation = EventInvitation.joins(:event, :vendor_contact).first
    if invitation
      invitation.update(status: 'accepted', responded_at: Time.current)
      EventInvitationMailer.accepted_confirmation_vendor(invitation)
    else
      # Fallback if no invitations exist
      EventInvitationMailer.accepted_confirmation_vendor(setup_invitation)
    end
  end

  # Preview acceptance notification to producer
  def accepted_notification_producer
    invitation = EventInvitation.joins(:event, :vendor_contact).first || setup_invitation
    invitation.update(status: 'accepted', responded_at: Time.current)
    EventInvitationMailer.accepted_notification_producer(invitation)
  end

  # Preview decline confirmation to vendor
  def declined_confirmation_vendor
    invitation = EventInvitation.joins(:event, :vendor_contact).first || setup_invitation
    invitation.update(status: 'declined', responded_at: Time.current)
    EventInvitationMailer.declined_confirmation_vendor(invitation)
  end

  # Preview decline notification to producer
  def declined_notification_producer
    invitation = EventInvitation.joins(:event, :vendor_contact).first || setup_invitation
    invitation.update(status: 'declined', responded_at: Time.current)
    EventInvitationMailer.declined_notification_producer(invitation)
  end

  private

  def setup_invitation
    user = User.first || User.create!(
      email: 'producer@example.com',
      name: 'Test Producer',
      password: 'password123',
      role: 'venue_owner',
      confirmed_at: Time.current
    )

    organization = Organization.first || Organization.create!(
      name: 'Sample Organization',
      user: user
    )

    event = Event.first || Event.create!(
      title: 'Sample Event',
      organization: organization,
      event_date: 1.month.from_now,
      application_deadline: 2.weeks.from_now
    )

    vendor_contact = VendorContact.first || VendorContact.create!(
      contact_name: 'Sample Vendor',
      email: 'vendor@example.com',
      organization: organization,
      contact_type: 'vendor',
      status: 'new',
      source: 'manual'
    )

    EventInvitation.create!(
      event: event,
      vendor_contact: vendor_contact,
      status: 'pending'
    )
  end
end
