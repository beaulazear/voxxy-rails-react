# Sentry Setup Guide

**Date:** January 28, 2026
**Purpose:** Error tracking and monitoring for email system
**Time to Setup:** 30 minutes

---

## What is Sentry?

Sentry is an error tracking platform that:
- ✅ Automatically captures errors/exceptions
- ✅ Sends alerts to Slack/email when errors occur
- ✅ Groups similar errors together
- ✅ Shows stack traces and context
- ✅ Tracks performance issues
- ✅ Integrates with Sidekiq for background job monitoring

**For Feb 3rd:** We need to know IMMEDIATELY when emails fail, not when users report it.

---

## Step 1: Create Sentry Account

### Sign Up (Free Tier)

1. Go to https://sentry.io/signup/
2. Sign up with:
   - Email: your-team-email@voxxypresents.com
   - Or sign in with GitHub
3. Create organization: "Voxxy Presents"
4. Select plan: **Developer (Free)**
   - 5,000 errors/month
   - 10,000 performance transactions/month
   - 30-day retention
   - Unlimited team members

### Create Project

1. Click "Create Project"
2. Platform: **Ruby on Rails**
3. Alert frequency: **On every new issue**
4. Project name: `voxxy-rails-production`
5. Click "Create Project"

### Get DSN (Data Source Name)

1. After project created, you'll see:
   ```
   SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456
   ```
2. **Copy this!** You'll need it for environment variables

---

## Step 2: Install Gems

### Already Done! ✓

The following gems have been added to `Gemfile`:
```ruby
gem "sentry-ruby"
gem "sentry-rails"
gem "sentry-sidekiq"
```

### Run Bundle Install

```bash
# In development
bundle install

# In production (Heroku will do this automatically on deploy)
```

---

## Step 3: Configure Environment Variables

### For Staging

```bash
heroku config:set SENTRY_DSN="https://YOUR-DSN@sentry.io/PROJECT-ID" -a voxxy-rails-staging
```

### For Production

```bash
heroku config:set SENTRY_DSN="https://YOUR-DSN@sentry.io/PROJECT-ID" -a voxxy-rails-production
```

### For Local Development (Optional)

Add to `.env` file:
```
SENTRY_DSN=https://YOUR-DSN@sentry.io/PROJECT-ID
```

**Note:** Sentry is disabled in development by default (see `config/initializers/sentry.rb`)

---

## Step 4: Deploy

### Commit Changes

```bash
git add Gemfile Gemfile.lock config/initializers/sentry.rb
git commit -m "Add Sentry error tracking"
git push origin your-branch-name
```

### Deploy to Staging

```bash
# Merge to staging branch
git checkout staging
git merge your-branch-name
git push origin staging

# Deploy (Heroku auto-deploys from staging branch)
# Or manually:
git push heroku staging:main
```

### Verify Deployment

```bash
# Check Sentry is configured
heroku run rails runner 'puts "Sentry DSN: #{Sentry.configuration.dsn ? "✓ Configured" : "✗ Missing"}"' -a voxxy-staging
```

---

## Step 5: Test Sentry

### Manual Test in Rails Console

```bash
heroku run rails console -a voxxy-staging
```

```ruby
# Trigger test error
begin
  raise "Sentry test error from Rails console"
rescue => e
  Sentry.capture_exception(e)
end

puts "✓ Test error sent to Sentry. Check dashboard in 1-2 minutes."
```

### Automatic Test (Built-in Rake Task)

```bash
heroku run rake sentry:test -a voxxy-staging
```

### Verify in Sentry Dashboard

1. Go to https://sentry.io
2. Select your project
3. You should see the test error appear within 1-2 minutes
4. Click on error to see:
   - Stack trace
   - Environment details
   - Breadcrumbs (what happened before error)

---

## Step 6: Set Up Alerts

### Email Alerts (Free)

