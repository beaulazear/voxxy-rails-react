# 📧 Email Overdue Detection System

**Date:** January 25, 2026
**Purpose:** Document the implementation of the email overdue/late warning system
**Status:** ✅ Implemented

---

## Overview

This system detects when scheduled emails are overdue (scheduled time has passed but email hasn't been sent yet) and exposes this information to the frontend for display as visual warnings.

### Problem Solved

**Before:** When emails failed to send on time (due to Sidekiq worker issues, errors, or other problems), there was no visual indication that emails were late. Producers couldn't tell if:
- Emails were scheduled correctly but late
- The system was working properly
- Intervention was needed

**After:** The system now:
- ✅ Detects overdue emails with a 10-minute grace period
- ✅ Calculates how late emails are (in minutes, hours, or days)
- ✅ Provides human-readable overdue messages
- ✅ Exposes this data via API for frontend display
- ✅ Includes debugging tools to diagnose issues

---

## Implementation Details

### 1. Backend Changes

#### ScheduledEmail Model Methods

**File:** `app/models/scheduled_email.rb`

Added three new methods:

```ruby
# Check if email is overdue
def overdue?
  return false unless status == "scheduled"
  return false unless scheduled_for

  # 10-minute grace period (worker runs every 5 min)
  grace_period = 10.minutes
  scheduled_for < (Time.current - grace_period)
end

# Calculate minutes overdue (negative if not overdue)
def minutes_overdue
  return 0 unless scheduled_for
  ((Time.current - scheduled_for) / 60).round
end

# Human-readable message
def overdue_message
  return nil unless overdue?

  minutes = minutes_overdue
  if minutes < 60
    "#{minutes} minute#{'s' if minutes != 1} late"
  elsif minutes < 1440 # Less than 24 hours
    hours = (minutes / 60.0).round(1)
    "#{hours} hour#{'s' if hours != 1} late"
  else
    days = (minutes / 1440.0).round(1)
    "#{days} day#{'s' if days != 1} late"
  end
end
```

**Key Features:**
- **10-minute grace period** - Prevents false positives. EmailSenderWorker runs every 5 minutes, so 10 minutes allows 2 processing cycles before flagging as late.
- **Timezone-safe** - Uses `Time.current` (UTC) compared to `scheduled_for` (UTC), eliminating timezone confusion
- **Human-readable** - Formats delays as "15 minutes late", "2.5 hours late", or "1.2 days late"

#### API Controller Updates

**File:** `app/controllers/api/v1/presents/scheduled_emails_controller.rb`

Updated the `index` action to include overdue information in the JSON response:

```ruby
emails_json = emails.map do |email|
  email.as_json(
    include: {
      email_template_item: {},
      latest_delivery: {}
    },
    methods: [:delivery_status]
  ).merge(
    # Existing fields
    delivery_counts: email.delivery_counts,
    undelivered_count: email.undelivered_count,
    # ... other fields

    # NEW: Overdue detection
    overdue: email.overdue?,
    minutes_overdue: email.minutes_overdue,
    overdue_message: email.overdue_message
  )
end
```

**API Response Example:**
```json
{
  "id": 123,
  "name": "1 Day Before Payment Due",
  "status": "scheduled",
  "scheduled_for": "2026-01-25T14:00:00.000Z",
  "overdue": true,
  "minutes_overdue": 45,
  "overdue_message": "45 minutes late"
}
```

### 2. Debugging Tools

#### New Rake Task: `email_schedule:debug`

**File:** `lib/tasks/email_schedule_debug.rake`

Comprehensive debugging command that shows:
- Timezone configuration (UTC vs Eastern)
- All scheduled emails with their status
- Which emails are overdue, ready to send, or upcoming
- Time differences in minutes
- Troubleshooting steps

**Usage:**
```bash
# Check all scheduled emails across all events
rails email_schedule:debug
```

**Sample Output:**
```
====================================================================
📧 EMAIL SCHEDULE DEBUGGING - Timezone & Overdue Analysis
====================================================================

⏰ TIMEZONE CONFIGURATION:
--------------------------------------------------------------------
  Rails timezone: UTC
  Current time (UTC): 2026-01-25 19:30:00 UTC
  Current time (Eastern): 2026-01-25 14:30:00 EST
  Offset: -05:00

📋 SCHEDULED EMAILS (3 total):
--------------------------------------------------------------------

1. 🚨 1 Day Before Payment Due
   Event: Summer Market 2026 (summer-market-2026)
   Scheduled (UTC): 2026-01-25 14:00:00 UTC
   Scheduled (EST): 2026-01-25 09:00:00 EST
   Status: OVERDUE - 45 minutes late
   Time since scheduled: 45 minutes ago
   Recipients: 12
   Trigger: days_before_payment_deadline (1 days, 10:00)

2. ✅ Payment Due Today
   Event: Summer Market 2026 (summer-market-2026)
   Scheduled (UTC): 2026-01-25 19:45:00 UTC
   Scheduled (EST): 2026-01-25 14:45:00 EST
   Status: READY TO SEND
   Time since scheduled: 5 minutes ago
   Recipients: 12
   Trigger: days_before_payment_deadline (0 days, 08:00)

3. ⏰ 1 Day Before Event
   Event: Summer Market 2026 (summer-market-2026)
   Scheduled (UTC): 2026-01-30 22:00:00 UTC
   Scheduled (EST): 2026-01-30 17:00:00 EST
   Status: UPCOMING
   Time until scheduled: 7200 minutes from now
   Recipients: 15
   Trigger: days_before_event (1 days, 17:00)

====================================================================
📊 SUMMARY:
====================================================================
  🚨 Overdue (late): 1
  ✅ Ready to send (in grace period): 1
  ⏰ Upcoming: 1
  📧 Total scheduled: 3

⚠️  WARNING: 1 email overdue!

🔍 TROUBLESHOOTING STEPS:
  1. Check if Sidekiq worker is running:
     ps aux | grep sidekiq

  2. Check Sidekiq queue status:
     rails sidekiq:debug

  3. Manually trigger EmailSenderWorker:
     rails runner 'EmailSenderWorker.new.perform'

  4. Check Sidekiq logs for errors:
     tail -f log/sidekiq.log

====================================================================
```

#### Additional Rake Commands

**Check specific event:**
```bash
rails email_schedule:check_event[summer-market-2026]
```

**List all overdue emails:**
```bash
rails email_schedule:overdue
```

---

## Timezone Architecture

### How Times Are Stored and Compared

The system uses **UTC internally** for all time comparisons, ensuring consistency:

```
BACKEND FLOW:
┌─────────────────────────────────────────────────────────────────┐
│ 1. EmailScheduleCalculator                                      │
│    Input: "09:00" (trigger_time in Eastern)                     │
│    Process: Time.use_zone("America/New_York") { ... }           │
│    Output: 2026-01-26 14:00:00 UTC                             │
│    (9 AM Eastern = 2 PM UTC)                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Database Storage                                             │
│    Field: scheduled_for TIMESTAMP                               │
│    Value: 2026-01-26 14:00:00 UTC                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. EmailSenderWorker (every 5 minutes)                          │
│    Query: WHERE scheduled_for <= Time.current                   │
│    Compare: 14:00:00 UTC <= 14:05:00 UTC ✅ READY              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. API Serialization                                            │
│    Output: "2026-01-26T14:00:00.000Z" (ISO 8601 UTC)           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Frontend Display                                             │
│    Parse: new Date("2026-01-26T14:00:00.000Z")                  │
│    Display: Browser auto-converts to local timezone             │
│    - Eastern browser: "Jan 26, 9:00 AM EST" ✅                 │
│    - Pacific browser: "Jan 26, 6:00 AM PST" ⚠️ (shows local)  │
└─────────────────────────────────────────────────────────────────┘
```

### Why UTC?

1. **No ambiguity** - One source of truth for when emails should send
2. **DST-safe** - Daylight Saving Time transitions don't affect comparisons
3. **Multi-timezone support** - If producers are in different timezones, the system still works
4. **Database best practice** - PostgreSQL stores TIMESTAMP as UTC

### Frontend Timezone Handling

**Current behavior:** Frontend displays times in the user's browser timezone.

**Potential issue:** If a producer is in California but the event is in New York, they'll see Pacific times, not Eastern times.

**Recommended frontend fix** (optional):
```typescript
// Force display in Eastern timezone regardless of user location
import { formatInTimeZone } from 'date-fns-tz';

const scheduledDate = email.scheduled_for; // "2026-01-26T14:00:00.000Z"
const easternDisplay = formatInTimeZone(
  new Date(scheduledDate),
  'America/New_York',
  'MMM d, yyyy h:mm a zzz'
);
// Output: "Jan 26, 2026 9:00 AM EST"
```

---

## Usage Guide

### For Developers

**Check if an email is overdue:**
```ruby
email = ScheduledEmail.find(123)

email.overdue?
# => true

email.minutes_overdue
# => 45

email.overdue_message
# => "45 minutes late"
```

**Find all overdue emails:**
```ruby
overdue_emails = ScheduledEmail.scheduled.select(&:overdue?)
# or
overdue_emails = ScheduledEmail.scheduled.select { |e| e.overdue? }
```

**Debug a specific event:**
```bash
rails email_schedule:check_event[event-slug]
```

### For Frontend Integration

**API Response Fields:**
```typescript
interface ScheduledEmail {
  id: number;
  name: string;
  status: 'scheduled' | 'sent' | 'paused' | 'failed';
  scheduled_for: string; // ISO 8601 UTC

  // NEW FIELDS:
  overdue: boolean;
  minutes_overdue: number;
  overdue_message: string | null; // "45 minutes late"
}
```

**Display overdue warning:**
```tsx
{email.overdue && (
  <div className="flex items-center gap-2 text-red-500">
    <AlertTriangle className="w-4 h-4" />
    <span className="text-sm font-medium">
      {email.overdue_message}
    </span>
  </div>
)}
```

---

## Troubleshooting

### Email shows as overdue but I just created it

**Cause:** Event dates are in the past, so calculated email times are also in the past.

**Solution:** ScheduledEmailGenerator skips emails scheduled in the past. This is expected behavior.

### All emails are overdue

**Likely causes:**
1. **Sidekiq worker not running**
   ```bash
   # Check if running
   ps aux | grep sidekiq

   # Start worker
   bundle exec sidekiq
   ```

2. **Sidekiq cron not configured**
   ```bash
   # Check cron jobs
   rails runner "puts Sidekiq::Cron::Job.all"

   # Should show EmailSenderWorker running every 5 minutes
   ```

3. **Redis connection issues**
   ```bash
   # Test Redis connection
   rails runner "puts Redis.new.ping"
   # Should output "PONG"
   ```

### Email sent but still shows as overdue

**Cause:** Email status didn't update to "sent" after sending.

**Solution:** Check EmailSenderService logs for errors during sending. The service should update status to "sent" after successful delivery.

---

## Testing

### Manual Testing

**1. Create a test event with emails scheduled in the past:**
```bash
rails email_testing:setup
```

**2. Check for overdue emails:**
```bash
rails email_schedule:overdue
```

**3. Manually trigger worker to process them:**
```bash
rails runner 'EmailSenderWorker.new.perform'
```

**4. Verify they're no longer overdue:**
```bash
rails email_schedule:overdue
# Should show: "✅ No overdue emails found!"
```

### Automated Testing

**RSpec example:**
```ruby
RSpec.describe ScheduledEmail, type: :model do
  describe '#overdue?' do
    let(:event) { create(:event, event_date: 10.days.from_now) }
    let(:email) { create(:scheduled_email, event: event, status: 'scheduled') }

    context 'when scheduled time is in the future' do
      before { email.update(scheduled_for: 1.hour.from_now) }

      it 'returns false' do
        expect(email.overdue?).to be false
      end
    end

    context 'when scheduled time is 5 minutes in the past (grace period)' do
      before { email.update(scheduled_for: 5.minutes.ago) }

      it 'returns false (within grace period)' do
        expect(email.overdue?).to be false
      end
    end

    context 'when scheduled time is 15 minutes in the past' do
      before { email.update(scheduled_for: 15.minutes.ago) }

      it 'returns true (past grace period)' do
        expect(email.overdue?).to be true
      end
    end

    context 'when email status is sent' do
      before do
        email.update(
          scheduled_for: 1.hour.ago,
          status: 'sent'
        )
      end

      it 'returns false (not overdue because already sent)' do
        expect(email.overdue?).to be false
      end
    end
  end

  describe '#overdue_message' do
    let(:email) { create(:scheduled_email, status: 'scheduled') }

    context 'when 30 minutes late' do
      before { email.update(scheduled_for: 30.minutes.ago) }

      it 'returns minutes message' do
        expect(email.overdue_message).to eq("30 minutes late")
      end
    end

    context 'when 2 hours late' do
      before { email.update(scheduled_for: 2.hours.ago) }

      it 'returns hours message' do
        expect(email.overdue_message).to eq("2.0 hours late")
      end
    end

    context 'when 3 days late' do
      before { email.update(scheduled_for: 3.days.ago) }

      it 'returns days message' do
        expect(email.overdue_message).to eq("3.0 days late")
      end
    end
  end
end
```

---

## Summary

### Files Changed

1. **`app/models/scheduled_email.rb`**
   - Added `overdue?` method
   - Added `minutes_overdue` method
   - Added `overdue_message` method

2. **`app/controllers/api/v1/presents/scheduled_emails_controller.rb`**
   - Updated `index` action to include overdue fields in JSON response

3. **`lib/tasks/email_schedule_debug.rake`** (NEW)
   - Added `email_schedule:debug` task
   - Added `email_schedule:check_event` task
   - Added `email_schedule:overdue` task

### Key Takeaways

✅ **Timezone handling is correct** - All comparisons happen in UTC
✅ **Grace period prevents false positives** - 10-minute buffer accounts for worker delay
✅ **API now exposes overdue status** - Frontend can display warnings
✅ **Debugging tools available** - Rake tasks make troubleshooting easy
✅ **Human-readable messages** - "45 minutes late" is clearer than raw timestamps

### Next Steps for Frontend

1. Update TypeScript types to include new fields:
   ```typescript
   overdue: boolean;
   minutes_overdue: number;
   overdue_message: string | null;
   ```

2. Add visual warning indicators:
   ```tsx
   {email.overdue && (
     <Badge variant="destructive">
       {email.overdue_message}
     </Badge>
   )}
   ```

3. Consider adding timezone display to clarify for users:
   ```tsx
   <p className="text-xs text-muted-foreground">
     All times shown in Eastern Time (ET)
   </p>
   ```

---

**Last Updated:** January 25, 2026
**Author:** Claude Code
**Status:** ✅ Production Ready
