# Role-Based Authentication Guide

**Last Updated:** January 17, 2026

## Overview

Voxxy uses a role-based authentication system to control access across two products:
- **Voxxy Mobile** (original product) - Uses `admin` boolean column
- **Voxxy Presents** (new B2B2C platform) - Uses `role` column

This guide explains how roles work across the entire system, from database to frontend UI.

---

## Database Schema

### User Table Columns

```ruby
# Role column (used by Presents product)
role: string
  - Valid values: 'consumer', 'venue_owner', 'vendor', 'admin'
  - Defined in User model as: ROLES = %w[consumer venue_owner vendor admin].freeze

# Admin boolean (used by Mobile product)
admin: boolean
  - Default: false
  - Used for mobile app administrators
```

### Important Note

**Two separate admin systems exist:**
- `role = 'admin'` → Voxxy Presents admin (new system)
- `admin = true` → Voxxy Mobile admin (legacy system)

Users can have EITHER or BOTH admin privileges depending on which product they manage.

---

## Backend (Rails)

### User Model Role Helpers

**Location:** `app/models/user.rb:348-380`

```ruby
# Role helpers
def consumer?
  role == "consumer"
end

def venue_owner?
  role == "venue_owner"
end

def vendor?
  role == "vendor"
end

def admin?
  role == "admin" || admin == true  # ← Checks BOTH role AND boolean
end

def presents_user?
  venue_owner? || vendor?
end

def mobile_user?
  consumer?
end

# Product context helpers
def uses_mobile?
  product_context.in?(["mobile", "both"]) || consumer?
end

def uses_presents?
  product_context.in?(["presents", "both"]) || presents_user?
end
```

### Key Observation: `admin?` Method

**IMPORTANT:** The `admin?` method checks **BOTH** the `role` column AND the `admin` boolean:

```ruby
def admin?
  role == "admin" || admin == true
end
```

This means:
- ✅ User with `role = 'admin'` → `admin?` returns `true`
- ✅ User with `admin = true` → `admin?` returns `true`
- ✅ User with BOTH → `admin?` returns `true`

---

## Frontend (React/TypeScript)

### User Type Definition

**Location:** `src/contexts/AuthContext.tsx:7-18`

```typescript
interface User {
  id: number
  email: string
  name: string
  role: 'consumer' | 'vendor' | 'venue_owner' | 'admin' | 'producer' | 'guest'
  confirmed_at: string | null
  avatar?: string
  profile_pic?: string
  username?: string
  status?: 'active' | 'suspended' | 'banned'
  product_context?: 'mobile' | 'presents' | 'both'
}
```

### Role Helper Functions

**Location:** `src/contexts/AuthContext.tsx:313-326`

```typescript
// Role-specific helper functions
const isAdmin = userProfile?.role === 'admin'  // ← ONLY checks role column
const isProducer = userProfile?.role === 'producer' || userProfile?.role === 'venue_owner'
const isVendor = userProfile?.role === 'vendor'
const isGuest = userProfile?.role === 'guest' || userProfile?.role === 'consumer'

// Email verification status
const isEmailVerified = !!userProfile?.confirmed_at

// DEPRECATED (but still work for backward compatibility)
const isOrganizer = isProducer // Maps to producer role
const isVenueOwner = isVendor  // Maps to vendor role

const hasRole = (role: User['role']) => userProfile?.role === role
```

### Important Difference: Frontend vs Backend

**Frontend `isAdmin`:**
```typescript
const isAdmin = userProfile?.role === 'admin'
```
- Only checks the `role` column
- Does NOT check the `admin` boolean
- This is intentional - frontend only cares about Presents product roles

**Backend `admin?`:**
```ruby
def admin?
  role == "admin" || admin == true
end
```
- Checks BOTH `role` column AND `admin` boolean
- Supports both Mobile and Presents admin systems

---

## Role-Based Routing

### Frontend Routes (App.tsx)

**Location:** `src/App.tsx:48-101`

```typescript
function RoleBasedDashboardRedirect() {
  const { userProfile } = useAuth()
  const role = userProfile.role

  // Producer roles (venue_owner = Producer in UI)
  if (role === 'producer' || role === 'venue_owner') {
    return <Navigate to="/producer/pending" replace />
  }

  // Vendor roles
  if (role === 'vendor') {
    return <Navigate to="/vendor/pending" replace />
  }

  // Consumer/Guest roles
  if (role === 'consumer' || role === 'guest') {
    return <Navigate to="/pending" replace />
  }

  // Admin - route to admin dashboard
  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  // Unknown role - redirect to home
  return <Navigate to="/" replace />
}
```