1. Go to **Settings** → **Alerts**
2. Click "Create Alert Rule"
3. Configure:
   - **Condition:** When an event is seen
   - **Filters:** None (alert on all errors)
   - **Actions:** Send email to team@voxxypresents.com
4. Save

### Slack Alerts (Recommended)

1. Go to **Settings** → **Integrations**
2. Find "Slack" and click "Install"
3. Authorize Sentry to access your Slack workspace
4. Configure:
   - **Channel:** #alerts or #engineering
   - **Alert on:** New issues, regressions, spikes
5. Save

**Example Slack Message:**
```
[Sentry] New issue in voxxy-rails-production
❌ EmailSenderService: NoMethodError
undefined method `send_email' for InvitationReminderService

View in Sentry: https://sentry.io/issues/123
```

---

## Step 7: Create Alert Rules for Email System

### Alert Rule 1: Email System Errors

1. Go to **Alerts** → "Create Alert Rule"
2. Configure:
   - **Name:** "Email System Errors"
   - **Condition:** When tags match
     - `component` equals `email_system`
   - **Action:**
     - Send Slack notification to #alerts
     - Send email to tech-lead@voxxypresents.com
3. Save

### Alert Rule 2: High Error Rate

1. Create new alert rule
2. Configure:
   - **Name:** "High Error Rate"
   - **Condition:** When event count is more than 10 in 1 hour
   - **Action:**
     - Send Slack notification to #alerts
     - Mark as "Critical"
3. Save

### Alert Rule 3: Webhook Failures

1. Create new alert rule
2. Configure:
   - **Name:** "Webhook Failures"
   - **Condition:** When tags match
     - `component` equals `webhook`
   - **Action:**
     - Send Slack notification immediately
3. Save

---

## What Sentry Will Capture

### Automatically Captured

1. **All exceptions in Rails controllers**
   - Example: `NoMethodError`, `ArgumentError`, etc.

2. **Sidekiq job failures**
   - EmailSenderWorker errors
   - EmailDeliveryProcessorJob errors

3. **Background job retries**
   - Shows how many times job retried
   - Final failure after all retries exhausted

### Manually Captured (Add to Code)

For non-exception errors:

```ruby
# Log warning (doesn't raise exception)
if recipients.empty?
  Sentry.capture_message(
    "Email sent with 0 recipients",
    level: :warning,
    extra: {
      email_id: scheduled_email.id,
      event_id: event.id,
      invitations_count: event.event_invitations.count
    }
  )
end
```

For custom error context:

```ruby
begin
  send_email(recipient)
rescue => e
  Sentry.capture_exception(e, extra: {
    recipient_email: recipient.email,
    scheduled_email_id: scheduled_email.id,
    category: email.category
  })
  raise
end
```

---

## Example Sentry Errors for Email System

### Error 1: Nil Category Bug

**Issue in Sentry:**
```
NoMethodError: undefined method `category' for nil:NilClass
File: app/workers/email_sender_worker.rb:65

Stack Trace:
  email_sender_worker.rb:65 in perform
  sidekiq/processor.rb:123 in execute_job

Tags:
  component: email_system
  priority: high
```

