# Invitation to Application Flow - Complete Guide

**Date:** December 28, 2024
**Status:** ✅ Updated - Invitations now include all vendor applications

---

## Overview

When a producer invites vendors to an event, the invitation link gives them access to **all available vendor applications** for that event. Vendors can then choose which application(s) fit their business and apply.

---

## The Complete Flow

### 1️⃣ **Producer Creates Event with Multiple Applications**

```
Event: "Downtown Summer Market"
├── Food Vendor Application
│   ├── Categories: ["food", "beverage"]
│   ├── Booth Price: $150
│   └── Code: EVENT-202512-FOOD01
│
├── Merchandise Vendor Application
│   ├── Categories: ["crafts", "merchandise"]
│   ├── Booth Price: $100
│   └── Code: EVENT-202512-MERCH01
│
└── Entertainment Vendor Application
    ├── Categories: ["music", "performance"]
    ├── Booth Price: $200
    └── Code: EVENT-202512-ENTER01
```

---

### 2️⃣ **Producer Invites Vendors**

Producer selects vendor contacts from their network:
- John's Food Truck (tagged: food, catering)
- Sarah's Crafts (tagged: merchandise, handmade)
- Mike's Band (tagged: music, entertainment)

**API Call:**
```typescript
POST /api/v1/presents/events/downtown-summer-market/invitations/batch
{
  "vendor_contact_ids": [123, 456, 789]
}
```

**Result:** Each vendor receives an email with their unique invitation link.

---

### 3️⃣ **Vendor Receives Email**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           🎉 You're Invited!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hello John Smith (John's Food Truck),

Downtown Events Co. would like to invite you
to participate in an upcoming event.

┌─────────────────────────────────────────┐
│  Downtown Summer Market                 │
│                                         │
│  📅 July 15, 2025 at 9:00 AM           │
│  📍 Central Park Plaza                  │
│  ⏰ Deadline: July 1, 2025             │
└─────────────────────────────────────────┘

    ┌──────────────────────────────┐
    │  View Invitation Details     │  ← CLICK
    └──────────────────────────────┘

Link: http://localhost:5173/invitations/xK9mP2vQr8...
```

---

### 4️⃣ **Vendor Clicks Link & Views Invitation**

**URL:** `http://localhost:5173/invitations/xK9mP2vQr8tLnWcY3jHfG5dA7bS1eN4oZxM6uI8pRa0T`

**Frontend calls:**
```typescript
GET /api/v1/presents/invitations/xK9mP2vQr8tLnWcY3jHfG5dA7bS1eN4oZxM6uI8pRa0T
```

**Backend returns:** ⭐ NEW - Now includes vendor applications!
```json
{
  "invitation": {
    "id": 1,
    "status": "viewed",
    "can_respond": true,
    "is_expired": false,
    "vendor_contact": {
      "id": 123,
      "name": "John Smith",
      "email": "john@foodtruck.com",
      "company_name": "John's Food Truck"
    },
    "event": {
      "id": 42,
      "title": "Downtown Summer Market",
      "slug": "downtown-summer-market",
      "description": "Annual summer market featuring local vendors",
      "event_date": "2025-07-15T09:00:00Z",
      "location": "Central Park Plaza",
      "application_deadline": "2025-07-01T23:59:59Z",

      "vendor_applications": [
        {
          "id": 1,
          "name": "Food Vendor Application",
          "description": "Application for food and beverage vendors",
          "categories": ["food", "beverage"],
          "booth_price": 150.00,
          "shareable_code": "EVENT-202512-FOOD01",
          "shareable_url": "http://localhost:5173/apply/EVENT-202512-FOOD01",
          "status": "active"
        },
        {
          "id": 2,
          "name": "Merchandise Vendor Application",
          "description": "Application for merchandise and craft vendors",
          "categories": ["crafts", "merchandise"],
          "booth_price": 100.00,
          "shareable_code": "EVENT-202512-MERCH01",
          "shareable_url": "http://localhost:5173/apply/EVENT-202512-MERCH01",
          "status": "active"
        },
        {
          "id": 3,
          "name": "Entertainment Vendor Application",
          "description": "Application for music and entertainment",
          "categories": ["music", "performance"],
          "booth_price": 200.00,
          "shareable_code": "EVENT-202512-ENTER01",
          "shareable_url": "http://localhost:5173/apply/EVENT-202512-ENTER01",
          "status": "active"
        }
      ]
    }
  }
}
```

