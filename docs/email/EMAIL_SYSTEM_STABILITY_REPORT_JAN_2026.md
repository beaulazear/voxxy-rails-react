# Email System Stability Report - January 2026

**Date:** January 28, 2026
**Deadline:** February 3, 2026 (6 days)
**Status:** ⚠️ MODERATE RISK - Stabilization Required
**Prepared for:** Technical Lead Review

---

## Executive Summary

The email automation system is **functionally operational** but shows signs of **architectural fragility** with multiple bug fixes in the past 2 weeks. The system will likely work for Feb 3rd with targeted stabilization.

### Key Findings

✅ **Strengths:**
- Core architecture is sound (Sidekiq + SendGrid + webhook tracking)
- Good documentation exists
- Recent fixes show active maintenance
- Production logs show successful sends

⚠️ **Critical Risks:**
- Category-based routing code added Jan 27 (untested in production)
- Code duplication between InvitationReminderService and EmailSenderService
- Zero automated tests for critical services
- No observability/monitoring layer
- Complex filtering logic with silent failure modes

### Confidence Assessment

| Scenario | Confidence | Notes |
|----------|------------|-------|
| **Current state (no changes)** | 75% | Recent bugs fixed, but fragile |
| **With Quick Wins implemented** | 85% | Error handling + logging improved |
| **With monitoring added** | 90% | Proactive detection + alerts |
| **With comprehensive testing** | 95% | All edge cases validated |

### Recommendation

**PATCH & MONITOR** (not redesign). Implement quick wins, add monitoring, and test thoroughly. Redesign can wait until after Feb 3rd.

---

## System Architecture Overview

### Email Flow

```
1. EVENT CREATED
   └─> Auto-generates 7 scheduled emails (EmailCampaignTemplate seeds)

2. SIDEKIQ CRON JOB (every 5 minutes)
   └─> EmailSenderWorker checks for emails where scheduled_for <= now

3. CATEGORY-BASED ROUTING ⚠️ NEW CODE (Jan 27, 2026)
   ├─> If category == "event_announcements"
   │   └─> InvitationReminderService (sends to invited vendor contacts)
   └─> Else
       └─> EmailSenderService (sends to registrations)

4. RECIPIENT FILTERING
   ├─> RecipientFilterService (for registrations)
   │   └─> Filters by status, payment, unsubscribe
   └─> InvitationReminderService filtering (for invitations)
       └─> Excludes applied vendors, unsubscribed contacts

5. VARIABLE RESOLUTION
   ├─> EmailVariableResolver (for registration emails)
   └─> InvitationVariableResolver (for invitation emails)

6. SENDGRID SEND
   └─> Direct SendGrid Web API call (duplicated in both services)

7. WEBHOOK TRACKING
   └─> EmailDeliveryProcessorJob updates delivery status
       └─> 3-tier lookup strategy (by message_id, then email+timestamp, then create)
```

### Component Dependencies

```
app/workers/
  ├── email_sender_worker.rb              (Entry point - Sidekiq cron)
  ├── email_delivery_processor_job.rb     (Webhook handler)
  └── email_retry_job.rb                  (Soft bounce retry)

app/services/
  ├── email_sender_service.rb             (Sends to registrations)
  ├── invitation_reminder_service.rb      (Sends to invited contacts) ⚠️ NEW
  ├── recipient_filter_service.rb         (Filters registrations)
  ├── email_variable_resolver.rb          (Resolves template variables)
  ├── invitation_variable_resolver.rb     (Resolves invitation variables) ⚠️ NEW
  └── base_email_service.rb               (Shared constants/utilities)

app/models/
  ├── scheduled_email.rb                  (Email instances per event)
  ├── email_template_item.rb              (Email definitions with category)
  ├── email_campaign_template.rb          (Template container)
  ├── email_delivery.rb                   (SendGrid delivery tracking)
  └── email_unsubscribe.rb                (Unsubscribe management)
```