**What This Tells Us:**
- `email_template_item` is nil
- Routing logic failed
- Need to add nil check (Quick Win #1!)

---

### Error 2: SendGrid API Failure

**Issue in Sentry:**
```
SendGrid::Error: Unauthorized
File: app/services/email_sender_service.rb:125

Tags:
  component: email_system
  priority: high

Extra Context:
  recipient_email: vendor@example.com
  scheduled_email_id: 123
```

**What This Tells Us:**
- SendGrid API key invalid or expired
- Need to update environment variable

---

### Error 3: Database Lookup Failed

**Issue in Sentry:**
```
ActiveRecord::RecordNotFound: Couldn't find EmailDelivery
File: app/workers/email_delivery_processor_job.rb:25

Tags:
  component: webhook
  priority: high
```

**What This Tells Us:**
- Webhook arrived but couldn't find EmailDelivery record
- 3-tier lookup strategy failing
- Race condition or timing issue

---

## Monitoring Dashboards

### Sentry Dashboard Overview

1. **Issues** - All errors, grouped by type
2. **Performance** - Slow transactions (optional)
3. **Releases** - Track errors by deployment
4. **Stats** - Error count over time

### Key Metrics to Watch

**For Feb 3rd:**
- ✅ Zero email system errors in last 24 hours
- ✅ No webhook failures
- ✅ Sidekiq jobs completing successfully

**Warning Signs:**
- ❌ Spike in errors (>10 in 1 hour)
- ❌ Same error repeating (>5 times)
- ❌ Errors with tag `priority: high`

---

## Cost & Limits

### Free Tier Limits

- **5,000 errors/month**
  - ~166 errors/day
  - Should be plenty for our volume

- **10,000 performance transactions/month**
  - Only if you enable performance monitoring
  - We set sample rate to 10% to stay under limit

- **30-day retention**
  - Errors older than 30 days deleted
  - Enough for debugging recent issues

### When to Upgrade

**Upgrade to Team plan ($26/month) if:**
- Hitting 5,000 error limit
- Need longer retention (90 days)
- Want more advanced features (custom dashboards, etc.)

**For now:** Free tier is sufficient for Feb 3rd launch.

---

## Best Practices

### DO:

✅ Check Sentry dashboard daily (5 min)
✅ Fix errors as they appear (don't let them pile up)
✅ Use tags to categorize errors (email_system, webhook, etc.)
✅ Add context to exceptions (email_id, event_id, etc.)
✅ Set up Slack alerts for immediate notification

### DON'T:

❌ Ignore errors in Sentry (they indicate real problems)
❌ Send sensitive data (passwords, API keys, etc.)
❌ Log every warning (only important ones)
❌ Forget to resolve fixed errors (mark as resolved in Sentry)

---

## Troubleshooting

### Sentry Not Capturing Errors

**Check 1: DSN Configured?**
```bash
heroku config:get SENTRY_DSN -a voxxy-staging
```

**Check 2: Sentry Enabled?**
```bash
heroku run rails runner 'puts Sentry.configuration.enabled_environments' -a voxxy-staging
# Should show: ["production", "staging"]
```

**Check 3: Test Manually**
```bash
heroku run rake sentry:test -a voxxy-staging
```

### Too Many Errors (Hitting Limit)

**Solution 1: Filter Noise**
Add to `config/initializers/sentry.rb`:
```ruby
config.before_send = lambda do |event, hint|
  # Ignore specific errors
  return nil if event.exception.values.any? { |e| e.type == "ActionController::RoutingError" }

  event
end
```

**Solution 2: Increase Sample Rate**
Reduce performance monitoring sample rate to save quota for errors.

---

## Quick Reference

### Important Links

- **Sentry Dashboard:** https://sentry.io
- **Documentation:** https://docs.sentry.io/platforms/ruby/guides/rails/
- **Status Page:** https://status.sentry.io

### Commands

```bash
# Test Sentry
heroku run rake sentry:test -a voxxy-staging

# Check configuration
heroku run rails runner 'puts Sentry.configuration.dsn' -a voxxy-staging

# Capture custom error
heroku run rails runner 'Sentry.capture_message("Test message")' -a voxxy-staging
```

---

## Success Criteria

**Sentry is working if:**
- ✅ Test error appears in dashboard within 2 minutes
- ✅ Slack alerts working
- ✅ Email alerts working
- ✅ Errors tagged correctly (component: email_system)
- ✅ Stack traces show correct file/line numbers

**Next Steps After Setup:**
1. Deploy to staging
2. Run test error
3. Verify alert received
4. Monitor for 24 hours
5. Deploy to production
6. Set up alerts for Feb 3rd

---

**Setup Time:** 30 minutes
**Cost:** Free (for now)
**Value:** Priceless (know about errors before users do!)

---

**Created:** January 28, 2026
**Updated:** January 28, 2026
