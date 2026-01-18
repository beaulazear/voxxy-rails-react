module Api
  module V1
    module Presents
      class ContactListsController < BaseController
        before_action :require_venue_owner
        before_action :set_organization, only: [ :index, :create ]
        before_action :set_contact_list, only: [ :show, :update, :destroy, :contacts ]
        before_action :check_ownership, only: [ :show, :update, :destroy, :contacts ]

        # GET /api/v1/presents/organizations/:organization_id/contact_lists
        def index
          lists = @organization.contact_lists.recent

          render json: {
            contact_lists: lists.map { |list| serialize_list(list) }
          }, status: :ok
        end

        # GET /api/v1/presents/contact_lists/:id
        def show
          render json: serialize_list(@contact_list), status: :ok
        end

        # GET /api/v1/presents/contact_lists/:id/contacts
        # Returns the actual contacts for this list with pagination
        def contacts
          contacts = @contact_list.contacts

          # Apply pagination
          page = params[:page]&.to_i || 1
          per_page = params[:per_page]&.to_i || 100

          # Ensure page is at least 1
          page = 1 if page < 1
          # Ensure per_page is reasonable (between 10 and 200)
          per_page = [ [ per_page, 10 ].max, 200 ].min

          # Get total count before pagination
          total_count = contacts.count
          total_pages = (total_count.to_f / per_page).ceil

          # Apply pagination
          paginated = contacts.offset((page - 1) * per_page).limit(per_page)

          render json: {
            vendor_contacts: paginated.map { |c| VendorContactSerializer.new(c).as_json },
            meta: {
              current_page: page,
              per_page: per_page,
              total_count: total_count,
              total_pages: total_pages
            }
          }, status: :ok
        end

        # POST /api/v1/presents/organizations/:organization_id/contact_lists
        def create
          list = @organization.contact_lists.build(contact_list_params)

          if list.save
            # Update contacts count for manual lists
            list.update_contacts_count! if list.manual?

            render json: serialize_list(list), status: :created
          else
            render json: { errors: list.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/presents/contact_lists/:id
        def update
          if @contact_list.update(contact_list_params)
            # Update contacts count if contact_ids changed (manual lists)
            if @contact_list.manual? && @contact_list.saved_change_to_contact_ids?
              @contact_list.update_contacts_count!
            end

            render json: serialize_list(@contact_list), status: :ok
          else
            render json: { errors: @contact_list.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/contact_lists/:id
        def destroy
          @contact_list.destroy
          render json: { message: "List deleted successfully" }, status: :ok
        end

        private

        def set_organization
          @organization = Organization.find(params[:organization_id])
          unless @organization.user_id == @current_user.id || @current_user.admin?
            render json: { error: "Not authorized" }, status: :forbidden
          end
        end

        def set_contact_list
          @contact_list = ContactList.find(params[:id])
        end

        def check_ownership
          unless @contact_list.organization.user_id == @current_user.id || @current_user.admin?
            render json: { error: "Not authorized" }, status: :forbidden
          end
        end

        def contact_list_params
          params.require(:contact_list).permit(
            :name,
            :description,
            :list_type,
            filters: {},
            contact_ids: []
          )
        end

        def serialize_list(list)
          {
            id: list.id,
            organization_id: list.organization_id,
            name: list.name,
            description: list.description,
            list_type: list.list_type,
            filters: list.filters,
            contact_ids: list.contact_ids,
            contacts_count: list.smart? ? list.contacts.count : list.contacts_count,
            last_used_at: list.last_used_at,
            created_at: list.created_at,
            updated_at: list.updated_at
          }
        end
      end
    end
  end
end
