# Voxxy Presents - Rails Implementation Plan

## Overview
**SIMPLIFIED APPROACH**: Build Voxxy Presents directly into the existing Voxxy Rails API. No Firebase integration, no data migration, no separate systems.

**Current State**:
- **Main Voxxy Rails**: Ruby on Rails + PostgreSQL (consumer mobile/web app)
- **Voxxy Presents**: Build from scratch as new product area within Rails

**Strategy**: Extend the existing Rails app with Presents functionality, sharing infrastructure while keeping products logically separated.

---

## Architecture

```
Voxxy Rails API (Single Backend)
│
├── Mobile/Web Product (Existing)
│   ├── Activities, Recommendations, Social features
│   ├── Users with role: 'consumer'
│   └── Routes: /api/v1/mobile/*
│
├── Presents Product (NEW)
│   ├── Organizations (venues/clubs)
│   ├── Events (venue events)
│   ├── Vendors (marketplace: venue, catering, entertainment, market vendors)
│   ├── Budgets (event financial planning)
│   ├── Registrations (RSVPs)
│   ├── Users with role: 'venue_owner' or 'vendor'
│   └── Routes: /api/v1/presents/*
│
└── Shared Infrastructure
    ├── Authentication (JWT + Sessions)
    ├── User Management
    ├── Notifications (Push + Email)
    ├── Email Service (SendGrid)
    ├── File Storage (S3)
    ├── Admin Panel
    └── Routes: /api/v1/shared/*
```

**Key Principle**: One database, one auth system, one codebase, one deployment.

---

## Timeline: 2-3 Weeks

### Week 1: Foundation
- ✅ Add API versioning/namespacing
- ✅ Add user roles and product context
- ✅ Create Presents database tables
- ✅ Run migrations
- ✅ Set up basic models

### Week 2: Core Features
- ✅ Build Presents controllers (Organizations, Events, Vendors, Budgets)
- ✅ Add serializers
- ✅ Implement authorization checks
- ✅ Build services (search, registration)

### Week 3: Polish & Deploy
- ✅ Add email notifications
- ✅ Testing (unit + integration)
- ✅ Documentation
- ✅ Deploy to staging
- ✅ Production launch

---

## Phase 1: Foundation (2-3 Days)

### 1.1 Add API Versioning

**Update routes to add versioning:**

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # Legacy routes (keep for backward compatibility temporarily)
  post '/login', to: 'sessions#create'
  delete '/logout', to: 'sessions#destroy'
  get '/me', to: 'users#me'

  namespace :api do
    namespace :v1 do
      # Mobile product routes (migrate existing routes here)
      namespace :mobile do
        resources :activities do
          resources :comments, :time_slots, :pinned_activities
          member do
            post :send_test_reminder
            get :share
            get :calendar
          end
          collection do
            get :ai_recommendations
          end
        end

        resources :responses
        resources :votes
        resources :notifications
        resources :user_activities
        post '/openai/restaurant_recommendations', to: 'openai#restaurant_recommendations'
        post '/openai/bar_recommendations', to: 'openai#bar_recommendations'
        post '/openai/game_recommendations', to: 'openai#game_recommendations'
      end

      # Presents product routes (NEW)
      namespace :presents do
        resources :organizations do
          resources :events
          resources :budgets
        end

        resources :events do
          resources :registrations
          resources :budgets
        end

        resources :vendors do
          collection do
            get :search
          end
        end

        resources :budgets do
          resources :budget_line_items
        end

        resources :registrations, only: [:create, :show, :update]
      end

      # Shared routes (accessible by both products)
      namespace :shared do
        post '/login', to: 'sessions#create'
        delete '/logout', to: 'sessions#destroy'
        get '/me', to: 'users#me'

        resources :users, only: [:create, :show, :update] do
          member do
            post :verify_email
            post :resend_verification
            post :reset_password
          end
        end

        resources :notifications, only: [:index, :show, :update]
      end
    end
  end

  # Admin routes (keep existing)
  namespace :admin do
    get '/analytics', to: 'admin#analytics'
    resources :moderation
  end
