# User Preferences API Documentation

**Last Updated:** November 1, 2025
**Backend Version:** Rails 7.2

## Overview

This document describes the user preference fields available in the Voxxy API. These fields allow users to customize their profile with their dining, bar, and general activity preferences, which are used to personalize recommendations and enhance the social experience.

---

## User Preference Fields

### 1. `preferences` (General Preferences)
- **Type:** String
- **Required:** No
- **Default:** `""` (empty string)
- **Nullable:** No (will default to empty string if not provided)
- **Description:** General activity preferences for the user (e.g., "Love board games, prefer strategy games, play with 4-6 people")

### 2. `favorite_food` (Favorite Food/Cuisine)
- **Type:** String
- **Required:** No
- **Default:** `null`
- **Nullable:** Yes
- **Description:** User's favorite food or cuisine type (e.g., "Italian", "Thai food", "Sushi")

### 3. `bar_preferences` (Bar Preferences) ⭐ NEW
- **Type:** String
- **Required:** No
- **Default:** `null`
- **Nullable:** Yes
- **Description:** User's bar and drinking venue preferences (e.g., "Prefer craft beer, love sports bars, quiet atmosphere")

---

## API Endpoints

### Get Current User Profile

**Endpoint:** `GET /users/:id`

**Response includes:**
```json
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "preferences": "Love board games, prefer strategy games",
  "favorite_food": "Italian",
  "bar_preferences": "Craft beer bars, quiet atmosphere",
  ...
}
```

---

### Update User Preferences