---

## Critical Issues Analysis

### Issue #1: Brand New Routing Code (HIGH RISK)

**Location:** `app/workers/email_sender_worker.rb:65-73`

**Added:** January 27, 2026 (yesterday)

**Code:**
```ruby
category = scheduled_email.email_template_item&.category

service = if category == "event_announcements"
  InvitationReminderService.new(scheduled_email)
else
  EmailSenderService.new(scheduled_email)
end
```

**Risks:**
- ❌ No production testing yet
- ❌ String matching fragile (`"event_announcements"` vs `"event_announcement"`)
- ❌ Nil category defaults to EmailSenderService (silent failure)
- ❌ Wrong service = wrong recipients = confused users

**Recent Bug Pattern:**
```
Commit 2b62bf3e (Jan 27): "add fix for send email class method"
  - InvitationReminderService originally called send_email() class method
  - Method didn't exist (inheritance removed)
  - Fixed by duplicating send_via_sendgrid code

Commit d22799f4 (Jan 26): "Fix recipient count calculation routing"
  - Recipient count logic was broken

Commit 17a53820 (Jan 24): "Add invitation recipient service"
  - Original implementation of InvitationReminderService
```

**Impact:** 3 commits in 4 days suggests unstable, evolving code.

---

### Issue #2: Code Duplication (MEDIUM-HIGH RISK)

**Files:**
- `app/services/invitation_reminder_service.rb:113-162` (87 lines)
- `app/services/email_sender_service.rb:97-146` (87 lines)

**Problem:** Nearly identical `send_via_sendgrid()` methods in both services.

**Example:**
```ruby
# Both services have this exact code
def send_via_sendgrid(recipient_email, subject, content_html, additional_headers = {})
  sg = SendGrid::API.new(api_key: ENV.fetch("VoxxyKeyAPI"))
  from = SendGrid::Email.new(email: "noreply@voxxypresents.com", name: organization.name)
  # ... 80+ lines of identical code
end
```

**Risk:** Bug fix in one service doesn't propagate to the other.

**Evidence:** SSL certificate bug (Jan 26) required fixing both services.

**Solution (Post-Feb 3):** Extract to BaseEmailService or shared module.

---

### Issue #3: Silent Failures in Filtering (MEDIUM RISK)

**Location:** `app/services/invitation_reminder_service.rb:59-85`

**Problem:** Complex filtering with multiple rejection criteria:

```ruby
invitations.reject do |invitation|
  vendor_contact = invitation.vendor_contact

  # Could raise NoMethodError if vendor_contact is nil
  next true if vendor_contact.email_unsubscribed?

  # Database query inside loop (N+1)
  EmailUnsubscribe.unsubscribed_from_event?(vendor_contact.email, event)
end

# Exclude already-applied vendors
registered_emails = event.registrations.pluck(:email).compact.map(&:downcase)
invitations = invitations.joins(:vendor_contact)
  .where.not("LOWER(vendor_contacts.email) IN (?)", registered_emails)
```

**Risks:**
- ❌ `vendor_contact` could be nil → NoMethodError
- ❌ N+1 queries if many invitations
- ❌ Case-sensitivity confusion (downcase in some places, not others)
- ❌ If all filtered out → email marked "sent" with 0 recipients (no error)
- ❌ Database query timeout could fail entire send

**Recent Fix (Jan 27):** Email matching logic was broken, fixed with case-insensitive comparison.

---

### Issue #4: Webhook Race Conditions (MEDIUM RISK)

**Location:** `app/workers/email_delivery_processor_job.rb:18-49`

**Problem:** 3-tier lookup strategy is complex:

