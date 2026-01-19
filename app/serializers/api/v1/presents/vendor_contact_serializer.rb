module Api
  module V1
    module Presents
      class VendorContactSerializer
        def initialize(vendor_contact, options = {})
          @vendor_contact = vendor_contact
          @include_relations = options[:include_relations] || false
        end

        def as_json
          {
            id: @vendor_contact.id,
            organization_id: @vendor_contact.organization_id,
            vendor_id: @vendor_contact.vendor_id,
            registration_id: @vendor_contact.registration_id,
            # Flat structure for compatibility with frontend VendorContact interface
            contact_name: @vendor_contact.name,
            email: @vendor_contact.email,
            phone: @vendor_contact.phone,
            business_name: @vendor_contact.try(:business_name) || @vendor_contact.try(:company_name),
            job_title: @vendor_contact.job_title,
            location: @vendor_contact.try(:location),
            contact_type: @vendor_contact.contact_type,
            status: @vendor_contact.status,
            notes: @vendor_contact.notes,
            tags: @vendor_contact.tags || [],
            categories: @vendor_contact.try(:categories) || [],
            featured: @vendor_contact.try(:featured) || false,
            interaction_count: @vendor_contact.interaction_count || 0,
            events_participated: @vendor_contact.try(:events_participated) || 0,
            last_contacted_at: @vendor_contact.last_contacted_at,
            instagram_handle: @vendor_contact.try(:instagram_handle),
            tiktok_handle: @vendor_contact.try(:tiktok_handle),
            website: @vendor_contact.try(:website),
            source: @vendor_contact.source,
            source_registration_id: @vendor_contact.try(:source_registration_id),
            imported_at: @vendor_contact.imported_at,
            created_at: @vendor_contact.created_at,
            updated_at: @vendor_contact.updated_at
          }.tap do |json|
            if @include_relations
              json[:organization] = organization_json if @vendor_contact.organization.present?
              json[:vendor] = vendor_json if @vendor_contact.vendor.present?
              json[:registration] = registration_json if @vendor_contact.registration.present?
            end
          end
        end

        private

        def organization_json
          {
            id: @vendor_contact.organization.id,
            name: @vendor_contact.organization.name,
            slug: @vendor_contact.organization.slug
          }
        end

        def vendor_json
          {
            id: @vendor_contact.vendor.id,
            name: @vendor_contact.vendor.name,
            slug: @vendor_contact.vendor.slug,
            vendor_type: @vendor_contact.vendor.vendor_type
          }
        end

        def registration_json
          {
            id: @vendor_contact.registration.id,
            event_id: @vendor_contact.registration.event_id,
            status: @vendor_contact.registration.status,
            vendor_category: @vendor_contact.registration.vendor_category,
            created_at: @vendor_contact.registration.created_at
          }
        end
      end
    end
  end
end
