module Api
  module V1
    module Presents
      class RegistrationSerializer
        def initialize(registration, options = {})
          @registration = registration
          @include_event = options[:include_event] || false
          @include_user = options[:include_user] || false
        end

        def as_json
          {
            id: @registration.id,
            email: @registration.email,
            name: @registration.name,
            phone: @registration.phone,
            ticket_code: @registration.ticket_code,
            status: @registration.status,
            checked_in: @registration.checked_in,
            checked_in_at: @registration.checked_in_at,
            subscribed: @registration.subscribed,
            business_name: @registration.business_name,
            vendor_category: @registration.vendor_category,
            vendor_application_id: @registration.vendor_application_id,
            created_at: @registration.created_at,
            updated_at: @registration.updated_at
          }.tap do |json|
            json[:event] = event_json if @include_event
            json[:user] = user_json if @include_user && @registration.user.present?
          end
        end

        private

        def event_json
          {
            id: @registration.event.id,
            title: @registration.event.title,
            slug: @registration.event.slug,
            event_date: @registration.event.event_date,
            location: @registration.event.location
          }
        end

        def user_json
          {
            id: @registration.user.id,
            name: @registration.user.name,
            email: @registration.user.email
          }
        end
      end
    end
  end
end
