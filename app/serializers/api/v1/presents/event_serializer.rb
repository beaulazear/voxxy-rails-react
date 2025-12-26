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
              end: @event.event_end_date
            },
            location: @event.location,
            poster_url: @event.poster_url,
            ticket_url: @event.ticket_url,
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
            json[:vendor_application] = vendor_application_json if @include_vendor_application
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

        def vendor_application_json
          active_app = @event.vendor_applications.active.first
          return nil unless active_app

          {
            id: active_app.id,
            name: active_app.name,
            description: active_app.description,
            categories: active_app.categories,
            submissions_count: active_app.submissions_count,
            booth_price: active_app.booth_price&.to_f
          }
        end
      end
    end
  end
end
