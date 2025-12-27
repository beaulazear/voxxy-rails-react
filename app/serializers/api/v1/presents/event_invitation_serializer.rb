module Api
  module V1
    module Presents
      class EventInvitationSerializer
        def initialize(event_invitation, options = {})
          @event_invitation = event_invitation
          @include_event = options[:include_event] || false
          @include_vendor_contact = options[:include_vendor_contact] || false
          @include_token = options[:include_token] || false
        end

        def as_json
          {
            id: @event_invitation.id,
            event_id: @event_invitation.event_id,
            vendor_contact_id: @event_invitation.vendor_contact_id,
            status: @event_invitation.status,
            sent_at: @event_invitation.sent_at,
            responded_at: @event_invitation.responded_at,
            response_notes: @event_invitation.response_notes,
            expires_at: @event_invitation.expires_at,
            created_at: @event_invitation.created_at,
            updated_at: @event_invitation.updated_at
          }.tap do |json|
            # Include invitation token only when explicitly requested (security)
            json[:invitation_token] = @event_invitation.invitation_token if @include_token

            # Include related event details
            json[:event] = event_json if @include_event && @event_invitation.event.present?

            # Include vendor contact details
            json[:vendor_contact] = vendor_contact_json if @include_vendor_contact && @event_invitation.vendor_contact.present?
          end
        end

        private

        def event_json
          {
            id: @event_invitation.event.id,
            title: @event_invitation.event.title,
            slug: @event_invitation.event.slug,
            description: @event_invitation.event.description,
            event_date: @event_invitation.event.event_date,
            location: @event_invitation.event.location,
            application_deadline: @event_invitation.event.application_deadline
          }
        end

        def vendor_contact_json
          {
            id: @event_invitation.vendor_contact.id,
            name: @event_invitation.vendor_contact.name,
            email: @event_invitation.vendor_contact.email,
            company_name: @event_invitation.vendor_contact.company_name,
            contact_type: @event_invitation.vendor_contact.contact_type
          }
        end
      end
    end
  end
end