### Admin Route Protection

**Location:** `src/components/auth/AdminRoute.tsx:10-31`

```typescript
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return <LoadingTransition message="Verifying admin access..." />
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  // Authenticated but not admin - redirect to home
  if (!isAdmin) {
    console.warn('🚫 Non-admin user attempted to access admin route')
    return <Navigate to="/" replace />
  }

  // Admin user - allow access
  return <>{children}</>
}
```

---

## Backend Controller Access Control

### Admin::EmailsController

**Location:** `app/controllers/admin/emails_controller.rb:3-5, 103-113`

```ruby
class Admin::EmailsController < ApplicationController
  before_action :authorized
  before_action :require_admin

  private

  def require_admin
    unless current_user&.admin?  # ← Uses admin? method (checks role OR boolean)
      respond_to do |format|
        format.json { render json: { error: "Admin access required" }, status: :forbidden }
        format.html do
          flash[:alert] = "Admin access required"
          redirect_to root_path
        end
      end
    end
  end
end
```

### Presents::BaseController

**Location:** `app/controllers/api/v1/presents/base_controller.rb:4-27`

```ruby
class Api::V1::Presents::BaseController < ApplicationController
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
    unless @current_user.venue_owner? || @current_user.admin?  # ← Checks role column
      render json: { error: "Venue owner access required" }, status: :forbidden
    end
  end

  def require_vendor
    unless @current_user.vendor? || @current_user.admin?  # ← Checks role column
      render json: { error: "Vendor access required" }, status: :forbidden
    end
  end
end
```

---

## Email Testing System Access Control

### Admin Email Testing

**Route:** `/admin/emails`

**Access Requirements:**
- User must be authenticated
- User must pass `current_user.admin?` check
- This means: `role = 'admin'` OR `admin = true`

**Features:**
- Send all 21 emails
- Send 7 scheduled emails
- Setup/cleanup test data
- All emails sent to admin's own email address

**Controller:** `Admin::EmailsController`

### Venue Owner Email Testing

**Route:** `/api/v1/presents/email_tests`

**Access Requirements:**
- User must be authenticated
- User must pass `require_venue_owner` check
- This means: `role = 'venue_owner'` OR `role = 'admin'`

**Features:**
- Send 7 scheduled emails only
- Emails sent to venue owner's own email address
- API endpoint (no HTML UI)

**Controller:** `Api::V1::Presents::EmailTestsController`

---

## Finding Users by Role

### Rails Console Queries

**Find users with admin ROLE (Presents admins):**
```ruby
# Find all users with role = 'admin'
admin_users = User.where(role: 'admin')

# Count them
admin_users.count

# Get their emails
admin_users.pluck(:email)
```

**Find users with admin BOOLEAN (Mobile admins):**
```ruby
# Find all users with admin = true
mobile_admins = User.where(admin: true)

# Count them
mobile_admins.count
```

**Find ALL admins (either role OR boolean):**
```ruby
# Find users who would pass admin? check
all_admins = User.where("role = ? OR admin = ?", 'admin', true)

# Count them
all_admins.count

# Get their details
all_admins.pluck(:id, :email, :role, :admin)
```

**Find venue owners:**
```ruby
venue_owners = User.where(role: 'venue_owner')
```

**Find vendors:**
```ruby
vendors = User.where(role: 'vendor')
```

---

## Common Scenarios

### Scenario 1: Creating a Presents Admin

To give a user full access to Voxxy Presents admin features (including email testing):

```ruby
user = User.find_by(email: 'admin@example.com')
user.update!(role: 'admin')

# Verify
user.admin?  # Should return true
user.venue_owner?  # Should return false
```

### Scenario 2: Creating a Venue Owner (Producer)

To give a user access to create events and test scheduled emails:

```ruby
user = User.find_by(email: 'producer@example.com')
user.update!(role: 'venue_owner')

# Verify
user.venue_owner?  # Should return true
user.admin?  # Should return false
```

### Scenario 3: User with BOTH Admin Systems

A user can have both Mobile admin and Presents admin access:

```ruby
user = User.find_by(email: 'superadmin@example.com')
user.update!(
  role: 'admin',
  admin: true,
  product_context: 'both'
)

# Verify
user.admin?  # Returns true (checks both)
user.uses_mobile?  # Returns true
user.uses_presents?  # Returns true
```

---

## Testing Access Control

### Test Admin Email Dashboard Access

**In Rails Console:**
```ruby
# Create test admin
admin = User.create!(
  email: 'test-admin@voxxypresents.com',
  name: 'Test Admin',
  password: 'password123',
  password_confirmation: 'password123',
  role: 'admin',
  confirmed_at: Time.current,
  product_context: 'presents',
  uses_presents: true
)

# Verify access methods
admin.admin?  # Should return true
admin.venue_owner?  # Should return false
admin.uses_presents?  # Should return true
```