```ruby
# Tier 1: Fast path
delivery = EmailDelivery.find_by(sendgrid_message_id: message_id)

# Tier 2: Fallback (1 hour window)
delivery = EmailDelivery.find_by(
  recipient_email: email,
  event_invitation_id: invitation_id,
  created_at: (Time.current - 1.hour)..Time.current
)

# Tier 3: Create on-the-fly using custom args
delivery = EmailDelivery.create!(...)
```

**Risks:**
- ⚠️ Webhook arrives before EmailDelivery created → falls to Tier 2
- ⚠️ Webhook fires twice → duplicate records possible
- ⚠️ Server time drift → 1-hour window might miss records
- ⚠️ SendGrid message ID format changes → Tier 1 always fails

**Recent Fix (Jan 23):** Added invitation delivery tracking (was missing for 95% of invitations).

---

### Issue #5: No Automated Tests (HIGH RISK)

**Test Coverage Analysis:**

✅ **What's Tested:**
- Model specs exist (ScheduledEmail, EmailDelivery, etc.)
- Some service specs (BaseEmailService, URL integration)

❌ **What's NOT Tested:**
- `InvitationReminderService` - **ZERO TESTS** (brand new code!)
- `EmailSenderService` - **ZERO TESTS** (core logic!)
- `RecipientFilterService` - **ZERO TESTS** (complex filtering!)
- `EmailVariableResolver` - **ZERO TESTS**
- `EmailSenderWorker` - **ZERO TESTS** (entry point!)
- `EmailDeliveryProcessorJob` - **ZERO TESTS** (webhook handler!)

❌ **No Integration Tests:**
- Complete flow (worker → service → SendGrid → webhook)
- Category routing logic
- Edge cases (0 recipients, all filtered, nil values)

**Manual Test Scripts Exist (not automated):**
```
test_email_automation_complete.rb
test_email_invitation.rb
test_email_system_no_redis.rb
```

These are in project root, not `/spec`, so RSpec doesn't run them.

---

### Issue #6: No Monitoring/Observability (CRITICAL)

**Current State:**
- ❌ No alerts when emails fail
- ❌ No dashboard for email health
- ❌ Producer has no visibility into failures
- ❌ Developer must check logs manually
- ❌ Failures discovered by users, not system

**Only Monitoring:**
- Rails logs (requires manual checking)
- Sidekiq dashboard (shows job failures, not email failures)
- SendGrid dashboard (external, not integrated)

**Gap:** Email can fail but marked as "sent" → silent failure.

**Example:**
```ruby
# If all recipients filtered out
if recipients.empty?
  return { sent: 0, failed: 0 }
end

# Scheduled email still marked "sent" later
scheduled_email.update!(status: "sent", recipient_count: 0)
```

Producer thinks email sent successfully, but 0 people received it.

---

## Quick Wins (Immediate Fixes)

### Quick Win #1: Add Nil Checks to Routing Logic

**File:** `app/workers/email_sender_worker.rb`

**Effort:** 5 minutes
**Impact:** Prevents silent routing failures

```ruby
# AFTER LINE 64
if scheduled_email.email_template_item.nil?
  Rails.logger.error("❌ EMAIL FAILURE: Scheduled email ##{scheduled_email.id} has no email_template_item!")
  scheduled_email.update!(
    status: "failed",
    error_message: "Missing email_template_item - cannot determine routing"
  )
  next
end

category = scheduled_email.email_template_item.category

if category.blank?
  Rails.logger.error("❌ EMAIL FAILURE: Email template item ##{scheduled_email.email_template_item.id} has blank category!")
  scheduled_email.update!(
    status: "failed",
    error_message: "Email template category is blank - cannot route"
  )
  next
end
```

---

### Quick Win #2: Add Recipient Count Warnings

**File:** `app/services/invitation_reminder_service.rb:17-19`

**Effort:** 10 minutes
**Impact:** Better debugging, clearer status

