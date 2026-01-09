# Render.com Deployment Guide for Voxxy Presents

This guide covers deploying the Voxxy Presents platform to Render.com, including setting up Redis and Sidekiq for automated email delivery.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Environment Variables](#environment-variables)
3. [Sidekiq Email Worker](#sidekiq-email-worker)
4. [Monitoring](#monitoring)
5. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Connect Your Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub/GitLab repository
4. Select the repository containing `render.yaml`
5. Render will automatically detect the blueprint and create:
   - **Web Service** (voxxy-rails) - Your Rails application
   - **Worker Service** (voxxy-sidekiq) - Background job processor
   - **PostgreSQL Database** (voxxy-postgres)
   - **Redis Instance** (voxxy-redis) - For Sidekiq job queue

### 2. Initial Deployment

Click **"Apply"** to create all services. Render will:
- Provision all infrastructure
- Run the build command (`bin/render-build.sh`)
- Deploy your application
- Start the Sidekiq worker

---

## Environment Variables

Set these environment variables in **both** the web service AND worker service:

### Required Variables

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `RAILS_MASTER_KEY` | Your `config/master.key` content | Render Dashboard → Service → Environment |
| `VoxxyKeyAPI` | SendGrid API key for email delivery | Render Dashboard → Service → Environment |
| `FRONTEND_URL` | Your frontend URL (e.g., `https://voxxy.com`) | Render Dashboard → Service → Environment |

### Auto-Configured Variables

These are automatically set by Render (no action needed):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `RAILS_ENV=production`

### How to Set Variables

1. Go to Render Dashboard
2. Select **voxxy-rails** (web service)
3. Click **"Environment"** tab
4. Add each variable:
   - Click **"Add Environment Variable"**
   - Enter key and value
   - Click **"Save Changes"**
5. **Repeat for voxxy-sidekiq** (worker service)

**Important:** Both services must have the same environment variables!

---

## Sidekiq Email Worker

### How It Works

The **voxxy-sidekiq** worker service runs Sidekiq with sidekiq-cron, which:
1. Starts the Sidekiq process
2. Loads the cron schedule from `config/sidekiq_schedule.yml`
3. Runs `EmailSenderWorker` every 5 minutes
4. Checks for scheduled emails ready to send
5. Sends emails via SendGrid

### Cron Jobs Configured

| Job | Frequency | Description |
|-----|-----------|-------------|
| `email_sender_worker` | Every 5 minutes | Sends scheduled emails that are due |
| `email_retry_scanner` | Every 30 minutes | Retries soft-bounced emails |

### Verify Sidekiq is Running

#### Method 1: Check Render Logs

1. Go to Render Dashboard
2. Select **voxxy-sidekiq** service
3. Click **"Logs"** tab
4. Look for these log messages:

```
Sidekiq 7.x.x starting
✓ Loaded sidekiq-cron schedule with 2 jobs
Sidekiq cron jobs loaded
```

#### Method 2: Check Rails Console

SSH into your web service or use Render Shell:

```bash
# Open Rails console
rails console

# Check if cron jobs are loaded
Sidekiq::Cron::Job.all.map(&:name)
# Should return: ["email_sender_worker", "email_retry_scanner"]

# Check last run time
Sidekiq::Cron::Job.find('email_sender_worker').last_enqueue_time
```

#### Method 3: Access Sidekiq Web UI

Add to `config/routes.rb`:

```ruby
# Mount Sidekiq web UI (production only, with authentication)
require 'sidekiq/web'
require 'sidekiq/cron/web'

Rails.application.routes.draw do
  # Protect Sidekiq UI with authentication
  authenticate :user, ->(user) { user.admin? } do
    mount Sidekiq::Web => '/sidekiq'
  end
end
```

Then visit: `https://your-app.onrender.com/sidekiq`

---

## Monitoring

### Check Email Delivery

#### 1. View Scheduled Emails

```bash
# Rails console
ScheduledEmail.where(status: 'scheduled').order(:scheduled_for)
```

#### 2. Check Recent Sends

```bash
# Emails sent in the last hour
ScheduledEmail.where(status: 'sent')
  .where('sent_at > ?', 1.hour.ago)
  .order(sent_at: :desc)
```

#### 3. Check Failures

```bash
# Failed emails
ScheduledEmail.where(status: 'failed')
  .order(updated_at: :desc)
  .pluck(:name, :error_message)
```

### Monitor Sidekiq Queues

```bash
# Rails console
Sidekiq::Stats.new
# => #<Sidekiq::Stats:0x...
#      @stats={
#        "processed"=>1234,
#        "failed"=>0,
#        "scheduled_size"=>0,
#        "retry_size"=>0,
#        "enqueued"=>0
#      }>
```

### View Worker Logs

Render Dashboard → **voxxy-sidekiq** → **Logs**

Look for:
```
EmailSenderWorker: Checking for scheduled emails ready to send...
Found 3 scheduled emails ready to send
Sending scheduled email #123: 1 Day Before Event
✓ Scheduled email #123 sent to 25 recipients
EmailSenderWorker complete: 3 sent, 0 failed
```

---

## Troubleshooting

### Problem: Emails Not Sending

#### Check 1: Is Sidekiq Worker Running?

**Render Dashboard → voxxy-sidekiq → Status should be "Live"**

If stopped:
- Check logs for errors
- Verify REDIS_URL is set
- Restart the worker

#### Check 2: Are Jobs Being Enqueued?

```bash
# Rails console
Sidekiq::Cron::Job.find('email_sender_worker').last_enqueue_time
# Should be within last 5 minutes
```

If `nil` or old:
- Sidekiq-cron schedule not loading
- Check logs for "Loaded sidekiq-cron schedule" message

#### Check 3: Check Redis Connection

```bash
# Rails console
Sidekiq.redis { |conn| conn.ping }
# Should return "PONG"
```

If fails:
- REDIS_URL not set correctly
- Redis service not running in Render

#### Check 4: Verify Scheduled Emails Exist

```bash
# Rails console
ScheduledEmail.where(status: 'scheduled')
  .where('scheduled_for <= ?', Time.current)
  .count
# Should return > 0 if emails are due
```

If 0:
- No emails scheduled yet
- Generate emails: `ScheduledEmailGenerator.new(event).generate`

### Problem: Worker Keeps Crashing

Check Render logs for:
- **Memory errors**: Upgrade worker plan
- **Database errors**: Check DATABASE_URL
- **Redis errors**: Check REDIS_URL

### Problem: Emails Sent Multiple Times

Possible causes:
- Multiple Sidekiq workers running (check Render services)
- Job retrying due to errors

Solution:
- Ensure only ONE worker service
- Check error logs to fix underlying issue

### Problem: "REDIS_URL not set" Error

1. Verify Redis service is running in Render
2. Check environment variable in both services:
   - Web service: Environment tab
   - Worker service: Environment tab
3. Redeploy if needed

---

## Scaling

### Increase Email Throughput

1. **Upgrade worker plan** (more CPU/memory)
2. **Increase concurrency** in `config/sidekiq.yml`:
   ```yaml
   :production:
     :concurrency: 25  # Increase from 10
   ```
3. **Add more workers** (multiple Sidekiq services)

### Multiple Worker Services

Create additional workers in `render.yaml`:

```yaml
- type: worker
  name: voxxy-sidekiq-2
  runtime: ruby
  # ... same config as voxxy-sidekiq
```

---

## Useful Commands

### Manually Trigger Email Worker

```bash
# Rails console
EmailSenderWorker.new.perform
```

### Check Next Scheduled Run

```bash
# Rails console
job = Sidekiq::Cron::Job.find('email_sender_worker')
job.last_enqueue_time
job.next_enqueue_time  # When it will run next
```

### Clear Failed Jobs

```bash
# Rails console
Sidekiq::RetrySet.new.clear
Sidekiq::DeadSet.new.clear
```

### Manually Send a Specific Email

```bash
# Rails console
email = ScheduledEmail.find(123)
service = EmailSenderService.new(email)
result = service.send_to_recipients
# => { sent: 25, failed: 0 }
```

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Sidekiq Documentation](https://github.com/mperham/sidekiq/wiki)
- [Sidekiq-Cron Documentation](https://github.com/sidekiq-cron/sidekiq-cron)
- [SendGrid API Documentation](https://docs.sendgrid.com/)

---

## Support

If emails still aren't sending after following this guide:

1. Check all logs (web service + worker service)
2. Verify all environment variables are set in BOTH services
3. Test Redis connection
4. Manually trigger the worker to see errors
5. Contact support with log output
