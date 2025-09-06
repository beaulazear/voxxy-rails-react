# Mobile App Updates for Server-Side Content Filtering

## Overview
The Rails API now has server-side content filtering. Here's what your mobile app needs to handle.

## How Server Filtering Works

### ✅ Profanity (Automatically Cleaned)
- **Mobile sends:** "This is fucking awesome"
- **Server cleans:** "This is f**king awesome" 
- **Mobile receives:** "This is f**king awesome"
- **Required change:** NONE - Works seamlessly!

### ❌ Spam/Hate (Rejected)
- **Mobile sends:** "Buy now! bit.ly/spam"
- **Server returns:** 422 Status Code with error
- **Required change:** Handle 422 errors gracefully

## Required Mobile App Updates

### 1. Update Comment Submission (components/CommentInput.js or similar)

```javascript
// BEFORE (might just check for success)
const submitComment = async (content) => {
  try {
    const response = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: { content } })
    });
    
    if (response.ok) {
      // Success - refresh comments
      fetchComments();
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to post comment');
  }
};

// AFTER (handle validation errors)
const submitComment = async (content) => {
  try {
    const response = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: { content } })
    });
    
    if (response.ok) {
      // Success - refresh comments
      fetchComments();
    } else if (response.status === 422) {
      // Content was rejected by server
      const data = await response.json();
      Alert.alert(
        'Content Not Allowed',
        'Your comment contains inappropriate content. Please revise and try again.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', 'Failed to post comment');
    }
  } catch (error) {
    Alert.alert('Error', 'Network error occurred');
  }
};
```

### 2. Update Activity Creation (screens/CreateActivityScreen.js or similar)

```javascript
// AFTER (handle field-specific validation errors)
const createActivity = async (activityData) => {
  try {
    const response = await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ activity: activityData })
    });
    
    if (response.ok) {
      // Success
      navigation.goBack();
    } else if (response.status === 422) {
      // Validation error
      const data = await response.json();
      
      if (data.errors) {
        // Show field-specific errors
        if (data.errors.activity_name) {
          setNameError('Activity name contains inappropriate content');
        }
        if (data.errors.welcome_message) {
          setWelcomeError('Welcome message contains inappropriate content');
        }
        
        Alert.alert(
          'Content Not Allowed',
          'Please remove inappropriate content and try again.',
          [{ text: 'OK' }]
        );
      }
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to create activity');
  }
};
```

### 3. What Happens to Existing Features

| Feature | Before | After | Change Needed |
|---------|--------|-------|---------------|
| Normal content | Passes through | Passes through | None |
| Profanity in content | Client filters | Server also filters (with asterisks) | None |
| Spam/hate content | Client rejects | Server also rejects (422 error) | Handle 422 errors |
| Report system | Works | Still works | None |
| Block system | Works | Still works | None |

## Testing Checklist

Before deploying, test these scenarios in your mobile app:

- [ ] Post a normal comment - Should work as before
- [ ] Post a comment with profanity - Should save with asterisks
- [ ] Post a spam comment - Should show user-friendly error
- [ ] Create activity with profanity - Name should be cleaned
- [ ] Create activity with spam in welcome - Should show error

## Error Messages to Show Users

When server rejects content (422 status), show these user-friendly messages:

```javascript
const ERROR_MESSAGES = {
  'contains inappropriate content': 'This content violates our community guidelines. Please revise.',
  'appears to be spam': 'This looks like spam. Please write genuine content.',
  'contains inappropriate language': 'Please avoid using inappropriate language.',
  'is too long': 'Your message is too long. Please shorten it.',
  'is too short': 'Your message is too short. Please add more detail.'
};
```

## Important Notes

1. **Your client-side filtering still works!** This server-side filtering is additional protection.

2. **Profanity gets cleaned automatically** - The server replaces bad words with asterisks, so the content still saves but in a clean format.

3. **Spam/hate gets rejected entirely** - The server returns a 422 error that you need to handle gracefully.

4. **No API endpoint changes** - All the same endpoints work, just with added validation.

## Quick Implementation

If you want the absolute minimum changes:

1. **For comments:** Update your comment submission to check for `response.status === 422` and show an alert
2. **For activities:** Update activity creation to check for 422 and show an alert
3. **That's it!** Everything else works as before.

## Testing Commands

Test your mobile app against the Rails API:

```bash
# In Rails directory - make sure server is running
rails server

# Test creating a comment with profanity (should clean it)
curl -X POST http://localhost:3000/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment":{"content":"This is fucking great","activity_id":1}}'

# Test creating a comment with spam (should reject with 422)
curl -X POST http://localhost:3000/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment":{"content":"Buy now! bit.ly/spam","activity_id":1}}'
```

## Summary

✅ **Good news:** Most content works exactly as before!  
⚠️ **Small change needed:** Handle 422 errors when content is rejected  
✅ **Bonus:** Profanity automatically gets cleaned - no extra work needed!

Your mobile app will work with these changes immediately, but adding the error handling will make the experience better for users.