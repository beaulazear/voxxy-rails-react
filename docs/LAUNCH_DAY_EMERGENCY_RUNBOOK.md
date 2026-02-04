# 🚨 Launch Day Emergency Runbook
**Customer:** Pancake and Booze Art Show
**Launch Date:** Tuesday, February 3, 2026
**Event Date:** March/April 2026

---

## 🎯 Mission Critical Systems
1. **Application submissions** - vendors applying to the event
2. **Application filtering/review** - customer reviewing applications
3. **Invite system** - sending invites to approved vendors
4. **Payment tracking** - connecting Eventbrite payments to vendors (KNOWN ISSUE: email matching won't work reliably)

---

## ⚠️ Known Issues Going Into Launch
- [ ] **Event pricing broken on frontend** - needs fixing before next event
- [ ] **Payment matching uses email** - will need ID-based matching for scale
- [ ] **Sentry not receiving events** - error monitoring may be blind
- [ ] **No automated database backups confirmed** - need to verify Render settings

---

## 📞 Emergency Response Protocol

### Step 1: Assess the Situation (2 minutes)
1. Customer reports issue
2. Ask: "Can you describe exactly what happened? What were you trying to do?"
3. Ask: "Is this blocking you from working, or just annoying?"
4. Categorize severity:
   - **P0 (DROP EVERYTHING):** Can't access system, data loss, all users affected
   - **P1 (Fix within 1 hour):** Customer blocked, can't review applications
   - **P2 (Fix within 4 hours):** Feature broken but workaround exists
   - **P3 (Fix this week):** Annoying but not blocking

### Step 2: Gather Information (5 minutes)
Run diagnostic script (see below) and ask:
- What time did this happen?
- Which vendor/application were you working with?
- Can you share a screenshot?
- Has this happened before today?

### Step 3: Check Monitoring
```bash
# SSH into Render or use Render dashboard
# Check recent logs
heroku logs --tail --app voxxy-production
# Or on Render: View logs in dashboard

# Check Sentry (if working)
# Go to sentry.io and check recent errors
```

### Step 4: Communicate
- **Acknowledge immediately:** "I see the issue, investigating now"
- **Update every 15 minutes:** Even if it's "still working on it"
- **Never ghost the customer**

---

## 🔥 Common Emergency Scenarios

### Scenario 1: "I can't see any applications"
**Symptoms:** Dashboard is empty, no applications showing
**Likely cause:** Database query issue, permissions, or data not loading

**Quick checks:**
```bash
# Run this in Rails console (see console access below)
Event.find_by(name: "Pancake and Booze")
event = Event.find(EVENT_ID)
event.vendor_contacts.count  # Should return number of applications
```

**Fixes:**
1. Check if event is published: `event.published?`
2. Check if applications exist: `event.vendor_contacts.where(status: 'applied')`
3. Check frontend filtering - might be filter applied that hides all
4. **Workaround:** Export data to CSV and send to customer while you fix

---

### Scenario 2: "Invites aren't sending"
**Symptoms:** Customer clicks "send invite" but vendor doesn't receive
**Likely cause:** Email delivery issue (see your EMAIL_SYSTEM_STABILITY_REPORT)

**Quick checks:**
```bash
# Check recent emails
Email.where("created_at > ?", 1.hour.ago).order(created_at: :desc).limit(10).pluck(:id, :to, :subject, :status)

# Check specific invite
invitation = Invitation.find(INVITATION_ID)
invitation.emails.pluck(:status, :sent_at, :delivered_at)
```

**Fixes:**
1. Check email status: `failed`, `bounced`, `spam`?
2. Verify recipient email address is valid
3. Check SendGrid dashboard for delivery issues
4. **Workaround:** Manually resend or provide invite link directly

---

### Scenario 3: "Payment isn't showing as received"
**Symptoms:** Vendor paid in Eventbrite but system shows unpaid
**Likely cause:** Payment sync didn't run or email didn't match

**Quick checks:**
```bash
# Check payment transactions
PaymentTransaction.where("created_at > ?", 1.day.ago).order(created_at: :desc)

# Check sync logs
PaymentSyncLog.order(created_at: :desc).first

# Manually trigger sync
PaymentSyncWorker.perform_async(event.id)
```

**Fixes:**
1. Check PaymentSyncLog for errors
2. Verify Eventbrite API credentials are valid
3. **Manual workaround:** Directly update vendor_fee_paid flag
   ```ruby
   registration = Registration.find_by(vendor_contact_id: VENDOR_ID, event_id: EVENT_ID)
   registration.update!(vendor_fee_paid: true)
   ```

---

### Scenario 4: "System is really slow"
**Symptoms:** Pages taking >5 seconds to load
**Likely cause:** Database query performance, too much data loading

**Quick checks:**
```bash
# Check database connection pool
ActiveRecord::Base.connection_pool.stat

# Check slow queries in logs
# Look for queries taking >1000ms

# Check Render metrics
# CPU/Memory usage in Render dashboard
```

**Fixes:**
1. Check if background jobs are backing up
2. Restart Sidekiq: `heroku ps:restart worker` (or Render equivalent)
3. **Emergency:** Restart app: `heroku ps:restart` (last resort, causes brief downtime)

---

### Scenario 5: "I made a mistake and need to undo"
**Symptoms:** Customer accidentally rejected someone, deleted something, etc.
**Likely cause:** User error

**Fixes:**
```ruby
# Most models have soft-delete or status changes
# Find the record and check if it's soft-deleted
VendorContact.with_deleted.find(ID)  # if using paranoia gem
# Or check status
vendor.update(status: 'previous_status')

# Check PaperTrail versions if enabled
vendor.versions  # Shows history of changes
```

---

## 🛠️ Quick Reference Commands

### Access Rails Console
```bash
# On Render
render shell -s voxxy-production
bundle exec rails console

# On Heroku (if using)
heroku run rails console --app voxxy-production
```

### Useful Console Commands
```ruby
# Find the customer's organization
org = Organization.find_by(name: "Pancake and Booze")

# Find their event
event = org.events.find_by(name: "EVENT_NAME")

# See all applications
event.vendor_contacts.count
event.vendor_contacts.group(:status).count

# See recent emails
Email.where("created_at > ?", 1.day.ago).order(created_at: :desc).limit(20)

# Check payment integrations
PaymentIntegration.where(organization_id: org.id)

# Force payment sync
PaymentSyncWorker.perform_async(event.id)

# Check Sidekiq queue status
Sidekiq::Queue.all.map { |q| [q.name, q.size] }

# See what background jobs are scheduled
Sidekiq::ScheduledSet.new.size
```

### Database Backup (Manual)
```bash
# On Render - use dashboard to create manual backup
# Or if you have direct DB access:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Download backup
render db:pull -s voxxy-production
```

---

## 📊 Health Check Dashboard

Run this before launch and periodically during the day:

```ruby
# === SYSTEM HEALTH CHECK ===
puts "=" * 60
puts "VOXXY HEALTH CHECK - #{Time.current}"
puts "=" * 60

# Organization check
org = Organization.find_by(name: "Pancake and Booze")
puts "\n🏢 ORGANIZATION"
puts "  Status: #{org ? '✅ Found' : '❌ NOT FOUND'}"
puts "  ID: #{org&.id}"

# Event check
event = org&.events&.last
puts "\n📅 EVENT"
puts "  Status: #{event ? '✅ Found' : '❌ NO EVENT'}"
puts "  Name: #{event&.name}"
puts "  Published: #{event&.published?}"

# Applications
puts "\n📝 APPLICATIONS"
puts "  Total: #{event&.vendor_contacts&.count || 0}"
puts "  By status: #{event&.vendor_contacts&.group(:status)&.count || {}}"

# Emails (last 24h)
email_count = Email.where("created_at > ?", 24.hours.ago).count
email_failed = Email.where("created_at > ? AND status IN (?)", 24.hours.ago, ['failed', 'bounced']).count
puts "\n📧 EMAILS (24h)"
puts "  Sent: #{email_count}"
puts "  Failed: #{email_failed} #{email_failed > 10 ? '⚠️' : '✅'}"

# Payments
payment_count = PaymentTransaction.where("created_at > ?", 24.hours.ago).count
puts "\n💰 PAYMENTS (24h)"
puts "  Transactions: #{payment_count}"

# Background jobs
puts "\n⚙️ BACKGROUND JOBS"
Sidekiq::Queue.all.each do |queue|
  puts "  #{queue.name}: #{queue.size} jobs"
end

# Database
puts "\n💾 DATABASE"
puts "  Connection pool: #{ActiveRecord::Base.connection_pool.stat}"

puts "\n" + "=" * 60
puts "Health check complete!"
puts "=" * 60
```

---

## 🔧 Pre-Launch Checklist (Run Monday)

### Critical Setup
- [ ] Verify SENTRY_DSN is set in Render environment variables
- [ ] Test Sentry with: `Sentry.capture_message("Pre-launch test")`
- [ ] Verify database backups are enabled in Render
- [ ] Create manual database backup
- [ ] Verify Eventbrite API credentials are working
- [ ] Test payment sync manually: `PaymentSyncWorker.perform_async(event.id)`

### Customer Environment
- [ ] Verify Pancake and Booze organization exists
- [ ] Verify event is created and published
- [ ] Test customer can log in
- [ ] Test customer can view applications
- [ ] Test invite sending (send test invite to yourself)
- [ ] Verify email templates look correct

### Monitoring
- [ ] Sentry receiving errors
- [ ] Render alerts configured
- [ ] Your phone notifications enabled
- [ ] Bookmark Render logs page
- [ ] Bookmark Sentry dashboard

### Communication
- [ ] Customer has your phone/Slack/email
- [ ] You have customer's direct contact
- [ ] Set expectations: response time, support hours
- [ ] Share this runbook location with customer (maybe simplified version)

---

## 📱 Emergency Contacts & Resources

**Render Dashboard:** https://dashboard.render.com
**Sentry Dashboard:** https://sentry.io
**Eventbrite API Docs:** https://www.eventbrite.com/platform/api

**Your Resources:**
- Email System Report: `docs/email/EMAIL_SYSTEM_STABILITY_REPORT_JAN_2026.md`
- Eventbrite Integration: `docs/EVENTBRITE_INTEGRATION_DOCS.md`
- Payment Sync Code: `app/services/payment_sync_service.rb`

---

## 🧘 Staying Calm Under Pressure

**Remember:**
1. **No one has died from a software bug**
2. **Most issues are fixable in minutes**
3. **Customer just wants honesty and communication**
4. **You have console access = you have god mode**
5. **Worst case: manual workaround while you fix properly**

**Communication Templates:**

❌ BAD: *silence* or "I don't know what's wrong"
✅ GOOD: "I see the issue. Investigating the application loading system. Will update you in 15 minutes."

❌ BAD: "This is broken, might take hours"
✅ GOOD: "I found the issue with payment sync. I can fix it properly in 1 hour, or I can manually update the payment status right now and fix properly later. Which would you prefer?"

❌ BAD: "The system crashed!"
✅ GOOD: "We're experiencing a performance issue affecting page loads. I'm restarting the background job processor which should resolve it within 2 minutes."

---

## 🎓 Post-Launch Debrief

After Tuesday, document:
- What broke?
- What went well?
- What should we fix before next event?
- What monitoring/alerts do we need?

**You've got this. You built it. You can fix it. 🚀**
