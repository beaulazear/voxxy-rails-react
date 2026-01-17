# Email Testing System - User Guide

**Last Updated:** January 17, 2026

## Overview

The email testing system allows admins and venue owners to test Voxxy Presents emails by sending them to their own inbox.

### Security Features
- ✅ **No spam risk:** Emails can ONLY be sent to the logged-in user's email address
- ✅ **Role-based access:** Admins get all 21 emails, venue owners get 7 scheduled emails
- ✅ **Cannot change recipient:** Email address is preset to prevent abuse

---

## For Admins: Test All 21 Emails

### Access
Navigate to: **`/admin/emails`**

### What You Can Test
**All 21 Voxxy Presents emails:**
- 7 Scheduled Automated Emails
- 4 Vendor Application Emails
- 5 Event Invitation Emails
- 5 Admin/Producer Notification Emails

### Features

**1. Preview Emails (NEW)**
```
Click: "Preview" button on any email card
Result: Opens large modal with rendered email HTML
Note: Creates test data without sending actual emails
All 21 emails: Includes all invitation emails
```

**2. Send All 21 Emails**
```
Click: "Send All 21 Emails to My Inbox"
Result: All emails sent to your admin email address
Time: ~2-3 minutes to receive all
```

**3. Send 7 Scheduled Emails Only**
```
Click: "Send 7 Scheduled Emails Only"
Result: Just the automated scheduled emails
Time: ~1 minute to receive all
```

**4. Setup Test Data**
```
Click: "Setup Test Data"
Result: Creates test event, organization, registrations, etc.
Note: Reusable - won't create duplicates
```

**5. Cleanup Test Data**
```
Click: "Cleanup Test Data"
Result: Removes all test records (marked with "TEST -" prefix)
Warning: Use carefully - removes test data permanently
```

### Email Categories Dashboard

The dashboard shows all 21 emails organized by category:

**Scheduled Automated Emails (7)**
- 1 Day Before Application Deadline
- Application Deadline Day
- 1 Day Before Payment Due
- Payment Due Today
- 1 Day Before Event
- Day of Event
- Day After Event - Thank You

**Vendor Application Emails (4)**
- Application Confirmation
- Application Approved
- Application Rejected
- Moved to Waitlist

**Event Invitation Emails (5)**
- Vendor Invitation
- Invitation Accepted - Vendor Confirmation
- Invitation Accepted - Producer Notification
- Invitation Declined - Vendor Confirmation
- Invitation Declined - Producer Notification

**Admin/Producer Notification Emails (5)**
- New Vendor Submission Notification
- Payment Confirmed
- Category Changed
- Event Details Changed (Bulk)
- Event Canceled (Bulk)

---

## For Venue Owners: Test Scheduled Emails

### Access (API Endpoint)
```
GET  /api/v1/presents/email_tests
POST /api/v1/presents/email_tests/send_scheduled
```

### What You Can Test
**7 Scheduled Automated Emails:**
- Application deadline reminders (2)
- Payment reminders (2)
- Event countdown emails (3)

### Features

**1. View Available Emails**
```http
GET /api/v1/presents/email_tests
Authorization: Bearer <token>
```

**Response:**
```json
{
  "test_email": "producer@example.com",
  "scheduled_emails": [
    {
      "position": 1,
      "name": "1 Day Before Application Deadline",
      "subject": "Last Chance: [eventName] Applications Close Tomorrow"
    },
    ...
  ],
  "total_count": 7
}
```

**2. Send Scheduled Emails to Your Inbox**
```http
POST /api/v1/presents/email_tests/send_scheduled
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Sending 7 scheduled emails to producer@example.com",
  "recipient": "producer@example.com",
  "results": [
    {
      "name": "1 Day Before Application Deadline",
      "status": "sent",
      "timestamp": "2026-01-17T10:30:00Z"
    },
    ...
  ],
  "success_count": 7,
  "failure_count": 0
}
```

### Security
- ✅ Emails sent ONLY to `current_user.email`
- ✅ Venue owner role required
- ✅ Cannot specify different recipient

---

## How It Works

### Test Data Generation

When you send test emails, the system automatically:

1. **Creates or reuses test records:**
   - Test user: `test.producer@voxxypresents.com`
   - Test organization: "TEST - Sample Venue"
   - Test event: "TEST - Summer Market 2026"
   - Test registration: `test.vendor@voxxypresents.com`
   - Test vendor contact: `test.contact@voxxypresents.com`

