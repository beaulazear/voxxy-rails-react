# Voxxy Presents - Firebase to Rails API Migration Guide

**Date:** November 4, 2025
**Purpose:** Guide for migrating Voxxy Presents frontend from Firebase to Rails API
**Target:** Frontend developers working in the Voxxy Presents client

---

## Table of Contents

1. [Overview](#overview)
2. [API Base URLs](#api-base-urls)
3. [Authentication Migration](#authentication-migration)
4. [Endpoint Mappings](#endpoint-mappings)
5. [Data Structure Changes](#data-structure-changes)
6. [Code Migration Examples](#code-migration-examples)
7. [Error Handling](#error-handling)
8. [Step-by-Step Migration Plan](#step-by-step-migration-plan)

---

## Overview

### What's Changing?

**Before:** Firebase Realtime Database / Firestore
**After:** Voxxy Rails REST API

### Why Migrate?

- ✅ Unified backend with Voxxy Mobile
- ✅ Better data relationships and SQL queries
- ✅ Role-based authorization
- ✅ Budget management features
- ✅ Vendor marketplace integration
- ✅ Consistent API patterns

### What Stays the Same?

- User authentication (JWT tokens)
- Core data models (Organizations, Events, Vendors)
- User roles and permissions

---

## API Base URLs

### Development
```javascript
const API_BASE_URL = 'http://localhost:3000/api/v1/presents';
```

### Production
```javascript
const API_BASE_URL = 'https://api.voxxyai.com/api/v1/presents';
```

### Shared Endpoints (Login, Users)
```javascript
const SHARED_API_URL = 'http://localhost:3000/api/v1/shared';
```

---

## Authentication Migration

### Before (Firebase)
```javascript
// Firebase Authentication
import { signInWithEmailAndPassword } from 'firebase/auth';

const loginWithFirebase = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  return { user: userCredential.user, token };
};
```

### After (Rails JWT)
```javascript
// Rails JWT Authentication
const loginWithRails = async (email, password) => {
  const response = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      product: 'presents', // Important: specify product context
    }),
  });

  const data = await response.json();

  if (data.token) {
    // Store token for future requests
    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));
    return { user: data.user, token: data.token };
  } else {
    throw new Error(data.error || 'Login failed');
  }
};
```

### Authenticated Requests
```javascript
// Add token to all authenticated requests
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('authToken');

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
};
```

---

## Endpoint Mappings

### Organizations (Venues)

| Operation | Firebase | Rails API | Auth Required |
|-----------|----------|-----------|---------------|
| List all | `db.ref('organizations').once('value')` | `GET /api/v1/presents/organizations` | ❌ No |
| Get by ID | `db.ref('organizations/{id}').once('value')` | `GET /api/v1/presents/organizations/{slug}` | ❌ No |
| Create | `db.ref('organizations').push()` | `POST /api/v1/presents/organizations` | ✅ Yes (venue_owner) |
| Update | `db.ref('organizations/{id}').update()` | `PATCH /api/v1/presents/organizations/{slug}` | ✅ Yes (owner) |
| Delete | `db.ref('organizations/{id}').remove()` | `DELETE /api/v1/presents/organizations/{slug}` | ✅ Yes (owner) |

**Note:** Rails uses **slugs** instead of IDs in URLs (e.g., `the-grand-ballroom` instead of `org123`)

---

### Events

| Operation | Firebase | Rails API | Auth Required |
|-----------|----------|-----------|---------------|
| List all | `db.ref('events').once('value')` | `GET /api/v1/presents/events` | ❌ No |
| Get by ID | `db.ref('events/{id}').once('value')` | `GET /api/v1/presents/events/{slug}` | ❌ No |
| By organization | Filter in code | `GET /api/v1/presents/organizations/{org_slug}/events` | ❌ No |
| Create | `db.ref('events').push()` | `POST /api/v1/presents/organizations/{org_slug}/events` | ✅ Yes (venue_owner) |
| Update | `db.ref('events/{id}').update()` | `PATCH /api/v1/presents/events/{slug}` | ✅ Yes (owner) |
| Delete | `db.ref('events/{id}').remove()` | `DELETE /api/v1/presents/events/{slug}` | ✅ Yes (owner) |
| Registrations | `db.ref('registrations').orderByChild('eventId')` | `GET /api/v1/presents/events/{slug}/registrations` | ✅ Yes (owner) |

**Query Params:**
- `?status=upcoming` - Filter upcoming events
- `?status=past` - Filter past events

---

### Vendors

| Operation | Firebase | Rails API | Auth Required |
|-----------|----------|-----------|---------------|
| List all | `db.ref('vendors').once('value')` | `GET /api/v1/presents/vendors` | ❌ No |
| Search | Filter in code | `GET /api/v1/presents/vendors/search?query={text}` | ❌ No |
| Get by ID | `db.ref('vendors/{id}').once('value')` | `GET /api/v1/presents/vendors/{slug}` | ❌ No |
| Create | `db.ref('vendors').push()` | `POST /api/v1/presents/vendors` | ✅ Yes (vendor) |
| Update | `db.ref('vendors/{id}').update()` | `PATCH /api/v1/presents/vendors/{slug}` | ✅ Yes (owner) |
| Delete | `db.ref('vendors/{id}').remove()` | `DELETE /api/v1/presents/vendors/{slug}` | ✅ Yes (owner) |

**Search Query Params:**
- `?query={text}` - Search name, description, services
- `?city={city}` - Filter by city
- `?state={state}` - Filter by state
- `?vendor_type={type}` - Filter by type (venue, catering, entertainment, market_vendor)
- `?verified=true` - Only verified vendors
- `?sort={field}` - Sort by rating, views, created_at

---

### Event Registrations (Guest RSVP)

| Operation | Firebase | Rails API | Auth Required |
|-----------|----------|-----------|---------------|
| Register for event | `db.ref('registrations').push()` | `POST /api/v1/presents/events/{slug}/registrations` | ❌ No |
| View registrations | Query by eventId | `GET /api/v1/presents/events/{slug}/registrations` | ✅ Yes (owner) |
| Update registration | `db.ref('registrations/{id}').update()` | `PATCH /api/v1/presents/registrations/{id}` | ✅ Yes (owner) |

**Important:** Guest registration does NOT require authentication!

---

### Budgets

| Operation | Firebase | Rails API | Auth Required |
|-----------|----------|-----------|---------------|
| List user budgets | Query by userId | `GET /api/v1/presents/budgets` | ✅ Yes |
| Get budget | `db.ref('budgets/{id}').once('value')` | `GET /api/v1/presents/budgets/{id}` | ✅ Yes (owner) |
| Create for event | `db.ref('budgets').push()` | `POST /api/v1/presents/events/{slug}/budgets` | ✅ Yes (owner) |
| Create for org | `db.ref('budgets').push()` | `POST /api/v1/presents/organizations/{slug}/budgets` | ✅ Yes (owner) |
| Update | `db.ref('budgets/{id}').update()` | `PATCH /api/v1/presents/budgets/{id}` | ✅ Yes (owner) |
| Delete | `db.ref('budgets/{id}').remove()` | `DELETE /api/v1/presents/budgets/{id}` | ✅ Yes (owner) |

---

### Budget Line Items

| Operation | Firebase | Rails API | Auth Required |
|-----------|----------|-----------|---------------|
| List items | Query by budgetId | `GET /api/v1/presents/budgets/{budget_id}/budget_line_items` | ✅ Yes (owner) |
| Create item | `db.ref('line_items').push()` | `POST /api/v1/presents/budgets/{budget_id}/budget_line_items` | ✅ Yes (owner) |
| Update item | `db.ref('line_items/{id}').update()` | `PATCH /api/v1/presents/budgets/{budget_id}/budget_line_items/{id}` | ✅ Yes (owner) |
| Delete item | `db.ref('line_items/{id}').remove()` | `DELETE /api/v1/presents/budgets/{budget_id}/budget_line_items/{id}` | ✅ Yes (owner) |

---

## Data Structure Changes

### Organizations

**Before (Firebase):**
```json
{
  "id": "org123",
  "name": "The Grand Ballroom",
  "email": "info@venue.com",
  "city": "New York",
  "state": "NY",
  "verified": true
}
```

**After (Rails - Serialized):**
```json
{
  "id": 1,
  "name": "The Grand Ballroom",
  "slug": "the-grand-ballroom",
  "description": "Premier event venue...",
  "logo_url": null,
  "contact": {
    "email": "info@grandballroom.com",
    "phone": "(212) 555-0100",
    "website": "https://grandballroom.com",
    "instagram": "@grandballroom"
  },
  "location": {
    "address": "123 5th Avenue",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "verified": true,
  "active": true,
  "created_at": "2025-11-04T20:53:36.700Z",
  "updated_at": "2025-11-04T20:53:36.700Z"
}
```

**Key Changes:**
- ✅ Added `slug` for URL-friendly IDs
- ✅ Nested `contact` object
- ✅ Nested `location` object with coordinates
- ✅ Added `logo_url` for branding
- ✅ Added `active` status flag

---

### Events

**Before (Firebase):**
```json
{
  "id": "evt456",
  "title": "Summer Gala",
  "organizationId": "org123",
  "date": "2026-01-04T19:00:00Z",
  "capacity": 200,
  "registeredCount": 3
}
```

**After (Rails - Serialized):**
```json
{
  "id": 1,
  "title": "Summer Gala 2025",
  "slug": "summer-gala-2025",
  "description": "Join us for an elegant evening...",
  "dates": {
    "start": "2026-01-04T19:00:00.000Z",
    "end": "2026-01-04T23:00:00.000Z"
  },
  "location": "123 5th Avenue, New York, NY",
  "poster_url": null,
  "ticket_url": null,
  "pricing": {
    "ticket_price": 150.0,
    "currency": "USD"
  },
  "capacity": {
    "total": 200,
    "registered": 3,
    "remaining": 197,
    "is_full": false
  },
  "status": {
    "published": true,
    "registration_open": true,
    "status": "published"
  },
  "organization": {
    "id": 1,
    "name": "The Grand Ballroom",
    "slug": "the-grand-ballroom",
    "verified": true
  }
}
```

**Key Changes:**
- ✅ `dates` object with start/end
- ✅ `pricing` object
- ✅ `capacity` object with computed fields (`remaining`, `is_full`)
- ✅ `status` object for publication state
- ✅ Nested `organization` object (when `include_organization: true`)

---

### Vendors

**Before (Firebase):**
```json
{
  "id": "vnd789",
  "name": "Elite Catering",
  "type": "catering",
  "city": "New York",
  "rating": 4.8
}
```

**After (Rails - Serialized):**
```json
{
  "id": 1,
  "name": "Elite Catering Co",
  "slug": "elite-catering-co",
  "vendor_type": "catering",
  "description": "Full-service catering...",
  "logo_url": null,
  "contact": {
    "email": "bookings@elitecatering.com",
    "phone": "(212) 555-0300",
    "website": "https://elitecatering.com",
    "instagram": "@elitecatering"
  },
  "location": {
    "city": "New York",
    "state": "NY",
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "services": {
    "meal_types": ["breakfast", "lunch", "dinner"],
    "dietary_options": ["vegetarian", "vegan", "gluten_free"],
    "service_styles": ["buffet", "plated", "family_style"]
  },
  "pricing": {
    "per_person_range": "$50-200",
    "minimum_guests": 25,
    "deposit_required": "50%"
  },
  "stats": {
    "rating": 4.8,
    "views_count": 0,
    "verified": true,
    "active": true
  }
}
```

**Key Changes:**
- ✅ Renamed `type` → `vendor_type`
- ✅ JSON `services` object (flexible structure)
- ✅ JSON `pricing` object (flexible structure)
- ✅ `stats` object for ratings/views
- ✅ Nested contact/location

---

### Registrations

**Before (Firebase):**
```json
{
  "id": "reg101",
  "eventId": "evt456",
  "email": "guest@example.com",
  "name": "Guest Name",
  "status": "confirmed"
}
```

**After (Rails - Serialized):**
```json
{
  "id": 1,
  "email": "guest@example.com",
  "name": "Guest Name",
  "phone": "(555) 123-4567",
  "ticket_code": "A1B2C3D4E5F6G7H8",
  "status": "confirmed",
  "checked_in": false,
  "checked_in_at": null,
  "subscribed": true,
  "created_at": "2025-11-04T20:53:36.772Z",
  "updated_at": "2025-11-04T20:53:36.772Z",
  "event": {
    "id": 1,
    "title": "Summer Gala 2025",
    "slug": "summer-gala-2025",
    "event_date": "2026-01-04T19:00:00.000Z",
    "location": "123 5th Avenue, New York, NY"
  }
}
```

**Key Changes:**
- ✅ Auto-generated `ticket_code` (unique per registration)
- ✅ `checked_in` and `checked_in_at` for check-in tracking
- ✅ `subscribed` for newsletter opt-in
- ✅ Nested `event` object

---

## Code Migration Examples

### 1. Fetch Organizations List

**Before (Firebase):**
```javascript
import { ref, onValue } from 'firebase/database';

const fetchOrganizations = () => {
  const orgsRef = ref(database, 'organizations');

  onValue(orgsRef, (snapshot) => {
    const data = snapshot.val();
    const orgsArray = Object.entries(data || {}).map(([id, org]) => ({
      id,
      ...org,
    }));
    setOrganizations(orgsArray);
  });
};
```

**After (Rails):**
```javascript
const fetchOrganizations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/organizations`);
    const organizations = await response.json();

    if (response.ok) {
      setOrganizations(organizations);
    } else {
      console.error('Error fetching organizations:', organizations.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

---

### 2. Create New Event

**Before (Firebase):**
```javascript
import { ref, push } from 'firebase/database';

const createEvent = async (eventData) => {
  const eventsRef = ref(database, 'events');
  const newEventRef = await push(eventsRef, {
    ...eventData,
    createdAt: Date.now(),
    userId: currentUser.uid,
  });
  return newEventRef.key;
};
```

**After (Rails):**
```javascript
const createEvent = async (organizationSlug, eventData) => {
  const token = await AsyncStorage.getItem('authToken');

  const response = await fetch(
    `${API_BASE_URL}/organizations/${organizationSlug}/events`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        event: {
          title: eventData.title,
          description: eventData.description,
          event_date: eventData.eventDate,
          event_end_date: eventData.eventEndDate,
          location: eventData.location,
          capacity: eventData.capacity,
          ticket_price: eventData.ticketPrice,
          published: eventData.published || false,
          registration_open: true,
        },
      }),
    }
  );

  const data = await response.json();

  if (response.ok) {
    return data; // Returns serialized event
  } else {
    throw new Error(data.errors?.join(', ') || 'Failed to create event');
  }
};
```

---

### 3. Register for Event (Guest)

**Before (Firebase):**
```javascript
const registerForEvent = async (eventId, guestData) => {
  const registrationsRef = ref(database, 'registrations');
  await push(registrationsRef, {
    eventId,
    email: guestData.email,
    name: guestData.name,
    phone: guestData.phone,
    status: 'confirmed',
    createdAt: Date.now(),
  });

  // Manually increment event registeredCount
  const eventRef = ref(database, `events/${eventId}`);
  await update(eventRef, {
    registeredCount: increment(1),
  });
};
```

**After (Rails - Much Simpler!):**
```javascript
const registerForEvent = async (eventSlug, guestData) => {
  // No authentication required for guest registration!
  const response = await fetch(
    `${API_BASE_URL}/events/${eventSlug}/registrations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registration: {
          email: guestData.email,
          name: guestData.name,
          phone: guestData.phone,
          subscribed: guestData.subscribed || false,
        },
      }),
    }
  );

  const data = await response.json();

  if (response.ok) {
    // Returns registration with auto-generated ticket_code
    console.log('Ticket Code:', data.ticket_code);
    return data;
  } else {
    throw new Error(data.errors?.join(', ') || 'Registration failed');
  }
};
```

**Note:** Rails automatically:
- ✅ Checks if event is full
- ✅ Validates email uniqueness per event
- ✅ Generates unique ticket code
- ✅ Increments registered_count

---

### 4. Search Vendors

**Before (Firebase - Client-side filtering):**
```javascript
const searchVendors = async (query, filters) => {
  const vendorsRef = ref(database, 'vendors');
  const snapshot = await get(vendorsRef);
  const vendors = snapshot.val();

  // Filter in JavaScript
  return Object.values(vendors || {}).filter((vendor) => {
    const matchesQuery =
      vendor.name.toLowerCase().includes(query.toLowerCase()) ||
      vendor.description.toLowerCase().includes(query.toLowerCase());

    const matchesCity = !filters.city || vendor.city === filters.city;
    const matchesType = !filters.type || vendor.type === filters.type;

    return matchesQuery && matchesCity && matchesType;
  });
};
```

**After (Rails - Server-side filtering):**
```javascript
const searchVendors = async (query, filters = {}) => {
  const params = new URLSearchParams();

  if (query) params.append('query', query);
  if (filters.city) params.append('city', filters.city);
  if (filters.state) params.append('state', filters.state);
  if (filters.vendor_type) params.append('vendor_type', filters.vendor_type);
  if (filters.verified) params.append('verified', 'true');
  if (filters.sort) params.append('sort', filters.sort);

  const response = await fetch(
    `${API_BASE_URL}/vendors/search?${params.toString()}`
  );

  return await response.json();
};

// Usage:
const results = await searchVendors('catering', {
  city: 'New York',
  vendor_type: 'catering',
  verified: true,
  sort: 'rating',
});
```

---

### 5. Get Event with Organization Data

**Before (Firebase - Multiple queries):**
```javascript
const getEventWithOrganization = async (eventId) => {
  // First get event
  const eventRef = ref(database, `events/${eventId}`);
  const eventSnap = await get(eventRef);
  const event = eventSnap.val();

  // Then get organization
  const orgRef = ref(database, `organizations/${event.organizationId}`);
  const orgSnap = await get(orgRef);
  const organization = orgSnap.val();

  return {
    ...event,
    organization,
  };
};
```

**After (Rails - Single request with nested data):**
```javascript
const getEventWithOrganization = async (eventSlug) => {
  // Automatically includes organization data!
  const response = await fetch(`${API_BASE_URL}/events/${eventSlug}`);
  const event = await response.json();

  // event.organization is already included
  console.log(event.organization.name);

  return event;
};
```

---

## Error Handling

### Rails API Error Format

```javascript
// Success Response (Status 200-299)
{
  "id": 1,
  "name": "The Grand Ballroom",
  // ... rest of data
}

// Error Response (Status 400-599)
{
  "error": "Not authorized",
  "errors": ["Name can't be blank", "Email is invalid"]
}
```

### Recommended Error Handler

```javascript
const handleApiError = (response, data) => {
  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - clear token and redirect to login
      AsyncStorage.removeItem('authToken');
      navigation.navigate('Login');
      throw new Error('Session expired. Please login again.');
    } else if (response.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    } else if (response.status === 404) {
      throw new Error('Resource not found.');
    } else if (response.status === 422) {
      // Validation errors
      const errorMsg = data.errors?.join(', ') || data.error || 'Validation failed';
      throw new Error(errorMsg);
    } else {
      throw new Error(data.error || 'An error occurred.');
    }
  }
};

// Usage:
try {
  const response = await fetch(url, options);
  const data = await response.json();
  handleApiError(response, data);
  return data;
} catch (error) {
  console.error(error.message);
  Alert.alert('Error', error.message);
}
```

---

## Step-by-Step Migration Plan

### Phase 1: Setup (Week 1)

**1.1 Update Environment Variables**
```javascript
// .env
REACT_APP_API_URL=http://localhost:3000/api/v1/presents
REACT_APP_SHARED_API_URL=http://localhost:3000/api/v1/shared
```

**1.2 Create API Service Layer**
```javascript
// services/api.js
export const API_BASE_URL = process.env.REACT_APP_API_URL;

export const apiClient = {
  get: async (endpoint) => {
    const token = await AsyncStorage.getItem('authToken');
    return fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
  },

  post: async (endpoint, data) => {
    const token = await AsyncStorage.getItem('authToken');
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    });
  },

  // ... patch, delete methods
};
```

**1.3 Test Connection**
```javascript
// Test API connectivity
const testApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/organizations`);
    const data = await response.json();
    console.log('✅ API Connected!', data.length, 'organizations found');
  } catch (error) {
    console.error('❌ API Connection failed:', error);
  }
};
```

