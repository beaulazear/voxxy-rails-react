# Admin Scripts Documentation

This guide documents all administrative scripts for managing the Voxxy Presents platform during production operations. These scripts are designed for manual intervention during critical situations, particularly around go-live and ongoing event management.

## 📁 Script Locations

All scripts are located in: `lib/scripts/`

- `email_retry.rb` - Retry failed email deliveries
- `data_backup.rb` - Backup and restore event data
- `spam_resend.rb` - Resend emails that went to spam

## 🔒 Safety & Environment

### Production Safety

All scripts include a safety check that prevents accidental execution in production without explicit permission:

```bash
# To run scripts in production, you MUST set this environment variable:
export ALLOW_PRODUCTION_SCRIPTS=true
```

### Testing in Staging

Scripts can be run freely in staging environment without the safety flag. Always test in staging before running in production!

### Confirmation Prompts

Most scripts that modify data or send emails will ask for confirmation:
```
⚠️  WARNING: This will send 50 emails!
Type 'yes' to continue:
```

Type exactly `yes` (lowercase) to proceed.

---

## 📧 Email Retry Script

**Purpose:** Manually retry failed email deliveries for specific events or recipients.

**File:** `lib/scripts/email_retry.rb`

### When to Use

- After a SendGrid outage or configuration error
- When emails bounced due to temporary issues
- When you've fixed an email template issue and need to resend
- After resolving domain reputation issues

### Basic Usage

```bash
# Always test with dry-run first!
rails runner lib/scripts/email_retry.rb --event=EVENT_SLUG --status=failed --dry-run

# Remove --dry-run to actually send
rails runner lib/scripts/email_retry.rb --event=EVENT_SLUG --status=failed
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--event=SLUG` | Event slug (required) | `--event=summer-market-2026` |
| `--emails=LIST` | Specific email addresses (comma-separated) | `--emails=user1@example.com,user2@example.com` |
| `--status=STATUS` | Filter by delivery status | `--status=bounced` or `--status=bounced,dropped` |
| `--type=TYPE` | Filter by email type | `--type=invitation` or `--type=scheduled` |
| `--dry-run` | Preview without sending | `--dry-run` |

### Valid Status Values

- `bounced` - Emails that bounced
- `dropped` - Emails dropped by SendGrid
- `failed` - Shorthand for bounced + dropped

### Valid Type Values

- `invitation` - Only invitation emails
- `scheduled` - Only scheduled campaign emails
- `all` - All email types (default)

### Common Scenarios

#### 1. Retry All Failed Invitations After Go-Live Issue

```bash
# Preview first
rails runner lib/scripts/email_retry.rb \
  --event=summer-market-2026 \
  --type=invitation \
  --status=failed \
  --dry-run

# If looks good, run for real
rails runner lib/scripts/email_retry.rb \
  --event=summer-market-2026 \
  --type=invitation \
  --status=failed
```

#### 2. Retry Specific Email Addresses Reported by User

```bash
rails runner lib/scripts/email_retry.rb \
  --event=summer-market-2026 \
  --emails=vendor1@example.com,vendor2@example.com
```

#### 3. Retry All Soft Bounces After Fixing Issue

```bash
rails runner lib/scripts/email_retry.rb \
  --event=summer-market-2026 \
  --status=bounced
```

### Output Example

```
================================================================================
EMAIL RETRY SCRIPT
================================================================================
Event: Summer Market 2026 (summer-market-2026)
Mode: DRY RUN (no emails will be sent)
================================================================================

📧 Found 15 email deliveries to retry:

By Status:
  bounced: 10
  dropped: 5

By Type:
  Invitation emails: 12
  Scheduled emails: 3

Sample Recipients:
  - vendor1@example.com (bounced, invitation)
  - vendor2@example.com (dropped, invitation)
  ... and 13 more

[1/15] vendor1@example.com (invitation)... would retry
[2/15] vendor2@example.com (invitation)... would retry
...

================================================================================
RESULTS
================================================================================
✅ Successfully retried: 15
❌ Failed: 0
⚠️  Skipped: 0
================================================================================
```

---

## 💾 Data Backup Script

**Purpose:** Export event data to JSON files for disaster recovery and restore from backups.

**File:** `lib/scripts/data_backup.rb`

### When to Use

- **Daily automated backups** (via cron/Sidekiq - see below)
- Before making major changes to an event
- After go-live to capture initial state
- When you need to restore a deleted or corrupted event

### Basic Usage