**In Browser:**
1. Login with test admin credentials
2. Navigate to `/admin/emails`
3. Should see email testing dashboard
4. Click "Send All 21 Emails to My Inbox"
5. Check `test-admin@voxxypresents.com` inbox

### Test Venue Owner Email API Access

**In Rails Console:**
```ruby
# Create test venue owner
venue_owner = User.create!(
  email: 'test-producer@voxxypresents.com',
  name: 'Test Producer',
  password: 'password123',
  password_confirmation: 'password123',
  role: 'venue_owner',
  confirmed_at: Time.current,
  product_context: 'presents',
  uses_presents: true
)

# Verify access methods
venue_owner.venue_owner?  # Should return true
venue_owner.admin?  # Should return false
venue_owner.uses_presents?  # Should return true
```

**In API Client (curl/Postman):**
```bash
# Login to get token
curl -X POST http://localhost:3000/api/v1/shared/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-producer@voxxypresents.com","password":"password123"}'

# Use token to access email tests
curl -X POST http://localhost:3000/api/v1/presents/email_tests/send_scheduled \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## Troubleshooting

### Problem: User can't access `/admin/emails`

**Check:**
1. Is user authenticated?
   ```ruby
   user = User.find_by(email: 'user@example.com')
   user.confirmed_at.present?  # Should be true
   ```

2. Does user have admin access?
   ```ruby
   user.admin?  # Should return true
   ```

3. If `admin?` returns false, check both columns:
   ```ruby
   user.role  # Should be 'admin'
   user.admin  # OR this should be true
   ```

4. Grant admin access:
   ```ruby
   user.update!(role: 'admin')
   ```

### Problem: Venue owner can't send test emails

**Check:**
1. Is user authenticated?
2. Does user have venue_owner role?
   ```ruby
   user.venue_owner?  # Should return true
   ```

3. Is user trying to access correct endpoint?
   - Venue owners: `/api/v1/presents/email_tests` (API only)
   - NOT: `/admin/emails` (admin only)

4. Grant venue owner access:
   ```ruby
   user.update!(role: 'venue_owner', uses_presents: true, product_context: 'presents')
   ```

### Problem: Frontend shows "Access Denied" but backend allows access

**Possible Cause:** User has `admin = true` (boolean) but `role != 'admin'`

**Backend:** `admin?` returns `true` (checks both)
**Frontend:** `isAdmin` returns `false` (only checks role)

**Solution:**
```ruby
# Set the role column to match
user.update!(role: 'admin')
```

---

## Best Practices

### 1. Use Role Column for Presents Product

For all Voxxy Presents features, use the `role` column:
```ruby
# Good
user.role = 'admin'
user.role = 'venue_owner'
user.role = 'vendor'

# Avoid for Presents
user.admin = true  # This is for Mobile product
```

### 2. Always Set product_context

When creating users for Presents:
```ruby
User.create!(
  role: 'venue_owner',
  product_context: 'presents',  # ← Important
  uses_presents: true  # ← Important
)
```

### 3. Use Helper Methods, Not Direct Column Access

```ruby
# Good
if current_user.admin?
if current_user.venue_owner?

# Avoid
if current_user.role == 'admin'
```

### 4. Frontend: Use AuthContext Helpers

```typescript
// Good
const { isAdmin, isProducer, isVendor } = useAuth()
if (isAdmin) { /* ... */ }

// Avoid
if (userProfile?.role === 'admin') { /* ... */ }
```

---

## Summary

### Key Takeaways

1. **Two Admin Systems:**
   - `role = 'admin'` → Presents admins (new)
   - `admin = true` → Mobile admins (legacy)

2. **Backend `admin?` Checks Both:**
   ```ruby
   def admin?
     role == "admin" || admin == true
   end
   ```

3. **Frontend Only Checks Role:**
   ```typescript
   const isAdmin = userProfile?.role === 'admin'
   ```

4. **Email Testing Access:**
   - Admins: All 21 emails at `/admin/emails`
   - Venue owners: 7 scheduled emails at `/api/v1/presents/email_tests`

5. **Role Values:**
   - `'consumer'` - Mobile app users
   - `'venue_owner'` - Event producers (Presents)
   - `'vendor'` - Marketplace vendors (Presents)
   - `'admin'` - System administrators (both products)

---

**Questions or issues?** Check the troubleshooting section or contact the development team.

**Last Updated:** January 17, 2026
