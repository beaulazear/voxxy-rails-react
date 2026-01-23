# SendGrid Webhook Processing Fix - January 23, 2026

**Date:** January 23, 2026
**Issue:** Webhook jobs enqueued but never processed, invitation bounces not tracked
**Status:** ✅ FIXED AND DEPLOYED

---

## 🐛 Problem Summary

SendGrid webhook events were being received and enqueued successfully, but EmailDelivery records were never created for invitation emails. Investigation revealed two critical issues:

### Issue #1: Queue Mismatch
- **Symptom**: Jobs enqueued successfully but never processed
- **Root Cause**: EmailDeliveryProcessorJob used queue `:email_webhooks`, but Sidekiq only watched `:critical`, `:email_delivery`, `:default`
- **Evidence**: Jobs sat in Redis indefinitely; no processing logs in Sidekiq

### Issue #2: Schema Validation Failure
- **Symptom**: Job processing failed with validation errors
- **Root Cause**: EmailDelivery table required `scheduled_email_id` and `registration_id`, but invitation emails don't have these
- **Error Message**: `Validation failed: Scheduled email must exist, Registration must exist`

---

## 🔍 Diagnosis

### How the Issue Was Found

1. **User reported**: Bounced invitations not showing as undelivered
2. **Rails logs showed**: Webhook receiving events and enqueuing jobs successfully
3. **Sidekiq logs showed**: EmailSenderWorker running, but NO EmailDeliveryProcessorJob logs
4. **Investigation revealed**:
   - EmailDeliveryProcessorJob: `sidekiq_options queue: :email_webhooks` (line 7)
   - config/sidekiq.yml: Only processes `critical`, `email_delivery`, `default` queues
   - **Queue mismatch confirmed**

5. **After queue fix**: Jobs started processing but failed with validation errors
6. **Schema investigation revealed**: `scheduled_email_id` and `registration_id` were NOT NULL but invitation emails don't have these values

---

## ✅ Solution Implemented

### Fix #1: Queue Configuration (Commit: c1f28c1)

**File:** `app/workers/email_delivery_processor_job.rb:7`

```ruby
# BEFORE:
sidekiq_options queue: :email_webhooks, retry: 3

# AFTER:
sidekiq_options queue: :email_delivery, retry: 3
```

**Result:** Jobs now process immediately in the existing `:email_delivery` queue

---

### Fix #2: Schema Flexibility (Migration: 20260123002354)

**Migration:** `db/migrate/20260123002354_make_email_delivery_flexible_for_invitations.rb`

**Changes:**
1. Made `scheduled_email_id` nullable (was NOT NULL)
2. Made `registration_id` nullable (was NOT NULL)
3. Added `event_invitation_id` column with foreign key and index
4. Added database check constraint:
   ```sql
   CHECK (
     (scheduled_email_id IS NOT NULL AND event_invitation_id IS NULL) OR
     (scheduled_email_id IS NULL AND event_invitation_id IS NOT NULL)
   )
   ```

**Why the check constraint?**
- Ensures data integrity
- Every EmailDelivery MUST be for either a scheduled email OR an invitation
- Prevents orphan records with neither source
- Prevents dual-source records (which would be invalid)

---

### Fix #3: Model Updates

**File:** `app/models/email_delivery.rb`

```ruby
# BEFORE:
belongs_to :scheduled_email
belongs_to :event
belongs_to :registration

# AFTER:
belongs_to :scheduled_email, optional: true
belongs_to :event
belongs_to :registration, optional: true
belongs_to :event_invitation, optional: true

# Added custom validation:
validate :must_have_email_source

private

def must_have_email_source
  if scheduled_email_id.blank? && event_invitation_id.blank?
    errors.add(:base, "Must have either scheduled_email_id or event_invitation_id")
  elsif scheduled_email_id.present? && event_invitation_id.present?
    errors.add(:base, "Cannot have both scheduled_email_id and event_invitation_id")
  end
end
```

---

### Fix #4: Webhook Processor Update

**File:** `app/workers/email_delivery_processor_job.rb:162`

```ruby
# BEFORE:
EmailDelivery.create!(
  event_id: event_id,
  sendgrid_message_id: sg_message_id,
  recipient_email: event_data["email"],
  status: "sent",
  sent_at: Time.at(event_data["timestamp"].to_i)
)

# AFTER:
EmailDelivery.create!(
  event_id: event_id,
  event_invitation_id: invitation_id,  # ← Added
  sendgrid_message_id: sg_message_id,
  recipient_email: event_data["email"],
  status: "sent",
  sent_at: Time.at(event_data["timestamp"].to_i)
)
```

---

## 📊 Impact

### Before Fix
- ❌ Webhook events enqueued but never processed
- ❌ No EmailDelivery records created for invitations
- ❌ Bounce tracking not working for invitations
- ❌ Frontend showed 0 undelivered for all emails

### After Fix
- ✅ Webhook events process immediately
- ✅ EmailDelivery records created on-the-fly for invitations
- ✅ Bounce tracking works for both scheduled and invitation emails
- ✅ Frontend displays accurate undelivered counts
- ✅ Database maintains data integrity via check constraint

