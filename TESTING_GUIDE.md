# Testing Guide - Performance & CRM Updates

## Overview

This guide covers testing for the **Phase 1: Performance & CRM Updates** branch.

**Branch:** `feature/performance-and-crm-updates`

## Features to Test

### 1. ⚡ Invites Pagination
- **Problem:** Slow loading with 1,900+ invitations
- **Solution:** Pagination with "Load More" button (50 per page)

### 2. 📊 Enhanced CSV Template
- **Problem:** Missing social media fields in import template
- **Solution:** Added instagram, tiktok, website, location columns

### 3. ✏️ Event Details Editor
- **Problem:** Edit card removed from Home, not restored elsewhere
- **Solution:** Added comprehensive editor to Settings tab

---

## Setup Test Environment

### Step 1: Create Test Data

Run the test data script to create a realistic testing environment:

```bash
cd /path/to/voxxy-rails-react
rails runner lib/scripts/setup_test_event.rb
```

This creates:
- ✅ 1 test user account
- ✅ 1 test organization
- ✅ 1 active event
- ✅ 300 network contacts
- ✅ 200 invitations (to network contacts)
- ✅ 500 vendor applications:
  - 100 from invited contacts (50% conversion)
  - 400 net new applicants
  - Realistic status distribution (pending, approved, waitlist, rejected)

**Login Credentials:**
- Email: `test-producer@voxxypresents.com`
- Password: `TestPassword123!`

### Step 2: Start Development Servers

**Backend:**
```bash
cd voxxy-rails-react
rails server
```

**Frontend:**
```bash
cd voxxy-presents-client
npm run dev
```

**Access:** http://localhost:5173

---

## Testing Checklist

### Feature 1: Invites Pagination ⚡

**Location:** Command Center → Invites Tab

**Test Steps:**
1. ✅ Login with test credentials
2. ✅ Navigate to test event → Command Center → Invites tab
3. ✅ **Verify initial load is fast** (should only load 50 invites)
4. ✅ **Verify count displays:** "200 contacts" at top
5. ✅ **Scroll to bottom** of table
6. ✅ **Verify "Load More" button appears** with text: "Load More (50 of 200)"
7. ✅ **Click "Load More"**
8. ✅ **Verify:**
   - Loading spinner appears
   - Next 50 invites append to list (no duplicate rows)
   - Button text updates: "Load More (100 of 200)"
9. ✅ **Continue loading** until all 200 loaded
10. ✅ **Verify "Load More" button disappears** when all loaded

**Expected Performance:**
- Initial load: < 2 seconds
- Each "Load More": < 1 second
- No page freezing or lag

**Filters Should Work:**
- ✅ Search by name/email still works
- ✅ Status filters work
- ✅ Payment filters work
- ✅ Load More respects current filters

---

### Feature 2: Enhanced CSV Template 📊

**Location:** Network → Upload CSV

**Test Steps:**
1. ✅ Navigate to **Network tab** (top navigation)
2. ✅ Click **"Upload CSV"** button
3. ✅ Click **"Download our CSV template"** link
4. ✅ **Verify downloaded file** (`vendor_contacts_template.csv`) has:
   - ✅ `name` column
   - ✅ `email` column
   - ✅ `phone` column
   - ✅ `business_name` column
   - ✅ **`instagram_handle`** column (NEW)
   - ✅ **`tiktok_handle`** column (NEW)
   - ✅ **`website`** column (NEW)
   - ✅ **`location`** column (NEW)
   - ✅ `job_title` column
   - ✅ `contact_type` column
   - ✅ `tags` column
   - ✅ `notes` column
5. ✅ **Verify example rows** show proper formatting:
   - Instagram: `@sarahceramics`
   - Website: `https://sarahceramics.com`
   - Location: `San Francisco, CA`

**Bonus Test:** Import the template
1. ✅ Edit template, add 2-3 test contacts
2. ✅ Upload the file
3. ✅ Verify new fields import correctly
4. ✅ Check Network table shows new contacts with social links

---

### Feature 3: Event Details Editor ✏️

**Location:** Command Center → Settings Tab

**Test Steps:**
1. ✅ Navigate to **test event → Command Center → Settings tab**
2. ✅ **Verify "Event Details" card** appears at top of Settings
3. ✅ **Verify view mode** shows:
   - Event Title
   - Venue
   - Location
   - Event Date
   - Application Deadline
   - Payment Deadline
   - Description (if set)
4. ✅ **Click "Edit Details" button**
5. ✅ **Verify edit mode** shows form with fields:
   - Event Title (text input)
   - Description (textarea)
   - Venue (text input)
   - Location (text input)
   - Event Date (date picker)
   - End Date (date picker)
   - Start Time (time picker)
   - End Time (time picker)
   - Application Deadline (date picker)
   - Payment Deadline (date picker)
6. ✅ **Update several fields:**
   - Change title to "Updated Test Market"
   - Change venue to "New Convention Center"
   - Update event date
7. ✅ **Click "Save Changes"**
8. ✅ **Verify:**
   - Success message appears
   - Form returns to view mode
   - Updated values are displayed
9. ✅ **Refresh page** → Verify changes persisted
10. ✅ **Test Cancel:**
    - Click "Edit Details" again
    - Change a field
    - Click "Cancel"
    - Verify changes are discarded

**Edge Cases:**
- ✅ Try saving with empty title (should fail validation)
- ✅ Verify dates update across the app (Home tab, public event page)

---

## Cleanup Test Data

When done testing, remove all test data:

```bash
rails runner lib/scripts/setup_test_event.rb cleanup
```

This will delete:
- Test user account
- Test organization
- All test events
- All test contacts
- All test invitations
- All test registrations

---

## Troubleshooting

### Pagination not working?
- Check browser console for API errors
- Verify backend is running Rails 7.2.2+
- Check backend logs for pagination params

### CSV template missing fields?
- Clear browser cache
- Re-download template
- Check `src/utils/csvTemplateGenerator.ts` has new fields

### Event Details editor not showing?
- Verify you're on the **Settings tab** (not Event Details tab)
- Check that `EventSettings.tsx` component loaded
- Refresh page

### Script fails to create test data?
- Ensure database is migrated: `rails db:migrate`
- Check for existing test user: delete manually first
- Verify Faker gem is installed

---

## Next Phase (Phase 2)

**Phase 2** will include email template updates and requires:
1. Production organization_id for Pancakes & Booze
2. New email copy for waitlist and accepted statuses
3. Testing in staging environment (not touching production data)

---

## Questions?

Report issues to the GitHub repo or contact the development team.

**Happy Testing! 🚀**