2. **Temporarily overrides recipient email:**
   - Changes recipient to YOUR email
   - Sends the email
   - Restores original test email

3. **Uses realistic data:**
   - Event dates 1 month in future
   - Application deadline 1 week away
   - Payment deadline 3 weeks away
   - Real-looking names and details

### Email Delivery

**For Scheduled Emails:**
- Uses `EmailVariableResolver` to resolve `[eventName]` variables
- Sends via `BaseEmailService` with SendGrid
- Tagged with test category for tracking

**For Transactional Emails:**
- Uses existing service classes (`RegistrationEmailService`, etc.)
- Temporarily updates registration email to yours
- Sends normally through services
- Restores original email after sending

### SendGrid Categories

Test emails are tagged with SendGrid categories:
```
["test", "scheduled-email"]        → Scheduled test emails
["test", "transactional"]          → Service test emails
```

You can filter test emails in SendGrid dashboard by these categories.

---

## Testing Workflow

### Recommended Testing Sequence

**1. Initial Setup (First Time)**
```
1. Navigate to /admin/emails
2. Click "Setup Test Data"
3. Verify test data created successfully
```

**2. Preview Emails (Recommended First Step)**
```
1. Click "Preview" button on any email card
2. Large modal opens with rendered HTML
3. Review styling and content
4. Close modal and preview other emails
5. No actual emails sent - safe to use anytime
```

**3. Test All Emails**
```
1. Click "Send All 21 Emails to My Inbox"
2. Wait 2-3 minutes
3. Check your inbox
4. Verify styling, content, and deliverability
```

**4. Test Individual Categories (Optional)**
```
1. Click "Send 7 Scheduled Emails Only"
2. Verify scheduled email functionality
```

**5. Cleanup (Optional)**
```
1. Click "Cleanup Test Data" to remove test records
2. Confirm deletion
```

### Verification Checklist

When emails arrive in your inbox, check:

- ✅ **Subject lines:** No emojis, proper capitalization
- ✅ **From address:** team@voxxyai.com or organization email
- ✅ **Styling:** Clean, simple, consistent across all emails
- ✅ **Links:** Plain underlined links (no buttons)
- ✅ **Footer:** "Powered by Voxxy Presents" present
- ✅ **Content:** Variables resolved correctly (no [eventName] placeholders)
- ✅ **Deliverability:** Emails not in spam folder
- ✅ **Mobile:** Responsive on phone screens

### Common Issues

**Problem: Some emails didn't arrive**
- Check spam folder
- Verify SendGrid quota not exceeded
- Check Rails logs for errors
- Verify test data exists

**Problem: Variables not resolved (showing [eventName])**
- Only affects scheduled emails
- Check `EmailVariableResolver` service
- Verify event has required fields

**Problem: "Admin access required" error**
- Ensure you're logged in as admin
- Check `current_user.admin?` returns true
- Venue owners can only use API endpoint

**Problem: Test data already exists**
- Test data is reusable - this is normal
- Click "Cleanup Test Data" to start fresh
- Or manually delete records with "TEST -" prefix

---

## API Integration (Frontend)

### For React/TypeScript Frontend

**Fetch Available Test Emails:**
```typescript
const response = await fetch('/api/v1/presents/email_tests', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.test_email); // User's email
console.log(data.scheduled_emails); // Array of 7 emails
```

**Send Scheduled Emails:**
```typescript
const response = await fetch('/api/v1/presents/email_tests/send_scheduled', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
console.log(`Sent ${result.success_count} emails to ${result.recipient}`);
```

**Example UI Component:**
```typescript
function EmailTestPanel() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const sendTestEmails = async () => {
    setLoading(true);
    try {
      const response = await api.post('/presents/email_tests/send_scheduled');
      setResults(response.data);
      alert(`Sent ${response.data.success_count} emails to your inbox!`);
    } catch (error) {
      alert('Error sending emails: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Test Your Scheduled Emails</h3>
      <p>Send all 7 scheduled emails to your inbox: {user.email}</p>
      <button onClick={sendTestEmails} disabled={loading}>
        {loading ? 'Sending...' : 'Send Test Emails'}
      </button>
      {results && (
        <div>
          Success: {results.success_count} / 7
        </div>
      )}
    </div>
  );
}
```

---

## Development vs Production

### Development Environment

**Admin Dashboard:**
- Access: `http://localhost:3000/admin/emails`
- Email delivery: Depends on `config/environments/development.rb`
- Recommendation: Use `letter_opener` gem to view in browser

