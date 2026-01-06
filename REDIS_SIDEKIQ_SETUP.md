# Redis & Sidekiq Setup Guide

This guide covers everything you need to know about Redis and Sidekiq in the Voxxy Presents email automation system.

---

## Table of Contents

1. [What is Redis?](#what-is-redis)
2. [What is Sidekiq?](#what-is-sidekiq)
3. [How They Work Together](#how-they-work-together)
4. [Local Development Setup](#local-development-setup)
5. [Production Setup (Render)](#production-setup-render)
6. [Testing Redis & Sidekiq](#testing-redis--sidekiq)
7. [Monitoring & Debugging](#monitoring--debugging)
8. [Common Issues & Solutions](#common-issues--solutions)
9. [Performance Optimization](#performance-optimization)

---

## What is Redis?

**Redis** (Remote Dictionary Server) is an in-memory data structure store used as a database, cache, and message broker.

### Key Characteristics:
- **In-Memory**: Stores data in RAM for extremely fast read/write operations
- **Persistent**: Can save data to disk for durability
- **Data Structures**: Supports strings, hashes, lists, sets, sorted sets, and more
- **Pub/Sub**: Built-in publish/subscribe messaging
- **Atomic Operations**: Thread-safe operations

### Why We Use Redis:
In our email automation system, Redis serves as a **job queue** and **temporary storage** for:
1. **Background Jobs**: Stores pending jobs that Sidekiq workers will process
2. **Job State**: Tracks job status, retries, failures
3. **Scheduled Jobs**: Maintains schedule for recurring cron jobs
4. **Statistics**: Tracks processed/failed job counts
5. **Rate Limiting**: Can limit email sending rates (future feature)

### Redis Data Model:
Redis organizes data in a key-value store with different data types:

```
# Example Redis keys used by Sidekiq:
queue:email_delivery           # List of jobs in email_delivery queue
queue:email_webhooks           # List of jobs in email_webhooks queue
schedule                       # Sorted set of scheduled jobs
retry                          # Sorted set of jobs waiting to retry
dead                           # Sorted set of permanently failed jobs
stat:processed                 # Counter of successful jobs
stat:failed                    # Counter of failed jobs
cron_job:email_sender_worker   # Hash with cron job configuration
```

---

## What is Sidekiq?

**Sidekiq** is a background job processing framework for Ruby that uses Redis as its data store.

### Key Features:
- **Multi-threaded**: Processes multiple jobs concurrently
- **Reliable**: Automatic retries with exponential backoff
- **Scheduled Jobs**: Run jobs at specific times
- **Recurring Jobs**: Cron-like scheduled tasks (via sidekiq-cron)
- **Web UI**: Built-in dashboard for monitoring
- **Queue Prioritization**: Different queues with different priorities

### Our Sidekiq Workers:

#### 1. EmailSenderWorker (Recurring)
```ruby
# app/workers/email_sender_worker.rb
class EmailSenderWorker
  include Sidekiq::Job
  sidekiq_options queue: :email_delivery, retry: 2

  def perform
    # Runs every 5 minutes via cron
    # Finds all scheduled emails where scheduled_for <= Time.current
    # Sends each email via EmailSenderService
  end
end
```

**Purpose**: Main worker that checks every 5 minutes for emails ready to send
**Queue**: `email_delivery`
**Schedule**: `*/5 * * * *` (every 5 minutes)
**Retries**: 2 attempts if the cron execution fails

#### 2. EmailDeliveryProcessorJob (Async)
```ruby
# app/workers/email_delivery_processor_job.rb
class EmailDeliveryProcessorJob
  include Sidekiq::Job
  sidekiq_options queue: :email_webhooks, retry: 3

  def perform(event_data)
    # Processes SendGrid webhook events
    # Updates EmailDelivery records with delivery status
    # Handles: delivered, bounce, dropped, deferred, etc.
  end
end
```

**Purpose**: Processes incoming SendGrid webhook events asynchronously
**Queue**: `email_webhooks`
**Retries**: 3 attempts with exponential backoff
**Trigger**: Called from `Api::V1::Webhooks::SendgridController#create`

#### 3. EmailRetryJob (Async)
```ruby
# app/workers/email_retry_job.rb
class EmailRetryJob
  include Sidekiq::Job
  sidekiq_options queue: :email_delivery, retry: 2

  def perform(email_delivery_id)
    # Retries soft-bounced emails
    # Implements exponential backoff: 1hr → 4hr → 24hr
    # Max 3 retry attempts
  end
end
```

**Purpose**: Retries emails that soft-bounced
**Queue**: `email_delivery`
**Schedule**: Dynamic (1hr, 4hr, or 24hr after bounce)
**Retries**: 2 attempts

#### 4. EmailRetryScannerJob (Recurring)
```ruby
# app/workers/email_retry_scanner_job.rb
class EmailRetryScannerJob
  include Sidekiq::Job
  sidekiq_options queue: :email_delivery, retry: 2

  def perform
    # Runs every 30 minutes via cron
    # Backup scanner for pending retries
    # Catches retries that might have been missed
  end
end
```

**Purpose**: Safety net to catch any missed retries
**Queue**: `email_delivery`
**Schedule**: `*/30 * * * *` (every 30 minutes)
**Retries**: 2 attempts

---

## How They Work Together

### Architecture Overview:

```
┌─────────────────────────────────────────────────────────────┐
│                    Rails Application                         │
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Controllers    │         │   Service Classes │          │
│  │                  │────────▶│                   │          │
│  │ - SendgridCtrl   │         │ - EmailSender     │          │
│  │ - EmailsCtrl     │         │ - ScheduleCalc    │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                              │                    │
│           │ Enqueue Jobs                 │                    │
│           ▼                              ▼                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Sidekiq Client                          │    │
│  │  (Pushes jobs to Redis queues)                      │    │
│  └─────────────────────────────────────────────────────┘    │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │              REDIS                    │
         │                                       │
         │  Queues:                              │
         │    - email_delivery: [Job1, Job2]     │
         │    - email_webhooks: [Job3]           │
         │                                       │
         │  Scheduled:                           │
         │    - RetryJob (in 1 hour)             │
         │                                       │
         │  Cron Schedule:                       │
         │    - EmailSenderWorker (every 5min)   │
         │    - EmailRetryScannerJob (every 30m) │
         └──────────────────────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │         Sidekiq Process               │
         │                                       │
         │  Thread Pool (5 threads):             │
         │    Thread 1: Processing Job1          │
         │    Thread 2: Processing Job2          │
         │    Thread 3: Processing Job3          │
         │    Thread 4: Idle                     │
         │    Thread 5: Idle                     │
         │                                       │
         │  Cron Manager:                        │
         │    - Checks schedule every minute     │
         │    - Enqueues jobs when due           │
         └──────────────────────────────────────┘
```

### Job Lifecycle:

1. **Job Creation**:
   ```ruby
   # Rails app enqueues a job
   EmailDeliveryProcessorJob.perform_async(event_data)
   ```

2. **Redis Storage**:
   ```
   # Sidekiq serializes job and pushes to Redis
   RPUSH queue:email_webhooks '{"class":"EmailDeliveryProcessorJob","args":[{...}]}'
   ```

3. **Job Retrieval**:
   ```
   # Sidekiq worker pulls job from queue
   LPOP queue:email_webhooks
   ```

4. **Job Execution**:
   ```ruby
   # Worker thread executes the perform method
   EmailDeliveryProcessorJob.new.perform(event_data)
   ```

5. **Completion**:
   ```
   # On success: increment processed count
   INCR stat:processed

   # On failure: add to retry queue with backoff
   ZADD retry <timestamp> '{"class":"EmailDeliveryProcessorJob",...}'
   ```

### Cron Job Flow:

```ruby
# Every minute, Sidekiq-Cron checks schedule
Sidekiq::Cron::Job.all.each do |job|
  if job.should_enqueue?
    job.enqueue! # Pushes job to its queue
  end
end

# Example: EmailSenderWorker runs every 5 minutes
# At 09:00, 09:05, 09:10, etc., job is enqueued:
RPUSH queue:email_delivery '{"class":"EmailSenderWorker","args":[]}'

# Worker picks it up and executes
EmailSenderWorker.new.perform
```

---

## Local Development Setup

### Step 1: Install Redis

**macOS (Homebrew)**:
```bash
# Install Redis
brew install redis

# Start Redis as a background service
brew services start redis

# Verify it's running
redis-cli ping
# Should respond: PONG

# Check Redis version
redis-cli --version
# redis-cli 8.4.0 (or similar)
```

**Linux (Ubuntu/Debian)**:
```bash
# Update package list
sudo apt update

# Install Redis
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server

# Verify it's running
redis-cli ping
```

**Windows (WSL recommended)**:
```bash
# Use WSL and follow Linux instructions above
# Or use Redis for Windows: https://github.com/microsoftarchive/redis/releases
```

### Step 2: Configure Rails for Redis

**config/initializers/sidekiq.rb**:
```ruby
# Already configured in your app
Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }

  # Load cron schedule on server start
  schedule_file = "config/sidekiq_schedule.yml"
  if File.exist?(schedule_file)
    Sidekiq::Cron::Job.load_from_hash YAML.load_file(schedule_file)
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }
end
```

**config/sidekiq_schedule.yml**:
```yaml
email_sender_worker:
  cron: "*/5 * * * *"
  class: "EmailSenderWorker"
  queue: email_delivery
  description: "Checks for scheduled emails ready to send and sends them"

email_retry_scanner:
  cron: "*/30 * * * *"
  class: "EmailRetryScannerJob"
  queue: email_delivery
  description: "Scans for pending email retries that need to be processed"
```

### Step 3: Install Sidekiq Gems

**Gemfile**:
```ruby
gem "sidekiq", "~> 7.3"
gem "sidekiq-cron"
```

```bash
bundle install
```

### Step 4: Start Development Services

**Terminal 1 - Redis** (if not running as service):
```bash
redis-server
```

**Terminal 2 - Rails**:
```bash
bundle exec rails s -p 3001
```

**Terminal 3 - Sidekiq**:
```bash
bundle exec sidekiq
```

**Terminal 4 - React** (optional):
```bash
cd /path/to/voxxy-presents-client
npm run dev
```

### Step 5: Verify Setup

```bash
# Check Redis connection
redis-cli ping

# Check Sidekiq queues
bundle exec rails runner "require 'sidekiq/api'; Sidekiq::Queue.all.each { |q| puts \"#{q.name}: #{q.size}\" }"

# Check cron jobs
bundle exec rails runner "require 'sidekiq-cron'; Sidekiq::Cron::Job.all.each { |j| puts \"#{j.name}: #{j.status}\" }"

# Manually enqueue a test job
bundle exec rails runner "EmailSenderWorker.perform_async"
```

---

## Production Setup (Render)

### Step 1: Add Redis Service

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **Redis**
3. **Configure**:
   - Name: `voxxy-redis`
   - Plan: Choose based on needs
     - Free: Good for testing (25MB, 30-day expiry)
     - Starter ($7/mo): 256MB, no expiry
     - Standard ($20/mo): 1GB, high availability
   - Region: Same as your Rails app (for low latency)
   - Eviction Policy: `noeviction` (don't auto-delete data)
   - Maxmemory Policy: `allkeys-lru` (if memory gets full, remove least recently used)

4. **Click "Create Redis"**

5. **Copy Connection Details**:
   - Internal Redis URL: `redis://red-xxxxx:6379` (use this)
   - External Redis URL: Only if accessing from outside Render

### Step 2: Add Environment Variable to Rails App

1. Go to your **Rails Web Service** in Render
2. Navigate to **Environment** tab
3. Add new environment variable:
   - Key: `REDIS_URL`
   - Value: `redis://red-xxxxx:6379` (your internal Redis URL)
4. **Save Changes** (this will trigger a redeploy)

### Step 3: Add Sidekiq Worker Service

**Option A: Using Render Dashboard**

1. **Click "New +"** → **Background Worker**
2. **Connect Git Repository**: Same repo as your Rails app
3. **Configure**:
   - Name: `voxxy-sidekiq`
   - Environment: `Ruby`
   - Build Command: `bundle install`
   - Start Command: `bundle exec sidekiq`
   - Plan: Starter or higher
   - Branch: `main` (or your production branch)
4. **Add Environment Variables**:
   - Copy all variables from your Rails web service
   - Ensure `REDIS_URL` is included
5. **Create Background Worker**

**Option B: Using render.yaml (Recommended)**

Create `render.yaml` in your repo root:

```yaml
services:
  # Rails API
  - type: web
    name: voxxy-rails-api
    env: ruby
    buildCommand: bundle install
    startCommand: bundle exec rails s -p 3001
    envVars:
      - key: RAILS_ENV
        value: production
      - key: REDIS_URL
        fromService:
          type: redis
          name: voxxy-redis
          property: connectionString
      - key: DATABASE_URL
        fromDatabase:
          name: voxxy-postgres
          property: connectionString
      - key: SENDGRID_API_KEY
        sync: false
      # ... other env vars

  # Sidekiq Worker
  - type: worker
    name: voxxy-sidekiq
    env: ruby
    buildCommand: bundle install
    startCommand: bundle exec sidekiq
    envVars:
      - key: RAILS_ENV
        value: production
      - key: REDIS_URL
        fromService:
          type: redis
          name: voxxy-redis
          property: connectionString
      - key: DATABASE_URL
        fromDatabase:
          name: voxxy-postgres
          property: connectionString
      - key: SENDGRID_API_KEY
        sync: false
      # ... other env vars

databases:
  - name: voxxy-postgres
    plan: starter

  - name: voxxy-redis
    plan: starter
    maxmemoryPolicy: allkeys-lru
```

Commit and push `render.yaml`, then Render will auto-create all services.

### Step 4: Verify Production Setup

**Check Sidekiq Web UI** (optional but recommended):

1. Add to `config/routes.rb`:
```ruby
require 'sidekiq/web'

Rails.application.routes.draw do
  # Mount Sidekiq web UI (add authentication!)
  authenticate :user, ->(user) { user.admin? } do
    mount Sidekiq::Web => '/admin/sidekiq'
  end

  # ... other routes
end
```

2. Add to `Gemfile`:
```ruby
gem 'sidekiq-cron'
gem 'redis-namespace' # Optional: namespace Sidekiq data
```

3. Visit: `https://your-app.onrender.com/admin/sidekiq`

**Check via Rails Console**:

1. Open Render dashboard → Rails service → **Shell** tab
2. Run:
```bash
bundle exec rails console

# Check Redis connection
Sidekiq.redis { |conn| conn.ping }
# => "PONG"

# Check queues
require 'sidekiq/api'
Sidekiq::Queue.all.each { |q| puts "#{q.name}: #{q.size}" }

# Check cron jobs
require 'sidekiq-cron'
Sidekiq::Cron::Job.all.each { |j| puts "#{j.name}: #{j.status}" }

# Check stats
stats = Sidekiq::Stats.new
puts "Processed: #{stats.processed}"
puts "Failed: #{stats.failed}"
```

### Step 5: Configure Cron Jobs in Production

Cron jobs are automatically loaded when Sidekiq starts via `config/initializers/sidekiq.rb`.

**Verify cron jobs are loaded**:
```bash
bundle exec rails runner "require 'sidekiq-cron'; puts Sidekiq::Cron::Job.all.map(&:name)"
# Should output: email_sender_worker, email_retry_scanner
```

**Manually load/update cron schedule**:
```bash
bundle exec rails runner "Sidekiq::Cron::Job.load_from_hash YAML.load_file('config/sidekiq_schedule.yml')"
```

---

## Testing Redis & Sidekiq

### Manual Testing

#### 1. Test Redis Connection
```bash
# Local
redis-cli ping
# => PONG

redis-cli
> SET test "Hello Redis"
> GET test
# => "Hello Redis"
> DEL test
> EXIT

# Production (via Rails console)
bundle exec rails console
Sidekiq.redis { |conn| conn.set("test", "Hello") }
Sidekiq.redis { |conn| conn.get("test") }
```

#### 2. Test Job Enqueuing
```bash
bundle exec rails console

# Enqueue a test job
EmailSenderWorker.perform_async
# => "jid-1234567890abcdef" (job ID)

# Check if job is in queue
require 'sidekiq/api'
queue = Sidekiq::Queue.new('email_delivery')
puts "Queue size: #{queue.size}"
queue.each { |job| puts job.inspect }
```

#### 3. Test Job Execution
```bash
# Start Sidekiq in foreground to see logs
bundle exec sidekiq

# In another terminal, enqueue a job
bundle exec rails console
EmailSenderWorker.perform_async

# Watch Sidekiq terminal for output:
# 2026-01-05T02:00:00.000Z pid=12345 tid=xyz EmailSenderWorker JID-abc123 INFO: start
# 2026-01-05T02:00:01.234Z pid=12345 tid=xyz EmailSenderWorker JID-abc123 INFO: done: 1.234 sec
```

#### 4. Test Cron Jobs
```bash
bundle exec rails console

# List all cron jobs
require 'sidekiq-cron'
Sidekiq::Cron::Job.all.each do |job|
  puts "#{job.name}:"
  puts "  Status: #{job.status}"
  puts "  Cron: #{job.cron}"
  puts "  Last run: #{job.last_enqueue_time}"
  puts "  Next run: #{job.next_enqueue_time}"
  puts ""
end

# Manually trigger a cron job (for testing)
job = Sidekiq::Cron::Job.find('email_sender_worker')
job.enque! # Enqueues the job immediately (without waiting for schedule)

# Disable a cron job
job.disable!

# Enable a cron job
job.enable!
```

#### 5. Test Email Sending Flow (End-to-End)
```bash
bundle exec rails console

# Create a test scheduled email in the past (so it's ready to send)
event = Event.first
template = EmailCampaignTemplate.find_by(is_default: true)
item = template.email_template_items.first

scheduled_email = ScheduledEmail.create!(
  event: event,
  email_campaign_template: template,
  email_template_item: item,
  name: "Test Email",
  subject_template: "Test Subject",
  body_template: "<p>Hello {{vendor_name}}</p>",
  trigger_type: "manual",
  scheduled_for: 1.minute.ago, # In the past!
  status: "scheduled"
)

puts "Created scheduled email ##{scheduled_email.id}"

# Manually trigger the sender worker
EmailSenderWorker.new.perform

# Check if email was sent
scheduled_email.reload
puts "Status: #{scheduled_email.status}" # Should be 'sent'
puts "Sent at: #{scheduled_email.sent_at}"

# Check email deliveries
scheduled_email.email_deliveries.each do |delivery|
  puts "  To: #{delivery.recipient_email} - Status: #{delivery.delivery_status}"
end
```

#### 6. Test Webhook Processing
```bash
# Simulate SendGrid webhook locally
curl -X POST http://localhost:3001/api/v1/webhooks/sendgrid \
  -H "Content-Type: application/json" \
  -d '{
    "event": "delivered",
    "email": "vendor@example.com",
    "sg_message_id": "test-message-id-123",
    "timestamp": 1704412800
  }'

# Check if job was enqueued
bundle exec rails console
require 'sidekiq/api'
queue = Sidekiq::Queue.new('email_webhooks')
puts "Webhook queue size: #{queue.size}"
```

### Automated Testing

Create `test/workers/email_sender_worker_test.rb`:
```ruby
require 'test_helper'

class EmailSenderWorkerTest < ActiveSupport::TestCase
  test "sends scheduled emails that are due" do
    # Create a scheduled email in the past
    email = scheduled_emails(:ready_to_send)
    email.update!(scheduled_for: 1.minute.ago, status: 'scheduled')

    # Run the worker
    EmailSenderWorker.new.perform

    # Verify email was sent
    email.reload
    assert_equal 'sent', email.status
    assert_not_nil email.sent_at
  end

  test "does not send future scheduled emails" do
    email = scheduled_emails(:future_email)
    email.update!(scheduled_for: 1.hour.from_now, status: 'scheduled')

    EmailSenderWorker.new.perform

    email.reload
    assert_equal 'scheduled', email.status
    assert_nil email.sent_at
  end
end
```

Run tests:
```bash
bundle exec rails test test/workers/
```

### Performance Testing

```bash
bundle exec rails console

# Enqueue 100 jobs
100.times do |i|
  EmailDeliveryProcessorJob.perform_async({
    'event' => 'delivered',
    'email' => "test#{i}@example.com",
    'sg_message_id' => "msg-#{i}"
  })
end

# Monitor processing speed
require 'sidekiq/api'
stats = Sidekiq::Stats.new

puts "Enqueued: #{stats.enqueued}"
sleep 10
stats = Sidekiq::Stats.new
puts "Enqueued after 10s: #{stats.enqueued}"
puts "Processed: #{stats.processed}"
# Calculate jobs/sec
```

---

## Monitoring & Debugging

### Sidekiq Web UI

The easiest way to monitor Sidekiq is through its built-in web UI.

**Setup**:

1. Add to `Gemfile`:
```ruby
gem 'sidekiq-cron'
```

2. Add to `config/routes.rb`:
```ruby
require 'sidekiq/web'
require 'sidekiq/cron/web'

Rails.application.routes.draw do
  # Require authentication for Sidekiq UI
  authenticate :user, ->(user) { user.admin? } do
    mount Sidekiq::Web => '/admin/sidekiq'
  end
end
```

3. Visit: `http://localhost:3001/admin/sidekiq` (local) or `https://your-app.onrender.com/admin/sidekiq` (production)

**What You Can See**:
- **Dashboard**: Overview of queues, processed/failed jobs, stats
- **Busy**: Currently running jobs
- **Queues**: Jobs waiting in each queue
- **Retries**: Failed jobs waiting to retry
- **Scheduled**: Jobs scheduled for future execution
- **Dead**: Permanently failed jobs
- **Cron**: Recurring cron jobs with next run times

### Redis CLI Monitoring

**Watch Redis commands in real-time**:
```bash
redis-cli monitor
# Shows every command Redis receives
# Useful for debugging what Sidekiq is doing
```

**Check Redis memory usage**:
```bash
redis-cli info memory

# Output:
# used_memory_human:1.23M
# used_memory_peak_human:2.34M
```

**List all keys**:
```bash
redis-cli keys '*'

# Output:
# queue:email_delivery
# queue:email_webhooks
# stat:processed
# stat:failed
# cron_job:email_sender_worker
```

**Inspect queue contents**:
```bash
# Get queue length
redis-cli llen queue:email_delivery

# Peek at first job in queue (without removing)
redis-cli lindex queue:email_delivery 0
```

**Check scheduled jobs**:
```bash
# List scheduled jobs with timestamps
redis-cli zrange schedule 0 -1 WITHSCORES
```

### Rails Console Monitoring

```bash
bundle exec rails console

require 'sidekiq/api'

# Overall stats
stats = Sidekiq::Stats.new
puts "Processed: #{stats.processed}"
puts "Failed: #{stats.failed}"
puts "Enqueued: #{stats.enqueued}"
puts "Scheduled: #{stats.scheduled_size}"
puts "Retries: #{stats.retry_size}"
puts "Dead: #{stats.dead_size}"

# Queue-specific stats
Sidekiq::Queue.all.each do |queue|
  puts "#{queue.name}: #{queue.size} jobs"
end

# Worker stats
workers = Sidekiq::Workers.new
workers.each do |process_id, thread_id, work|
  puts "#{work['payload']['class']} started at #{work['run_at']}"
end

# Scheduled jobs (including cron)
scheduled_set = Sidekiq::ScheduledSet.new
scheduled_set.each do |job|
  puts "#{job.klass} scheduled for #{Time.at(job.at)}"
end

# Failed jobs
retry_set = Sidekiq::RetrySet.new
retry_set.each do |job|
  puts "#{job.klass} failed #{job.retry_count} times, next retry at #{Time.at(job.at)}"
end
```

### Logging

**Sidekiq Logs** (local):
```bash
# Sidekiq outputs to stdout by default
# Run in foreground to see logs:
bundle exec sidekiq

# Or tail log file if you configured one:
tail -f log/sidekiq.log
```

**Rails Logs** (local):
```bash
tail -f log/development.log

# Filter for Sidekiq-related logs:
tail -f log/development.log | grep Sidekiq
```

**Production Logs** (Render):
1. Go to Render Dashboard
2. Click on **Sidekiq Background Worker**
3. Click **Logs** tab
4. Filter by log level or search for specific terms

**Custom Logging in Workers**:
```ruby
class EmailSenderWorker
  include Sidekiq::Job

  def perform
    logger.info "EmailSenderWorker started at #{Time.current}"

    ready_emails = ScheduledEmail.where(...)
    logger.info "Found #{ready_emails.count} emails to send"

    ready_emails.each do |email|
      logger.info "Sending email ##{email.id} to #{email.event.title}"
      send_scheduled_email(email)
    end

    logger.info "EmailSenderWorker completed"
  end
end
```

### Metrics & Alerts

**Track Key Metrics**:
- Queue depth (how many jobs are waiting)
- Processing time (how long jobs take)
- Failure rate (% of failed jobs)
- Retry rate (% of jobs that need retries)
- Dead job count (permanently failed jobs)

**Set Up Alerts** (recommended for production):
- Alert if queue depth > 1000 for 10+ minutes
- Alert if failure rate > 5%
- Alert if dead job count increases
- Alert if Sidekiq process stops

**Example: Check if Sidekiq is Healthy**:
```bash
bundle exec rails runner "
  require 'sidekiq/api'

  # Check if any workers are processing
  workers = Sidekiq::Workers.new
  if workers.size == 0
    puts 'WARNING: No active workers!'
    exit 1
  end

  # Check queue depth
  total_enqueued = Sidekiq::Stats.new.enqueued
  if total_enqueued > 1000
    puts 'WARNING: Queue depth too high!'
    exit 1
  end

  # Check failure rate
  stats = Sidekiq::Stats.new
  failure_rate = stats.failed.to_f / [stats.processed, 1].max
  if failure_rate > 0.05
    puts 'WARNING: Failure rate above 5%!'
    exit 1
  end

  puts 'OK: Sidekiq is healthy'
  exit 0
"
```

---

## Common Issues & Solutions

### Issue 1: Connection Refused

**Error**:
```
RedisClient::CannotConnectError: Connection refused - connect(2) for 127.0.0.1:6379
```

**Cause**: Redis is not running

**Solution**:
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it:
# macOS:
brew services start redis

# Linux:
sudo systemctl start redis-server

# Or run in foreground:
redis-server
```

### Issue 2: Jobs Not Processing

**Symptom**: Jobs sit in queue but never execute

**Possible Causes & Solutions**:

1. **Sidekiq not running**:
```bash
# Check if Sidekiq process is running
ps aux | grep sidekiq

# Start Sidekiq:
bundle exec sidekiq
```

2. **Wrong queue name**:
```ruby
# Worker expects 'email_delivery' queue
class EmailSenderWorker
  sidekiq_options queue: :email_delivery
end

# But job is enqueued to 'default' queue
EmailSenderWorker.perform_async # Goes to 'default' by default

# Solution: Specify queue when enqueuing
EmailSenderWorker.set(queue: :email_delivery).perform_async
# Or rely on sidekiq_options in worker class
```

3. **Sidekiq not listening to the queue**:
```bash
# Check config/sidekiq.yml (if using)
:queues:
  - default
  - email_delivery  # Make sure this is listed
  - email_webhooks

# Or start Sidekiq with specific queues:
bundle exec sidekiq -q email_delivery -q email_webhooks -q default
```

### Issue 3: Cron Jobs Not Running

**Symptom**: Recurring jobs never execute

**Debug**:
```bash
bundle exec rails console

require 'sidekiq-cron'

# Check if cron jobs are loaded
jobs = Sidekiq::Cron::Job.all
puts "Found #{jobs.count} cron jobs"

jobs.each do |job|
  puts "#{job.name}: #{job.status} (next run: #{job.next_enqueue_time})"
end

# If no jobs found, load them:
Sidekiq::Cron::Job.load_from_hash YAML.load_file('config/sidekiq_schedule.yml')

# Manually trigger a cron job to test:
Sidekiq::Cron::Job.find('email_sender_worker').enque!
```

### Issue 4: Jobs Failing Silently

**Symptom**: Jobs disappear from queue but nothing happens

**Debug**:
```bash
bundle exec rails console

require 'sidekiq/api'

# Check dead set for permanently failed jobs
dead_set = Sidekiq::DeadSet.new
puts "Dead jobs: #{dead_set.size}"

dead_set.each do |job|
  puts "Job: #{job.klass}"
  puts "Failed: #{job['failed_at']}"
  puts "Error: #{job['error_message']}"
  puts "Backtrace: #{job['error_backtrace'].first(3).join("\n")}"
  puts "---"
end

# Check retry set for jobs waiting to retry
retry_set = Sidekiq::RetrySet.new
retry_set.each do |job|
  puts "#{job.klass} - Retry #{job.retry_count} at #{Time.at(job.at)}"
end
```

**Common Failures**:
- Missing environment variables (e.g., SENDGRID_API_KEY)
- Database connection issues
- Network timeouts
- Unhandled exceptions in worker code

### Issue 5: Redis Out of Memory

**Error**:
```
OOM command not allowed when used memory > 'maxmemory'
```

**Cause**: Redis has reached max memory limit

**Solution**:

1. **Check memory usage**:
```bash
redis-cli info memory
# used_memory_human:256.00M
# maxmemory_human:256.00M
```

2. **Set eviction policy** (config/initializers/sidekiq.rb):
```ruby
Sidekiq.configure_server do |config|
  config.redis = {
    url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"),
    # Let Redis evict old keys when full
    driver: :ruby
  }
end
```

3. **Clear old data**:
```bash
# Clear dead jobs older than 30 days
bundle exec rails runner "require 'sidekiq/api'; Sidekiq::DeadSet.new.clear"

# Clear processed job stats (resets counters)
bundle exec rails runner "require 'sidekiq/api'; Sidekiq::Stats.new.reset('processed')"
```

4. **Upgrade Redis plan** (production):
- Render: Upgrade from Starter (256MB) to Standard (1GB+)

### Issue 6: Duplicate Job Execution

**Symptom**: Same job runs multiple times

**Causes**:
- Multiple Sidekiq processes running
- Job not properly completing (worker crashes mid-job)
- Cron job scheduling issues

**Solution**:

1. **Check for multiple Sidekiq processes**:
```bash
ps aux | grep sidekiq
# Should only show 1 process (plus grep itself)

# Kill extra processes:
pkill -f sidekiq
bundle exec sidekiq
```

2. **Add uniqueness constraint** (sidekiq-unique-jobs gem):
```ruby
# Gemfile
gem 'sidekiq-unique-jobs'

# Worker
class EmailSenderWorker
  include Sidekiq::Job

  sidekiq_options queue: :email_delivery,
                  retry: 2,
                  lock: :until_executed,  # Prevent duplicate execution
                  on_conflict: :log       # Log if duplicate detected

  def perform
    # ...
  end
end
```

3. **Check cron job status**:
```bash
bundle exec rails runner "
  require 'sidekiq-cron'
  Sidekiq::Cron::Job.all.each do |job|
    puts \"#{job.name}: #{job.status}\"
    # If you see duplicates, destroy them:
    # job.destroy if job.name == 'duplicate_name'
  end
"
```

### Issue 7: Slow Job Processing

**Symptom**: Jobs take too long to process

**Solutions**:

1. **Increase concurrency** (config/sidekiq.yml):
```yaml
:concurrency: 10  # Increase from 5 to 10 threads
```

2. **Optimize worker code**:
```ruby
# Bad: N+1 queries
def perform
  ScheduledEmail.where(...).each do |email|
    email.event.title  # Queries DB for each email!
  end
end

# Good: Eager loading
def perform
  ScheduledEmail.includes(:event).where(...).each do |email|
    email.event.title  # No extra queries
  end
end
```

3. **Use batch processing**:
```ruby
def perform
  # Instead of processing one-by-one
  ScheduledEmail.where(...).find_in_batches(batch_size: 100) do |batch|
    batch.each do |email|
      # Process email
    end
  end
end
```

4. **Add more Sidekiq workers** (production):
- Scale Sidekiq worker service on Render
- Or run multiple Sidekiq processes

---

## Performance Optimization

### 1. Queue Prioritization

Process critical jobs faster than low-priority ones:

```yaml
# config/sidekiq.yml
:queues:
  - [critical, 3]      # Process 3 critical jobs for every 1 default
  - [email_delivery, 2] # Process 2 email jobs for every 1 default
  - [email_webhooks, 2]
  - [default, 1]
```

### 2. Batch Processing

Process multiple items in a single job:

```ruby
class BatchEmailSenderWorker
  include Sidekiq::Job

  def perform(scheduled_email_ids)
    # Process up to 50 emails in one job
    ScheduledEmail.where(id: scheduled_email_ids).find_each do |email|
      send_scheduled_email(email)
    end
  end
end

# Enqueue in batches
ready_emails.in_groups_of(50, false) do |batch|
  BatchEmailSenderWorker.perform_async(batch.map(&:id))
end
```

### 3. Database Connection Pooling

Ensure enough DB connections for Sidekiq threads:

```yaml
# config/database.yml
production:
  pool: <%= ENV.fetch("RAILS_MAX_THREADS", 10) %>
  # Set to at least concurrency + 5
```

```bash
# Set environment variable
export RAILS_MAX_THREADS=15  # If Sidekiq concurrency is 10
```

### 4. Redis Connection Pooling

```ruby
# config/initializers/sidekiq.rb
Sidekiq.configure_server do |config|
  config.redis = {
    url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"),
    size: 12  # Should be concurrency + 2
  }
end

Sidekiq.configure_client do |config|
  config.redis = {
    url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"),
    size: 5   # Fewer connections needed for client
  }
end
```

### 5. Job Timeouts

Prevent jobs from running indefinitely:

```ruby
class EmailSenderWorker
  include Sidekiq::Job

  sidekiq_options queue: :email_delivery,
                  retry: 2,
                  backtrace: true,
                  timeout: 300  # 5 minutes max

  def perform
    # Will be killed if exceeds 5 minutes
  end
end
```

### 6. Memory Management

Reduce memory usage in long-running workers:

```ruby
def perform
  # Bad: Loads all records into memory
  ScheduledEmail.where(...).each do |email|
    process(email)
  end

  # Good: Batch loading with garbage collection
  ScheduledEmail.where(...).find_in_batches(batch_size: 100) do |batch|
    batch.each { |email| process(email) }
    GC.start  # Force garbage collection after each batch
  end
end
```

### 7. Monitoring & Auto-Scaling

**Render Auto-Scaling** (Enterprise plan):
```yaml
# render.yaml
services:
  - type: worker
    name: voxxy-sidekiq
    autoscaling:
      enabled: true
      minInstances: 1
      maxInstances: 5
      targetCPUPercent: 70
```

**Manual Scaling Based on Queue Depth**:
```ruby
# Check queue depth and scale accordingly
stats = Sidekiq::Stats.new
if stats.enqueued > 1000
  # Alert ops team to scale up
  # Or programmatically scale via Render API
end
```

---

## Advanced Topics

### Sidekiq Enterprise Features

If you need more features, consider [Sidekiq Enterprise](https://sidekiq.org/) ($1799/year):
- **Rate Limiting**: Throttle job execution
- **Unique Jobs**: Built-in deduplication
- **Rolling Restarts**: Zero-downtime deploys
- **Periodic Jobs**: More flexible than cron
- **Batches**: Coordinated batch processing with callbacks
- **Leader Election**: Run singleton jobs across multiple workers

### Alternative Job Backends

If Redis doesn't meet your needs:
- **PostgreSQL**: Use `good_job` gem (stores jobs in Postgres)
- **MySQL**: Use `delayed_job` gem
- **AWS SQS**: Use `shoryuken` gem
- **Google Cloud Tasks**: Use `cloudtasker` gem

---

## Quick Reference

### Common Commands

```bash
# Redis
redis-cli ping                    # Check if running
redis-cli info                    # Server info
redis-cli keys '*'                # List all keys
redis-cli flushall                # Clear all data (DANGER!)

# Sidekiq
bundle exec sidekiq               # Start Sidekiq
bundle exec sidekiq -q critical,3 -q default,1  # With queue weights
bundle exec sidekiq -C config/sidekiq.yml       # With config file

# Rails Console
bundle exec rails console

# Enqueue job
MyWorker.perform_async(arg1, arg2)
MyWorker.perform_in(1.hour, arg1)
MyWorker.perform_at(5.minutes.from_now, arg1)

# Queue stats
require 'sidekiq/api'
Sidekiq::Queue.new('default').size
Sidekiq::Stats.new.enqueued

# Cron jobs
require 'sidekiq-cron'
Sidekiq::Cron::Job.all
Sidekiq::Cron::Job.find('job_name').enque!
Sidekiq::Cron::Job.destroy('job_name')

# Clear queues
Sidekiq::Queue.new('default').clear
Sidekiq::RetrySet.new.clear
Sidekiq::DeadSet.new.clear
```

### Environment Variables

```bash
# Local (.env)
REDIS_URL=redis://localhost:6379/0

# Production (Render)
REDIS_URL=redis://red-xxxxx:6379
RAILS_ENV=production
RAILS_MAX_THREADS=15
```

### File Locations

```
config/
  initializers/
    sidekiq.rb              # Sidekiq configuration
  sidekiq_schedule.yml      # Cron job definitions
  sidekiq.yml               # Queue configuration (optional)
  routes.rb                 # Mount Sidekiq web UI

app/
  workers/                  # Sidekiq worker classes
    email_sender_worker.rb
    email_delivery_processor_job.rb
    email_retry_job.rb
    email_retry_scanner_job.rb

Gemfile                     # Sidekiq gems
```

---

## Next Steps

1. **Monitor Production**: Set up Sidekiq Web UI and check regularly
2. **Set Up Alerts**: Configure alerts for queue depth, failures
3. **Optimize Workers**: Profile slow workers and optimize
4. **Scale as Needed**: Upgrade Redis/Sidekiq plans when traffic grows
5. **Document Runbooks**: Create playbooks for common issues

---

For more information:
- [Sidekiq Documentation](https://github.com/sidekiq/sidekiq/wiki)
- [Sidekiq-Cron](https://github.com/sidekiq-cron/sidekiq-cron)
- [Redis Documentation](https://redis.io/docs/)
- [Render Redis Guide](https://render.com/docs/redis)
