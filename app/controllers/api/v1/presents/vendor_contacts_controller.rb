require "timeout"

module Api
  module V1
    module Presents
      class VendorContactsController < BaseController
        before_action :require_venue_owner
        before_action :set_vendor_contact, only: [ :show, :update, :destroy ]
        before_action :check_organization_ownership, only: [ :show, :update, :destroy ]

        # GET /api/v1/presents/vendor_contacts
        # GET /api/v1/presents/organizations/:organization_id/vendor_contacts
        def index
          if params[:organization_id].present?
            organization = Organization.find(params[:organization_id])
            unless organization.user_id == @current_user.id || @current_user.admin?
              return render json: { error: "Not authorized" }, status: :forbidden
            end
            vendor_contacts = organization.vendor_contacts
          else
            # Get all contacts for current user's organizations
            organization_ids = @current_user.organizations.pluck(:id)
            vendor_contacts = VendorContact.where(organization_id: organization_ids)
          end

          # Apply filters
          vendor_contacts = vendor_contacts.by_status(params[:status]) if params[:status].present?
          vendor_contacts = vendor_contacts.by_contact_type(params[:contact_type]) if params[:contact_type].present?
          vendor_contacts = vendor_contacts.by_location(params[:location]) if params[:location].present?
          vendor_contacts = vendor_contacts.by_category(params[:category]) if params[:category].present?
          vendor_contacts = vendor_contacts.featured if params[:featured] == "true"
          vendor_contacts = vendor_contacts.with_email if params[:has_email] == "true"
          vendor_contacts = vendor_contacts.with_phone if params[:has_phone] == "true"

          # Apply search
          if params[:search].present?
            search_term = "%#{params[:search]}%"
            vendor_contacts = vendor_contacts.where(
              "name ILIKE ? OR email ILIKE ? OR business_name ILIKE ?",
              search_term, search_term, search_term
            )
          end

          # Order
          vendor_contacts = if params[:sort] == "recently_contacted"
            vendor_contacts.recently_contacted
          else
            vendor_contacts.recent
          end

          # Includes for performance
          vendor_contacts = vendor_contacts.includes(:organization, :vendor, :registration)

          serialized = vendor_contacts.map do |contact|
            VendorContactSerializer.new(contact, include_relations: true).as_json
          end

          render json: { vendor_contacts: serialized }, status: :ok
        end

        # GET /api/v1/presents/vendor_contacts/:id
        def show
          serialized = VendorContactSerializer.new(@vendor_contact, include_relations: true).as_json
          render json: serialized, status: :ok
        end

        # POST /api/v1/presents/vendor_contacts
        def create
          organization = Organization.find(params[:vendor_contact][:organization_id])

          unless organization.user_id == @current_user.id || @current_user.admin?
            return render json: { error: "Not authorized to create contacts for this organization" },
                          status: :forbidden
          end

          vendor_contact = organization.vendor_contacts.build(vendor_contact_params)

          if vendor_contact.save
            serialized = VendorContactSerializer.new(vendor_contact, include_relations: true).as_json
            render json: serialized, status: :created
          else
            render json: { errors: vendor_contact.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/presents/vendor_contacts/:id
        def update
          if @vendor_contact.update(vendor_contact_params)
            serialized = VendorContactSerializer.new(@vendor_contact, include_relations: true).as_json
            render json: serialized, status: :ok
          else
            render json: { errors: @vendor_contact.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/vendor_contacts/:id
        def destroy
          @vendor_contact.destroy
          render json: { message: "Vendor contact deleted successfully" }, status: :ok
        end

        # POST /api/v1/presents/vendor_contacts/bulk_import
        def bulk_import
          # Ensure user owns an organization
          unless @current_user.organizations.any?
            render json: { error: "You must have an organization to import contacts" }, status: :forbidden
            return
          end

          # Get the organization (use first organization for now)
          organization = @current_user.organizations.first

          # Validate file presence
          unless params[:file].present?
            render json: { error: "No file provided" }, status: :unprocessable_entity
            return
          end

          # Validate file type
          file = params[:file]
          unless file.content_type == "text/csv" || file.original_filename.end_with?(".csv")
            render json: { error: "File must be a CSV" }, status: :unprocessable_entity
            return
          end

          # Parse options
          options = {
            skip_duplicates: ActiveModel::Type::Boolean.new.cast(params[:skip_duplicates] || true),
            update_existing: ActiveModel::Type::Boolean.new.cast(params[:update_existing] || false),
            tags: params[:tags].present? ? JSON.parse(params[:tags]) : []
          }

          # Process import
          import_service = VendorContactImportService.new(organization, file, options)

          # Set timeout to prevent long-running requests
          result = Timeout.timeout(120) do
            import_service.process
          end

          # Return results
          render json: {
            success: true,
            summary: {
              total_rows: result[:total_rows],
              created: result[:created],
              updated: result[:updated],
              skipped: result[:skipped],
              failed: result[:failed]
            },
            errors: result[:errors]
          }, status: :ok

        rescue Timeout::Error
          render json: {
            error: "Import timeout - file too large. Please split into smaller files."
          }, status: :request_timeout

        rescue StandardError => e
          render json: {
            error: "Import failed: #{e.message}"
          }, status: :internal_server_error
        end

        # POST /api/v1/presents/vendor_contacts/:id/record_interaction
        def record_interaction
          set_vendor_contact
          check_organization_ownership

          @vendor_contact.record_interaction!
          serialized = VendorContactSerializer.new(@vendor_contact, include_relations: true).as_json
          render json: serialized, status: :ok
        end

        # POST /api/v1/presents/vendor_contacts/:id/add_tag
        def add_tag
          set_vendor_contact
          check_organization_ownership

          tag_name = params[:tag]
          if tag_name.present?
            @vendor_contact.add_tag(tag_name)
            serialized = VendorContactSerializer.new(@vendor_contact, include_relations: true).as_json
            render json: serialized, status: :ok
          else
            render json: { error: "Tag name required" }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/vendor_contacts/:id/remove_tag
        def remove_tag
          set_vendor_contact
          check_organization_ownership

          tag_name = params[:tag]
          if tag_name.present?
            @vendor_contact.remove_tag(tag_name)
            serialized = VendorContactSerializer.new(@vendor_contact, include_relations: true).as_json
            render json: serialized, status: :ok
          else
            render json: { error: "Tag name required" }, status: :unprocessable_entity
          end
        end

        private

        def set_vendor_contact
          @vendor_contact = VendorContact.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Vendor contact not found" }, status: :not_found
        end

        def check_organization_ownership
          return if @vendor_contact.nil?

          unless @vendor_contact.organization.user_id == @current_user.id || @current_user.admin?
            render json: { error: "Not authorized" }, status: :forbidden
          end
        end

        def vendor_contact_params
          params.require(:vendor_contact).permit(
            :organization_id,
            :vendor_id,
            :registration_id,
            :name,
            :email,
            :phone,
            :business_name,
            :job_title,
            :contact_type,
            :status,
            :notes,
            :source,
            :imported_at,
            :instagram_handle,
            :tiktok_handle,
            :website,
            :location,
            :featured,
            tags: [],
            categories: []
          )
        end
      end
    end
  end
end