end
```

**Migration strategy:**
- Keep legacy routes temporarily for backward compatibility
- Mobile clients gradually migrate to `/api/v1/mobile/*`
- New Presents clients use `/api/v1/presents/*` from day one

---

### 1.2 Add User Roles

**Create migration:**

```ruby
# db/migrate/YYYYMMDDHHMMSS_add_product_fields_to_users.rb
class AddProductFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :role, :string, default: 'consumer'
    add_column :users, :product_context, :string # 'mobile', 'presents', 'both'

    add_index :users, :role
  end
end
```

**Update User model:**

```ruby
# app/models/user.rb
class User < ApplicationRecord
  has_secure_password

  # Existing associations
  has_many :activities, dependent: :destroy
  has_many :notifications, dependent: :destroy
  # ... other mobile associations

  # NEW - Presents associations
  has_many :organizations, dependent: :destroy
  has_many :vendors, dependent: :destroy
  has_many :budgets, dependent: :destroy

  # Role management
  ROLES = %w[consumer venue_owner vendor admin].freeze

  validates :role, inclusion: { in: ROLES }
  validates :email, presence: true, uniqueness: true
  validates :name, presence: true

  # Role helpers
  def consumer?
    role == 'consumer'
  end

  def venue_owner?
    role == 'venue_owner'
  end

  def vendor?
    role == 'vendor'
  end

  def admin?
    role == 'admin'
  end

  def presents_user?
    venue_owner? || vendor?
  end

  def mobile_user?
    consumer?
  end

  # Product context helpers
  def uses_mobile?
    product_context.in?(['mobile', 'both']) || consumer?
  end

  def uses_presents?
    product_context.in?(['presents', 'both']) || presents_user?
  end
end
```

---

### 1.3 Create Presents Database Tables

**Organizations table:**

```ruby
# db/migrate/YYYYMMDDHHMMSS_create_organizations.rb
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
    add_index :organizations, :user_id
    add_index :organizations, :active
  end
end
```

**Events table:**

```ruby
# db/migrate/YYYYMMDDHHMMSS_create_events.rb
class CreateEvents < ActiveRecord::Migration[7.2]
  def change
    create_table :events do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :title, null: false
      t.string :slug, null: false
      t.text :description
      t.datetime :event_date
      t.datetime :event_end_date
      t.string :location
      t.string :poster_url
      t.string :ticket_url
      t.decimal :ticket_price, precision: 8, scale: 2
      t.integer :capacity
      t.integer :registered_count, default: 0
      t.boolean :published, default: false
      t.boolean :registration_open, default: true
      t.string :status # 'draft', 'published', 'cancelled', 'completed'

      t.timestamps
    end

    add_index :events, :slug, unique: true
    add_index :events, :organization_id
    add_index :events, :event_date
    add_index :events, :published
    add_index :events, :status
  end
end
```

**Vendors table:**

```ruby
# db/migrate/YYYYMMDDHHMMSS_create_vendors.rb
class CreateVendors < ActiveRecord::Migration[7.2]
  def change
    create_table :vendors do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :slug, null: false
      t.string :vendor_type, null: false # 'venue', 'catering', 'entertainment', 'market_vendor'
      t.text :description
      t.string :logo_url
      t.string :website
      t.string :instagram_handle
      t.string :contact_email
      t.string :phone
      t.json :services # Flexible field for vendor-specific services
      t.json :pricing # Flexible field for pricing info
      t.string :address
      t.string :city
      t.string :state
      t.string :zip_code
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6
      t.boolean :verified, default: false
      t.boolean :active, default: true
      t.integer :views_count, default: 0
      t.decimal :rating, precision: 3, scale: 2

      t.timestamps
    end

    add_index :vendors, :slug, unique: true
    add_index :vendors, :user_id
    add_index :vendors, :vendor_type
    add_index :vendors, :active
    add_index :vendors, :verified
  end
end
```

**Registrations table:**

```ruby
# db/migrate/YYYYMMDDHHMMSS_create_registrations.rb
class CreateRegistrations < ActiveRecord::Migration[7.2]
  def change
    create_table :registrations do |t|
      t.references :event, null: false, foreign_key: true
      t.references :user, foreign_key: true # nullable for guest registrations
      t.string :email, null: false
      t.string :name
      t.string :phone
      t.boolean :subscribed, default: false
      t.string :ticket_code
      t.string :qr_code_url
      t.boolean :checked_in, default: false
      t.datetime :checked_in_at
      t.string :status # 'pending', 'confirmed', 'cancelled'

      t.timestamps
    end

    add_index :registrations, :event_id
    add_index :registrations, :user_id
    add_index :registrations, :email
    add_index :registrations, :ticket_code, unique: true
    add_index :registrations, :status
  end
end
```

**Budgets table:**

```ruby
# db/migrate/YYYYMMDDHHMMSS_create_budgets.rb
class CreateBudgets < ActiveRecord::Migration[7.2]
  def change
    create_table :budgets do |t|
      # Polymorphic - can belong to Event or Organization
      t.references :budgetable, polymorphic: true, null: false
      t.references :user, null: false, foreign_key: true
      t.string :title
      t.decimal :total_amount, precision: 10, scale: 2
      t.decimal :spent_amount, precision: 10, scale: 2, default: 0
      t.string :status # 'draft', 'active', 'completed'

      t.timestamps
    end

    add_index :budgets, [:budgetable_type, :budgetable_id]
    add_index :budgets, :user_id
  end
end
```

**Budget Line Items table:**

```ruby
# db/migrate/YYYYMMDDHHMMSS_create_budget_line_items.rb
class CreateBudgetLineItems < ActiveRecord::Migration[7.2]
  def change
    create_table :budget_line_items do |t|
      t.references :budget, null: false, foreign_key: true
      t.string :name, null: false
      t.string :category # 'venue', 'catering', 'entertainment', 'marketing', 'other'
      t.decimal :budgeted_amount, precision: 10, scale: 2
      t.decimal :actual_amount, precision: 10, scale: 2, default: 0
      t.text :notes
      t.references :vendor, foreign_key: true # optional link to vendor

      t.timestamps
    end

    add_index :budget_line_items, :budget_id
    add_index :budget_line_items, :category
  end
end
```

---

### 1.4 Create Presents Models

**Organization model:**

```ruby
# app/models/organization.rb
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

**Event model:**

```ruby
# app/models/event.rb
class Event < ApplicationRecord
  belongs_to :organization
  has_many :registrations, dependent: :destroy
  has_one :budget, as: :budgetable, dependent: :destroy

  validates :title, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[draft published cancelled completed] }

  before_validation :generate_slug, on: :create
  before_save :update_registration_status

  scope :published, -> { where(published: true) }
  scope :upcoming, -> { where('event_date > ?', Time.current).order(event_date: :asc) }
  scope :past, -> { where('event_date <= ?', Time.current).order(event_date: :desc) }

  def full?
    capacity.present? && registered_count >= capacity
  end

  def spots_remaining
    return nil unless capacity.present?
    capacity - registered_count
  end

  private

  def generate_slug
    self.slug = title.parameterize if title.present? && slug.blank?
  end

  def update_registration_status
    self.registration_open = false if full?
  end
end
```

**Vendor model:**

```ruby
# app/models/vendor.rb
class Vendor < ApplicationRecord
  belongs_to :user
  has_many :budget_line_items, dependent: :nullify

  VENDOR_TYPES = %w[venue catering entertainment market_vendor].freeze

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :vendor_type, inclusion: { in: VENDOR_TYPES }
  validates :contact_email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  before_validation :generate_slug, on: :create

  scope :active, -> { where(active: true) }
  scope :verified, -> { where(verified: true) }
  scope :by_type, ->(type) { where(vendor_type: type) }

  def increment_views!
    increment!(:views_count)
  end

  private

  def generate_slug
    self.slug = name.parameterize if name.present? && slug.blank?
  end
end
```

**Registration model:**

```ruby
# app/models/registration.rb
class Registration < ApplicationRecord
  belongs_to :event, counter_cache: :registered_count
  belongs_to :user, optional: true

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, inclusion: { in: %w[pending confirmed cancelled] }
  validates :email, uniqueness: { scope: :event_id, message: 'already registered for this event' }

  before_create :generate_ticket_code
  after_create :send_confirmation_email

  scope :confirmed, -> { where(status: 'confirmed') }
  scope :pending, -> { where(status: 'pending') }

  def confirm!
    update(status: 'confirmed')
  end

  def cancel!
    update(status: 'cancelled')
  end

  def check_in!
    update(checked_in: true, checked_in_at: Time.current)
  end

  private

  def generate_ticket_code
    self.ticket_code = SecureRandom.hex(8).upcase
  end

  def send_confirmation_email
    # RegistrationEmailService.send_confirmation(self)
  end
end
```

**Budget model:**

```ruby
# app/models/budget.rb
class Budget < ApplicationRecord
  belongs_to :budgetable, polymorphic: true
  belongs_to :user
  has_many :budget_line_items, dependent: :destroy

  validates :status, inclusion: { in: %w[draft active completed] }

  before_save :calculate_totals

  scope :active, -> { where(status: 'active') }

  def remaining_amount
    total_amount.to_f - spent_amount.to_f
  end

  def percentage_spent
    return 0 if total_amount.to_f.zero?
    (spent_amount.to_f / total_amount.to_f * 100).round(2)
  end

  private

  def calculate_totals
    self.total_amount = budget_line_items.sum(:budgeted_amount)
    self.spent_amount = budget_line_items.sum(:actual_amount)
  end
end
```

**Budget Line Item model:**

```ruby
# app/models/budget_line_item.rb
class BudgetLineItem < ApplicationRecord
  belongs_to :budget
  belongs_to :vendor, optional: true

  CATEGORIES = %w[venue catering entertainment marketing staffing other].freeze

  validates :name, presence: true
  validates :category, inclusion: { in: CATEGORIES }, allow_blank: true

  after_save :update_budget_totals
  after_destroy :update_budget_totals

  def variance
    budgeted_amount.to_f - actual_amount.to_f
  end

  private

  def update_budget_totals
    budget.save # Triggers budget's calculate_totals callback
  end
end
```

---

## Phase 2: Controllers (3-5 Days)

### 2.1 Base Controller Setup

```ruby
# app/controllers/api/v1/presents/base_controller.rb
module Api
  module V1
    module Presents
      class BaseController < ApplicationController
        before_action :authorized
        before_action :check_presents_access

        private

        def check_presents_access
          unless @current_user.uses_presents? || @current_user.admin?
            render json: { error: 'Access denied. Presents product access required.' },
                   status: :forbidden
          end
        end

        def require_venue_owner
          unless @current_user.venue_owner? || @current_user.admin?
            render json: { error: 'Venue owner access required' }, status: :forbidden
          end
        end

        def require_vendor
          unless @current_user.vendor? || @current_user.admin?
            render json: { error: 'Vendor access required' }, status: :forbidden
          end
        end
      end
    end
  end
end
```

### 2.2 Organizations Controller

```ruby
# app/controllers/api/v1/presents/organizations_controller.rb
module Api
  module V1
    module Presents
      class OrganizationsController < BaseController
        skip_before_action :check_presents_access, only: [:index, :show]
        before_action :require_venue_owner, only: [:create, :update, :destroy]
        before_action :set_organization, only: [:show, :update, :destroy]

        def index
          organizations = Organization.active.includes(:user)
          organizations = organizations.verified if params[:verified] == 'true'

          render json: organizations.map { |org| OrganizationSerializer.new(org).basic }
        end

        def show
          render json: OrganizationSerializer.new(@organization).full
        end

        def create
          organization = @current_user.organizations.build(organization_params)

          if organization.save
            render json: OrganizationSerializer.new(organization).full, status: :created
          else
            render json: { errors: organization.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @organization.update(organization_params)
            render json: OrganizationSerializer.new(@organization).full
          else
            render json: { errors: @organization.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @organization.destroy
          head :no_content
        end

        private

        def set_organization
          @organization = Organization.find_by!(slug: params[:id])

          # Check ownership for update/destroy
          if action_name.in?(['update', 'destroy'])
            unless @organization.user_id == @current_user.id || @current_user.admin?
              render json: { error: 'Not authorized' }, status: :forbidden
            end
          end
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
```

### 2.3 Events Controller

```ruby
# app/controllers/api/v1/presents/events_controller.rb
module Api
  module V1
    module Presents
      class EventsController < BaseController
        skip_before_action :check_presents_access, only: [:index, :show]
        before_action :require_venue_owner, only: [:create, :update, :destroy]
        before_action :set_event, only: [:show, :update, :destroy]

        def index
          events = Event.includes(:organization)
          events = events.published unless @current_user&.admin?
          events = events.where(organization_id: params[:organization_id]) if params[:organization_id]

          events = if params[:status] == 'upcoming'
            events.upcoming
          elsif params[:status] == 'past'
            events.past
          else
            events.order(event_date: :desc)
          end

          render json: events.map { |event| EventSerializer.new(event).basic }
        end

        def show
          render json: EventSerializer.new(@event).full
        end

        def create
          organization = @current_user.organizations.find_by!(slug: params[:organization_id])
          event = organization.events.build(event_params)

          if event.save
            render json: EventSerializer.new(event).full, status: :created
          else
            render json: { errors: event.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @event.update(event_params)
            render json: EventSerializer.new(@event).full
          else
            render json: { errors: @event.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @event.destroy
          head :no_content
        end

        private

        def set_event
          @event = Event.find_by!(slug: params[:id])

          if action_name.in?(['update', 'destroy'])
            unless @event.organization.user_id == @current_user.id || @current_user.admin?
              render json: { error: 'Not authorized' }, status: :forbidden
            end
          end
        end

        def event_params
          params.require(:event).permit(
            :title, :description, :event_date, :event_end_date, :location,
            :poster_url, :ticket_url, :ticket_price, :capacity,
            :published, :registration_open, :status
          )
        end
      end
    end
  end
end
```

### 2.4 Vendors Controller

```ruby
# app/controllers/api/v1/presents/vendors_controller.rb
module Api
  module V1
    module Presents
      class VendorsController < BaseController
        skip_before_action :check_presents_access, only: [:index, :show, :search]
        before_action :require_vendor, only: [:create, :update, :destroy]
        before_action :set_vendor, only: [:show, :update, :destroy]

        def index
          vendors = Vendor.active.includes(:user)
          vendors = vendors.verified if params[:verified] == 'true'
          vendors = vendors.by_type(params[:vendor_type]) if params[:vendor_type]

          render json: vendors.map { |vendor| VendorSerializer.new(vendor).basic }
        end

        def search
          vendors = VendorSearchService.search(search_params)
          render json: vendors.map { |vendor| VendorSerializer.new(vendor).basic }
        end

        def show
          @vendor.increment_views!
          render json: VendorSerializer.new(@vendor).full
        end

        def create
          vendor = @current_user.vendors.build(vendor_params)

          if vendor.save
            render json: VendorSerializer.new(vendor).full, status: :created
          else
            render json: { errors: vendor.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @vendor.update(vendor_params)
            render json: VendorSerializer.new(@vendor).full
          else
            render json: { errors: @vendor.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @vendor.destroy
          head :no_content
        end

        private

        def set_vendor
          @vendor = Vendor.find_by!(slug: params[:id])

          if action_name.in?(['update', 'destroy'])
            unless @vendor.user_id == @current_user.id || @current_user.admin?
              render json: { error: 'Not authorized' }, status: :forbidden
            end
          end
        end

        def vendor_params
          params.require(:vendor).permit(
            :name, :vendor_type, :description, :logo_url, :website,
            :instagram_handle, :contact_email, :phone, :address,
            :city, :state, :zip_code, :latitude, :longitude,
            services: {}, pricing: {}
          )
        end

        def search_params
          params.permit(:query, :vendor_type, :city, :state, :verified)
        end
      end
    end
  end
end
```

### 2.5 Registrations Controller

```ruby
# app/controllers/api/v1/presents/registrations_controller.rb
module Api
  module V1
    module Presents
      class RegistrationsController < BaseController
        skip_before_action :authorized, only: [:create]
        skip_before_action :check_presents_access, only: [:create]
        before_action :set_event, only: [:create]
        before_action :set_registration, only: [:show, :update]

        def create
          unless @event.registration_open?
            return render json: { error: 'Registration is closed' }, status: :unprocessable_entity
          end

          if @event.full?
            return render json: { error: 'Event is at capacity' }, status: :unprocessable_entity
          end

          registration = @event.registrations.build(registration_params)
          registration.user = @current_user if @current_user
          registration.status = 'confirmed'

          if registration.save
            render json: RegistrationSerializer.new(registration).full, status: :created
          else
            render json: { errors: registration.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def show
          render json: RegistrationSerializer.new(@registration).full
        end

        def update
          if @registration.update(update_params)
            render json: RegistrationSerializer.new(@registration).full
          else
            render json: { errors: @registration.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def set_event
          @event = Event.find_by!(slug: params[:event_id])
        end

        def set_registration
          @registration = Registration.find(params[:id])

          unless @registration.user_id == @current_user&.id || @current_user&.admin?
            render json: { error: 'Not authorized' }, status: :forbidden
          end
        end

        def registration_params
          params.require(:registration).permit(:email, :name, :phone, :subscribed)
        end

        def update_params
          params.require(:registration).permit(:name, :phone)
        end
      end
    end
  end
end
```

### 2.6 Budgets Controller

```ruby
# app/controllers/api/v1/presents/budgets_controller.rb
module Api
  module V1
    module Presents
      class BudgetsController < BaseController
        before_action :set_budgetable, only: [:create]
        before_action :set_budget, only: [:show, :update, :destroy]

        def index
          budgets = @current_user.budgets.includes(:budgetable, :budget_line_items)
          render json: budgets.map { |budget| BudgetSerializer.new(budget).full }
        end

        def show
          render json: BudgetSerializer.new(@budget).full
        end

        def create
          budget = @budgetable.budgets.build(budget_params)
          budget.user = @current_user

          if budget.save
            render json: BudgetSerializer.new(budget).full, status: :created
          else
            render json: { errors: budget.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @budget.update(budget_params)
            render json: BudgetSerializer.new(@budget).full
          else
            render json: { errors: @budget.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @budget.destroy
          head :no_content
        end

        private

        def set_budgetable
          if params[:event_id]
            @budgetable = Event.find_by!(slug: params[:event_id])
          elsif params[:organization_id]
            @budgetable = Organization.find_by!(slug: params[:organization_id])
          else
            render json: { error: 'Must specify event_id or organization_id' }, status: :bad_request
          end
        end

        def set_budget
          @budget = @current_user.budgets.find(params[:id])
        end

        def budget_params
          params.require(:budget).permit(:title, :total_amount, :status)
        end
      end
    end
  end
end
```

---

## Phase 3: Serializers (1-2 Days)

### 3.1 Organization Serializer

```ruby
# app/serializers/organization_serializer.rb
class OrganizationSerializer < BaseSerializer
  def basic
    {
      id: object.id,
      name: object.name,
      slug: object.slug,
      logo_url: object.logo_url,
      city: object.city,
      state: object.state,
      verified: object.verified,
      created_at: object.created_at
    }
  end

  def full
    basic.merge(
      description: object.description,
      website: object.website,
      instagram_handle: object.instagram_handle,
      phone: object.phone,
      email: object.email,
      address: object.address,
      zip_code: object.zip_code,
      latitude: object.latitude,
      longitude: object.longitude,
      owner: user_basic(object.user),
      events_count: object.events.count,
      upcoming_events_count: object.events.upcoming.count,
      updated_at: object.updated_at
    )
  end
end
```

### 3.2 Event Serializer

```ruby
# app/serializers/event_serializer.rb
class EventSerializer < BaseSerializer
  def basic
    {
      id: object.id,
      title: object.title,
      slug: object.slug,
      description: object.description&.truncate(200),
      event_date: object.event_date,
      poster_url: object.poster_url,
      organization: OrganizationSerializer.new(object.organization).basic,
      registered_count: object.registered_count,
      capacity: object.capacity,
      spots_remaining: object.spots_remaining,
      status: object.status,
      created_at: object.created_at
    }
  end

  def full
    basic.merge(
      description: object.description, # full description
      event_end_date: object.event_end_date,
      location: object.location,
      ticket_url: object.ticket_url,
      ticket_price: object.ticket_price,
      published: object.published,
      registration_open: object.registration_open,
      is_full: object.full?,
      updated_at: object.updated_at
    )
  end
end
```

### 3.3 Vendor Serializer

```ruby
# app/serializers/vendor_serializer.rb
class VendorSerializer < BaseSerializer
  def basic
    {
      id: object.id,
      name: object.name,
      slug: object.slug,
      vendor_type: object.vendor_type,
      logo_url: object.logo_url,
      city: object.city,
      state: object.state,
      verified: object.verified,
      rating: object.rating,
      views_count: object.views_count,
      created_at: object.created_at
    }
  end

  def full
    basic.merge(
      description: object.description,
      website: object.website,
      instagram_handle: object.instagram_handle,
      contact_email: object.contact_email,
      phone: object.phone,
      services: object.services,
      pricing: object.pricing,
      address: object.address,
      zip_code: object.zip_code,
      latitude: object.latitude,
      longitude: object.longitude,
      owner: user_basic(object.user),
      updated_at: object.updated_at
    )
  end
end
```

### 3.4 Registration Serializer

```ruby
# app/serializers/registration_serializer.rb
class RegistrationSerializer < BaseSerializer
  def full
    {
      id: object.id,
      event: EventSerializer.new(object.event).basic,
      email: object.email,
      name: object.name,
      phone: object.phone,
      ticket_code: object.ticket_code,
      qr_code_url: object.qr_code_url,
      status: object.status,
      checked_in: object.checked_in,
      checked_in_at: object.checked_in_at,
      subscribed: object.subscribed,
      created_at: object.created_at
    }
  end
end
```

### 3.5 Budget Serializer

```ruby
# app/serializers/budget_serializer.rb
class BudgetSerializer < BaseSerializer
  def full
    {
      id: object.id,
      budgetable_type: object.budgetable_type,
      budgetable_id: object.budgetable_id,
      title: object.title,
      total_amount: object.total_amount,
      spent_amount: object.spent_amount,
      remaining_amount: object.remaining_amount,
      percentage_spent: object.percentage_spent,
      status: object.status,
      line_items: object.budget_line_items.map { |item| line_item_basic(item) },
      created_at: object.created_at,
      updated_at: object.updated_at
    }
  end

  private

  def line_item_basic(item)
    {
      id: item.id,
      name: item.name,
      category: item.category,
      budgeted_amount: item.budgeted_amount,
      actual_amount: item.actual_amount,
      variance: item.variance,
      vendor: item.vendor ? VendorSerializer.new(item.vendor).basic : nil
    }
  end
end
```

---

## Phase 4: Services (2-3 Days)

### 4.1 Vendor Search Service

```ruby
# app/services/vendor_search_service.rb
class VendorSearchService
  def self.search(filters)
    vendors = Vendor.active.includes(:user)

    # Filter by vendor type
    vendors = vendors.by_type(filters[:vendor_type]) if filters[:vendor_type].present?

    # Text search
    if filters[:query].present?
      query = "%#{filters[:query]}%"
      vendors = vendors.where(
        "name ILIKE ? OR description ILIKE ? OR services::text ILIKE ?",
        query, query, query
      )
    end

    # Location filters
    vendors = vendors.where(city: filters[:city]) if filters[:city].present?
    vendors = vendors.where(state: filters[:state]) if filters[:state].present?

    # Verified filter
    vendors = vendors.verified if filters[:verified] == 'true'

    # Sorting
    vendors = case filters[:sort]
    when 'rating'
      vendors.order(rating: :desc)
    when 'views'
      vendors.order(views_count: :desc)
    else
      vendors.order(created_at: :desc)
    end

    vendors
  end
end
```

### 4.2 Registration Email Service

```ruby
# app/services/registration_email_service.rb
class RegistrationEmailService < BaseEmailService
  def self.send_confirmation(registration)
    return unless registration.email.present?

    event = registration.event
    organization = event.organization

    mail = SendGrid::Mail.new
    mail.from = SendGrid::Email.new(email: 'noreply@voxxy.com', name: 'Voxxy Presents')
    mail.subject = "You're registered for #{event.title}!"

    personalization = SendGrid::Personalization.new
    personalization.add_to(SendGrid::Email.new(email: registration.email, name: registration.name))

    # Dynamic template data
    personalization.add_dynamic_template_data({
      event_title: event.title,
      event_date: event.event_date.strftime('%B %d, %Y at %I:%M %p'),
      event_location: event.location,
      organization_name: organization.name,
      ticket_code: registration.ticket_code,
      qr_code_url: registration.qr_code_url,
      event_url: "#{app_url}/events/#{event.slug}"
    })

    mail.add_personalization(personalization)
    mail.template_id = ENV['SENDGRID_REGISTRATION_TEMPLATE_ID']

    send_email(mail)
  end

  def self.send_reminder(registration)
    # Send event reminder 24 hours before
    # Similar structure to send_confirmation
  end
end
```

### 4.3 Event Notification Service

```ruby
# app/services/event_notification_service.rb
class EventNotificationService
  def self.notify_new_registration(registration)
    event = registration.event
    organization = event.organization
    owner = organization.user

    # Create in-app notification for organization owner
    Notification.create!(
      user: owner,
      title: 'New Event Registration',
      body: "#{registration.name || registration.email} registered for #{event.title}",
      notification_type: 'registration',
      data: {
        registration_id: registration.id,
        event_id: event.id
      }
    )

    # Send push notification if enabled
    if owner.push_notifications && owner.push_token.present?
      PushNotificationService.send_notification(
        owner.push_token,
        owner.platform,
        'New Registration',
        "Someone registered for #{event.title}"
      )
    end
  end

  def self.notify_event_published(event)
    # Notify followers/subscribers when event is published
  end
end
```

---

## Phase 5: Shared Infrastructure Updates (2-3 Days)

### 5.1 Update User Serializer

```ruby
# app/serializers/user_serializer.rb
class UserSerializer < BaseSerializer
  def basic
    {
      id: object.id,
      name: object.name,
      username: object.username,
      email: object.email,
      role: object.role,
      avatar: object.avatar,
      created_at: object.created_at
    }
  end

  def full
    basic.merge(
      product_context: object.product_context,
      confirmed_at: object.confirmed_at,
      # Mobile-specific fields
      favorite_food: object.favorite_food,
      bar_preferences: object.bar_preferences,
      neighborhood: object.neighborhood,
      city: object.city,
      state: object.state,
      # Notification preferences
      push_notifications: object.push_notifications,
      email_notifications: object.email_notifications,
      text_notifications: object.text_notifications,
      # Presents-specific
      organizations: object.organizations.map { |org| OrganizationSerializer.new(org).basic },
      vendors: object.vendors.map { |vendor| VendorSerializer.new(vendor).basic }
    )
  end

  def mobile_context
    basic.merge(
      favorite_food: object.favorite_food,
      bar_preferences: object.bar_preferences,
      neighborhood: object.neighborhood,
      latitude: object.latitude,
      longitude: object.longitude
    )
  end

  def presents_context
    basic.merge(
      organizations: object.organizations.map { |org| OrganizationSerializer.new(org).basic },
      vendors: object.vendors.map { |vendor| VendorSerializer.new(vendor).basic }
    )
  end
end
```

### 5.2 Update Sessions Controller

```ruby
# app/controllers/api/v1/shared/sessions_controller.rb
module Api
  module V1
    module Shared
      class SessionsController < ApplicationController
        skip_before_action :authorized, only: [:create]

        def create
          user = User.find_by(email: params[:email])

          if user&.authenticate(params[:password])
            if user.confirmed_at.nil?
              return render json: { error: 'Please verify your email first' }, status: :unauthorized
            end

            token = JsonWebToken.encode(user_id: user.id)

            # Determine product context from login source
            product_context = params[:product] || 'mobile'
            user.update(product_context: product_context) if user.product_context.nil?

            render json: {
              token: token,
              user: UserSerializer.new(user).full
            }
          else
            render json: { error: 'Invalid email or password' }, status: :unauthorized
          end
        end

        def destroy
          session[:user_id] = nil if session[:user_id]
          render json: { message: 'Logged out successfully' }
        end
      end
    end
  end
end
```

### 5.3 Update Users Controller

```ruby
# app/controllers/api/v1/shared/users_controller.rb
module Api
  module V1
    module Shared
      class UsersController < ApplicationController
        skip_before_action :authorized, only: [:create]
        before_action :set_user, only: [:show, :update]

        def create
          user = User.new(user_params)
          user.role = params[:role] || 'consumer'
          user.product_context = params[:product] || 'mobile'

          if user.save
            EmailVerificationService.send_verification_email(user)
            token = JsonWebToken.encode(user_id: user.id)

            render json: {
              token: token,
              user: UserSerializer.new(user).full
            }, status: :created
          else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def show
          render json: UserSerializer.new(@user).full
        end

        def me
          render json: UserSerializer.new(@current_user).full
        end

        def update
          if @user.update(update_params)
            render json: UserSerializer.new(@user).full
          else
            render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def set_user
          @user = params[:id] == 'me' ? @current_user : User.find(params[:id])

          unless @user.id == @current_user.id || @current_user.admin?
            render json: { error: 'Not authorized' }, status: :forbidden
          end
        end

        def user_params
          params.require(:user).permit(
            :name, :email, :username, :password, :password_confirmation,
            :avatar, :city, :state, :neighborhood
          )
        end

        def update_params
          params.require(:user).permit(
            :name, :username, :avatar, :city, :state, :neighborhood,
            :favorite_food, :bar_preferences,
            :push_notifications, :email_notifications, :text_notifications,
            :push_token, :platform
          )
        end
      end
    end
  end
end
```

---

## Phase 6: Testing (2-3 Days)

### 6.1 Model Tests

```ruby
# spec/models/organization_spec.rb
require 'rails_helper'

RSpec.describe Organization, type: :model do
  it { should belong_to(:user) }
  it { should have_many(:events) }
  it { should validate_presence_of(:name) }
  it { should validate_presence_of(:slug) }
  it { should validate_uniqueness_of(:slug) }

  describe 'slug generation' do
    it 'generates slug from name on create' do
      org = create(:organization, name: 'Test Venue')
      expect(org.slug).to eq('test-venue')
    end
  end
end

# spec/models/event_spec.rb
require 'rails_helper'

RSpec.describe Event, type: :model do
  it { should belong_to(:organization) }
  it { should have_many(:registrations) }
  it { should validate_presence_of(:title) }

  describe '#full?' do
    it 'returns true when at capacity' do
      event = create(:event, capacity: 10, registered_count: 10)
      expect(event.full?).to be true
    end

    it 'returns false when below capacity' do
      event = create(:event, capacity: 10, registered_count: 5)
      expect(event.full?).to be false
    end
  end
end
```

### 6.2 Controller Tests

```ruby
# spec/requests/api/v1/presents/organizations_spec.rb
require 'rails_helper'

RSpec.describe 'Api::V1::Presents::Organizations', type: :request do
  let(:venue_owner) { create(:user, role: 'venue_owner') }
  let(:auth_headers) { { 'Authorization' => "Bearer #{JsonWebToken.encode(user_id: venue_owner.id)}" } }

  describe 'GET /api/v1/presents/organizations' do
    it 'returns all active organizations' do
      create_list(:organization, 3)

      get '/api/v1/presents/organizations'

      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body).count).to eq(3)
    end
  end

  describe 'POST /api/v1/presents/organizations' do
    it 'creates organization for venue owner' do
      org_params = { organization: { name: 'Test Venue', description: 'A test venue' } }

      post '/api/v1/presents/organizations', params: org_params, headers: auth_headers

      expect(response).to have_http_status(:created)
      expect(Organization.count).to eq(1)
    end
  end
end
```

### 6.3 Integration Tests

```ruby
# spec/integration/event_registration_flow_spec.rb
require 'rails_helper'

RSpec.describe 'Event Registration Flow', type: :request do
  let!(:organization) { create(:organization) }
  let!(:event) { create(:event, organization: organization, capacity: 100) }

  it 'allows guest to register for event' do
    registration_params = {
      registration: {
        email: 'guest@example.com',
        name: 'Test Guest'
      }
    }

    post "/api/v1/presents/events/#{event.slug}/registrations", params: registration_params

    expect(response).to have_http_status(:created)
    expect(event.reload.registered_count).to eq(1)
    expect(Registration.last.ticket_code).to be_present
  end

  it 'prevents registration when event is full' do
    event.update(capacity: 1, registered_count: 1)

    post "/api/v1/presents/events/#{event.slug}/registrations",
         params: { registration: { email: 'test@example.com' } }

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)['error']).to include('capacity')
  end
end
```

---

## Phase 7: Deployment & Documentation (1-2 Days)

### 7.1 Environment Variables

```bash
# .env
# Existing variables
SENDGRID_API_KEY=your_key
OPENAI_API_KEY=your_key
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_key

# NEW - Presents-specific
PRESENTS_DEFAULT_EVENT_CAPACITY=500
PRESENTS_REGISTRATION_CUTOFF_HOURS=2
```

### 7.2 Database Seeds

```ruby
# db/seeds.rb

# Create admin user
admin = User.create!(
  name: 'Admin',
  email: 'admin@voxxy.com',
  password: 'password',
  role: 'admin',
  confirmed_at: Time.current
)

# Create venue owner
venue_owner = User.create!(
  name: 'Venue Owner',
  email: 'venue@voxxy.com',
  password: 'password',
  role: 'venue_owner',
  product_context: 'presents',
  confirmed_at: Time.current
)

# Create organization
org = Organization.create!(
  user: venue_owner,
  name: 'The Grand Ballroom',
  description: 'Premier event venue in downtown',
  city: 'New York',
  state: 'NY',
  verified: true
)

# Create event
event = Event.create!(
  organization: org,
  title: 'Summer Music Festival',
  description: 'Join us for an amazing night of music',
  event_date: 2.weeks.from_now,
  location: '123 Main St, New York, NY',
  capacity: 500,
  published: true
)

# Create vendor
vendor_user = User.create!(
  name: 'Vendor User',
  email: 'vendor@voxxy.com',
  password: 'password',
  role: 'vendor',
  product_context: 'presents',
  confirmed_at: Time.current
)

Vendor.create!(
  user: vendor_user,
  name: 'Elite Catering Co',
  vendor_type: 'catering',
  description: 'Full-service catering for events of all sizes',
  city: 'New York',
  state: 'NY',
  verified: true
)

puts "✅ Seed data created successfully!"
```

### 7.3 API Documentation

Create a simple API docs file:

```markdown
# Voxxy Presents API Documentation

## Authentication
All authenticated endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Organizations

**List Organizations**
```
GET /api/v1/presents/organizations
Query params: ?verified=true
```

**Get Organization**
```
GET /api/v1/presents/organizations/:slug
```

**Create Organization** (Venue Owner only)
```
POST /api/v1/presents/organizations
Body: {
  "organization": {
    "name": "Venue Name",
    "description": "Description",
    "city": "New York",
    "state": "NY"
  }
}
```

### Events

**List Events**
```
GET /api/v1/presents/events
Query params: ?status=upcoming&organization_id=123
```

**Get Event**
```
GET /api/v1/presents/events/:slug
```

**Create Event** (Venue Owner only)
```
POST /api/v1/presents/organizations/:org_slug/events
Body: {
  "event": {
    "title": "Event Title",
    "description": "Description",
    "event_date": "2025-12-01T19:00:00Z",
    "capacity": 100
  }
}
```

### Vendors

**Search Vendors**
```
GET /api/v1/presents/vendors/search
Query params: ?query=catering&vendor_type=catering&city=New York
```

**Get Vendor**
```
GET /api/v1/presents/vendors/:slug
```

### Registrations

**Register for Event** (Public)
```
POST /api/v1/presents/events/:event_slug/registrations
Body: {
  "registration": {
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## Response Formats

All responses follow this structure:

**Success:**
```json
{
  "id": 1,
  "name": "Value",
  ...
}
```

**Error:**
```json
{
  "error": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```
```

---

## Shared Infrastructure Benefits

### What You're Reusing

✅ **Authentication** - Existing JWT/session system
✅ **Email Service** - SendGrid integration (`BaseEmailService`)
✅ **Push Notifications** - `PushNotificationService`
✅ **File Uploads** - S3 configuration for logos/posters
✅ **Background Jobs** - Sidekiq for async tasks
✅ **Admin Panel** - Extend existing admin for Presents moderation
✅ **Rate Limiting** - rack-attack already configured
✅ **CORS** - Existing CORS setup
✅ **Error Handling** - Existing error handling patterns
✅ **Logging** - Existing logging infrastructure

### No Additional Gems Needed

Everything you need is already in your Gemfile:
- `bcrypt` - Password hashing
- `jwt` - JWT tokens
- `sendgrid-ruby` - Emails
- `aws-sdk-s3` - File storage
- `sidekiq` - Background jobs
- `rack-cors` - CORS
- `pg` - PostgreSQL

---

## Folder Structure

```
voxxy-rails/
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb (shared auth)
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── mobile/ (existing, migrate here)
│   │   │       │   ├── activities_controller.rb
│   │   │       │   ├── openai_controller.rb
│   │   │       │   └── ...
│   │   │       ├── presents/ (NEW)
│   │   │       │   ├── base_controller.rb
│   │   │       │   ├── organizations_controller.rb
│   │   │       │   ├── events_controller.rb
│   │   │       │   ├── vendors_controller.rb
│   │   │       │   ├── registrations_controller.rb
│   │   │       │   └── budgets_controller.rb
│   │   │       └── shared/ (NEW)
│   │   │           ├── sessions_controller.rb
│   │   │           ├── users_controller.rb
│   │   │           └── notifications_controller.rb
│   │   └── admin/
│   │
│   ├── models/
│   │   ├── user.rb (shared, updated)
│   │   ├── activity.rb (mobile)
│   │   ├── organization.rb (presents - NEW)
│   │   ├── event.rb (presents - NEW)
│   │   ├── vendor.rb (presents - NEW)
│   │   ├── registration.rb (presents - NEW)
│   │   └── budget.rb (presents - NEW)
│   │
│   ├── services/
│   │   ├── base_email_service.rb (shared)
│   │   ├── openai_controller.rb (mobile)
│   │   ├── vendor_search_service.rb (presents - NEW)
│   │   ├── registration_email_service.rb (presents - NEW)
│   │   └── event_notification_service.rb (presents - NEW)
│   │
│   └── serializers/
│       ├── user_serializer.rb (shared, updated)
│       ├── activity_serializer.rb (mobile)
│       ├── organization_serializer.rb (presents - NEW)
│       ├── event_serializer.rb (presents - NEW)
│       ├── vendor_serializer.rb (presents - NEW)
│       └── registration_serializer.rb (presents - NEW)
│
├── db/
│   ├── migrate/
│   │   └── (10 new migrations for Presents tables)
│   └── schema.rb
│
├── config/
│   └── routes.rb (updated with namespacing)
│
└── spec/
    ├── models/ (NEW tests)
    ├── requests/ (NEW tests)
    └── integration/ (NEW tests)
```

---

## Migration Checklist

### Week 1: Foundation
- [ ] Run `rails db:migrate` for all Presents tables
- [ ] Update User model with roles and associations
- [ ] Create Presents models (Organization, Event, Vendor, Registration, Budget)
- [ ] Add API versioning to routes
- [ ] Test basic model validations

### Week 2: Core Features
- [ ] Build Presents controllers (Organizations, Events, Vendors)
- [ ] Create serializers for all Presents models
- [ ] Implement VendorSearchService
- [ ] Add authorization checks (venue_owner, vendor roles)
- [ ] Test all CRUD operations

### Week 3: Polish & Deploy
- [ ] Add registration email notifications
- [ ] Write unit tests for models
- [ ] Write integration tests for key flows
- [ ] Seed database with sample data
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Deploy to production

---

## Future Enhancements (Post-MVP)

### Phase 2 (Month 2-3)
- [ ] Vendor-Event connections (junction table)
- [ ] Vendor reviews and ratings
- [ ] Event analytics dashboard
- [ ] Waitlist for sold-out events
- [ ] QR code generation for tickets

### Phase 3 (Month 3-6)
- [ ] Payment processing (Stripe integration)
- [ ] Vendor marketplace search filters
- [ ] Event promotion tools
- [ ] Email campaigns for events
- [ ] Mobile app for event check-in

### Cross-Product Features (Month 6+)
- [ ] Show Presents venues in Mobile recommendations
- [ ] Unified user profiles (consumer + venue owner)
- [ ] Cross-product notifications
- [ ] Consolidated admin dashboard

---

## Success Metrics

Track these metrics post-launch:

**Adoption:**
- Number of venue owners signed up
- Number of vendors listed
- Number of events created
- Number of registrations

**Engagement:**
- Events per organization (avg)
- Registrations per event (avg)
- Vendor search queries
- Vendor profile views

**Technical:**
- API response times
- Error rates
- Database query performance
- Background job success rate

---

## Questions & Support

**Technical Questions:**
- Review this document
- Check API documentation
- Review existing Mobile codebase patterns

**Architecture Decisions:**
- Follow existing Rails conventions
- Reuse services and patterns from Mobile
- Keep products logically separated but infrastructure shared

---

## Summary

**Approach:** Build Voxxy Presents directly into Rails (no Firebase, no integration complexity)

**Timeline:** 2-3 weeks to production

**Key Benefits:**
- ✅ Shared authentication and user management
- ✅ Reuse email, notifications, file storage
- ✅ One database, one codebase, one deployment
- ✅ Easy to add cross-product features later

**Next Step:** Run migrations and start building!

```bash
# Get started:
rails db:migrate
rails db:seed
rails s
```

Your Presents API will be live at `/api/v1/presents/*` 🚀
