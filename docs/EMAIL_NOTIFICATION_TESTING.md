# Email Notification System - Testing Guide

## ✅ Implementation Complete!

The email notification system with user confirmation has been fully integrated into both the backend and frontend.

---

## 🎯 What Was Implemented

### Backend (Rails API)
- ✅ Database migration for `payment_status` field on registrations
- ✅ Email notification controller with confirmation endpoints
- ✅ Updated `Registration` model with payment tracking
- ✅ Updated `Event` model with change detection
- ✅ 4 new email templates (payment confirmed, category changed, event details changed, event canceled)
- ✅ Response warnings when actions would trigger emails

### Frontend (React/TypeScript)
- ✅ New API methods for email notifications
- ✅ `EmailConfirmationDialog` component
- ✅ `useEmailNotifications` custom hook
- ✅ Integration into `EventDetailsTab`
- ✅ Integration into `ApplicantsTab`

---

## 🧪 How to Test

### Prerequisites
1. Rails server running: `bundle exec rails s`
2. Frontend running: `cd ../voxxy-presents-client && npm run dev`
3. Have a test event with vendor applications/registrations

###  Test 1: Event Details Changed Email

**Steps:**
1. Log in to Producer Dashboard
2. Navigate to an event
3. Click "Edit" on event details
4. Change the event date, venue, or time
5. Click "Save"

**Expected Result:**
- Event saves successfully
- A confirmation dialog appears:
  - Title: "Send Event Update Email?"
  - Shows number of recipients
  - Lists changed fields
  - Warning message
- Click "Yes, Send Emails" → Toast notification showing success
- Click "Cancel" → Dialog closes, no emails sent

---

### Test 2: Event Canceled Email

**Steps:**
1. Log in to Producer Dashboard
2. Navigate to an event
3. Click "Edit" on event details
4. Change status to "Cancelled"
5. Click "Save"

**Expected Result:**
- Event status updates to cancelled
- A confirmation dialog appears:
  - Title: "Send Cancellation Email?"
  - ⚠️ Red/warning styling
  - Shows number of recipients
  - "This action cannot be undone" warning
- Click "Yes, Send Emails" → Toast showing success
- Cancellation emails sent to all vendors

---

### Test 3: Payment Confirmed Email

**Steps:**
1. Log in to Producer Dashboard
2. Navigate to event → Applicants tab
3. Find a vendor application
4. Update payment status to "confirmed" (you may need to add UI for this)
5. Submit the update

**Expected Result:**
- Payment status updates
- Confirmation dialog appears:
  - Title: "Send Payment Confirmation?"
  - Shows recipient email
  - Individual confirmation (not bulk)
- Click "Yes, Send Email" → Email sent to vendor

---

### Test 4: Category Changed Email

**Steps:**
1. Log in to Producer Dashboard
2. Navigate to event → Applicants tab
3. Find a vendor application
4. Change the vendor category
5. Submit the update

**Expected Result:**
- Category updates
- Confirmation dialog appears:
  - Title: "Send Category Change Notification?"
  - Shows old and new category
  - Shows recipient email
- Click "Yes, Send Email" → Email sent to vendor

---

### Test 5: Status Change to Waitlist (Automatic)

**Steps:**
1. Log in to Producer Dashboard
2. Navigate to event → Applicants tab
3. Change a vendor's status to "Waitlist"
4. Submit the update

**Expected Result:**
- Status updates to waitlist
- Email sent **automatically** (no confirmation dialog)
- This is intentional for status changes

---

## 🔍 Verifying Email Content

Since we're in development, emails are NOT actually sent. To verify email content:

### Option 1: Check Rails Logs
```bash
tail -f log/development.log
```

Look for log lines like:
```
Sending registration confirmation email to: vendor@example.com
Event update sent to 45 recipients (0 failed)
```

### Option 2: Use Rails Console
```ruby
# Test payment confirmation email generation
registration = Registration.first
RegistrationEmailService.send_payment_confirmation(registration)
# Check logs for email content

# Test event update email
event = Event.first
result = RegistrationEmailService.send_event_details_changed_to_all(event)
puts "Sent: #{result[:sent]}, Failed: #{result[:failed]}"
```

### Option 3: Add Letter Opener (Development Tool)
In `Gemfile`:
```ruby
group :development do
  gem 'letter_opener'
end
```

In `config/environments/development.rb`:
```ruby
config.action_mailer.delivery_method = :letter_opener
config.action_mailer.perform_deliveries = true
```