---

### 5️⃣ **Frontend Displays Invitation with Applications**

Your `InvitationViewPage.tsx` now has access to `invitation.event.vendor_applications[]` and can display:

```
┌─────────────────────────────────────────────────┐
│  Event Invitation                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  📍 Downtown Summer Market                      │
│  July 15, 2025 • Central Park Plaza             │
│                                                 │
│  Hello John Smith,                              │
│  You've been invited to participate!            │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Available Vendor Applications          │   │
│  ├─────────────────────────────────────────┤   │
│  │                                         │   │
│  │  🍔 Food Vendor Application             │   │
│  │  Categories: Food, Beverage             │   │
│  │  Booth Price: $150.00                   │   │
│  │  ┌──────────────┐                       │   │
│  │  │ Apply Now    │  ← Click to apply     │   │
│  │  └──────────────┘                       │   │
│  │                                         │   │
│  │  🎨 Merchandise Vendor Application      │   │
│  │  Categories: Crafts, Merchandise        │   │
│  │  Booth Price: $100.00                   │   │
│  │  ┌──────────────┐                       │   │
│  │  │ Apply Now    │                       │   │
│  │  └──────────────┘                       │   │
│  │                                         │   │
│  │  🎵 Entertainment Vendor Application    │   │
│  │  Categories: Music, Performance         │   │
│  │  Booth Price: $200.00                   │   │
│  │  ┌──────────────┐                       │   │
│  │  │ Apply Now    │                       │   │
│  │  └──────────────┘                       │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌────────────────┐  ┌────────────────────┐    │
│  │ Decline        │  │ Accept Invitation  │    │
│  └────────────────┘  └────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 6️⃣ **Vendor Workflow Options**

#### Option A: Accept Invitation First, Apply Later
1. Vendor clicks **"Accept Invitation"** (with optional note)
2. Backend sends confirmation emails
3. Vendor can still see and click application links
4. Vendor clicks **"Apply Now"** on desired application(s)
5. Opens `/apply/EVENT-202512-FOOD01` (existing application flow)

#### Option B: Apply Directly
1. Vendor clicks **"Apply Now"** on desired application
2. Opens `/apply/EVENT-202512-FOOD01` directly
3. Vendor fills out application form (existing flow)
4. Invitation remains in "viewed" status until explicitly accepted/declined

#### Option C: Decline Invitation
1. Vendor clicks **"Decline"** (with optional note)
2. Backend sends notification to producer
3. Application links become inactive/hidden

---

### 7️⃣ **Application Submission**

When vendor clicks **"Apply Now"** on an application:

**Navigate to:** `http://localhost:5173/apply/EVENT-202512-FOOD01`

This is your **existing** application flow - nothing changes here!

The vendor fills out:
- Business name
- Contact info
- Vendor category
- Any custom fields

---

## Frontend Implementation Guide

### Update `InvitationViewPage.tsx`

Add a section to display vendor applications:

```typescript
{/* Vendor Applications Section - NEW */}
{invitation.event?.vendor_applications && invitation.event.vendor_applications.length > 0 && (
  <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
    <h3 className="text-lg font-semibold text-white mb-4">
      Available Vendor Applications
    </h3>
    <div className="space-y-4">
      {invitation.event.vendor_applications.map((app) => (
        <div
          key={app.id}
          className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
        >
          <h4 className="text-white font-medium mb-2">{app.name}</h4>

          {app.description && (
            <p className="text-white/60 text-sm mb-3">{app.description}</p>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              {app.categories.map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30"
                >
                  {category}
                </span>
              ))}
            </div>
            <span className="text-green-400 font-medium">
              ${app.booth_price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => window.location.href = app.shareable_url}
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all"
          >
            Apply Now
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

### TypeScript Interface Update

Update the `EventInvitation` interface in your API service:

```typescript
export interface EventInvitation {
  // ... existing fields ...
  event?: {
    id: number
    title: string
    slug: string
    description: string
    event_date: string
    location: string
    application_deadline: string

    // NEW - Array of vendor applications
    vendor_applications: VendorApplication[]
  }
}

