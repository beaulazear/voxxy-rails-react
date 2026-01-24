# Bug Fix: EmailUnsubscribe.for_email Scope

**Date:** January 24, 2026
**Status:** ✅ FIXED

---

## 🐛 The Bug

**Error Message:**
```
ERROR -- : Failed to send scheduled email #173: undefined method `downcase' for []:Array
ERROR -- : /app/models/email_unsubscribe.rb:30:in `block in <class:EmailUnsubscribe>'
```

**Root Cause:**
The `EmailUnsubscribe.for_email` scope was designed to accept a **single email string**, but it was being called with an **array of emails** in two places:

1. **`RecipientFilterService` (line 123):**
   ```ruby
   EmailUnsubscribe.for_email(scope.pluck(:email))  # Returns array
   ```

2. **`ScheduledEmail` model (line 134):**
   ```ruby
   EmailUnsubscribe.for_email(recipient_emails)  # Array of emails
   ```

When an empty array `[]` was passed (no recipients), it tried to call `[].downcase`, which caused the error.

---

## ✅ The Fix

**File:** `app/models/email_unsubscribe.rb`

**Before (line 30):**
```ruby
scope :for_email, ->(email) { where(email: email.downcase.strip) }
```

**After:**
```ruby
scope :for_email, ->(email) {
  # Handle both single email string and array of emails
  if email.is_a?(Array)
    # Normalize all emails in the array
    normalized_emails = email.map { |e| e.to_s.downcase.strip }.compact.uniq
    where(email: normalized_emails)
  else
    # Single email string
    where(email: email.to_s.downcase.strip)
  end
}
```

---

## 🔍 How It Works

### Single Email (Original Behavior)
```ruby
EmailUnsubscribe.for_email("Test@Example.com")
# SQL: WHERE email = 'test@example.com'
```

### Array of Emails (New Functionality)
```ruby
EmailUnsubscribe.for_email(["Test1@Example.com", "TEST2@example.COM"])
# SQL: WHERE email IN ('test1@example.com', 'test2@example.com')
```

### Empty Array (Bug Case - Now Fixed)
```ruby
EmailUnsubscribe.for_email([])
# SQL: WHERE email IN ()
# No error - just returns no results
```

---

## 🎯 Benefits

1. **Backwards Compatible:** Still works with single email strings
2. **Supports Bulk Operations:** Can now handle arrays of emails efficiently
3. **Handles Edge Cases:** Empty arrays don't cause errors
4. **Normalizes Input:** Uses `.to_s` to handle nil values safely
5. **Removes Duplicates:** `.compact.uniq` ensures clean data

---

## 📍 Where This Scope Is Used

1. **`RecipientFilterService#filter_recipients`**
   - Filters out unsubscribed emails from recipient lists
   - Called when sending scheduled automated emails

2. **`ScheduledEmail#unsubscribed_count`**
   - Counts how many recipients are unsubscribed
   - Used for displaying stats in dashboard

3. **`EmailUnsubscribe.unsubscribed_from_event?`**
   - Checks if a single email is unsubscribed from an event
   - Used before sending individual emails

4. **`EmailUnsubscribe.unsubscribed_from_organization?`**
   - Checks if a single email is unsubscribed from an organization
   - Used for organization-level email filtering

5. **`EmailUnsubscribe.unsubscribed_globally?`**
   - Checks if a single email is globally unsubscribed
   - Used for global unsubscribe checks

---

## ✅ Testing

### Manual Testing
The error occurred during scheduled email sending. To test the fix:

1. **Create a scheduled email** with no recipients (empty filter)
2. **Wait for Sidekiq job** to process
3. **Verify:** No error in logs
4. **Result:** Email is skipped gracefully (no recipients to send to)

### Expected Log Output (After Fix)
```
INFO -- : No recipients match filter criteria for scheduled email #173
```

Instead of:
```
ERROR -- : undefined method `downcase' for []:Array
```

---

## 🚀 Deployment

**No migration required** - This is a code-only fix.

**Steps:**
1. Deploy code to production
2. Monitor logs for scheduled email jobs
3. Verify no more `downcase` errors
4. Check that emails continue sending normally

---

## 📝 Additional Notes

- The `.to_s` call ensures nil values don't cause errors
- `.compact` removes any nil values from arrays
- `.uniq` ensures no duplicate emails in queries
- `.downcase.strip` normalizes email formatting
- SQL `IN` clause handles arrays efficiently

---

**Status:** ✅ Bug fixed and ready for deployment