**Letter Opener Setup:**
```ruby
# Gemfile
gem 'letter_opener', group: :development

# config/environments/development.rb
config.action_mailer.delivery_method = :letter_opener
config.action_mailer.perform_deliveries = true
```

Emails will open in browser instead of sending to real inbox.

### Staging Environment

**Admin Dashboard:**
- Access: `https://staging-api.voxxypresents.com/admin/emails`
- Email delivery: Uses SendGrid (real emails sent)
- Test with real email addresses

### Production Environment

**Admin Dashboard:**
- Access: `https://api.voxxypresents.com/admin/emails`
- Email delivery: Uses SendGrid (real emails sent)
- **Use carefully:** Emails count against SendGrid quota
- Recommendation: Test in staging first

---

## Monitoring

### Rails Logs

Check logs for email sending activity:
```bash
tail -f log/development.log | grep -i email
```

Look for:
```
Sending test email '1 Day Before Application Deadline'
Email sent to admin@example.com
Failed to send test email 'Payment Confirmed': Connection timeout
```

### SendGrid Dashboard

View test emails in SendGrid:
1. Login to SendGrid dashboard
2. Go to Activity Feed
3. Filter by category: `test`
4. View delivery status, opens, clicks

### Database Queries

Check test data:
```sql
-- View test events
SELECT * FROM events WHERE title LIKE 'TEST -%';

-- View test organizations
SELECT * FROM organizations WHERE name LIKE 'TEST -%';

-- View test registrations
SELECT * FROM registrations WHERE email LIKE 'test.%@voxxypresents.com';
```

---

## Troubleshooting

### Email Not Arriving

**1. Check SendGrid Quota**
```
- Login to SendGrid
- Check current plan limits
- Verify not over daily limit
```

**2. Check Rails Logs**
```bash
tail -100 log/production.log | grep -i error
```

**3. Verify Test Data**
```bash
rails console
> service = Admin::EmailTestService.new(User.find_by(admin: true))
> service.setup_test_data
```

**4. Check Email Settings**
```bash
rails console
> ENV['VoxxyKeyAPI'] # Should return SendGrid API key
> ENV['SENDER_EMAIL'] # Should return team@voxxyai.com
```

### Variables Not Resolving

**Issue:** Email shows `[eventName]` instead of actual event name

**Solution:**
```bash
rails console
> event = Event.find_by(title: 'TEST - Summer Market 2026')
> registration = event.registrations.first
> resolver = EmailVariableResolver.new(event, registration)
> resolver.resolve('[eventName]')
# Should return actual event title
```

### Permission Errors

**Issue:** "Admin access required"

**Solution:**
```bash
rails console
> user = User.find_by(email: 'your@email.com')
> user.admin?  # Should return true
> user.update(admin: true)  # If false
```

---

## Best Practices

### When to Test Emails

✅ **Always test before:**
- Deploying email styling changes
- Updating email content
- Changing email templates
- Releasing new email features

✅ **Test in these scenarios:**
- After changing BASE_STYLES
- After editing seed file templates
- After modifying service classes
- Before major production deployments

### Testing Frequency

- **Development:** Test anytime you make changes
- **Staging:** Test before every production deploy
- **Production:** Test sparingly (counts against quota)

### Email Client Testing

Test emails in multiple clients:
- ✅ Gmail (web, iOS, Android)
- ✅ Outlook (web, desktop)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ Mobile devices

### Spam Score Testing

Use tools to check spam scores:
- **Mail Tester:** https://www.mail-tester.com
- **GlockApps:** https://glockapps.com
- **SendGrid Email Testing:** Built into SendGrid

---

## Summary

### Admin Features
- ✅ Test all 21 emails at once
- ✅ Test scheduled emails only
- ✅ Setup/cleanup test data
- ✅ Visual dashboard with email categories
- ✅ Emails sent to admin's email only

### Venue Owner Features
- ✅ Test 7 scheduled emails
- ✅ API endpoint for frontend integration
- ✅ Emails sent to venue owner's email only
- ✅ JSON response with results

### Security
- ✅ No spam risk (emails to self only)
- ✅ Role-based access control
- ✅ Cannot change recipient email
- ✅ Admin-only full access
- ✅ Venue owners limited to scheduled emails

---

**Questions or issues?** Check the troubleshooting section or contact the development team.

**Last Updated:** January 17, 2026
