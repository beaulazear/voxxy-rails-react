# Sidekiq Email Worker - Quick Start Guide

## 🚨 Immediate Action Required

Your scheduled emails aren't sending because **Sidekiq worker is not running in production**.

---

## ✅ Solution (3 Steps)

### Step 1: Deploy the New Configuration (5 minutes)

1. **Commit the new files:**
   ```bash
   git add render.yaml config/sidekiq.yml docs/
   git commit -m "Add Render Sidekiq worker configuration"
   git push origin main
   ```

2. **Go to Render Dashboard:**
   - Visit https://dashboard.render.com
   - You should see a new deployment triggered
   - **OR** manually create services from Blueprint:
     - Click **"New +"** → **"Blueprint"**
     - Select your repository
     - Click **"Apply"**

3. **Render will automatically create:**
   - ✅ Web Service (your Rails app) - already exists
   - ✅ **Worker Service (Sidekiq)** - **NEW!** This is what was missing
   - ✅ Redis Instance - should already exist

---

### Step 2: Set Environment Variables (5 minutes)

**IMPORTANT:** You must set these variables in **BOTH** services:

#### For `voxxy-rails` (Web Service):

1. Render Dashboard → **voxxy-rails** → **Environment**
2. Verify these exist (add if missing):
   - `RAILS_MASTER_KEY` = (your master.key content)
   - `SENDGRID_API_KEY` = (your SendGrid API key)
   - `FRONTEND_URL` = (your frontend URL)

#### For `voxxy-sidekiq` (Worker Service):

1. Render Dashboard → **voxxy-sidekiq** → **Environment**
2. Add the **SAME** variables as above:
   - `RAILS_MASTER_KEY` = (same value)
   - `SENDGRID_API_KEY` = (same value)
   - `FRONTEND_URL` = (same value)

**Note:** `DATABASE_URL` and `REDIS_URL` are auto-configured by Render.

---

### Step 3: Verify It's Working (2 minutes)

#### Check Sidekiq Worker Logs

1. Render Dashboard → **voxxy-sidekiq** → **Logs**
2. Look for these success messages:

```
✓ Loaded sidekiq-cron schedule with 2 jobs
Sidekiq cron jobs loaded
```

#### Check Email Worker is Running

Within 5 minutes, you should see:

```
EmailSenderWorker: Checking for scheduled emails ready to send...
```

Every 5 minutes after that, you'll see the worker checking for emails.

---

## ✅ How to Verify Emails Will Send

### Option 1: Check Worker Logs (Easiest)

Render Dashboard → **voxxy-sidekiq** → **Logs**

Look for:
```
Found 3 scheduled emails ready to send
Sending scheduled email #123: 1 Day Before Event
✓ Scheduled email #123 sent to 25 recipients
EmailSenderWorker complete: 3 sent, 0 failed
```

### Option 2: Use Rails Console

1. Render Dashboard → **voxxy-rails** → **Shell**
2. Run:
   ```bash
   rails console

   # Check if worker jobs are loaded
   Sidekiq::Cron::Job.all.map(&:name)
   # => ["email_sender_worker", "email_retry_scanner"]

   # Check last run time
   Sidekiq::Cron::Job.find('email_sender_worker').last_enqueue_time
   # => Should be within last 5 minutes

   # Check for emails ready to send
   ScheduledEmail.where(status: 'scheduled')
     .where('scheduled_for <= ?', Time.current)
     .count
   ```

### Option 3: Manually Trigger (For Testing)

```bash
# In Rails console
EmailSenderWorker.new.perform
# This will immediately check and send any ready emails
```

---

## 🔍 What Changed

### Before:
- ❌ Rails web app running in Render
- ❌ Redis running in Render
- ❌ **No Sidekiq worker** ← This was the problem!
- ❌ Emails scheduled but never sent

### After:
- ✅ Rails web app running in Render
- ✅ Redis running in Render
- ✅ **Sidekiq worker running** ← NEW!
- ✅ **Emails automatically sent every 5 minutes**

---

## 🚨 Common Issues

### Issue: Worker service fails to start

**Check logs for:**
- `REDIS_URL not set` → Set REDIS_URL in worker environment
- `ActiveRecord connection failed` → Set DATABASE_URL in worker environment
- `LoadError: cannot load such file` → Build command failed, check build logs

**Solution:**
- Ensure ALL environment variables from web service are copied to worker service
- Redeploy the worker

### Issue: Worker starts but jobs don't run

**Possible causes:**
1. Sidekiq-cron schedule not loading
2. No emails are due yet

**Check:**
```bash
# Rails console
Sidekiq::Cron::Job.count  # Should be 2
```

If 0, the schedule file isn't loading. Check worker logs for errors.

### Issue: Emails send multiple times

**Cause:** Multiple worker services running

**Solution:**
- Check Render dashboard for duplicate worker services
- Delete extras, keep only `voxxy-sidekiq`

---

## 📊 Monitoring Dashboard

### Quick Status Check

```bash
# Rails console
{
  redis: Sidekiq.redis { |conn| conn.ping },  # Should be "PONG"
  workers: Sidekiq::Workers.new.size,          # Should be > 0
  scheduled: Sidekiq::ScheduledSet.new.size,   # Scheduled jobs
  retry: Sidekiq::RetrySet.new.size,           # Failed jobs
  jobs_loaded: Sidekiq::Cron::Job.count        # Should be 2
}
```

---

## 📞 Need Help?

If emails still aren't sending:

1. ✅ Check worker service is running (Render dashboard)
2. ✅ Check worker logs for errors
3. ✅ Verify environment variables in both services
4. ✅ Test Redis connection: `Sidekiq.redis { |conn| conn.ping }`
5. ✅ Manually trigger worker to see error: `EmailSenderWorker.new.perform`

See full troubleshooting guide in `docs/RENDER_DEPLOYMENT.md`

---

## 🎯 Next Steps

1. **Deploy now** (commit and push)
2. **Wait 10-15 minutes** for Render to build and deploy
3. **Check worker logs** to verify it's running
4. **Monitor for 1 hour** to see emails being sent

Your scheduled emails should start sending automatically! 🚀
