module Api
  module V1
    module Presents
      class OrganizationsController < BaseController
        skip_before_action :authorized, only: [ :index, :show ]
        skip_before_action :check_presents_access, only: [ :index, :show ]
        before_action :require_venue_owner, only: [ :create, :update, :destroy ]
        before_action :set_organization, only: [ :show, :update, :destroy ]

        # GET /api/v1/presents/organizations
        def index
          organizations = Organization.active.includes(:user)
          organizations = organizations.verified if params[:verified] == "true"

          serialized = organizations.map do |org|
            OrganizationSerializer.new(org).as_json
          end

          render json: serialized, status: :ok
        end

        # GET /api/v1/presents/organizations/:id
        def show
          serialized = OrganizationSerializer.new(@organization, include_events: true).as_json
          render json: serialized, status: :ok
        end

        # POST /api/v1/presents/organizations
        def create
          organization = @current_user.organizations.build(organization_params)

          if organization.save
            serialized = OrganizationSerializer.new(organization).as_json
            render json: serialized, status: :created
          else
            render json: { errors: organization.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/presents/organizations/:id
        def update
          if @organization.update(organization_params)
            serialized = OrganizationSerializer.new(@organization).as_json
            render json: serialized, status: :ok
          else
            render json: { errors: @organization.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/organizations/:id
        def destroy
          @organization.destroy
          head :no_content
        end

        private

        def set_organization
          @organization = Organization.find_by!(slug: params[:id])

          # Check ownership for update/destroy
          if action_name.in?([ "update", "destroy" ])
            unless @organization.user_id == @current_user.id || @current_user.admin?
              render json: { error: "Not authorized" }, status: :forbidden
            end
          end
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Organization not found" }, status: :not_found
        end

        def organization_params
          params.require(:organization).permit(
            :name, :description, :logo_url, :website, :instagram_handle,
            :phone, :email, :address, :city, :state, :zip_code,
            :latitude, :longitude
          )
        end
      end
    end
  end
end