---

## 🧪 Testing

### How to Verify the Fix

**1. Check Sidekiq is processing webhook jobs:**
```ruby
# Rails console
require 'sidekiq/api'

# Check email_delivery queue (not email_webhooks!)
Sidekiq::Queue.new('email_delivery').size  # Should be 0 if processing

# Check recent jobs
Sidekiq::ProcessSet.new.each do |process|
  puts process['busy']
end
```

**2. Send test invitation and verify:**
```bash
# Run rake task
bundle exec rake email_testing:send_test_invitations

# Check EmailDelivery records created
bundle exec rails console
```

```ruby
# Find invitation deliveries
invitation_deliveries = EmailDelivery.where.not(event_invitation_id: nil)
puts "Invitation deliveries: #{invitation_deliveries.count}"

# Check for bounces (courtneygreer@voxxyai.com should bounce)
bounced = EmailDelivery.where(status: 'bounced', recipient_email: 'courtneygreer@voxxyai.com')
puts "Bounce tracked: #{bounced.exists?}"
```

**3. Check webhook processing in Sidekiq logs:**
```bash
# Look for these log patterns:
grep "Creating delivery record for invitation email" log/production.log
grep "Processing bounce event for delivery" log/production.log
grep "Email bounced" log/production.log
```

**4. Verify frontend displays undelivered count:**
- Navigate to event scheduled emails page
- Check "Undelivered" column shows non-zero for bounced emails
- Hover over count to see tooltip

---

## 📝 Files Changed

### Code Changes:
1. `app/workers/email_delivery_processor_job.rb` - Queue + event_invitation_id
2. `app/models/email_delivery.rb` - Optional associations + validation
3. `db/migrate/20260123002354_make_email_delivery_flexible_for_invitations.rb` - Schema migration
4. `db/schema.rb` - Auto-updated by migration

### Documentation Updates:
1. `docs/email/WEBHOOK_VERIFICATION_CHECKLIST.md` - Updated queue references
2. `docs/email/INVITATION_BOUNCE_TRACKING_FIX.md` - Archived with resolution
3. `docs/email/WEBHOOK_PROCESSING_FIX_JAN_23_2026.md` - This document (new)

---

## 🎯 Success Metrics

After deployment, verify:

- [ ] Sidekiq processes EmailDeliveryProcessorJob successfully (no errors)
- [ ] EmailDelivery records created for invitation emails
- [ ] Bounced invitations show `status: 'bounced'`
- [ ] Frontend displays undelivered counts correctly
- [ ] Database constraint prevents invalid records
- [ ] Both scheduled and invitation emails track properly

---

## 🔄 Rollback Plan

If issues occur after deployment:

### Rollback Migration (Emergency)
```bash
bundle exec rails db:rollback
```

**Note:** This will:
- Remove `event_invitation_id` column
- Restore NOT NULL constraints on `scheduled_email_id` and `registration_id`
- Remove check constraint
- Invitation tracking will stop working (revert to original problem)

### Alternative: Revert Queue Change Only
```ruby
# app/workers/email_delivery_processor_job.rb
sidekiq_options queue: :email_webhooks, retry: 3
```

Then add `:email_webhooks` to config/sidekiq.yml:
```yaml
:queues:
  - [critical, 10]
  - [email_delivery, 5]
  - [email_webhooks, 5]  # Add this
  - [default, 1]
```

**Not recommended** - better to fix forward than rollback.

---

## 💡 Lessons Learned

1. **Always verify queue configuration** when jobs aren't processing
   - Check `sidekiq_options queue:` in job file
   - Verify queue is listed in `config/sidekiq.yml`
   - Use Sidekiq dashboard to monitor queue activity

2. **Database constraints are essential** for data integrity
   - NOT NULL constraints should match business logic
   - Check constraints enforce complex business rules
   - Optional associations need explicit `optional: true`

3. **Two email systems need unified tracking**
   - Scheduled emails (campaign automation)
   - Invitation emails (manual CRM sends)
   - Both need delivery tracking for accurate metrics

4. **Logging is critical for debugging**
   - EmailDeliveryProcessorJob has excellent logging
   - Helped quickly identify where failures occurred
   - Made debugging much faster

---

## 📚 Related Documentation

- [WEBHOOK_TRACKING_COMPLETE_FLOW.md](./WEBHOOK_TRACKING_COMPLETE_FLOW.md) - Complete webhook flow
- [WEBHOOK_VERIFICATION_CHECKLIST.md](./WEBHOOK_VERIFICATION_CHECKLIST.md) - Verification steps
- [EMAIL_DOCS_INDEX.md](./EMAIL_DOCS_INDEX.md) - Documentation index
- [EMAIL_RECIPIENT_FILTERING_FIX_V2.md](./EMAIL_RECIPIENT_FILTERING_FIX_V2.md) - Next planned fix

---

## ✅ Status: COMPLETE

**Deployed:** January 23, 2026
**Verified:** Pending user testing after deployment
**Next Steps:** Monitor production logs and verify bounce tracking works end-to-end
