# Controller Migration Examples

## How Namespaced Controllers Work

This document shows concrete examples of how controllers work in the new namespaced structure.

## Basic Example: Presents Base Controller

**File:** `app/controllers/api/v1/presents/base_controller.rb`

```ruby
module Api
  module V1
    module Presents
      class BaseController < ApplicationController
        # All Presents controllers inherit from this
        before_action :authorized
        before_action :check_presents_access

        private

        def check_presents_access
          unless @current_user.uses_presents? || @current_user.admin?
            render json: { error: 'Access denied' }, status: :forbidden
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

**How it works:**
- Route: Any route under `/api/v1/presents/*`
- Rails looks for: `app/controllers/api/v1/presents/`
- Class modules: `Api::V1::Presents`

## Example: Organizations Controller

**File:** `app/controllers/api/v1/presents/organizations_controller.rb`

```ruby
module Api
  module V1
    module Presents
      class OrganizationsController < BaseController
        # Skip auth for public endpoints
        skip_before_action :check_presents_access, only: [:index, :show]
        before_action :require_venue_owner, only: [:create, :update, :destroy]
        before_action :set_organization, only: [:show, :update, :destroy]

        # GET /api/v1/presents/organizations
        def index
          organizations = Organization.active.includes(:user)
          organizations = organizations.verified if params[:verified] == 'true'

          render json: organizations.map { |org| OrganizationSerializer.new(org).basic }
        end

        # GET /api/v1/presents/organizations/:slug
        def show
          render json: OrganizationSerializer.new(@organization).full
        end

        # POST /api/v1/presents/organizations
        def create
          organization = @current_user.organizations.build(organization_params)

          if organization.save
            render json: OrganizationSerializer.new(organization).full, status: :created
          else
            render json: { errors: organization.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/presents/organizations/:slug
        def update
          if @organization.update(organization_params)
            render json: OrganizationSerializer.new(@organization).full
          else
            render json: { errors: @organization.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/organizations/:slug
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

**Route mapping:**
```
POST /api/v1/presents/organizations
  ↓
Looks for: app/controllers/api/v1/presents/organizations_controller.rb
  ↓
Finds class: Api::V1::Presents::OrganizationsController
  ↓
Calls method: #create
```

## Example: Events Controller (Nested Routes)

**File:** `app/controllers/api/v1/presents/events_controller.rb`

```ruby
module Api
  module V1
    module Presents
      class EventsController < BaseController
        skip_before_action :check_presents_access, only: [:index, :show]
        before_action :require_venue_owner, only: [:create, :update, :destroy]
        before_action :set_event, only: [:show, :update, :destroy]

        # GET /api/v1/presents/events
        # GET /api/v1/presents/organizations/:organization_id/events
        def index
          events = Event.includes(:organization)
          events = events.published unless @current_user&.admin?

          # Support nested route
          if params[:organization_id]
            events = events.where(organization_id: params[:organization_id])
          end

          events = if params[:status] == 'upcoming'
            events.upcoming
          elsif params[:status] == 'past'
            events.past
          else
            events.order(event_date: :desc)
          end

          render json: events.map { |event| EventSerializer.new(event).basic }
        end

        # GET /api/v1/presents/events/:slug
        def show
          render json: EventSerializer.new(@event).full
        end

        # POST /api/v1/presents/organizations/:organization_id/events
        def create
          organization = @current_user.organizations.find_by!(slug: params[:organization_id])
          event = organization.events.build(event_params)

          if event.save
            render json: EventSerializer.new(event).full, status: :created
          else
            render json: { errors: event.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/presents/events/:slug
        def update
          if @event.update(event_params)
            render json: EventSerializer.new(@event).full
          else
            render json: { errors: @event.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/events/:slug
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

**Route mapping for nested routes:**
```
POST /api/v1/presents/organizations/my-venue/events
  ↓
Looks for: app/controllers/api/v1/presents/events_controller.rb
  ↓
Finds class: Api::V1::Presents::EventsController
  ↓
Calls method: #create
  ↓
With params: { organization_id: "my-venue", event: {...} }
```

## Comparison: Legacy vs Namespaced

### Legacy Controller (Current)

**File:** `app/controllers/activities_controller.rb`

```ruby
class ActivitiesController < ApplicationController
  before_action :authorized

  def index
    @activities = current_user.activities
    render json: @activities
  end

  def create
    activity = current_user.activities.build(activity_params)
    if activity.save
      render json: activity, status: :created
    else
      render json: { errors: activity.errors }, status: :unprocessable_entity
    end
  end

  private

  def activity_params
    params.require(:activity).permit(:activity_name, :activity_location, ...)
  end
end
```

**Route:** `GET /activities`

### Namespaced Controller (New)

**File:** `app/controllers/api/v1/mobile/activities_controller.rb`

```ruby
module Api
  module V1
    module Mobile
      class ActivitiesController < ApplicationController
        before_action :authorized

        def index
          @activities = current_user.activities
          render json: @activities
        end

        def create
          activity = current_user.activities.build(activity_params)
          if activity.save
            render json: activity, status: :created
          else
            render json: { errors: activity.errors }, status: :unprocessable_entity
          end
        end

        private

        def activity_params
          params.require(:activity).permit(:activity_name, :activity_location, ...)
        end
      end
    end
  end
end
```

**Route:** `GET /api/v1/mobile/activities`

**Notice:** The code inside is identical! Only the wrapper modules and file location changed.

## Shared Controller Example

**File:** `app/controllers/api/v1/shared/sessions_controller.rb`

```ruby
module Api
  module V1
    module Shared
      class SessionsController < ApplicationController
        skip_before_action :authorized, only: [:create]

        # POST /api/v1/shared/login
        def create
          user = User.find_by(email: params[:email])

          if user&.authenticate(params[:password])
            if user.confirmed_at.nil?
              return render json: { error: 'Please verify your email' },
                            status: :unauthorized
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
            render json: { error: 'Invalid credentials' }, status: :unauthorized
          end
        end

        # DELETE /api/v1/shared/logout
        def destroy
          # Handle logout
          render json: { message: 'Logged out successfully' }
        end
      end
    end
  end
end
```

**This controller is used by both:**
- Mobile app: `POST /api/v1/shared/login` with `product: "mobile"`
- Presents app: `POST /api/v1/shared/login` with `product: "presents"`

## Migration Strategy

### Phase 1: Keep Both (NOW)

```ruby
# Legacy (keep working)
class ActivitiesController < ApplicationController
  def index
    # ...
  end
end

# New (add when ready)
module Api::V1::Mobile
  class ActivitiesController < ApplicationController
    def index
      # Same code as legacy
    end
  end
end
```

**Both routes work:**
- `GET /activities` → Legacy controller
- `GET /api/v1/mobile/activities` → New controller

### Phase 2: Extract Shared Logic

```ruby
# app/services/activities_service.rb
class ActivitiesService
  def self.fetch_user_activities(user, filters = {})
    activities = user.activities
    activities = activities.where(active: true) if filters[:active_only]
    activities.order(created_at: :desc)
  end

  def self.create_activity(user, params)
    activity = user.activities.build(params)
    activity.save
    activity
  end
end

# Legacy controller (simplified)
class ActivitiesController < ApplicationController
  def index
    @activities = ActivitiesService.fetch_user_activities(current_user)
    render json: @activities
  end

  def create
    activity = ActivitiesService.create_activity(current_user, activity_params)
    if activity.persisted?
      render json: activity, status: :created
    else
      render json: { errors: activity.errors }, status: :unprocessable_entity
    end
  end
end

# New namespaced controller (same logic)
module Api::V1::Mobile
  class ActivitiesController < ApplicationController
    def index
      @activities = ActivitiesService.fetch_user_activities(current_user)
      render json: @activities
    end

    def create
      activity = ActivitiesService.create_activity(current_user, activity_params)
      if activity.persisted?
        render json: activity, status: :created
      else
        render json: { errors: activity.errors }, status: :unprocessable_entity
      end
    end
  end
end
```

### Phase 3: Deprecate Legacy (LATER)

Once mobile app fully migrated:
1. Remove legacy routes from `routes.rb`
2. Delete legacy controller files
3. Keep only namespaced controllers

## Summary

### Key Points:

1. **Route → File Path Mapping**
   - `/api/v1/mobile/activities` → `app/controllers/api/v1/mobile/activities_controller.rb`
   - The namespace structure MUST match the module structure

2. **No Immediate Migration Required**
   - Legacy controllers continue working
   - Add new controllers when ready
   - Both can coexist

3. **Module Nesting**
   - Each namespace level = one module
   - `Api::V1::Mobile::ActivitiesController` = 3 nested modules

4. **Inheritance**
   - Mobile controllers → inherit from `ApplicationController`
   - Presents controllers → inherit from `Api::V1::Presents::BaseController`
   - Shared controllers → inherit from `ApplicationController`

5. **Authorization**
   - Each namespace can have different auth rules
   - Base controllers handle product-specific authorization
   - Shared controllers = minimal auth (just login check)

## Testing Your Understanding

Try to answer:

1. **Q:** If I have a route `GET /api/v1/presents/vendors`, where should the controller file be?
   **A:** `app/controllers/api/v1/presents/vendors_controller.rb`

2. **Q:** What would the class definition look like?
   **A:**
   ```ruby
   module Api
     module V1
       module Presents
         class VendorsController < BaseController
         end
       end
     end
   end
   ```

3. **Q:** Can I keep my existing `ActivitiesController` at `app/controllers/activities_controller.rb`?
   **A:** Yes! It still works for route `GET /activities`

4. **Q:** Do both controllers (legacy and namespaced) need the same code?
   **A:** Not necessarily. You can share logic via services/concerns, or keep them separate initially.
