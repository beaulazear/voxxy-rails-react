# Voxxy Rails Backend - Vendor Contacts/Network CRM Feature Analysis

## Executive Summary

The Voxxy Rails backend has a well-structured foundation for the Presents product (venues/events). The system currently supports:
- Organizations (venues/clubs) owned by venue_owner role users
- Events created by organizations
- Vendor Applications (forms for vendors to apply to events)
- Registrations (both event RSVPs and vendor application submissions)
- Vendors (vendor marketplace profiles)

**Key Finding: The vendor_contacts table DOES NOT EXIST yet** and will need to be created to support the CRM feature.

---

## 1. Current Database Schema

### Existing Relevant Tables

#### organizations
- **Purpose**: Venues/clubs that organize events
- **Owner**: One user (venue_owner)
- **Fields**:
  - id, user_id (FK), name, slug (unique), description
  - logo_url, website, instagram_handle
  - phone, email, address, city, state, zip_code
  - latitude, longitude
  - verified (boolean), active (boolean)
  - timestamps
- **Indexes**: slug (unique), active, user_id
- **Associated**: has_many :events, has_many :budgets

#### events
- **Purpose**: Events hosted by organizations
- **Owner**: Organization (FK)
- **Fields**:
  - id, organization_id (FK), title, slug (unique), description
  - event_date, event_end_date, location, poster_url, ticket_url
  - ticket_price (decimal), capacity, registered_count (counter)
  - published (boolean), registration_open (boolean)
  - status (enum: draft, published, cancelled, completed)
  - timestamps
- **Indexes**: organization_id, slug (unique), event_date, published, status
- **Associated**: has_many :registrations, has_many :vendor_applications

#### vendor_applications
- **Purpose**: Forms for vendors to apply to specific events
- **Owner**: Event (FK)
- **Fields**:
  - id, event_id (FK), name, description
  - status (enum: active, inactive), categories (jsonb array)
  - submissions_count (counter), shareable_code (unique)
  - timestamps
- **Indexes**: event_id, status, created_at, shareable_code (unique)
- **Associated**: has_many :registrations (vendor submissions)
- **Special**: Publicly accessible via shareable_code for vendors

#### registrations
- **Purpose**: Both event RSVPs and vendor application submissions
- **Owner**: Event (FK), optional: User (FK), optional: VendorApplication (FK)
- **Fields**:
  - id, event_id (FK), user_id (optional), vendor_application_id (optional)
  - email, name, phone, ticket_code (unique)
  - status (enum: pending, confirmed, cancelled, approved, rejected, waitlist)
  - checked_in (boolean), checked_in_at
  - subscribed (boolean), qr_code_url
  - business_name, vendor_category (for vendor applications)
  - timestamps
- **Indexes**: event_id, user_id, vendor_application_id, status, email, ticket_code
- **Associated**: belongs_to :event, belongs_to :user (optional), belongs_to :vendor_application (optional)

#### vendors
- **Purpose**: Vendor marketplace profiles
- **Owner**: One user (vendor role)
- **Fields**:
  - id, user_id (FK), name, slug (unique), vendor_type
  - description, logo_url, website, instagram_handle
  - contact_email, phone, address, city, state, zip_code
  - latitude, longitude, services (json), pricing (json)
  - verified (boolean), active (boolean)
  - views_count, rating (decimal)
  - timestamps
- **Indexes**: user_id, slug (unique), active, vendor_type, verified
- **Associated**: belongs_to :user, has_many :budget_line_items

#### users
- **Purpose**: System users with various roles
- **Roles**: consumer, venue_owner, vendor, admin
- **Fields**:
  - ... (25+ fields for auth, location, notifications, moderation, etc.)
  - role (string), admin (boolean for backwards compat)
- **Associated**: 
  - has_many :organizations (venues they own)
  - has_many :vendors (vendor profiles they own)
  - has_many :budgets
  - (+ many mobile app associations)

---

## 2. Current Models & Their Relationships

### Model Hierarchy

```
User (role: venue_owner/vendor)
├── Organizations
│   └── Events
│       ├── VendorApplications
│       │   └── Registrations (vendor submissions)
│       └── Registrations (event RSVPs)
│       └── Budget
│           └── BudgetLineItems
│               └── Vendor (reference to vendor offering service)
└── Vendors
    └── BudgetLineItems

Registration (dual-purpose model)
├── belongs_to :event (always)
├── belongs_to :user (optional - if registered user account)
├── belongs_to :vendor_application (optional - if vendor submission)
└── Tracks: email, name, phone, business_name, vendor_category
```

### Key Model Files

- `/Users/beaulazear/Desktop/voxxy-rails/app/models/organization.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/models/event.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/models/vendor.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/models/vendor_application.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/models/registration.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/models/user.rb`

---

## 3. Current API Endpoints (Presents)

### Route Structure
All routes under `/api/v1/presents/` namespace with authentication required (except specified).

