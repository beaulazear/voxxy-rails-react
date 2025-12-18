# Vendor Contacts/CRM Feature - Quick Start Guide

## What Was Analyzed

Complete backend architecture analysis of the Voxxy Rails application for understanding the foundation and requirements for adding a vendor contacts/network CRM feature.

## Key Findings

### Current State
- Well-structured Presents product backend (venues/events)
- Complete infrastructure for organizations, events, vendors, and vendor applications
- Robust API with proper authentication and authorization
- Clean separation between models, controllers, and serializers

### Gap Analysis
The `vendor_contacts` table DOES NOT EXIST and will need to be created to support CRM functionality.

### Current Vendor Data Sources
1. **Vendor model** - Marketplace vendor profiles with contact info
2. **Registrations** - Vendor application submissions with contact data
3. **VendorApplications** - Event vendor application forms

## To Build the CRM Feature, You'll Need:

### Phase 1: Core Infrastructure
1. Create `vendor_contacts` database table
2. Create `VendorContact` Rails model
3. Create `VendorContactsController` with CRUD actions
4. Create `VendorContactSerializer`
5. Add routes to `/api/v1/presents/` namespace

### Phase 2: CRM Features
1. Contact management (basic CRUD)
2. Search and filtering
3. Organization-scoped access
4. Import from vendor applications
5. Status/pipeline tracking

### Phase 3: Advanced Features
1. Interaction/communication logs
2. Tagging and categorization
3. Relationship mapping
4. Export/reporting
5. Analytics dashboards

## Key Resources Created

### Analysis Documents
1. **VENDOR_CONTACTS_CRM_ANALYSIS.md**
   - Comprehensive breakdown of existing schema
   - Model relationships and hierarchies
   - Current API endpoints
   - Authorization patterns
   - What exists vs. what's needed
   - Recommended implementation approach

2. **VENDOR_CONTACTS_CODE_REFERENCES.md**
   - Real code patterns from existing models/controllers
   - Serializer examples
   - Migration patterns
   - Route configurations
   - Authorization examples
   - Database relationship patterns

## Architecture Overview

```
User (venue_owner role)
  └── Organization
       ├── Events
       │   └── VendorApplications
       │       └── Registrations (vendor submissions)
       └── VendorContacts (TO BE CREATED)
           └── Contact records for CRM management
```

## Authorization Pattern

For VendorContacts, follow this pattern:

```ruby
# In base controller
before_action :require_venue_owner  # Only venue owners can manage contacts

# In controller actions
unless @vendor_contact.organization.user_id == @current_user.id || @current_user.admin?
  render json: { error: "Not authorized" }, status: :forbidden
end
```

## Suggested VendorContact Table Schema

```ruby
create_table :vendor_contacts do |t|
  t.references :organization, null: false, foreign_key: true
  t.references :vendor, optional: true, foreign_key: true
  t.references :registration, optional: true, foreign_key: true
  
  # Contact information
  t.string :name, null: false
  t.string :email
  t.string :phone
  t.string :company_name
  t.string :job_title
  
  # CRM fields
  t.string :contact_type  # lead, vendor, partner, etc
  t.string :status, default: 'new'  # new, contacted, interested, converted
  t.text :notes
  t.jsonb :tags, default: []
  t.integer :interaction_count, default: 0
  t.datetime :last_contacted_at
  
  # Source tracking
  t.string :source  # application, import, manual_entry
  t.datetime :imported_at
  
  t.timestamps
end

add_index :vendor_contacts, :organization_id
add_index :vendor_contacts, :vendor_id
add_index :vendor_contacts, :status
add_index :vendor_contacts, :email
```

## Files You Should Reference

**Models:** `/Users/beaulazear/Desktop/voxxy-rails/app/models/vendor.rb`
**Controllers:** `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/vendors_controller.rb`
**Serializers:** `/Users/beaulazear/Desktop/voxxy-rails/app/serializers/api/v1/presents/vendor_serializer.rb`
**Routes:** `/Users/beaulazear/Desktop/voxxy-rails/config/routes.rb` (lines 263-311)
**Base Controller:** `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/base_controller.rb`

## Implementation Checklist

### Database
- [ ] Create migration for vendor_contacts table
- [ ] Run migration
- [ ] Create vendor_contacts index migration

### Models
- [ ] Create VendorContact model
- [ ] Add associations to Organization (has_many :vendor_contacts)
- [ ] Add validations
- [ ] Add scopes (by_status, by_type, etc)

### API
- [ ] Create VendorContactsController
- [ ] Implement index (list by organization)
- [ ] Implement show (get single contact)
- [ ] Implement create (new contact)
- [ ] Implement update (edit contact)
- [ ] Implement destroy (delete contact)

### Serializers
- [ ] Create VendorContactSerializer
- [ ] Include related organization/vendor data
- [ ] Format contact information

### Routes
- [ ] Add vendor_contacts routes to `/api/v1/presents/`
- [ ] Decide on nesting: under organizations or standalone

### Authorization
- [ ] Require venue_owner role
- [ ] Check organization ownership
- [ ] Allow admin override

## API Endpoint Examples

Once implemented, the API will look like:

```
GET    /api/v1/presents/organizations/:org_id/vendor_contacts
GET    /api/v1/presents/vendor_contacts/:id
POST   /api/v1/presents/vendor_contacts
PATCH  /api/v1/presents/vendor_contacts/:id
DELETE /api/v1/presents/vendor_contacts/:id

# Optional advanced endpoints
GET    /api/v1/presents/vendor_contacts/search
POST   /api/v1/presents/vendor_contacts/import
GET    /api/v1/presents/vendor_contacts/export
```

## Database Relationships

```ruby
# In VendorContact model
belongs_to :organization
belongs_to :vendor, optional: true
belongs_to :registration, optional: true

# In Organization model (add to existing)
has_many :vendor_contacts, dependent: :destroy
```

## Key Points to Remember

1. **JWT Authentication** - All endpoints require valid JWT token with venue_owner role
2. **Organization Scoping** - Contacts belong to organizations; users can only see their own
3. **Slug Patterns** - Consider if you need slug generation for contacts
4. **Counter Caches** - Consider adding counter_cache for relationship counts
5. **Status Tracking** - Use enums or string for status tracking
6. **Soft Deletes** - Consider if deleted contacts should be archived instead
7. **Activity Logging** - Consider tracking who created/updated contacts

## Getting Help

All detailed information is in the two comprehensive documents:
- `VENDOR_CONTACTS_CRM_ANALYSIS.md` - For understanding the existing system
- `VENDOR_CONTACTS_CODE_REFERENCES.md` - For code patterns and examples

