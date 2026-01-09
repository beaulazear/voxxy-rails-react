# API Namespacing & Versioning Guide

## What is Namespacing?

**Namespacing** is a way to organize code into logical groups to prevent naming conflicts and improve code organization. In Rails, it allows you to:

1. **Group related routes** under a common path prefix (e.g., `/api/v1/mobile/*`)
2. **Organize controllers** into matching folder structures
3. **Version your API** so you can make breaking changes without affecting existing clients
4. **Create clear boundaries** between different products or features

## Why We Use Namespacing

### 1. **API Versioning**
```ruby
# Version 1 (current)
GET /api/v1/activities  # Returns data in current format

# Future: Version 2 (when you need breaking changes)
GET /api/v2/activities  # Returns data in new format

# Old mobile apps continue working with v1!
```

### 2. **Product Separation**
We're building two products in one codebase:
- **Mobile** - Consumer app for activity planning
- **Presents** - Venue/events management platform

```ruby
# Mobile product
/api/v1/mobile/activities
/api/v1/mobile/recommendations

# Presents product
/api/v1/presents/events
/api/v1/presents/vendors

# Shared across both
/api/v1/shared/login
/api/v1/shared/users
```

### 3. **Clear Authorization**
Each namespace can have different authorization rules:
- Mobile routes → require `consumer` role
- Presents routes → require `venue_owner` or `vendor` role
- Shared routes → available to all authenticated users

### 4. **Better Organization**
```
app/controllers/
├── api/
│   └── v1/
│       ├── mobile/          # All mobile controllers
│       ├── presents/        # All Presents controllers
│       └── shared/          # Shared controllers
```

## Current Route Structure

### Legacy Routes (Temporary - Backward Compatibility)
These routes still work for existing mobile clients that haven't updated:
- `POST /login`
- `GET /activities`
- `POST /activities/:id/comments`
- etc.

**Status:** Will be deprecated once mobile clients migrate to versioned API.

### New Versioned Routes

#### Mobile Product Routes
**Base:** `/api/v1/mobile/*`

Examples:
- `GET /api/v1/mobile/activities` → List all activities
- `POST /api/v1/mobile/activities` → Create activity
- `POST /api/v1/mobile/openai/restaurant_recommendations` → Get AI recommendations
- `GET /api/v1/mobile/user_activities/community_feed` → View community feed

#### Presents Product Routes (New)
**Base:** `/api/v1/presents/*`

Examples:
- `GET /api/v1/presents/organizations` → List venues
- `POST /api/v1/presents/events` → Create event
- `GET /api/v1/presents/vendors/search` → Search vendors
- `POST /api/v1/presents/events/:id/registrations` → Register for event

#### Shared Routes
**Base:** `/api/v1/shared/*`

Examples:
- `POST /api/v1/shared/login` → Login (works for both products)
- `GET /api/v1/shared/me` → Get current user
- `POST /api/v1/shared/users` → Create user account
- `PUT /api/v1/shared/notifications/:id/mark_as_read` → Mark notification as read

## Controller Structure

### Directory Layout
```
app/controllers/
├── api/
│   └── v1/
│       ├── mobile/
│       │   ├── activities_controller.rb
│       │   ├── openai_controller.rb
│       │   ├── user_activities_controller.rb
│       │   └── ... (all mobile controllers)
│       │
│       ├── presents/
│       │   ├── base_controller.rb
│       │   ├── organizations_controller.rb
│       │   ├── events_controller.rb
│       │   ├── vendors_controller.rb
│       │   └── registrations_controller.rb
│       │
│       └── shared/
│           ├── sessions_controller.rb
│           ├── users_controller.rb
│           └── notifications_controller.rb
│
└── (legacy controllers remain here temporarily)
```

### Controller Namespacing Example

**File:** `app/controllers/api/v1/mobile/activities_controller.rb`

```ruby
module Api
  module V1
    module Mobile
      class ActivitiesController < ApplicationController
        # Your controller code here

        def index
          # GET /api/v1/mobile/activities
          activities = Activity.all
          render json: activities
        end
      end
    end
  end
end
```

**File:** `app/controllers/api/v1/presents/events_controller.rb`

```ruby
module Api
  module V1
    module Presents
      class EventsController < BaseController
        # Presents-specific authorization
        before_action :require_venue_owner, only: [:create, :update]

        def index
          # GET /api/v1/presents/events
          events = Event.published
          render json: events
        end
      end
    end
  end
end
```

