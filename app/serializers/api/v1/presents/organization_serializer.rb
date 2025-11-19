module Api
  module V1
    module Presents
      class OrganizationSerializer
        def initialize(organization, options = {})
          @organization = organization
          @include_events = options[:include_events] || false
          @include_owner = options[:include_owner] || false
        end

        def as_json
          {
            id: @organization.id,
            user_id: @organization.user_id,
            name: @organization.name,
            slug: @organization.slug,
            description: @organization.description,
            logo_url: @organization.logo_url,
            contact: {
              email: @organization.email,
              phone: @organization.phone,
              website: @organization.website,
              instagram: @organization.instagram_handle
            },
            location: {
              address: @organization.address,
              city: @organization.city,
              state: @organization.state,
              zip_code: @organization.zip_code,
              latitude: @organization.latitude&.to_f,
              longitude: @organization.longitude&.to_f
            },
            verified: @organization.verified,
            active: @organization.active,
            created_at: @organization.created_at,
            updated_at: @organization.updated_at
          }.tap do |json|
            json[:events] = events_json if @include_events
            json[:owner] = owner_json if @include_owner
          end
        end

        private

        def events_json
          @organization.events.published.map do |event|
            {
              id: event.id,
              title: event.title,
              slug: event.slug,
              event_date: event.event_date,
              ticket_price: event.ticket_price&.to_f,
              capacity: event.capacity,
              spots_remaining: event.spots_remaining,
              poster_url: event.poster_url
            }
          end
        end

        def owner_json
          {
            id: @organization.user.id,
            name: @organization.user.name,
            email: @organization.user.email
          }
        end
      end
    end
  end
end