This will open emails in your browser instead of sending them.

---

## 🐛 Troubleshooting

### Issue: Dialog doesn't appear after updating event

**Check:**
1. Open browser console - any JavaScript errors?
2. Check Network tab - does the API response include `email_notification`?
3. Verify the fields you changed are in the detection list:
   - `event_date`
   - `venue`
   - `location`
   - `start_time`
   - `end_time`
   - `status` (for cancellation)

**Fix:**
- Check `EventDetailsTab.tsx` line 185-187
- Ensure `response.email_notification` exists

---

### Issue: "Email sending not confirmed" error

**Cause:** The backend requires `confirmed: true` in the request body

**Check:**
- `useEmailNotifications.ts` - verify `confirmed: true` is being sent
- API methods in `api.ts` - check request bodies

---

### Issue: Emails not reaching the confirmation step

**Check:**
1. Backend is detecting changes:
   ```ruby
   event = Event.find_by(slug: "your-event-slug")
   event.update(event_date: 1.week.from_now)
   event.details_changed_requiring_notification? # Should be true
   ```

2. Controller is returning `email_notification`:
   - Check `app/controllers/api/v1/presents/events_controller.rb` line 86-100

---

### Issue: TypeScript errors in frontend

**Common fixes:**
```bash
cd /Users/beaulazear/Desktop/voxxy-presents-client
npm install  # Ensure dependencies are installed
```

**If `sonner` is missing:**
```bash
npm install sonner
```

---

## 📊 API Endpoint Reference

### Event Email Notifications

```
POST /api/v1/presents/events/:slug/email_notifications/check_event_update_impact
POST /api/v1/presents/events/:slug/email_notifications/send_event_update
POST /api/v1/presents/events/:slug/email_notifications/check_cancellation_impact
POST /api/v1/presents/events/:slug/email_notifications/send_cancellation
```

### Registration Email Notifications

```
POST /api/v1/presents/registrations/:id/email_notifications/send_payment_confirmation
POST /api/v1/presents/registrations/:id/email_notifications/send_category_change
```

---

## 📝 Manual API Testing (cURL)

### Test Event Update Impact Check
```bash
curl -X POST http://localhost:3000/api/v1/presents/events/summer-gala-2025/email_notifications/check_event_update_impact \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

Expected Response:
```json
{
  "action": "event_details_changed",
  "recipient_count": 45,
  "warning": "This will send an email notification to 45 recipients.",
  "requires_confirmation": true
}
```

### Test Send Event Update Emails
```bash
curl -X POST http://localhost:3000/api/v1/presents/events/summer-gala-2025/email_notifications/send_event_update \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"confirmed": true}'
```

Expected Response:
```json
{
  "success": true,
  "message": "Event update emails sent",
  "sent_count": 45,
  "failed_count": 0
}
```

---

## ✨ Success Criteria

The implementation is successful when:

- ✅ Updating event details shows confirmation dialog
- ✅ Canceling event shows confirmation dialog with warning
- ✅ Dialog shows correct recipient counts
- ✅ "Send Emails" button triggers API call
- ✅ Toast notifications appear after sending
- ✅ "Cancel" button closes dialog without sending
- ✅ Rails logs show email generation
- ✅ No errors in browser console
- ✅ No errors in Rails logs

---

## 🚀 Production Deployment Notes

Before deploying to production:

1. **Configure SendGrid API Key:**
   - Ensure `VoxxyKeyAPI` is set in production environment
   - Test SendGrid integration

2. **Email Template Review:**
   - Review all 6 email templates for branding
   - Verify all variable resolution works
   - Test unsubscribe links

3. **Rate Limiting:**
   - Consider adding rate limits to email endpoints
   - Prevent abuse of bulk email sending

4. **Monitoring:**
   - Set up alerts for failed email deliveries
   - Monitor SendGrid delivery rates
   - Track email open/click rates

5. **User Permissions:**
   - Verify only event owners can send emails
   - Test admin override capabilities

---

## 📚 Related Documentation

- `/Users/beaulazear/Desktop/voxxy-rails/docs/EMAIL_NOTIFICATION_SYSTEM.md` - Complete system documentation
- `/Users/beaulazear/Desktop/voxxy-rails/app/services/registration_email_service.rb` - Email service implementation
- `/Users/beaulazear/Desktop/voxxy-presents-client/src/hooks/useEmailNotifications.ts` - Frontend hook implementation

---

**🎉 Happy Testing!**