## Migration Strategy for Mobile Clients

### Phase 1: Dual Support (Current)
- ✅ Both legacy and versioned routes work
- Mobile app can continue using old routes
- New features use versioned routes

### Phase 2: Mobile Client Update
- Update mobile app to use `/api/v1/mobile/*` routes
- Test thoroughly
- Deploy to production

### Phase 3: Deprecation
- Once all users have updated mobile app
- Remove legacy routes
- Clean up old controllers

### Migration Timeline
| Phase | When | Action |
|-------|------|--------|
| Phase 1 | **Now** | Both routes work, mobile can migrate gradually |
| Phase 2 | **1-2 months** | Mobile app fully migrated to v1 API |
| Phase 3 | **3-4 months** | Remove legacy routes |

## How to Add New Controllers

### For Mobile Product

1. **Create controller file:**
   ```
   app/controllers/api/v1/mobile/my_feature_controller.rb
   ```

2. **Add proper namespacing:**
   ```ruby
   module Api
     module V1
       module Mobile
         class MyFeatureController < ApplicationController
           def index
             # Your code
           end
         end
       end
     end
   end
   ```

3. **Add routes:**
   ```ruby
   # config/routes.rb
   namespace :api do
     namespace :v1 do
       namespace :mobile do
         resources :my_feature
       end
     end
   end
   ```

4. **Access at:** `GET /api/v1/mobile/my_feature`

### For Presents Product

1. **Create controller file:**
   ```
   app/controllers/api/v1/presents/my_feature_controller.rb
   ```

2. **Inherit from Presents base controller:**
   ```ruby
   module Api
     module V1
       module Presents
         class MyFeatureController < BaseController
           # Automatically includes Presents authorization

           def index
             # Your code
           end
         end
       end
     end
   end
   ```

3. **Add routes:**
   ```ruby
   # config/routes.rb
   namespace :api do
     namespace :v1 do
       namespace :presents do
         resources :my_feature
       end
     end
   end
   ```

4. **Access at:** `GET /api/v1/presents/my_feature`

## Testing Routes

### View all routes:
```bash
bundle exec rails routes
```

### Filter by namespace:
```bash
# Mobile routes
bundle exec rails routes | grep "api/v1/mobile"

# Presents routes
bundle exec rails routes | grep "api/v1/presents"

# Shared routes
bundle exec rails routes | grep "api/v1/shared"
```

### Test a specific route:
```bash
curl http://localhost:3000/api/v1/mobile/activities
curl http://localhost:3000/api/v1/presents/events
```

## Benefits Summary

### ✅ For Development
- Clear separation between products
- Easy to find related code
- Prevents controller naming conflicts
- Can add new products without touching existing code

### ✅ For Mobile Team
- Existing app continues working
- Can migrate gradually
- Clear API structure
- Better documentation

### ✅ For Future
- Can add v2 without breaking v1
- Can deprecate old endpoints safely
- Easy to add new products (e.g., Voxxy Enterprise)
- Better API maintenance

## Common Questions

### Q: Why not just use `/mobile/*` and `/presents/*`?
**A:** Adding `api/v1` allows future versioning. When you need breaking changes, you can create `api/v2` and both versions work simultaneously.

### Q: Do I need to update my mobile app immediately?
**A:** No! Legacy routes still work. Update when convenient.

### Q: What happens to existing controllers?
**A:** They stay in `app/controllers/` for now. We'll gradually move mobile controllers to `api/v1/mobile/` and can remove legacy routes later.

### Q: How do I know which routes are legacy vs. new?
**A:** Run `bundle exec rails routes` and look for:
- **Legacy:** Routes without `/api/v1/` prefix
- **New:** Routes starting with `/api/v1/mobile/` or `/api/v1/presents/`

### Q: Can a user access both Mobile and Presents features?
**A:** Yes! That's what `/api/v1/shared/*` is for. The user model will support multiple roles and product contexts.

## Next Steps

1. **For Mobile:** Continue using legacy routes, plan migration to `/api/v1/mobile/*`
2. **For Presents:** Build all new features using `/api/v1/presents/*`
3. **For Shared:** Use `/api/v1/shared/*` for authentication, users, notifications

## Related Documentation
- [Voxxy Presents Implementation Plan](./VOXXY_PRESENTS_IMPLEMENTATION_PLAN.md)
- Rails Routing Guide: https://guides.rubyonrails.org/routing.html#controller-namespaces-and-routing
