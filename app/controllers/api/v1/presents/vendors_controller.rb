module Api
  module V1
    module Presents
      class VendorsController < BaseController
        skip_before_action :authorized, only: [ :index, :show, :search ]
        skip_before_action :check_presents_access, only: [ :index, :show, :search ]
        before_action :require_vendor, only: [ :create, :update, :destroy ]
        before_action :set_vendor, only: [ :show, :update, :destroy ]

        # GET /api/v1/presents/vendors
        def index
          vendors = Vendor.active.includes(:user)
          vendors = vendors.verified if params[:verified] == "true"
          vendors = vendors.by_type(params[:vendor_type]) if params[:vendor_type].present?

          serialized = vendors.map do |vendor|
            VendorSerializer.new(vendor).as_json
          end

          render json: serialized, status: :ok
        end

        # GET /api/v1/presents/vendors/search
        def search
          vendors = Vendor.active.includes(:user)

          # Filter by vendor type
          vendors = vendors.by_type(params[:vendor_type]) if params[:vendor_type].present?

          # Text search (name, description)
          if params[:query].present?
            query = "%#{params[:query]}%"
            vendors = vendors.where(
              "name ILIKE ? OR description ILIKE ? OR services::text ILIKE ?",
              query, query, query
            )
          end

          # Location filters
          vendors = vendors.where(city: params[:city]) if params[:city].present?
          vendors = vendors.where(state: params[:state]) if params[:state].present?

          # Verified filter
          vendors = vendors.verified if params[:verified] == "true"

          # Sorting
          vendors = case params[:sort]
          when "rating"
                      vendors.order(rating: :desc)
          when "views"
                      vendors.order(views_count: :desc)
          else
                      vendors.order(created_at: :desc)
          end

          serialized = vendors.map do |vendor|
            VendorSerializer.new(vendor).as_json
          end

          render json: serialized, status: :ok
        end

        # GET /api/v1/presents/vendors/:id
        def show
          @vendor.increment_views!
          serialized = VendorSerializer.new(@vendor).as_json
          render json: serialized, status: :ok
        end

        # POST /api/v1/presents/vendors
        def create
          vendor = @current_user.vendors.build(vendor_params)

          if vendor.save
            serialized = VendorSerializer.new(vendor).as_json
            render json: serialized, status: :created
          else
            render json: { errors: vendor.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/presents/vendors/:id
        def update
          if @vendor.update(vendor_params)
            serialized = VendorSerializer.new(@vendor).as_json
            render json: serialized, status: :ok
          else
            render json: { errors: @vendor.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/vendors/:id
        def destroy
          @vendor.destroy
          head :no_content
        end

        private

        def set_vendor
          @vendor = Vendor.find_by!(slug: params[:id])

          # Check ownership for update/destroy
          if action_name.in?([ "update", "destroy" ])
            unless @vendor.user_id == @current_user.id || @current_user.admin?
              render json: { error: "Not authorized" }, status: :forbidden
            end
          end
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Vendor not found" }, status: :not_found
        end

        def vendor_params
          params.require(:vendor).permit(
            :name, :vendor_type, :description, :logo_url, :website,
            :instagram_handle, :contact_email, :phone, :address,
            :city, :state, :zip_code, :latitude, :longitude,
            services: {}, pricing: {}
          )
        end
      end
    end
  end
end