```bash
# Export a single event
rails runner lib/scripts/data_backup.rb --event=EVENT_SLUG

# Export all events for an organization
rails runner lib/scripts/data_backup.rb --organization=ORG_SLUG

# List available backups
rails runner lib/scripts/data_backup.rb --list

# Restore from backup
rails runner lib/scripts/data_backup.rb --restore=backups/FILENAME.json
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--event=SLUG` | Export single event | `--event=summer-market-2026` |
| `--organization=SLUG` | Export all events for org | `--organization=voxxy-presents` |
| `--restore=FILE` | Restore from backup file | `--restore=backups/event.json` |
| `--output=PATH` | Custom output directory | `--output=/tmp/backups` |
| `--list` | List all available backups | `--list` |

### What Gets Backed Up

- ✅ Event details (title, dates, location, settings, capacity)
- ✅ All vendor applications/registrations
- ✅ Invitation list contacts (with vendor contact info)
- ✅ Scheduled emails (templates, timing, filters)
- ✅ Vendor application forms configuration
- ✅ Payment integrations configuration
- ✅ Event portal settings
- ✅ Email delivery records (for analytics only)

### What Doesn't Get Restored

- Email delivery records (historical data, not duplicated)
- Payment transactions (financial data, not duplicated)
- System IDs (new IDs generated on restore)

### Backup File Location

By default, backups are stored in: `./backups/`

Filename format: `{event-slug}-{timestamp}.json`

Example: `summer-market-2026-2026-02-08-143022.json`

### Common Scenarios

#### 1. Daily Backup Before Go-Live

```bash
# Backup the event right before sending invitations
rails runner lib/scripts/data_backup.rb --event=summer-market-2026

# Output:
# ✅ Event data exported successfully!
# 📁 File: backups/summer-market-2026-2026-02-08-140000.json
# 📊 Size: 45.2 KB
```

#### 2. Emergency Restore After Data Loss

```bash
# First, list available backups to find the right one
rails runner lib/scripts/data_backup.rb --list

# Output shows:
# 📁 summer-market-2026-2026-02-08-140000.json
#    Event: Summer Market 2026
#    Exported: 2026-02-08T14:00:00Z
#    Size: 45.2 KB

# Restore from the backup
rails runner lib/scripts/data_backup.rb \
  --restore=backups/summer-market-2026-2026-02-08-140000.json

# This creates a NEW event with slug: summer-market-2026-restored
```

#### 3. Backup All Events for Organization

```bash
# Useful for end-of-month backups
rails runner lib/scripts/data_backup.rb --organization=voxxy-presents
```

#### 4. List and Review Backups

```bash
rails runner lib/scripts/data_backup.rb --list
```

### Restore Behavior

**Important:** Restore creates a NEW event, it does NOT overwrite existing events.

- New event slug: `{original-slug}-restored`
- If that exists: `{original-slug}-restored-1`, etc.
- All relationships are recreated with new IDs
- Vendor contacts are matched by email (reused if exists)

### Backup File Format

The backup is a JSON file with this structure:

```json
{
  "exported_at": "2026-02-08T14:00:00Z",
  "export_version": "1.0",
  "original_event_id": 123,
  "event": { /* event attributes */ },
  "organization": { /* org reference */ },
  "registrations": [ /* all registrations */ ],
  "event_invitations": [ /* invitations with contacts */ ],
  "scheduled_emails": [ /* scheduled emails */ ],
  "vendor_applications": [ /* application forms */ ],
  "event_portal": { /* portal settings */ },
  "payment_integrations": [ /* payment config */ ]
}
```

---

## 🚫 Spam Resend Script

**Purpose:** Resend emails that were marked as spam by SendGrid or reported by spam monitoring services.

**File:** `lib/scripts/spam_resend.rb`

### When to Use

- After receiving spam reports from SendGrid webhooks
- When third-party spam monitoring service reports issues
- After improving domain reputation
- When specific users report emails went to spam

### Basic Usage

```bash
# Always test with dry-run first!
rails runner lib/scripts/spam_resend.rb --event=EVENT_SLUG --emails=EMAIL_LIST --dry-run

# Remove --dry-run to actually send
rails runner lib/scripts/spam_resend.rb --event=EVENT_SLUG --emails=EMAIL_LIST
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--event=SLUG` | Event slug (required) | `--event=summer-market-2026` |
| `--emails=LIST` | Specific email addresses (comma-separated) | `--emails=user1@me.com,user2@me.com` |
| `--file=PATH` | CSV file with email addresses | `--file=spam_reports.csv` |
| `--since=TIME` | Auto-detect spam emails since time | `--since=24h` or `--since=7d` |
| `--mark-only` | Mark without actually sending | `--mark-only` |
| `--dry-run` | Preview without sending or marking | `--dry-run` |

