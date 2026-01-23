module Api
  module V1
    module Presents
      class EventPortalSerializer
        def initialize(event_portal, options = {})
          @event_portal = event_portal
          @event = event_portal.event
          @current_user_email = options[:current_user_email]
        end

        def as_json
          {
            id: @event_portal.id,
            view_count: @event_portal.view_count,
            last_viewed_at: @event_portal.last_viewed_at,
            event: event_json,
            vendor_categories: vendor_categories_json,
            producer_updates: producer_updates_json
          }
        end

        # For compatibility with JSONAPI::Serializer format if needed
        def serializable_hash
          { data: as_json }
        end

        private

        def event_json
          {
            id: @event.id,
            title: @event.title,
            slug: @event.slug,
            description: @event.description,
            dates: {
              event_date: @event.event_date,
              event_end_date: @event.event_end_date,
              start_time: @event.start_time,
              end_time: @event.end_time
            },
            venue: @event.venue,
            location: @event.location,
            age_restriction: @event.age_restriction,
            ticket_url: @event.ticket_url || @event.ticket_link,
            application_deadline: @event.application_deadline,
            payment_deadline: @event.payment_deadline,
            organization: organization_json
          }
        end

        def organization_json
          return nil unless @event.organization

          {
            id: @event.organization.id,
            name: @event.organization.name,
            slug: @event.organization.slug
          }
        end

        def vendor_categories_json
          active_apps = @event.vendor_applications.active
          return [] if active_apps.empty?

          active_apps.map do |app|
            {
              id: app.id,
              name: app.name,
              description: app.description,
              categories: app.categories,
              booth_price: app.booth_price&.to_f,
              payment_link: app.payment_link,
              install: {
                install_date: app.install_date,
                install_start_time: app.install_start_time,
                install_end_time: app.install_end_time
              },
              application_tags: app.application_tags
            }
          end
        end

        def producer_updates_json
          bulletins = @event.bulletins.for_display.limit(50)
          return [] if bulletins.empty?

          bulletins.map do |bulletin|
            BulletinSerializer.new(bulletin, current_user_email: @current_user_email).as_json
          end
        end
      end
    end
  end
end
