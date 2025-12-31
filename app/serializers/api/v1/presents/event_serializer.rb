module Api
  module V1
    module Presents
      class EventSerializer
        def initialize(event, options = {})
          @event = event
          @include_organization = options[:include_organization] || false
          @include_registrations = options[:include_registrations] || false
          @include_vendor_application = options[:include_vendor_application] || false
        end

        def as_json
          {
            id: @event.id,
            title: @event.title,
            slug: @event.slug,
            description: @event.description,
            dates: {
              start: @event.event_date,
              end: @event.event_end_date,
              start_time: @event.start_time,
              end_time: @event.end_time
            },
            venue: @event.venue,
            location: @event.location,
            poster_url: @event.poster_url,
            ticket_url: @event.ticket_url,
            ticket_link: @event.ticket_link,
            age_restriction: @event.age_restriction,
            pricing: {
              ticket_price: @event.ticket_price&.to_f,
              currency: "USD"
            },
            capacity: {
              total: @event.capacity,
              registered: @event.registered_count,
              remaining: @event.spots_remaining,
              is_full: @event.full?
            },
            status: {
              published: @event.published,
              registration_open: @event.registration_open,
              status: @event.status
            },
            application_deadline: @event.application_deadline,
            created_at: @event.created_at,
            updated_at: @event.updated_at
          }.tap do |json|
            json[:organization] = organization_json if @include_organization
            json[:registrations] = registrations_json if @include_registrations
            json[:registration_count] = @event.registered_count
            json[:vendor_applications] = vendor_applications_json if @include_vendor_application
          end
        end

        private

        def organization_json
          {
            id: @event.organization.id,
            name: @event.organization.name,
            slug: @event.organization.slug,
            city: @event.organization.city,
            state: @event.organization.state,
            verified: @event.organization.verified
          }
        end

        def registrations_json
          @event.registrations.confirmed.map do |registration|
            Api::V1::Presents::RegistrationSerializer.new(registration).as_json
          end
        end

        def vendor_applications_json
          active_apps = @event.vendor_applications.active
          return [] if active_apps.empty?

          active_apps.map do |app|
            {
              id: app.id,
              name: app.name,
              description: app.description,
              categories: app.categories,
              submissions_count: app.submissions_count,
              booth_price: app.booth_price&.to_f
            }
          end
        end
      end
    end
  end
end
