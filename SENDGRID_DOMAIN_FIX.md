# SendGrid Domain Authentication Fix

## Problem Summary

Emails are bouncing with error: `450 4.1.8 Sender address rejected: Domain not found`

**Root Cause:** SendGrid subdomain `em166.voxxypresents.com` is not properly authenticated with DNS records, causing recipient mail servers to reject emails as potential spam.

**Affected Emails:**
- `justingallen@me.com` - Bounced (blocked)
- `courtneygreer@voxxyai.com` - Dropped (previously bounced)

---

## Immediate Action Required

### Step 1: Fix SendGrid Domain Authentication

1. **Log into SendGrid Dashboard:**
   - Go to https://app.sendgrid.com
   - Navigate to: **Settings → Sender Authentication → Domain Authentication**

2. **Check Current Status:**
   - Look for `voxxypresents.com` or `em166.voxxypresents.com`
   - Status should show **green checkmark** with "Verified"
   - If showing yellow/red or "Pending", DNS records are not set up correctly

3. **Get DNS Records:**
   - Click "View DNS Records" for your domain
   - SendGrid will show you 3 CNAME records that need to be added
   - Example records (yours will be different):
     ```
     s1._domainkey.voxxypresents.com  →  s1.domainkey.u46194336.wl166.sendgrid.net
     s2._domainkey.voxxypresents.com  →  s2.domainkey.u46194336.wl166.sendgrid.net
     em166.voxxypresents.com          →  u46194336.wl166.sendgrid.net
     ```

4. **Add DNS Records:**
   - Log into your DNS provider (GoDaddy, Cloudflare, etc.)
   - Add all 3 CNAME records exactly as shown in SendGrid
   - **Important:** Make sure you're adding to `voxxypresents.com` domain, not `voxxyai.com`
   - DNS propagation can take 24-48 hours, but usually completes in 1-2 hours

5. **Verify in SendGrid:**
   - After adding DNS records, click "Verify" in SendGrid dashboard
   - Once verified, status will show green checkmark
   - Authentication is complete!

---

### Step 2: Clear SendGrid Bounce List

**IMPORTANT:** Only do this AFTER domain authentication is verified (Step 1 complete).

1. **Go to Suppressions:**
   - SendGrid Dashboard → **Suppressions → Bounces**

2. **Remove Blocked Emails:**
   - Search for: `justingallen@me.com`
   - Click the trash icon to delete from bounce list
   - Search for: `courtneygreer@voxxyai.com`
   - Click the trash icon to delete from bounce list

3. **Why This Matters:**
   - SendGrid automatically blocks emails that have bounced to protect your sender reputation
   - Once you fix domain authentication, you need to manually unblock these addresses
   - Otherwise, SendGrid will continue suppressing emails to these recipients

---

### Step 3: Set Up SendGrid Webhook (Monitoring)

**This has been implemented in the code changes below.**

The webhook will:
- Track all email events (delivered, bounced, opened, clicked)
- Alert admins immediately when critical errors occur
- Prevent future emails from being lost without notice

**To activate:**

1. **Run the migration:**
   ```bash
   bundle exec rails db:migrate
   ```

2. **Configure webhook in SendGrid:**
   - Go to SendGrid Dashboard → **Settings → Mail Settings → Event Webhook**
   - HTTP Post URL: `https://hey-voxxy.onrender.com/api/v1/sendgrid/webhook`
   - Enable the following events:
     - ✅ Delivered
     - ✅ Bounced
     - ✅ Dropped
     - ✅ Opened
     - ✅ Clicked
   - Click "Save"

3. **Test the webhook:**
   - SendGrid provides a "Test Your Integration" button
   - Click it to send test events
   - Check Rails logs to confirm events are being received:
     ```bash
     heroku logs --tail -a your-app-name | grep "SendGrid Event"
     # or on Render:
     # Check application logs in Render dashboard
     ```

---

## How to Verify It's Working

### Test 1: Check Domain Authentication
```bash
dig CNAME em166.voxxypresents.com
```
Should return SendGrid's domain (e.g., `u46194336.wl166.sendgrid.net`)

### Test 2: Check DKIM Records
```bash
dig CNAME s1._domainkey.voxxypresents.com
dig CNAME s2._domainkey.voxxypresents.com
```
Both should return SendGrid's DKIM servers

### Test 3: Send Test Email
After domain is verified and bounce list is cleared:
1. Have `justingallen@me.com` submit a new vendor application
2. Check SendGrid Activity Feed to see if email was delivered
3. Ask Justin if he received the email

---

## Code Changes Made

### 1. **SendGrid Webhook Controller** (`app/controllers/api/v1/sendgrid_webhooks_controller.rb`)
   - Handles bounce, dropped, delivered, opened, and clicked events
   - Updates `EmailDelivery` records with real-time status
   - Sends critical alerts to admins for domain authentication errors

### 2. **Route Added** (`config/routes.rb`)
   ```ruby
   post "sendgrid/webhook", to: "sendgrid_webhooks#event"
   ```

### 3. **Migration** (`db/migrate/20260207012717_add_send_grid_tracking_to_email_deliveries.rb`)
   - Adds fields: `opened_at`, `clicked_at`, `failed_at`, `error_message`
   - Adds index on `failed_at` for monitoring queries

### 4. **Admin Alert Mailer** (`app/mailers/admin_mailer.rb`)
   - Sends alert to `team@voxxypresents.com` when critical errors occur
   - Includes full error details and fix instructions

---

## Prevention: How to Avoid This in Future

### 1. **Always Use Authenticated Domains**
   - Never send emails from domains without proper DNS authentication
   - SendGrid provides a checklist - ensure all items are green before going live

### 2. **Monitor Bounce Rates**
   - Normal bounce rate: < 2%
   - If bounce rate > 5%, investigate immediately
   - SendGrid Dashboard shows bounce rate trends

### 3. **Set Up Webhook Monitoring**
   - The webhook implemented above will alert you automatically
   - Check `EmailDelivery` records periodically for failed emails

### 4. **Use SendGrid Email Validation API** (Future Enhancement)
   - Validate email addresses before sending
   - Catches typos and invalid domains
   - Reduces bounce rate and protects sender reputation

---

## Additional Resources

- **SendGrid Domain Authentication Docs:** https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication
- **SendGrid Webhook Events:** https://docs.sendgrid.com/for-developers/tracking-events/event
- **DNS Propagation Checker:** https://dnschecker.org

---

## Support

If you continue to have issues after following this guide:

1. **Check DNS propagation:** Use https://dnschecker.org to verify CNAME records are visible worldwide
2. **Contact SendGrid Support:** They can verify your domain authentication is correct
3. **Check Rails logs:** Look for SendGrid webhook events to debug delivery issues

---

## Summary Checklist

- [ ] Add DNS CNAME records to `voxxypresents.com` domain
- [ ] Verify domain authentication in SendGrid (green checkmark)
- [ ] Remove `justingallen@me.com` from SendGrid bounce list
- [ ] Remove `courtneygreer@voxxyai.com` from SendGrid bounce list
- [ ] Run migration: `bundle exec rails db:migrate`
- [ ] Configure SendGrid webhook in dashboard
- [ ] Test with new vendor application
- [ ] Monitor Rails logs for webhook events

**Estimated Time:** 30-60 minutes (mostly waiting for DNS propagation)