---

### Phase 2: Authentication (Week 1-2)

**2.1 Migrate Login**
- Replace Firebase `signInWithEmailAndPassword`
- Implement JWT token storage
- Update auth context/state management

**2.2 Migrate Signup**
- Replace Firebase `createUserWithEmailAndPassword`
- Send `role` and `product_context` during signup

**2.3 Update Auth Context**
```javascript
// contexts/AuthContext.js
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const user = await AsyncStorage.getItem('currentUser');

      if (token && user) {
        setCurrentUser(JSON.parse(user));
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, product: 'presents' }),
    });

    const data = await response.json();

    if (data.token) {
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));
      setCurrentUser(data.user);
    } else {
      throw new Error(data.error);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

### Phase 3: Core Features (Week 2-3)

**Priority Order:**

1. **Organizations List** (Public)
   - Migrate `OrganizationsListScreen`
   - Update to use Rails endpoint
   - Handle new data structure

2. **Organization Details** (Public)
   - Migrate `OrganizationDetailScreen`
   - Display nested contact/location
   - Show organization's events

3. **Events List** (Public)
   - Migrate `EventsListScreen`
   - Implement upcoming/past filters
   - Handle capacity display

4. **Event Details** (Public)
   - Migrate `EventDetailScreen`
   - Display new capacity object
   - Show organization info

5. **Event Registration** (Public)
   - Migrate registration form
   - Display generated ticket code
   - Handle capacity validation

6. **My Organizations** (Auth Required)
   - Create/Edit/Delete flows
   - Handle venue owner permissions

7. **My Events** (Auth Required)
   - Create/Edit/Delete flows
   - View registrations list

---

### Phase 4: Advanced Features (Week 3-4)

**4.1 Vendor Marketplace**
- Vendor list screen
- Vendor search with filters
- Vendor detail view
- Create/manage vendor profile

**4.2 Budget Management**
- Budget list screen
- Create budget for event/organization
- Budget line items CRUD
- Vendor linking

**4.3 Profile & Settings**
- User profile screen
- Update user info
- Role display

---

### Phase 5: Testing & Polish (Week 4-5)

**5.1 Integration Testing**
- Test all CRUD operations
- Test authentication flows
- Test error scenarios

**5.2 Data Migration**
- Export existing Firebase data
- Transform to Rails format
- Import via API or direct DB

**5.3 Performance**
- Implement loading states
- Add pull-to-refresh
- Add pagination (if needed)

**5.4 Cleanup**
- Remove Firebase dependencies
- Remove unused Firebase code
- Update documentation

---

## Common Gotchas

### 1. ID vs Slug
❌ **Don't use numeric IDs in URLs**
```javascript
fetch(`/api/v1/presents/events/1`) // Wrong!
```

✅ **Use slugs**
```javascript
fetch(`/api/v1/presents/events/summer-gala-2025`) // Correct!
```

### 2. Nested Data
❌ **Don't make multiple requests**
```javascript
// Bad - multiple requests
const event = await fetchEvent(slug);
const org = await fetchOrganization(event.organization_id);
```

✅ **Use nested serializer data**
```javascript
// Good - single request
const event = await fetchEvent(slug);
// event.organization is already included!
console.log(event.organization.name);
```

### 3. Authentication
❌ **Don't send empty Bearer tokens**
```javascript
headers: {
  'Authorization': `Bearer ${token}` // If token is null, this sends "Bearer null"
}
```

✅ **Conditionally add header**
```javascript
const headers = {
  'Content-Type': 'application/json',
};