**Endpoint:** `PUT /users/:id` or `PATCH /users/:id`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_token>
```

**Request Body:**
```json
{
  "user": {
    "preferences": "Love outdoor activities, prefer small groups",
    "favorite_food": "Mexican",
    "bar_preferences": "Wine bars, rooftop venues"
  }
}
```

**Success Response (200 OK):**
```json
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "preferences": "Love outdoor activities, prefer small groups",
  "favorite_food": "Mexican",
  "bar_preferences": "Wine bars, rooftop venues",
  "text_notifications": true,
  "email_notifications": true,
  "push_notifications": true,
  ...
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "errors": ["Error message here"]
}
```

---

## Usage Examples

### Example 1: Update All Preferences at Once
```javascript
const updatePreferences = async (userId, preferences) => {
  const response = await fetch(`/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      user: {
        preferences: "Love trying new restaurants",
        favorite_food: "Japanese",
        bar_preferences: "Speakeasy style bars, craft cocktails"
      }
    })
  });

  return response.json();
};
```

### Example 2: Update Individual Preference
```javascript
const updateBarPreferences = async (userId, barPrefs) => {
  const response = await fetch(`/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      user: {
        bar_preferences: barPrefs
      }
    })
  });

  return response.json();
};
```

### Example 3: Clear a Preference
```javascript
// To clear a preference, send an empty string or null
const clearFavoriteFood = async (userId) => {
  const response = await fetch(`/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      user: {
        favorite_food: ""
      }
    })
  });

  return response.json();
};
```

---

## Where Preferences Are Used

### 1. **AI Recommendations** ✨ SMART FILTERING

User preferences are **intelligently filtered** based on recommendation type:

**Restaurant Recommendations:**
- Uses: `favorite_food` + `preferences`
- Example format: `"John's profile: Favorite food: Italian, Preferences: Love outdoor seating"`
- Endpoint: `POST /openai/restaurant_recommendations`

**Bar Recommendations:**
- Uses: `bar_preferences` + `preferences`
- Example format: `"John's profile: Bar preferences: Craft beer bars, Preferences: Prefer quiet atmosphere"`
- Endpoint: `POST /openai/bar_recommendations`

**Game/Activity Recommendations:**
- Uses: `preferences` only
- Example format: `"John's profile: Preferences: Love board games with small groups"`
- Endpoint: `POST /openai/game_recommendations`

This ensures the AI only receives relevant context for each recommendation type, improving recommendation quality and reducing noise.

### 2. **User Profile Display**
All three preference fields are returned in the full user serialization:
- User dashboard (`GET /dashboard`)
- User profile page (`GET /users/:id`)
- Activity participant lists

### 3. **Activity Serialization**
When activities are serialized, participant preferences are included via the `user_with_preferences` serializer, which includes all three preference fields.

---

## Important Notes

### Data Storage
- All three fields are stored as **plain text strings** in the database
- No structured format or validation is enforced server-side
- No character limits are currently enforced (though this may change)

### Current Limitations
- ⚠️ **No validation:** Any text can be stored
- ⚠️ **No length limits:** Consider implementing client-side limits
- ⚠️ **Plain text only:** No rich text or formatting
- ⚠️ **No structure:** Cannot query or filter by specific sub-preferences

### Best Practices
1. **Keep it simple:** Plain text descriptions work best
2. **Reasonable length:** Consider limiting to 200-500 characters per field on the client side
3. **Clear descriptions:** Encourage users to be specific but concise
4. **Sanitize input:** Clean user input before sending to API
5. **Handle nulls:** Remember that `favorite_food` and `bar_preferences` can be null

---

## UI Recommendations

### Form Fields
```jsx
// Example React/React Native component structure
<TextInput
  label="General Preferences"
  placeholder="e.g., Love trying new restaurants, prefer outdoor seating"
  value={preferences}
  onChange={setPreferences}
  maxLength={500}
  multiline
/>

<TextInput
  label="Favorite Food/Cuisine"
  placeholder="e.g., Italian, Sushi, Thai"
  value={favoriteFood}
  onChange={setFavoriteFood}
  maxLength={100}
/>

<TextInput
  label="Bar Preferences"
  placeholder="e.g., Craft beer, wine bars, rooftop venues"
  value={barPreferences}
  onChange={setBarPreferences}
  maxLength={200}
  multiline
/>
```

### Display Format
When displaying preferences in the UI:
```jsx
// Check if user has any preferences
const hasPreferences = user.preferences || user.favorite_food || user.bar_preferences;

// Display preferences section
{hasPreferences && (
  <PreferencesSection>
    {user.favorite_food && (
      <Preference>
        <Label>Favorite Food:</Label> {user.favorite_food}
      </Preference>
    )}
    {user.bar_preferences && (
      <Preference>
        <Label>Bar Preferences:</Label> {user.bar_preferences}
      </Preference>
    )}
    {user.preferences && (
      <Preference>
        <Label>Other Preferences:</Label> {user.preferences}
      </Preference>
    )}
  </PreferencesSection>
)}
```

---

## Migration History

### Migration 1: `preferences` field
- **File:** `db/migrate/20250531154223_add_preferences_and_notfications_to_users.rb`
- **Date:** May 31, 2025
- **Changes:** Added `preferences` string column with default empty string

### Migration 2: `favorite_food` field
- **File:** `db/migrate/20251002134127_add_favorite_food_to_users.rb`
- **Date:** October 2, 2025
- **Changes:** Added `favorite_food` string column (nullable)

### Migration 3: `bar_preferences` field
- **File:** `db/migrate/20251101191938_add_bar_preferences_to_users.rb`
- **Date:** November 1, 2025
- **Changes:** Added `bar_preferences` string column (nullable)

---

## Future Improvements (Planned)

The following improvements are planned for future releases:
1. ✅ Add validation for field lengths
2. ✅ Migrate to structured format (JSONB or separate models)
3. ✅ Add input sanitization
4. ✅ Add database indexes for search performance
5. ✅ Support for multiple categorized preferences

---

## Questions or Issues?

If you encounter any issues or have questions about these fields, please contact the backend team or create an issue in the repository.

**Backend Locations:**
- Model: `app/models/user.rb:261-272`
- Controller: `app/controllers/users_controller.rb:250-256`
- Serializers:
  - `app/serializers/user_serializer.rb`
  - `app/serializers/base_serializer.rb:23-30`
- AI Integration:
  - Smart filtering logic: `app/controllers/openai_controller.rb:306-334` (`build_profile_input`)
  - Combined responses builder: `app/controllers/openai_controller.rb:250-304` (`build_combined_responses`)
  - Restaurant endpoint: `app/controllers/openai_controller.rb:21-61`
  - Bar endpoint: `app/controllers/openai_controller.rb:63-103`
  - Game endpoint: `app/controllers/openai_controller.rb:105-137`
