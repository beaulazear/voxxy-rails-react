# Frontend Integration: New Event & Vendor Application Fields

## Context
We've added two new **required** fields to the Voxxy Presents backend API:
1. **`application_deadline`** (datetime) - Added to Events
2. **`booth_price`** (decimal) - Added to Vendor Applications

## Backend Changes Summary

### Events API Changes

**Endpoint:** `POST /api/v1/presents/organizations/:organization_id/events`

**New Required Field:**
- `application_deadline` (ISO 8601 datetime string)

**Validation Rules:**
- Required for all new events
- Must be on or before the `event_date`

**Example Request:**
```json
POST /api/v1/presents/organizations/my-org/events
{
  "event": {
    "title": "Summer Market",
    "description": "Annual summer market event",
    "event_date": "2025-08-15T10:00:00Z",
    "application_deadline": "2025-08-01T23:59:59Z",  // NEW - REQUIRED
    "location": "Central Park",
    "published": false
  }
}
```

**Example Success Response:**
```json
{
  "id": 12,
  "title": "Summer Market",
  "slug": "summer-market",
  "description": "Annual summer market event",
  "dates": {
    "start": "2025-08-15T10:00:00Z",
    "end": null
  },
  "location": "Central Park",
  "application_deadline": "2025-08-01T23:59:59Z",  // NEW FIELD
  "status": {
    "published": false,
    "registration_open": true,
    "status": null
  },
  "organization": { ... },
  "created_at": "2025-12-26T16:00:00Z",
  "updated_at": "2025-12-26T16:00:00Z"
}
```

**Example Error Response (missing application_deadline):**
```json
{
  "errors": ["Application deadline can't be blank"]
}
```

**Example Error Response (invalid application_deadline):**
```json
{
  "errors": ["Application deadline must be on or before the event start date"]
}
```

---

### Vendor Applications API Changes

**Endpoint:** `POST /api/v1/presents/events/:event_slug/vendor_applications`

**New Required Field:**
- `booth_price` (number, must be >= 0)

**Validation Rules:**
- Required for all new vendor applications
- Must be greater than or equal to 0 (no negative prices)

**Example Request:**
```json
POST /api/v1/presents/events/summer-market/vendor_applications
{
  "vendor_application": {
    "name": "Vendor Application for Summer Market",
    "description": "Apply to be a vendor at our summer market",
    "booth_price": 150.00,  // NEW - REQUIRED
    "status": "active",
    "categories": ["food", "crafts", "art"]
  }
}
```

**Example Success Response:**
```json
{
  "id": 2,
  "name": "Vendor Application for Summer Market",
  "description": "Apply to be a vendor at our summer market",
  "status": "active",
  "categories": ["food", "crafts", "art"],
  "pricing": {
    "booth_price": 150.0,  // NEW FIELD
    "currency": "USD"
  },
  "shareable_code": "EVENT-202512-ABC123",
  "shareable_url": "https://www.voxxypresents.com/apply/EVENT-202512-ABC123",
  "event": { ... },
  "created_at": "2025-12-26T16:00:00Z",
  "updated_at": "2025-12-26T16:00:00Z"
}
```

**Example Error Response (missing booth_price):**
```json
{
  "errors": ["Booth price can't be blank", "Booth price is not a number"]
}
```

**Example Error Response (negative booth_price):**
```json
{
  "errors": ["Booth price must be greater than or equal to 0"]
}
```

---

## Tasks for Frontend Integration

Please update the frontend to support these new required fields:

### 1. Update TypeScript Interfaces/Types

**Event Interface:**
Add `application_deadline` field to the Event type definition.

**VendorApplication Interface:**
Add `pricing` object with `booth_price` and `currency` fields.

### 2. Update CreateEventForm / CreateEventWizard

**Step 1 - Event Details:**
- Add `application_deadline` input field (datetime picker)
- Make it a required field
- Add validation: `application_deadline` must be on or before `event_date`
- Display error message if validation fails

**UI Suggestions:**
- Use a datetime picker component
- Show helper text: "Deadline for vendors to submit applications"
- Add validation message: "Application deadline must be on or before the event start date"

### 3. Update CreateApplicationForm / Step 2 - Application Details

**Step 2 - Application Details:**
- Add `booth_price` input field (number input)
- Make it a required field
- Add validation: `booth_price` must be >= 0
- Format as currency (USD)
- Display error message if validation fails

**UI Suggestions:**
- Use a currency input component with $ prefix
- Show helper text: "Price vendors will pay for a booth"
- Add validation message: "Booth price must be $0 or greater"
- Consider showing dynamic booth rows with individual pricing if needed

### 4. Update API Service Calls

Ensure your API service functions include the new fields:

**createEvent:**
```typescript
// Example
const createEvent = async (organizationSlug: string, eventData: EventFormData) => {
  const response = await api.post(
    `/api/v1/presents/organizations/${organizationSlug}/events`,
    {
      event: {
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.eventDate,
        application_deadline: eventData.applicationDeadline,  // NEW
        location: eventData.location,
        // ... other fields
      }
    }
  );
  return response.data;
};
```

**createVendorApplication:**
```typescript
// Example
const createVendorApplication = async (eventSlug: string, appData: ApplicationFormData) => {
  const response = await api.post(
    `/api/v1/presents/events/${eventSlug}/vendor_applications`,
    {
      vendor_application: {
        name: appData.name,
        description: appData.description,
        booth_price: appData.boothPrice,  // NEW
        status: 'active',
        categories: appData.categories,
      }
    }
  );
  return response.data;
};
```

### 5. Update Display Components

**Event Display Components:**
- Show `application_deadline` where events are displayed
- Format the date nicely (e.g., "Applications due: August 1, 2025")

**Vendor Application Display Components:**
- Show `booth_price` from the `pricing` object
- Format as currency: `$${pricing.booth_price.toFixed(2)}`

### 6. Handle Validation Errors

Update error handling to display backend validation errors:
- "Application deadline can't be blank"
- "Application deadline must be on or before the event start date"
- "Booth price can't be blank"
- "Booth price must be greater than or equal to 0"

---

## Important Notes

### Legacy Data Compatibility
- Existing events/applications **without** these fields will still work
- Only **NEW** events/applications require these fields
- When fetching existing data, these fields may be `null` - handle gracefully

### Testing Checklist
- [ ] Can create new event with valid `application_deadline`
- [ ] Error shown when `application_deadline` is missing
- [ ] Error shown when `application_deadline` is after `event_date`
- [ ] Can create new vendor application with valid `booth_price`
- [ ] Error shown when `booth_price` is missing
- [ ] Error shown when `booth_price` is negative
- [ ] Both fields display correctly in event/application lists
- [ ] Both fields display correctly in event/application detail views

---

## Questions?

If you encounter any issues or need clarification:
1. Check the backend validation error messages
2. Verify the request payload matches the examples above
3. Ensure datetime strings are in ISO 8601 format
4. Ensure booth_price is sent as a number, not a string

Backend is fully tested and ready! 🚀