### Organizations
- `GET /api/v1/presents/me/organization` - Get current user's organization
- `GET /api/v1/presents/organizations` - List all public organizations
- `GET /api/v1/presents/organizations/:id` - Get specific organization
- `POST /api/v1/presents/organizations` - Create organization (requires venue_owner)
- `PATCH /api/v1/presents/organizations/:id` - Update organization
- `DELETE /api/v1/presents/organizations/:id` - Delete organization

### Events
- `GET /api/v1/presents/events` - List events (filters by published unless owner/admin)
- `GET /api/v1/presents/events/:id` - Get event details
- `GET /api/v1/presents/organizations/:org_id/events` - List org's events
- `POST /api/v1/presents/organizations/:org_id/events` - Create event
- `PATCH /api/v1/presents/events/:id` - Update event
- `DELETE /api/v1/presents/events/:id` - Delete event

### Vendors
- `GET /api/v1/presents/vendors` - List vendors (with filters)
- `GET /api/v1/presents/vendors/search` - Search vendors
- `GET /api/v1/presents/vendors/:id` - Get vendor details
- `POST /api/v1/presents/vendors` - Create vendor (requires vendor role)
- `PATCH /api/v1/presents/vendors/:id` - Update vendor
- `DELETE /api/v1/presents/vendors/:id` - Delete vendor

### Vendor Applications
- `GET /api/v1/presents/events/:event_id/vendor_applications` - List applications
- `GET /api/v1/presents/vendor_applications/:id` - Get application
- `GET /api/v1/presents/vendor_applications/:id/submissions` - Get vendor submissions
- `GET /api/v1/presents/vendor_applications/lookup/:code` - Lookup by shareable code (PUBLIC)
- `POST /api/v1/presents/events/:event_id/vendor_applications` - Create application
- `PATCH /api/v1/presents/vendor_applications/:id` - Update application
- `DELETE /api/v1/presents/vendor_applications/:id` - Delete application

### Registrations
- `GET /api/v1/presents/events/:event_id/registrations` - List event registrations
- `GET /api/v1/presents/registrations/:id` - Get registration
- `GET /api/v1/presents/registrations/track/:ticket_code` - Track application (PUBLIC)
- `POST /api/v1/presents/events/:event_id/registrations` - Create registration/application
- `PATCH /api/v1/presents/registrations/:id` - Update registration

### Controllers Path
`/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/`

---

## 4. Authentication & Authorization Pattern

### Base Controller
File: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/base_controller.rb`

**Standard flow:**
1. `before_action :authorized` - Validates JWT token, sets @current_user
2. `before_action :check_presents_access` - Ensures user has presents access
3. `skip_before_action` for public endpoints (list, show for published content)

**Authorization Methods:**
- `require_venue_owner` - Only venue_owner or admin
- `require_vendor` - Only vendor or admin
- `require_presents_access` - Only presents users (venue_owner, vendor, or admin)

**User Role Checks** (in User model):
```ruby
user.consumer? # role == 'consumer'
user.venue_owner? # role == 'venue_owner'
user.vendor? # role == 'vendor'
user.admin? # role == 'admin' or admin flag true
user.presents_user? # venue_owner? || vendor?
user.uses_presents? # product_context in ['presents', 'both'] or presents_user?
```

---

## 5. Serializers Pattern

### Location
`/Users/beaulazear/Desktop/voxxy-rails/app/serializers/api/v1/presents/`

### Existing Serializers
- `organization_serializer.rb` - Organizations
- `event_serializer.rb` - Events
- `vendor_serializer.rb` - Vendors (structured with nested contact/location/stats)
- `vendor_application_serializer.rb` - Vendor Applications
- `registration_serializer.rb` - Registrations (supports include_event, include_user)

### Pattern Example (VendorSerializer):
```ruby
class VendorSerializer
  def initialize(vendor, options = {})
    @vendor = vendor
    @include_owner = options[:include_owner] || false
  end

  def as_json
    {
      id, name, slug, vendor_type, description, logo_url,
      contact: { email, phone, website, instagram },
      location: { city, state, latitude, longitude },
      services, pricing,
      stats: { rating, views_count, verified, active },
      created_at, updated_at
    }.tap do |json|
      json[:owner] = owner_json if @include_owner
    end
  end