export interface VendorApplication {
  id: number
  name: string
  description: string | null
  categories: string[]
  booth_price: number
  shareable_code: string
  shareable_url: string
  status: string
}
```

---

## Key Benefits

### ✅ Single Point of Entry
- One invitation link gives access to all relevant applications
- Vendor doesn't need multiple emails or links

### ✅ Vendor Choice
- Vendor can see all options
- Can apply to multiple applications if applicable
- Clear pricing and categories help decision-making

### ✅ Streamlined Workflow
- Accept invitation = express general interest
- Apply to specific application = commit to that vendor type
- Producer can track both invitation responses AND applications separately

### ✅ No Breaking Changes
- Existing application flow (`/apply/:code`) unchanged
- Email templates unchanged
- Just adds more data to invitation response

---

## Example User Stories

### Story 1: Food Truck Vendor
1. John receives invitation to "Downtown Market"
2. Clicks link, sees 3 applications: Food, Merchandise, Entertainment
3. Clicks **"Accept Invitation"** (shows interest)
4. Clicks **"Apply Now"** on "Food Vendor Application"
5. Fills out application form with menu, health permits, etc.
6. Submits application

### Story 2: Multi-Category Vendor
1. Sarah receives invitation to "Arts & Crafts Fair"
2. Sees 2 relevant applications: Handmade Goods, Art Prints
3. Clicks **"Apply Now"** on "Handmade Goods" first
4. Completes application, returns to invitation page
5. Clicks **"Apply Now"** on "Art Prints" second
6. Submits both applications

### Story 3: Wrong Fit
1. Mike (musician) receives invitation to "Food Festival"
2. Sees only "Food Vendor" and "Beverage Vendor" applications
3. Realizes it's not a good fit
4. Clicks **"Decline"** with note: "Thanks, but I'm an entertainment vendor"
5. Producer gets notification and can update their contact list

---

## Data Flow Summary

```
Invitation Link (Token)
    ↓
GET /api/v1/presents/invitations/:token
    ↓
Returns: Event + All Vendor Applications
    ↓
Frontend Displays: Invitation Details + Application Cards
    ↓
User Action 1: Accept/Decline Invitation (general interest)
    ↓
User Action 2: Click "Apply" on specific application
    ↓
Navigate to: /apply/:shareable_code (existing flow)
    ↓
Submit Application Form
```

---

## Testing

### Test Scenario 1: Event with Multiple Applications

```ruby
# Rails console
event = Event.create!(
  title: "Test Market",
  slug: "test-market",
  organization: Organization.first,
  event_date: 2.weeks.from_now,
  application_deadline: 1.week.from_now
)

# Create 3 different applications
food_app = VendorApplication.create!(
  event: event,
  name: "Food Vendor",
  description: "For food and beverage vendors",
  categories: ["food", "beverage"],
  booth_price: 150,
  status: "active"
)

merch_app = VendorApplication.create!(
  event: event,
  name: "Merchandise Vendor",
  description: "For craft and merchandise vendors",
  categories: ["crafts", "merchandise"],
  booth_price: 100,
  status: "active"
)

# Create invitation
contact = VendorContact.first
invitation = EventInvitation.create!(
  event: event,
  vendor_contact: contact
)

# Test API response
# GET /api/v1/presents/invitations/:token
# Should include both applications in response
```

### Test Scenario 2: No Applications Yet

If an event has no vendor applications yet, the response will include an empty array:

```json
{
  "vendor_applications": []
}
```

Frontend should handle this gracefully (show message like "No applications available yet").

---

## Next Steps

### Frontend TODO
1. Update `InvitationViewPage.tsx` to display vendor applications
2. Add "Apply Now" buttons for each application
3. Update TypeScript interfaces
4. Test with multiple applications
5. Handle edge case: no applications available

### Backend (Already Complete) ✅
- ✅ Serializer includes vendor_applications
- ✅ Controller eager loads applications
- ✅ Only active applications returned
- ✅ Full application details included

---

## Status: Ready for Frontend Integration! 🚀

The backend now returns all vendor applications with each invitation. Frontend just needs to display them!
