# Backend Moderation Changes - Mobile Integration Guide

## Overview
This document outlines the recent backend changes implemented to comply with Apple App Store Guidelines 1.2 for user-generated content. The mobile app needs to integrate with these new APIs to pass Apple review.

## 1. User Blocking System ✅ NEW

### Backend Implementation
The Rails API now has a complete user blocking system with database persistence.

### API Endpoints

#### Block a User
```javascript
POST /users/:user_id/block
Headers: { Authorization: "Bearer TOKEN" }
Response: {
  "message": "User blocked successfully",
  "blocked_user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Unblock a User
```javascript
DELETE /users/:user_id/unblock
Headers: { Authorization: "Bearer TOKEN" }
Response: {
  "message": "User unblocked successfully",
  "unblocked_user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Get List of Blocked Users
```javascript
GET /users/blocked
Headers: { Authorization: "Bearer TOKEN" }
Response: {
  "blocked_users": [
    {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "avatar_url"
    }
  ],
  "total": 1
}
```

### Content Filtering
**IMPORTANT**: The backend now automatically filters out content from blocked users in:
- Comments (`GET /activities/:id/comments`)
- User Activities (`GET /user_activities`)
- Flagged Activities (`GET /user_activities/flagged`)
- Favorited Activities (`GET /user_activities/favorited`)

### Mobile App Changes Needed
1. **Update BlockedUsersService.js** to sync with backend:
   - On block action: Call `POST /users/:id/block`
   - On unblock action: Call `DELETE /users/:id/unblock`
   - On app launch: Sync blocked list with `GET /users/blocked`
   - Remove local-only blocking logic since backend now handles filtering

2. **Update Comment Components**:
   - Remove client-side filtering of blocked users (backend handles this)
   - Add "Block User" option to user interactions
   - Show success/error messages from API responses

## 2. Terms & Privacy Acceptance Tracking ✅ NEW

### Backend Implementation
The server now tracks when users accept Terms, Privacy Policy, and Community Guidelines with version control.

### API Endpoint

#### Accept Policies
```javascript
POST /accept_policies
Headers: { Authorization: "Bearer TOKEN" }
Body: {
  "accept_terms": true,           // optional
  "accept_privacy": true,          // optional
  "accept_guidelines": true,       // optional
  "terms_version": "1.0.0",        // optional, defaults to current
  "privacy_version": "1.0.0",      // optional, defaults to current
  "guidelines_version": "1.0.0"    // optional, defaults to current
}
Response: {
  "message": "Policies accepted successfully",
  "accepted": {
    "terms": true,
    "privacy_policy": true,
    "community_guidelines": true
  },
  "user": {
    "terms_accepted": true,
    "privacy_policy_accepted": true,
    "community_guidelines_accepted": true,
    "all_policies_accepted": true
  }
}
```

### User Profile Changes
The `/me` endpoint now returns policy acceptance status:
```javascript
GET /me
Response includes:
{
  ...existing user data...,
  "terms_accepted": true,
  "privacy_policy_accepted": true,
  "community_guidelines_accepted": true,
  "all_policies_accepted": true,
  "needs_policy_acceptance": false
}
```

### Mobile App Changes Needed

1. **Update EULAModal.js**:
```javascript
// After user accepts in modal
const acceptPolicies = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/accept_policies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accept_terms: termsChecked,
        accept_privacy: privacyChecked,
        accept_guidelines: guidelinesChecked,
        terms_version: "1.0.0",
        privacy_version: "1.0.0",
        guidelines_version: "1.0.0"
      })
    });
    
    if (response.ok) {
      // Store locally as backup
      await AsyncStorage.setItem('policies_accepted', JSON.stringify({
        timestamp: new Date().toISOString(),
        terms_version: "1.0.0",
        privacy_version: "1.0.0",
        guidelines_version: "1.0.0"
      }));
      
      // Close modal and proceed
      setModalVisible(false);
    }
  } catch (error) {
    console.error('Failed to accept policies:', error);
    // Handle error
  }
};
```

2. **Update App Launch Flow**:
```javascript
// In UserContext or App.js
const checkPolicyAcceptance = async () => {
  const userData = await fetch('/me');
  
  if (userData.needs_policy_acceptance) {
    // Show EULA modal
    setShowEULAModal(true);
  }
};
```

3. **Version Checking**:
   - Current versions in backend: `1.0.0` for all policies
   - When backend updates versions, `needs_policy_acceptance` will be true
   - Force users to re-accept when this happens

## 3. Existing Moderation Features (Already Implemented)

### Reports System
- `POST /reports` - Create report (already integrated in ReportModal.js)
- Reports are tracked with 24-hour SLA
- Backend sends email notifications to admins

### User Suspension/Ban Status
The `/me` endpoint returns:
```javascript
{
  "status": "active|suspended|banned",
  "suspended_until": "2024-01-15T12:00:00Z",  // if suspended
  "suspension_reason": "...",                  // if suspended
  "ban_reason": "..."                          // if banned
}
```

**Mobile App Should**:
- Check `status` field on login/app launch
- Show SuspendedScreen.js when status is not "active"
- Handle 403/451 error codes for suspended/banned users

## 4. Error Handling

### New Error Responses
The backend will return specific status codes for moderated users:
- `403 Forbidden` - User is suspended (temporary)
- `451 Unavailable For Legal Reasons` - User is banned (permanent)

Example error response:
```javascript
{
  "error": {
    "code": "USER_SUSPENDED",
    "message": "Your account is suspended until 2024-01-15",
    "suspended_until": "2024-01-15T12:00:00Z",
    "reason": "Community guidelines violation"
  }
}
```

### Mobile App Changes Needed
Update API error handlers:
```javascript
const handleApiError = (error, status) => {
  if (status === 403 || status === 451) {
    // User is suspended/banned
    navigation.navigate('SuspendedScreen');
    return;
  }
  // Handle other errors...
};
```

## 5. Implementation Checklist for Mobile

### High Priority (Required for Apple Review)
- [ ] Integrate with `/accept_policies` endpoint when EULA accepted
- [ ] Check `needs_policy_acceptance` on app launch
- [ ] Sync blocked users with backend API
- [ ] Remove local-only blocking (let backend filter)
- [ ] Handle 403/451 errors for suspended/banned users

### Medium Priority (Improve UX)
- [ ] Add "Block User" to user profile screens
- [ ] Show blocked users list in settings
- [ ] Display policy versions in settings
- [ ] Add policy re-acceptance flow for version updates

### Low Priority (Nice to Have)
- [ ] Cache blocked users list locally for offline
- [ ] Show last policy acceptance date in settings
- [ ] Add unblock functionality in blocked users list

## 6. Testing Instructions

### Test Blocking
1. Login as User A
2. Navigate to User B's profile or comment
3. Select "Block User"
4. Verify User B's content no longer appears
5. Check GET /users/blocked shows User B

### Test Policy Acceptance
1. Fresh install app
2. Create new account
3. EULA modal should appear
4. Accept all policies
5. Verify POST /accept_policies is called
6. Check /me returns all_policies_accepted: true

### Test Moderation
1. Report a user/comment
2. Admin suspends the reported user
3. Reported user tries to use app
4. Should see SuspendedScreen with reason and duration

## 7. Backend Constants

### Current Policy Versions
- Terms: "1.0.0"
- Privacy: "1.0.0"
- Guidelines: "1.0.0"

### User Status Values
- "active" - Normal user
- "suspended" - Temporary ban
- "banned" - Permanent ban

### Report Reasons
- "spam" (0)
- "harassment" (1)
- "hate" (2)
- "inappropriate" (3)
- "violence" (4)
- "misinformation" (5)
- "privacy" (6)
- "other" (7)

## 8. Migration Path

### Phase 1 (Immediate - Before Apple Review)
1. Update accept policies integration
2. Sync blocking with backend
3. Handle suspension/ban states

### Phase 2 (Post-Launch)
1. Remove local AsyncStorage blocking
2. Add version checking for policies
3. Improve error messages

## Questions/Support
If you need any clarification about these backend changes or help with integration:
1. Check the Rails API logs for debugging
2. Test endpoints with Postman/curl first
3. Verify authentication tokens are being sent correctly

## Important Notes
- **ALL** moderation features must work server-side for Apple compliance
- Local storage should only be used as cache/backup, not source of truth
- The backend automatically filters blocked users - no client filtering needed
- Policy acceptance MUST be tracked on server for legal compliance

---
Last Updated: September 5, 2025
Backend Implementation: Complete ✅
Mobile Integration: Pending 🚧