if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

### 4. Request Body Format
❌ **Don't send flat objects**
```javascript
body: JSON.stringify({
  title: 'My Event',
  description: 'Great event',
})
```

✅ **Wrap in resource key**
```javascript
body: JSON.stringify({
  event: { // Note the wrapping key!
    title: 'My Event',
    description: 'Great event',
  }
})
```

### 5. Date Formatting
Rails returns ISO 8601 timestamps:
```javascript
"event_date": "2026-01-04T19:00:00.000Z"
```

Convert to Date objects:
```javascript
const eventDate = new Date(event.dates.start);
const formatted = eventDate.toLocaleDateString();
```

---

## API Testing Tools

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah@venue.com","password":"password123","product":"presents"}'
```

**Get Organizations:**
```bash
curl http://localhost:3000/api/v1/presents/organizations
```

**Create Event (with auth):**
```bash
curl -X POST http://localhost:3000/api/v1/presents/organizations/the-grand-ballroom/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "title": "Test Event",
      "description": "Testing",
      "event_date": "2026-06-15T19:00:00Z",
      "capacity": 100,
      "ticket_price": 50,
      "published": true
    }
  }'
```

---

## Resources

### Documentation
- [API Testing Results](./API_TESTING_RESULTS.md) - All endpoints tested with examples
- [Serializers Guide](./SERIALIZERS_IMPLEMENTATION.md) - JSON response format details
- [Integration Strategy](./VOXXY_INTEGRATION_STRATEGY.md) - Overall architecture

### Test Credentials
```
Venue Owner: sarah@venue.com / password123
Vendor:      mike@catering.com / password123
Consumer:    john@consumer.com / password123
```

### Seed Data
Run in Rails console to create test data:
```bash
rails db:seed:presents
```

---

## Support & Questions

**Need Help?**
1. Check the [API Testing Results](./API_TESTING_RESULTS.md) for endpoint examples
2. Review error messages - Rails gives descriptive validation errors
3. Test endpoints with cURL/Postman before implementing in app
4. Check Rails logs: `tail -f log/development.log`

**Common Issues:**
- 401 Unauthorized → Check token is valid and not expired
- 403 Forbidden → Check user has correct role (venue_owner, vendor, etc.)
- 404 Not Found → Check slug is correct (not numeric ID)
- 422 Unprocessable → Check request body format and required fields

---

**Good luck with the migration! 🚀**

The Rails API is faster, more powerful, and better structured than Firebase. You'll appreciate the cleaner code and better developer experience!
