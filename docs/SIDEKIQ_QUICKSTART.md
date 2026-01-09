# Sidekiq Email Worker - Quick Start Guide

## ✅ Current Status (January 9, 2026)

**Production Environment (`main` branch):**
- **Web Service**: `hey-voxxy` ✅ Running
- **Worker Service**: `heyvoxxy-sidekiq` ✅ **FULLY OPERATIONAL**
- **Database**: `VoxxyDB` (PostgreSQL)
- **Redis**: `beau-redis`
- **Status**: Emails sending automatically every 5 minutes

**Staging Environment (`staging` branch):**
- **Web Service**: `voxxy-reails-react` ✅ Running
- **Worker Service**: `voxxy-sidekiq` ✅ **FULLY OPERATIONAL**
- **Database**: `beaulazear` (PostgreSQL)
- **Redis**: `beau-redis`
- **Status**: Emails sending automatically every 5 minutes

**Both environments are operational!** Use this guide to verify status, troubleshoot, or set up a new environment.

---

## 🔍 Quick Verification

### Check Worker Status

1. **Render Dashboard** → Select worker service:
   - Production: `heyvoxxy-sidekiq`
   - Staging: `voxxy-sidekiq`
2. **Logs** tab → Look for:

```
✓ Loaded sidekiq-cron schedule with 2 jobs
EmailSenderWorker: Checking for scheduled emails ready to send...
```

### Check Recent Email Sends

**Production logs example:**
```
Found 4 scheduled emails ready to send
Sending scheduled email #2: 4 Days Before Event
✓ Email sent to greerlcourtney@gmail.com (SendGrid status: 202)
✓ Sent scheduled email #2 to 1 recipients (0 failed)
EmailSenderWorker complete: 4 sent, 0 failed
```

---

## ✅ How to Verify Emails Will Send

### Option 1: Check Worker Logs (Easiest)

**Render Dashboard** → Select worker service → **Logs**
- Production: `heyvoxxy-sidekiq`
- Staging: `voxxy-sidekiq`

Look for:
```
Found 3 scheduled emails ready to send
Sending scheduled email #123: 1 Day Before Event
✓ Scheduled email #123 sent to 25 recipients
EmailSenderWorker complete: 3 sent, 0 failed
```

### Option 2: Use Rails Console

1. **Render Dashboard** → Select web service → **Shell**
   - Production: `hey-voxxy`
   - Staging: `voxxy-reails-react`
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

## 🔍 Current Architecture

### Production Setup:
- ✅ Rails web app: `hey-voxxy` (main branch)
- ✅ Redis: `beau-redis` (shared)
- ✅ **Sidekiq worker**: `heyvoxxy-sidekiq` ✅
- ✅ Database: `VoxxyDB`
- ✅ **Emails sent automatically every 5 minutes**

### Staging Setup:
- ✅ Rails web app: `voxxy-reails-react` (staging branch)
- ✅ Redis: `beau-redis` (shared)
- ✅ **Sidekiq worker**: `voxxy-sidekiq` ✅
- ✅ Database: `beaulazear`
- ✅ **Emails sent automatically every 5 minutes**

### How It Works:
1. Each worker connects to its own database
2. Workers check every 5 minutes for scheduled emails (`scheduled_for <= current_time`)
3. Emails are sent via SendGrid
4. Status updated from `scheduled` → `sent`
5. Both environments operate independently

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

## 🎯 Setting Up a New Environment

If you need to set up Sidekiq for a new environment:

1. **Create Background Worker** in Render Dashboard:
   - Name: `your-env-sidekiq`
   - Branch: Your environment branch
   - Build: `./bin/render-build.sh`
   - Start: `bundle exec sidekiq -C config/sidekiq.yml`

2. **Link Services**:
   - DATABASE_URL → Link to your PostgreSQL
   - REDIS_URL → Link to `beau-redis`

3. **Copy Environment Variables**:
   - Copy ALL env vars from your web service to worker service
   - Including: `RAILS_MASTER_KEY`, `VoxxyKeyAPI`, `PRIMARY_DOMAIN`, `FRONTEND_URL`, etc.

4. **Wait 10-15 minutes** for deployment

5. **Verify in logs**:
   ```
   ✓ Loaded sidekiq-cron schedule with 2 jobs
   EmailSenderWorker: Checking for scheduled emails ready to send...
   ```

See `docs/RENDER_DEPLOYMENT.md` for detailed instructions.

---

## ✅ System Status

**Production and staging are fully operational!** Scheduled emails are sending automatically every 5 minutes. 🚀