### Time Format for --since

- `24h` - Last 24 hours
- `7d` - Last 7 days
- `30m` - Last 30 minutes
- `2026-02-08` - Since specific date

### CSV File Format

The script accepts CSV files in two formats:

**Format 1: With header**
```csv
email
user1@example.com
user2@example.com
```

**Format 2: Plain text (no header)**
```
user1@example.com
user2@example.com
user3@example.com
```

### Common Scenarios

#### 1. Resend to Specific Addresses Reported as Spam

```bash
# Preview first
rails runner lib/scripts/spam_resend.rb \
  --event=summer-market-2026 \
  --emails=vendor1@me.com,vendor2@me.com \
  --dry-run

# Send for real
rails runner lib/scripts/spam_resend.rb \
  --event=summer-market-2026 \
  --emails=vendor1@me.com,vendor2@me.com
```

#### 2. Process Spam Report from Third-Party Service

```bash
# Export spam report from monitoring service as CSV
# Save as spam_reports.csv with one email per line

rails runner lib/scripts/spam_resend.rb \
  --event=summer-market-2026 \
  --file=spam_reports.csv \
  --dry-run

# If looks good, run for real
rails runner lib/scripts/spam_resend.rb \
  --event=summer-market-2026 \
  --file=spam_reports.csv
```

#### 3. Auto-Detect and Resend Recent Spam

```bash
# Find all emails marked as spam in last 24 hours
rails runner lib/scripts/spam_resend.rb \
  --event=summer-market-2026 \
  --since=24h \
  --dry-run
```

#### 4. Mark Spam Without Resending (for tracking)

```bash
# Just mark in database for reporting purposes
rails runner lib/scripts/spam_resend.rb \
  --event=summer-market-2026 \
  --emails=user@example.com \
  --mark-only
```

### Tracking

The script tracks resend attempts in the `email_deliveries` table:

- `retry_count` - Incremented each time
- `last_retry_at` - Timestamp of last retry
- `notes` - JSON field with `resent_due_to_spam: true`

This allows you to:
- Query how many spam resends have been done
- Track which emails were affected by spam issues
- Generate reports on email deliverability

### Output Example

```
================================================================================
SPAM RESEND SCRIPT
================================================================================
Event: Summer Market 2026 (summer-market-2026)
Mode: LIVE - emails will be sent and marked
================================================================================

📧 Found 8 email deliveries to process:

Requested: 10 email addresses
Found: 8 deliveries to process

⚠️  Not found in event (2):
  - unknown1@example.com
  - unknown2@example.com

By Type:
  Invitation emails: 6
  Scheduled emails: 2

Current Status:
  bounced: 5
  dropped: 3

⚠️  WARNING: This will resend 8 emails!
Type 'yes' to continue: yes

--------------------------------------------------------------------------------
PROCESSING...
--------------------------------------------------------------------------------

[1/8] vendor1@me.com (invitation)... ✅ resent
[2/8] vendor2@me.com (invitation)... ✅ resent
...

================================================================================
RESULTS
================================================================================
✅ Successfully resent: 8
❌ Failed: 0
⚠️  Skipped: 0
================================================================================
```

---

## 🤖 Automated Daily Backups

To run automated daily backups at 2 AM EST, you need to set up a Sidekiq scheduled job.

### Using Sidekiq Scheduler

**1. Install sidekiq-scheduler gem** (if not already installed):

```ruby
# Gemfile
gem 'sidekiq-scheduler'
```

**2. Create the worker:**

```ruby
# app/workers/daily_backup_worker.rb
class DailyBackupWorker
  include Sidekiq::Worker

  def perform
    # Get all organizations
    Organization.find_each do |organization|
      Rails.logger.info("Running daily backup for: #{organization.name}")

      # Run backup script for this organization
      system("rails runner lib/scripts/data_backup.rb --organization=#{organization.slug}")
    end
  end
end
```

**3. Configure the schedule:**

```yaml
# config/sidekiq.yml
:schedule:
  daily_backup:
    cron: '0 2 * * *'  # Every day at 2 AM (server time)
    class: DailyBackupWorker
    queue: default
```

**4. Ensure server time is EST:**

Check with: `date` command on server

If needed, set timezone in Rails:
```ruby
# config/application.rb
config.time_zone = 'Eastern Time (US & Canada)'
```

### Alternative: Cron Job