```ruby
# REPLACE LINES 17-19
if recipients.empty?
  Rails.logger.warn("⚠️  ZERO RECIPIENTS for scheduled email ##{scheduled_email.id}")
  Rails.logger.warn("    Event: #{event.title} (ID: #{event.id})")
  Rails.logger.warn("    Category: #{scheduled_email.email_template_item&.category}")
  Rails.logger.warn("    Total invitations: #{event.event_invitations.count}")
  Rails.logger.warn("    Registered emails: #{event.registrations.count}")
  Rails.logger.warn("    Filtered out: #{event.event_invitations.count - recipients.count}")

  scheduled_email.update!(
    status: "sent",  # Not a failure, just no recipients
    sent_at: Time.current,
    recipient_count: 0,
    error_message: "No recipients matched filter criteria (#{event.event_invitations.count} invitations, #{event.registrations.count} already registered)"
  )

  return { sent: 0, failed: 0 }
end
```

---

### Quick Win #3: Improve Error Logging

**File:** `app/services/invitation_reminder_service.rb:42-45`

**Effort:** 5 minutes
**Impact:** Easier debugging

```ruby
# REPLACE LINES 42-45
rescue => e
  last_error = e.message
  Rails.logger.error("❌ SEND FAILURE: Email to #{recipient_email} failed")
  Rails.logger.error("    Error: #{e.class.name} - #{e.message}")
  Rails.logger.error("    Backtrace: #{e.backtrace.first(3).join("\n    ")}")
  Rails.logger.error("    Scheduled Email: ##{scheduled_email.id}")
  Rails.logger.error("    Event: #{event.title} (##{event.id})")
  failed_count += 1
end
```

---

### Quick Win #4: Add Validation to Seeds

**File:** `db/seeds/email_campaign_templates.rb`

**Effort:** 5 minutes
**Impact:** Catches seed data bugs before production

```ruby
# ADD AT END OF FILE (after all creates)
puts "\n=== Validating Email Template Data ==="

template = EmailCampaignTemplate.find_by(name: "Standard Event Communication Sequence")

if template.nil?
  raise "❌ SEED ERROR: Standard template not found!"
end

# Validate categories
event_announcements = template.email_template_items.where(category: "event_announcements")
vendor_emails = template.email_template_items.where(category: "vendor_emails")

puts "Event Announcements: #{event_announcements.count} (expected: 2)"
puts "Vendor Emails: #{vendor_emails.count} (expected: 5)"

if event_announcements.count != 2
  raise "❌ SEED ERROR: Expected 2 event_announcement emails, got #{event_announcements.count}"
end

if vendor_emails.count != 5
  raise "❌ SEED ERROR: Expected 5 vendor_emails, got #{vendor_emails.count}"
end

# Validate trigger types
template.email_template_items.each do |item|
  if item.trigger_type.blank?
    raise "❌ SEED ERROR: Email '#{item.name}' has blank trigger_type"
  end

  if item.category.blank?
    raise "❌ SEED ERROR: Email '#{item.name}' has blank category"
  end
end

puts "✓ All email templates validated successfully"
```

---

### Quick Win #5: Add Delivery Record Validation

**File:** `app/services/invitation_reminder_service.rb:175-187`

