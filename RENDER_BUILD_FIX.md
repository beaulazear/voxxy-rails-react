# Render Build Fix - EventPortalsController

## 🐛 The Problem

Render build failed with:
```
Before process_action callback :check_presents_access has not been defined (ArgumentError)
```

## 🔍 Root Cause

The `EventPortalsController` was created with incorrect structure:

**❌ Before (Broken):**
```ruby
class Api::V1::Presents::EventPortalsController < ApplicationController
  skip_before_action :check_presents_access, only: [ ... ]
  # ...
end
```

**Problems:**
1. Inherited from `ApplicationController` instead of `BaseController`
2. `check_presents_access` callback is defined in `BaseController`, not `ApplicationController`
3. Incorrect module structure (compact vs nested)
4. Missing proper module closing

## ✅ The Fix

Changed controller to inherit from `BaseController` and use proper module structure:

**✅ After (Fixed):**
```ruby
module Api
  module V1
    module Presents
      class EventPortalsController < BaseController
        skip_before_action :check_presents_access, only: [ ... ]
        # ...
      end
    end
  end
end
```

**Why this works:**
1. `BaseController` defines `check_presents_access` callback
2. All other Presents controllers inherit from `BaseController`
3. Proper module nesting with correct indentation
4. Modules properly closed

## 📁 File Changed

- `app/controllers/api/v1/presents/event_portals_controller.rb`

## ✅ Verification

```bash
# Lint check
bundle exec rubocop app/controllers/api/v1/presents/event_portals_controller.rb
# ✅ 1 file inspected, no offenses detected

# App loads
bundle exec rails runner "puts Api::V1::Presents::EventPortalsController.name"
# ✅ Api::V1::Presents::EventPortalsController
```

## 🚀 Next Steps

1. Commit the fix:
   ```bash
   git add app/controllers/api/v1/presents/event_portals_controller.rb
   git commit -m "Fix EventPortalsController inheritance and module structure"
   git push
   ```

2. Render will rebuild successfully

## 📚 For Your Colleague

When creating new controllers in the `Api::V1::Presents` namespace:
- ✅ Always inherit from `BaseController`, not `ApplicationController`
- ✅ Use proper module nesting:
  ```ruby
  module Api
    module V1
      module Presents
        class YourController < BaseController
          # ...
        end
      end
    end
  end
  ```
- ✅ Look at existing controllers as templates (e.g., `events_controller.rb`)