If you prefer using system cron instead of Sidekiq:

```bash
# Run: crontab -e
# Add this line (runs at 2 AM EST):
0 2 * * * cd /path/to/app && RAILS_ENV=production bundle exec rails runner lib/scripts/data_backup.rb --organization=voxxy-presents >> /path/to/app/log/backups.log 2>&1
```

### Backup Retention

Consider setting up automatic cleanup of old backups:

```bash
# Delete backups older than 30 days
find ./backups -name "*.json" -mtime +30 -delete
```

---

## 📊 Monitoring & Logging

### Checking Script Logs

All scripts log to Rails logger. Check logs:

```bash
# In development
tail -f log/development.log

# In staging/production
heroku logs --tail  # if on Heroku
# or
tail -f log/production.log
```

### Script Output

All scripts provide detailed output including:
- Summary of what will be done
- Progress indicators
- Success/failure counts
- Warnings and errors

Save output to file for records:

```bash
rails runner lib/scripts/email_retry.rb --event=EVENT_SLUG > retry_results.txt 2>&1
```

### SendGrid Monitoring

Monitor email deliverability via SendGrid dashboard:
- https://app.sendgrid.com/

Check:
- Delivery rates
- Bounce rates
- Spam reports
- Block lists

---

## 🔧 Troubleshooting

### Script Won't Run in Production

**Error:** `⛔️ SAFETY CHECK: Cannot run scripts in production`

**Solution:** Set environment variable:
```bash
export ALLOW_PRODUCTION_SCRIPTS=true
rails runner lib/scripts/...
```

### Event Not Found

**Error:** `❌ Event not found: event-slug`

**Solution:**
- Check the event slug is correct
- Verify event exists: `Event.find_by(slug: 'event-slug')`
- Use `--list` to see available backups

### No Emails Found to Retry

**Error:** `⚠️  No email deliveries found matching the criteria`

**Possible causes:**
- Wrong event slug
- Emails haven't been sent yet
- Status filter too restrictive
- Email addresses don't match exactly

**Debug:**
```ruby
# Rails console
event = Event.find_by(slug: 'event-slug')
event.email_deliveries.pluck(:recipient_email, :status)
```

### Restore Creates Wrong Event

**Behavior:** Restored event has weird slug like `event-restored-5`

**Explanation:** This is intentional! Restore never overwrites existing events.

**Solution:** After verifying restore, you can:
1. Delete the broken original event
2. Update the restored event's slug to the original

```ruby
# Rails console
restored = Event.find_by(slug: 'summer-market-2026-restored')
original = Event.find_by(slug: 'summer-market-2026')

# Delete original if it's broken
original.destroy

# Rename restored to original slug
restored.update(slug: 'summer-market-2026')
```

### Emails Still Not Delivering After Retry

**Possible causes:**
- Recipient's email is actually invalid
- Hard bounce (permanent failure)
- Domain is blacklisted
- SendGrid account suspended

**Check:**
1. SendGrid dashboard for delivery status
2. Email delivery record: `EmailDelivery.find_by(recipient_email: '...')`
3. Bounce reason: `delivery.bounce_reason`

### CSV File Won't Parse

**Error:** `❌ File not found` or parsing errors

**Solutions:**
- Check file path is correct and accessible
- Ensure CSV is UTF-8 encoded
- Try plain text format (one email per line)
- Check for extra spaces or invalid characters

---

## 🎯 Quick Reference

### Most Common Commands

```bash
# Retry failed invitation emails
rails runner lib/scripts/email_retry.rb --event=EVENT_SLUG --type=invitation --status=failed --dry-run

# Backup an event
rails runner lib/scripts/data_backup.rb --event=EVENT_SLUG

# List backups
rails runner lib/scripts/data_backup.rb --list

# Resend spam emails from CSV
rails runner lib/scripts/spam_resend.rb --event=EVENT_SLUG --file=spam_reports.csv --dry-run
```

### Safety Checklist

Before running any script in production:

- [ ] Tested in staging first
- [ ] Used `--dry-run` to preview
- [ ] Backed up data (`data_backup.rb`)
- [ ] Confirmed event slug is correct
- [ ] Reviewed script output carefully
- [ ] Have rollback plan ready

---

## 📞 Support

If you encounter issues with these scripts:

1. Check logs: `log/production.log`
2. Review troubleshooting section above
3. Test in staging first
4. Contact dev team with:
   - Exact command run
   - Full error message
   - Script output
   - Event slug and context

---

**Last Updated:** 2026-02-08
**Version:** 1.0
