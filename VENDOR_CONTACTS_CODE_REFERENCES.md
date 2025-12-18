# Voxxy Rails - Code References for Vendor Contacts CRM Feature

## Key Code Patterns to Follow

### 1. Example Controller Pattern (from VendorsController)

```ruby
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

        private

        def set_vendor
          @vendor = Vendor.find_by!(slug: params[:id])
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
```

### 2. Example Model Pattern (from Organization)

```ruby
class Organization < ApplicationRecord
  belongs_to :user
  has_many :events, dependent: :destroy
  has_many :budgets, as: :budgetable, dependent: :destroy

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  before_validation :generate_slug, on: :create

  scope :active, -> { where(active: true) }
  scope :verified, -> { where(verified: true) }

  private

  def generate_slug
    self.slug = name.parameterize if name.present? && slug.blank?
  end
end
```

### 3. Example Serializer Pattern (from VendorSerializer)

```ruby
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
```

### 4. Example Migration Pattern (from organizations migration)

```ruby
class CreateOrganizations < ActiveRecord::Migration[7.2]
  def change
    create_table :organizations do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.string :logo_url
      t.string :website
      t.string :instagram_handle
      t.string :phone
      t.string :email
      t.string :address
      t.string :city
      t.string :state
      t.string :zip_code
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6
      t.boolean :verified, default: false
      t.boolean :active, default: true

      t.timestamps
    end

    add_index :organizations, :slug, unique: true
    add_index :organizations, :active
  end
end
```

### 5. Example Routing Pattern (from routes.rb)

```ruby
namespace :api do
  namespace :v1 do
    namespace :presents do
      # Organizations (venues/clubs)
      resources :organizations do
        resources :events, only: [ :index, :create ]
        resources :budgets, only: [ :index, :create ]
      end

      # Events
      resources :events do
        resources :registrations, only: [ :index, :create ]
        resources :budgets, only: [ :index, :create ]
        resources :vendor_applications, only: [ :index, :create ]
      end

      # Vendors (marketplace)
      resources :vendors do
        collection do
          get :search
        end
      end

      # Vendor Applications (vendor application forms)
      resources :vendor_applications, only: [ :show, :update, :destroy ] do
        collection do
          get "lookup/:code", action: :lookup_by_code, as: :lookup
        end
        member do
          get :submissions
        end
      end
    end
  end
end
```

---

## Standard Authorization Patterns

### In BaseController (inherited by all controllers)
```ruby
module Api
  module V1
    module Presents
      class BaseController < ApplicationController
        before_action :authorized
        before_action :check_presents_access

        private

        def check_presents_access
          unless @current_user.uses_presents? || @current_user.admin?
            render json: { error: "Access denied. Presents product access required." },
                   status: :forbidden
          end
        end

        def require_venue_owner
          unless @current_user.venue_owner? || @current_user.admin?
            render json: { error: "Venue owner access required" }, status: :forbidden
          end
        end

        def require_vendor
          unless @current_user.vendor? || @current_user.admin?
            render json: { error: "Vendor access required" }, status: :forbidden
          end
        end
      end
    end
  end
end
```

### Common Authorization Patterns in Controllers

```ruby
# Skip auth for public endpoints
skip_before_action :authorized, only: [ :index, :show ]
skip_before_action :check_presents_access, only: [ :index, :show ]

# Require specific role for actions
before_action :require_venue_owner, only: [ :create, :update, :destroy ]

# Check ownership in setter method
def set_vendor
  @vendor = Vendor.find_by!(slug: params[:id])
  if action_name.in?([ "update", "destroy" ])
    unless @vendor.user_id == @current_user.id || @current_user.admin?
      render json: { error: "Not authorized" }, status: :forbidden
    end
  end
rescue ActiveRecord::RecordNotFound
  render json: { error: "Vendor not found" }, status: :not_found
end
```

---

## Database Connection Patterns

### Has-Many Relationships
```ruby
# In Organization model
has_many :events, dependent: :destroy
has_many :budgets, as: :budgetable, dependent: :destroy

# In Event model
has_many :registrations, dependent: :destroy
has_many :vendor_applications, dependent: :destroy
```

### Belongs-To Relationships
```ruby
# In Registration model
belongs_to :event, counter_cache: :registered_count
belongs_to :user, optional: true
belongs_to :vendor_application, optional: true, counter_cache: :submissions_count

# In Event model
belongs_to :organization
```

### Polymorphic Associations
```ruby
# In Budget model (budgetable can be Organization or Event)
belongs_to :budgetable, polymorphic: true

# Usage in Organization:
has_many :budgets, as: :budgetable, dependent: :destroy
```

---

## Common Helper Methods

### Scopes (from various models)
```ruby
# In Organization
scope :active, -> { where(active: true) }
scope :verified, -> { where(verified: true) }

# In Event
scope :published, -> { where(published: true) }
scope :upcoming, -> { where("event_date > ?", Time.current).order(event_date: :asc) }
scope :past, -> { where("event_date <= ?", Time.current).order(event_date: :desc) }

# In Registration
scope :confirmed, -> { where(status: "confirmed") }
scope :pending, -> { where(status: "pending") }
scope :vendor_registrations, -> { where.not(vendor_application_id: nil) }
scope :by_category, ->(category) { where(vendor_category: category) }
```

### Before/After Hooks
```ruby
# Auto-generate slug
before_validation :generate_slug, on: :create

# Counter cache (automatic with counter_cache: option)
belongs_to :event, counter_cache: :registered_count

# Callbacks
after_create :send_confirmation_email
after_update :send_status_update_email, if: :saved_change_to_status?
```

### Slug Generation Pattern
```ruby
def generate_slug
  self.slug = name.parameterize if name.present? && slug.blank?
end
```

---

## Testing/Development References

### Current Role Users
- `consumer` role: Default mobile app users
- `venue_owner` role: Owners of organizations/venues
- `vendor` role: Vendors in marketplace
- `admin` role: System administrators

### Test Data Needed for Vendor Contacts CRM
- Venue Owner user account
- Organization owned by venue owner
- Event under organization
- Vendor Application under event
- Registration(s) from vendor applications (to convert to vendor contacts)

### Key Database Indexes to Ensure Good Query Performance
```ruby
add_index :vendor_contacts, :organization_id  # For listing contacts by org
add_index :vendor_contacts, :created_at       # For ordering by date
add_index :vendor_contacts, [ :organization_id, :status ] # For filtered queries
```

---

## Recommended Files to Reference When Building Vendor Contacts

1. **For Model Structure**: `/Users/beaulazear/Desktop/voxxy-rails/app/models/vendor.rb`
2. **For Controller Pattern**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/vendors_controller.rb`
3. **For Serializer Pattern**: `/Users/beaulazear/Desktop/voxxy-rails/app/serializers/api/v1/presents/vendor_serializer.rb`
4. **For Migration Pattern**: `/Users/beaulazear/Desktop/voxxy-rails/db/migrate/20251104140600_create_vendors.rb`
5. **For Routes Pattern**: `/Users/beaulazear/Desktop/voxxy-rails/config/routes.rb` (lines 263-311)
6. **For Registration Reference**: `/Users/beaulazear/Desktop/voxxy-rails/app/models/registration.rb` (for inspiration on collecting contact data)