end
```

---

## 6. Data Currently Collected About Vendors

### Through Vendor Model
- Basic info: name, type, description, logo
- Contact: email, phone, website, instagram
- Location: address, city, state, zip, coordinates
- Services and pricing (JSON)
- Verification status, active status
- Ratings and view counts

### Through Registrations (Vendor Applications)
When vendors apply to events via vendor applications, the system captures:
- email (primary contact)
- name (person's name)
- phone
- business_name
- vendor_category (the category they're applying under)
- timestamps
- status (pending → approved/rejected/waitlist)

### Current Gap
**No structured way to store vendor contacts/network data:**
- No contact history/interactions
- No tags/categories for vendor relationship management
- No notes/communication logs
- No relationship tracking between vendors
- No lead/opportunity scoring
- No pipeline stage tracking

---

## 7. What Exists vs. What Needs to be Added

### WHAT EXISTS

#### Database Level
- `organizations` table (to own events and manage vendors)
- `vendor_applications` table (to collect vendor submissions)
- `registrations` table (stores vendor submission data)
- Foreign key relationships established
- Appropriate indexes on frequently queried fields

#### Model Level
- Clear relationships defined
- VendorApplication has submission counter
- Registration has status enum with multiple states
- Vendor model with comprehensive fields

#### API Level
- Complete CRUD operations for organizations, events, vendors
- Vendor application submission endpoint
- Vendor submission listing with filters
- Public lookup endpoints (for sharing application forms)
- Role-based authorization
- Proper serializers for API responses

#### Authorization Level
- JWT authentication in place
- Role-based authorization (venue_owner, vendor, admin)
- Ownership checks on resources
- Public endpoints for vendor discovery

### WHAT NEEDS TO BE ADDED

#### For Vendor Contacts/Network CRM Feature

1. **Database**
   - `vendor_contacts` table (NEW)
   - Potentially: `vendor_interaction_logs` table (for communication history)
   - Potentially: `vendor_tags` table (for categorization)
   - Potentially: `vendor_relationships` table (for vendor-to-vendor relationships)

2. **Models**
   - `VendorContact` model (NEW)
   - Associations in Organization/User model
   - Scopes for filtering/searching contacts

3. **API Endpoints**
   - `GET /api/v1/presents/organizations/:org_id/vendor_contacts` - List contacts
   - `GET /api/v1/presents/vendor_contacts/:id` - Get contact details
   - `POST /api/v1/presents/vendor_contacts` - Create contact
   - `PATCH /api/v1/presents/vendor_contacts/:id` - Update contact
   - `DELETE /api/v1/presents/vendor_contacts/:id` - Delete contact
   - Potentially: Search/filter endpoints, bulk operations

4. **Controllers**
   - `VendorContactsController` (NEW)
   - Nested under organizations or as standalone resource

5. **Serializers**
   - `VendorContactSerializer` (NEW)

6. **Features for CRM**
   - Contact information storage (name, email, phone, company, role)
   - Interaction history tracking
   - Tags/categories for organization
   - Notes/communication logs
   - Lead status/pipeline tracking
   - Relationship management
   - Export capabilities

---

## 8. Key Integration Points for New Feature

### Will Connect To:
1. **Organization** - Each vendor contact belongs to an organization
2. **User** - Created/managed by venue owners
3. **Vendor** - Potentially link contacts to registered vendors
4. **Registration** - Import vendor data from applications
5. **VendorApplication** - Track which application led to contact

### Authorization Requirements:
- Only organization owner can view/manage their vendor contacts
- Admins can access all
- Bulk import from vendor applications for authorized users

### Migration Path:
1. Could import existing vendor contact data from:
   - `registrations` (vendor application submissions)
   - `vendors` marketplace profiles
   - Manual entry via CRM interface

---

## 9. File Paths Summary

### Core Models
- `/Users/beaulazear/Desktop/voxxy-rails/app/models/organization.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/models/event.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/models/vendor.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/models/vendor_application.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/models/registration.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/models/user.rb`

### API Controllers
- `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/base_controller.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/organizations_controller.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/events_controller.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/vendor_applications_controller.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/registrations_controller.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/vendors_controller.rb`

### Serializers
- `/Users/beaulazear/Desktop/voxxy-rails/app/serializers/api/v1/presents/organization_serializer.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/serializers/api/v1/presents/event_serializer.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/serializers/api/v1/presents/vendor_serializer.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/serializers/api/v1/presents/vendor_application_serializer.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/app/serializers/api/v1/presents/registration_serializer.rb`

### Routes
- `/Users/beaulazear/Desktop/voxxy-rails/config/routes.rb` (Lines 263-311 for /api/v1/presents)

### Database
- `/Users/beaulazear/Desktop/voxxy-rails/db/schema.rb`
- `/Users/beaulazear/Desktop/voxxy-rails/db/migrate/` (latest: 20251116163713)

---

## 10. Recommended Next Steps

### Phase 1: Foundation
1. Create `vendor_contacts` migration
2. Create `VendorContact` model with associations
3. Create `VendorContactsController` with CRUD actions
4. Create `VendorContactSerializer`
5. Add routes to config/routes.rb

### Phase 2: Enhanced Features
1. Add interaction/communication logs
2. Implement tagging system
3. Add bulk import from vendor applications
4. Implement contact search/filtering

### Phase 3: CRM Features
1. Pipeline stages / lead tracking
2. Relationship management between vendors
3. Export/reporting capabilities
4. Activity feeds

---

## Summary

The Voxxy Rails backend has a solid, well-organized foundation for the Presents product. The existing structure for organizations, events, vendors, and vendor applications provides excellent scaffolding for adding a vendor contacts/network CRM feature. The authentication, authorization, and API patterns are already established and mature, making it straightforward to add new endpoints for vendor contact management.

The main requirement is creating the `vendor_contacts` table and related models/controllers/serializers following the established patterns in the codebase.