**Effort:** 5 minutes
**Impact:** Failed tracking = failed email (don't mark as sent)

```ruby
# REPLACE LINES 175-187
begin
  delivery = EmailDelivery.create!(
    recipient_email: recipient_email,
    event_invitation_id: invitation.id,
    scheduled_email_id: scheduled_email.id,
    sendgrid_message_id: message_id,
    status: "sent"
  )
  Rails.logger.info("✓ Created EmailDelivery record ##{delivery.id} for #{recipient_email}")

rescue ActiveRecord::RecordInvalid => e
  Rails.logger.error("❌ CRITICAL: Failed to create EmailDelivery record for #{recipient_email}")
  Rails.logger.error("    Error: #{e.message}")
  Rails.logger.error("    This email should NOT be marked as sent!")

  # Re-raise so email is marked failed, not sent
  raise
end
```

---

## Monitoring & Observability Recommendations

### Current Gap

**Problem:** System has no way to proactively detect email failures. Developers and producers only discover issues when users report them.

**Required Capabilities:**
1. **Real-time alerting** when emails fail
2. **Dashboard** showing email health metrics
3. **Daily digest** for producers showing what sent/failed
4. **Scheduled monitoring** checking for stuck emails

---

### Solution 1: Email Health Monitoring Rake Task

**File:** Create `lib/tasks/email_monitoring.rake`

**Purpose:** Detect stuck, failed, or suspicious emails

**Usage:**
- Run manually: `bundle exec rake email:monitor`
- Run hourly in production: Add to cron or Heroku Scheduler

```ruby
namespace :email do
  desc "Monitor email system health and alert on failures"
  task monitor: :environment do
    puts "\n=== Email System Health Check ==="
    puts "Time: #{Time.current}"

    alerts = []
    warnings = []

    # CHECK 1: Overdue emails (scheduled but not sent)
    overdue_window = 15.minutes.ago
    overdue = ScheduledEmail.where(status: "scheduled")
      .where("scheduled_for < ?", overdue_window)
      .where(enabled: true)

    if overdue.any?
      alerts << "❌ CRITICAL: #{overdue.count} emails are OVERDUE!"
      overdue.limit(10).each do |email|
        alerts << "  - Email ##{email.id}: #{email.name}"
        alerts << "    Scheduled: #{email.scheduled_for.strftime('%Y-%m-%d %H:%M')}"
        alerts << "    Event: #{email.event&.title} (##{email.event_id})"
        alerts << "    Category: #{email.email_template_item&.category || 'UNKNOWN'}"
      end
    end

    # CHECK 2: Recently failed emails
    failed = ScheduledEmail.where(status: "failed")
      .where("updated_at > ?", 1.day.ago)

    if failed.any?
      alerts << "❌ ERROR: #{failed.count} emails FAILED in last 24 hours!"
      failed.limit(10).each do |email|
        alerts << "  - Email ##{email.id}: #{email.name}"
        alerts << "    Error: #{email.error_message}"
        alerts << "    Event: #{email.event&.title} (##{email.event_id})"
        alerts << "    Failed at: #{email.updated_at.strftime('%Y-%m-%d %H:%M')}"
      end
    end

    # CHECK 3: Emails sent to zero recipients
    zero_recipients = ScheduledEmail.where(status: "sent", recipient_count: 0)
      .where("sent_at > ?", 1.day.ago)

    if zero_recipients.any?
      warnings << "⚠️  WARNING: #{zero_recipients.count} emails sent to 0 recipients!"
      zero_recipients.limit(5).each do |email|
        warnings << "  - Email ##{email.id}: #{email.name}"
        warnings << "    Event: #{email.event&.title}"
        warnings << "    Reason: #{email.error_message || 'No error message recorded'}"
      end
    end

    # CHECK 4: High failure rate for recent sends
    recent_sent = ScheduledEmail.where(status: "sent")
      .where("sent_at > ?", 1.hour.ago)

    if recent_sent.any?
      total_sent = recent_sent.sum(:sent_count)
      total_failed = recent_sent.sum(:failed_count)
      total_emails = total_sent + total_failed

      if total_emails > 0
        failure_rate = (total_failed.to_f / total_emails * 100).round(1)

        if failure_rate > 10
          alerts << "❌ HIGH FAILURE RATE: #{failure_rate}% of emails failed in last hour"
          alerts << "    Total sent: #{total_sent}, Failed: #{total_failed}"
        elsif failure_rate > 5
          warnings << "⚠️  Elevated failure rate: #{failure_rate}% in last hour"
        end
      end
    end

    # CHECK 5: Sidekiq queue health
    if defined?(Sidekiq)
      email_queue_size = Sidekiq::Queue.new('email_delivery').size

      if email_queue_size > 100
        alerts << "❌ Email queue backed up: #{email_queue_size} jobs waiting"
      elsif email_queue_size > 50
        warnings << "⚠️  Email queue elevated: #{email_queue_size} jobs"
      end

      # Check for dead jobs
      dead_set = Sidekiq::DeadSet.new
      dead_email_jobs = dead_set.select { |job| job.klass == 'EmailSenderWorker' }

      if dead_email_jobs.any?
        alerts << "❌ DEAD EMAIL JOBS: #{dead_email_jobs.count} permanently failed"
      end
    end

    # OUTPUT RESULTS
    if alerts.empty? && warnings.empty?
      puts "✓ All systems healthy"
      puts "  - No overdue emails"
      puts "  - No recent failures"
      puts "  - No zero-recipient sends"
      exit 0
    end

    # Print warnings
    if warnings.any?
      puts "\n⚠️  WARNINGS:"
      warnings.each { |w| puts w }
    end

    # Print alerts
    if alerts.any?
      puts "\n❌ ALERTS:"
      alerts.each { |a| puts a }

      # Send email alert to developers
      if Rails.env.production?
        send_alert_email(alerts)
      end

      exit 1  # Non-zero exit code for alerting systems
    end
  end

  # Helper to send alert emails
  def send_alert_email(alerts)
    # TODO: Implement using ActionMailer or SendGrid
    # For now, just log
    Rails.logger.error("EMAIL SYSTEM ALERTS:\n#{alerts.join("\n")}")
  end
end
```

**Setup:**
```bash
# Heroku Scheduler (hourly)
bundle exec rake email:monitor

# Cron (every 30 minutes)
*/30 * * * * cd /app && bundle exec rake email:monitor
```

---

### Solution 2: Producer Daily Digest Email

**Purpose:** Send daily summary to event producers showing email activity

**File:** Create `app/services/email_digest_service.rb`

```ruby
class EmailDigestService
  def self.send_daily_digest(organization)
    events = organization.events.where("event_date >= ?", Date.today)

    # Collect stats from yesterday
    yesterday_start = 1.day.ago.beginning_of_day
    yesterday_end = 1.day.ago.end_of_day

    stats = {
      sent: 0,
      failed: 0,
      recipients: 0,
      emails: []
    }

    events.each do |event|
      event.scheduled_emails.where(sent_at: yesterday_start..yesterday_end).each do |email|
        stats[:sent] += 1 if email.status == "sent"
        stats[:failed] += 1 if email.status == "failed"
        stats[:recipients] += email.recipient_count

        stats[:emails] << {
          event: event.title,
          name: email.name,
          status: email.status,
          recipients: email.recipient_count,
          sent_at: email.sent_at,
          error: email.error_message
        }
      end
    end

    # Send digest email
    if stats[:emails].any?
      ProducerMailer.daily_email_digest(organization.user, stats).deliver_later
    end
  end

  # Run for all organizations
  def self.send_all_digests
    Organization.find_each do |org|
      send_daily_digest(org)
    end
  end
end
```

**Rake Task:**
```ruby
# lib/tasks/email_monitoring.rake
namespace :email do
  desc "Send daily digest to all producers"
  task send_digests: :environment do
    EmailDigestService.send_all_digests
    puts "✓ Sent daily digests to all producers"
  end
end
```

**Schedule:** Run daily at 8am
```bash
# Heroku Scheduler (daily at 8am)
bundle exec rake email:send_digests
```

---

### Solution 3: Third-Party Monitoring Tools

#### Option A: Sentry (Recommended for Feb 3rd)

**Purpose:** Error tracking + alerting
**Cost:** Free tier (5k events/month) or $26/month
**Setup Time:** 15 minutes

**Setup:**
```ruby
# Gemfile
gem 'sentry-ruby'
gem 'sentry-rails'
gem 'sentry-sidekiq'

# config/initializers/sentry.rb
Sentry.init do |config|
  config.dsn = ENV['SENTRY_DSN']
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]
  config.traces_sample_rate = 0.1  # 10% performance monitoring

  # Email-specific error filtering
  config.before_send = lambda do |event, hint|
    # Tag email-related errors
    if event.transaction&.include?('Email') ||
       event.exception&.values&.any? { |e| e.type&.include?('Email') }
      event.tags[:component] = 'email_system'
      event.tags[:priority] = 'high'
    end
    event
  end
end
```

**Benefits:**
- ✅ Automatic error capture
- ✅ Slack/email alerts
- ✅ Error grouping and trends
- ✅ Release tracking
- ✅ Performance monitoring

**Alert Rules:**
```
Rule: Email System Errors
Conditions:
  - event.tags.component = "email_system"
  - error count > 5 in 1 hour
Actions:
  - Send Slack message to #alerts
  - Send email to tech-lead@company.com
```

---

#### Option B: Honeybadger

**Purpose:** Error + uptime + check-in monitoring
**Cost:** $39/month (first month free)
**Setup Time:** 20 minutes

**Setup:**
```ruby
# Gemfile
gem 'honeybadger'

# config/honeybadger.yml
api_key: <%= ENV['HONEYBADGER_API_KEY'] %>
env: <%= Rails.env %>

# Uptime monitoring (external)
# Add uptime check: https://app.honeybadger.io/check_ins
```

**Benefits:**
- ✅ Error tracking (like Sentry)
- ✅ Uptime monitoring (external HTTP checks)
- ✅ Check-in monitoring (periodic task verification)
- ✅ Slack integration

**Check-In Example:**
```ruby
# app/workers/email_sender_worker.rb
def perform
  Honeybadger.check_in('email-sender-worker')  # Notify Honeybadger we ran

  # ... email sending logic

  Honeybadger.check_in('email-sender-worker')  # Notify success
end
```

**Honeybadger Dashboard:**
```
Check-In: email-sender-worker
  Expected: Every 5 minutes
  Alert if: Missing for 15 minutes
  Action: Slack alert to #alerts
```

---

#### Option C: Better Uptime (Uptime Monitoring Only)

**Purpose:** External monitoring + status page
**Cost:** Free tier (10 monitors) or $18/month
**Setup Time:** 10 minutes

**Setup:**
1. Create monitors:
   - `GET https://app.voxxypresents.com/health` - General health
   - `GET https://app.voxxypresents.com/api/v1/health/email` - Email system health

2. Set alert thresholds:
   - Alert after 2 failed checks (10 minutes)
   - Send Slack + email alerts

**Health Endpoint:**
```ruby
# config/routes.rb
get '/api/v1/health/email', to: 'health#email'

# app/controllers/health_controller.rb
class HealthController < ApplicationController
  def email
    # Check for overdue emails
    overdue = ScheduledEmail.where(status: "scheduled")
      .where("scheduled_for < ?", 15.minutes.ago)
      .count

    # Check for recent failures
    failed = ScheduledEmail.where(status: "failed")
      .where("updated_at > ?", 1.hour.ago)
      .count

    if overdue > 0 || failed > 0
      render json: {
        status: "unhealthy",
        overdue_emails: overdue,
        recent_failures: failed
      }, status: 500
    else
      render json: { status: "healthy" }, status: 200
    end
  end
end
```

---

#### Option D: LogDNA / Papertrail (Log Aggregation)

**Purpose:** Centralized log search + alerting
**Cost:** Free tier or $25/month
**Setup Time:** 30 minutes

**Benefits:**
- ✅ Search all logs in one place
- ✅ Alert on log patterns
- ✅ Log retention (7-30 days)
- ✅ Real-time log tailing

**Alert Example:**
```
Pattern: "❌ EMAIL FAILURE"
Condition: Appears more than 5 times in 1 hour
Action: Send Slack alert
```

---

### Recommended Monitoring Stack (For Feb 3rd)

**Minimum (Free):**
1. **Sentry** (free tier) - Error tracking
2. **Email health rake task** (custom) - Run hourly via Heroku Scheduler
3. **Better Uptime** (free tier) - External uptime checks

**Ideal ($100/month):**
1. **Sentry Pro** ($26/month) - Error tracking + performance
2. **Honeybadger** ($39/month) - Check-in monitoring
3. **Better Uptime** ($18/month) - Uptime + status page
4. **LogDNA** ($25/month) - Log aggregation
5. **Email health rake task** (custom) - Free

**Total Setup Time:** 1-2 hours

---

## Risk Timeline & Mitigation

### January 28 (Today) - Stabilization Day

**Priority:** HIGH
**Goal:** Implement quick wins + add basic monitoring

**Tasks:**
- [ ] Implement Quick Wins #1-5 (1 hour)
- [ ] Deploy to staging
- [ ] Set up Sentry (15 minutes)
- [ ] Create email health rake task (30 minutes)
- [ ] Run manual tests

**Deliverables:**
- Better error handling
- Nil checks on routing
- Basic monitoring in place

---

### January 29-30 - Testing Phase

**Priority:** CRITICAL
**Goal:** Validate all email scenarios work

**Tasks:**
- [ ] Run comprehensive test plan (see next section)
- [ ] Test all 7 email types
- [ ] Test edge cases (0 recipients, etc.)
- [ ] Verify webhook tracking
- [ ] Monitor Sentry for errors
- [ ] Fix any issues found

**Deliverables:**
- High confidence system works
- All edge cases tested
- Known issues documented

---

### January 31 - February 2 - Monitoring Phase

**Priority:** MEDIUM
**Goal:** Watch production, fix issues proactively

**Tasks:**
- [ ] Run email health check hourly
- [ ] Monitor Sentry dashboard
- [ ] Check Sidekiq queue sizes
- [ ] Review SendGrid dashboard
- [ ] Keep developers on call

**Deliverables:**
- Proactive issue detection
- Fast response to problems

---

### February 3 - Event Day

**Priority:** CRITICAL
**Goal:** Ensure emails send successfully

**Tasks:**
- [ ] Monitor continuously (every hour)
- [ ] Check email health dashboard
- [ ] Have manual sending script ready
- [ ] Be ready to disable automation if needed

**Backup Plan:**
```ruby
# Manual send script (if automation fails)
event = Event.find_by(slug: "event-slug")
email = event.scheduled_emails.find_by(name: "Payment Deadline - Day Of")

service = EmailSenderService.new(email)
result = service.send_to_recipients

puts "Sent: #{result[:sent]}, Failed: #{result[:failed]}"
```

---

## Summary

### Current Risk: ⚠️ MODERATE

**Will it work on Feb 3rd?** Probably (75% confidence without changes, 90% with fixes + monitoring)

### Critical Success Factors

1. ✅ Implement Quick Wins (especially nil checks)
2. ✅ Add monitoring (Sentry + health checks)
3. ✅ Test thoroughly (comprehensive test plan)
4. ✅ Have backup plan ready

### Post-Feb 3rd Recommendations

1. **Add automated tests** for all critical services
2. **Consolidate duplicated code** (extract to BaseEmailService)
3. **Improve routing logic** (move to model, eliminate string matching)
4. **Add producer UI** for manual email sends
5. **Implement daily digest emails** for producers

### Questions for Technical Lead

1. Which monitoring tools do we have budget for?
2. Who will be on-call Feb 1-3?
3. Do we have a staging environment for testing?
4. Can we get early access to production data for testing?
5. What's the rollback plan if automation fails?

---

**Prepared by:** Engineering Team
**Date:** January 28, 2026
**Next Review:** January 29, 2026 (post-testing)
