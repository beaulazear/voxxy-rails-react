module Api
  module V1
    module Presents
      class VendorApplicationSerializer
        def initialize(vendor_application, options = {})
          @vendor_application = vendor_application
          @include_event = options[:include_event] || false
          @include_submissions = options[:include_submissions] || false
        end

        def as_json
          {
            id: @vendor_application.id,
            name: @vendor_application.name,
            description: @vendor_application.description,
            status: @vendor_application.status,
            categories: @vendor_application.categories || [],
            submissions_count: @vendor_application.submissions_count,
            event_id: @vendor_application.event_id,
            shareable_code: @vendor_application.shareable_code,
            shareable_url: @vendor_application.shareable_url,
            created_at: @vendor_application.created_at,
            updated_at: @vendor_application.updated_at
          }.tap do |json|
            json[:event] = event_json if @include_event
            json[:submissions] = submissions_json if @include_submissions
            json[:submissions_by_status] = @vendor_application.submissions_by_status
          end
        end

        private

        def event_json
          {
            id: @vendor_application.event.id,
            title: @vendor_application.event.title,
            slug: @vendor_application.event.slug,
            event_date: @vendor_application.event.event_date,
            location: @vendor_application.event.location
          }
        end

        def submissions_json
          @vendor_application.registrations.map do |registration|
            Api::V1::Presents::RegistrationSerializer.new(registration).as_json
          end
        end
      end
    end
  end
end
