module Api
  module V1
    module Presents
      class VendorSerializer
        def initialize(vendor, options = {})
          @vendor = vendor
          @include_owner = options[:include_owner] || false
        end

        def as_json
          {
            id: @vendor.id,
            name: @vendor.name,
            slug: @vendor.slug,
            vendor_type: @vendor.vendor_type,
            description: @vendor.description,
            logo_url: @vendor.logo_url,
            contact: {
              email: @vendor.contact_email,
              phone: @vendor.phone,
              website: @vendor.website,
              instagram: @vendor.instagram_handle
            },
            location: {
              city: @vendor.city,
              state: @vendor.state,
              latitude: @vendor.latitude&.to_f,
              longitude: @vendor.longitude&.to_f
            },
            services: @vendor.services || {},
            pricing: @vendor.pricing || {},
            stats: {
              rating: @vendor.rating&.to_f,
              views_count: @vendor.views_count || 0,
              verified: @vendor.verified,
              active: @vendor.active
            },
            created_at: @vendor.created_at,
            updated_at: @vendor.updated_at
          }.tap do |json|
            json[:owner] = owner_json if @include_owner
          end
        end

        private

        def owner_json
          {
            id: @vendor.user.id,
            name: @vendor.user.name,
            email: @vendor.user.email
          }
        end
      end
    end
  end
end
