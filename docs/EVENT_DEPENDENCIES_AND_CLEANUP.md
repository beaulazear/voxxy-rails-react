# 🗂️ Event Dependencies & Cleanup Guide

**Last Updated:** January 26, 2026
**Purpose:** Document all foreign key relationships for Event model and proper deletion order

---

## Table of Contents

1. [Overview](#overview)
2. [Foreign Key Relationships](#foreign-key-relationships)
3. [Deletion Order](#deletion-order)
4. [Event Model Associations](#event-model-associations)
5. [Cleanup Task Implementation](#cleanup-task-implementation)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The `Event` model is a central part of the Voxxy Presents platform and has **many** foreign key relationships. When deleting events (especially test events), these relationships must be handled in the **correct order** to avoid PostgreSQL foreign key constraint violations.

**Key Issue:** PostgreSQL enforces referential integrity. You cannot delete a record if other tables still reference it via foreign keys.

---

## Foreign Key Relationships

### Tables That Reference Events

Here are **all** the tables that have foreign key constraints pointing to `events.id`:

#### 1. **email_deliveries**
- **Foreign Key:** `event_id` → `events.id`
- **Additional FK:** Also references `scheduled_emails.id` AND `event_invitations.id`
- **Constraint Name:** `fk_rails_[hash]`
- **Must Delete First:** YES (references multiple tables)
- **Location:** `/Users/beaulazear/Desktop/voxxy-rails/app/models/email_delivery.rb`

```ruby
belongs_to :event
belongs_to :scheduled_email, optional: true
belongs_to :event_invitation, optional: true
```

#### 2. **email_unsubscribes**
- **Foreign Key:** `event_id` → `events.id`
- **Constraint Name:** `fk_rails_25ef9ec7c8`
- **Must Delete First:** YES
- **Purpose:** Tracks event-specific unsubscribe requests
- **Location:** `/Users/beaulazear/Desktop/voxvy-rails/app/models/email_unsubscribe.rb`

```ruby
belongs_to :event, optional: true
```

#### 3. **unsubscribe_tokens**
- **Foreign Key:** `event_id` → `events.id`
- **Constraint Name:** `fk_rails_71b84d8501`
- **Must Delete First:** YES
- **Purpose:** Generates unique unsubscribe links for emails
- **Location:** `/Users/beaulazear/Desktop/voxxy-rails/app/models/unsubscribe_token.rb`

```ruby
belongs_to :event
```

#### 4. **scheduled_emails**
- **Foreign Key:** `event_id` → `events.id`
- **Association:** `has_many :scheduled_emails, dependent: :destroy`
- **Auto-deleted:** YES (via Rails cascade)
- **Location:** `/Users/beaulazear/Desktop/voxxy-rails/app/models/scheduled_email.rb`

#### 5. **registrations**
- **Foreign Key:** `event_id` → `events.id`
- **Association:** `has_many :registrations, dependent: :destroy`
- **Auto-deleted:** YES (via Rails cascade)
- **Location:** `/Users/beaulazear/Desktop/voxxy-rails/app/models/registration.rb`

#### 6. **event_invitations**
- **Foreign Key:** `event_id` → `events.id`
- **Association:** `has_many :event_invitations, dependent: :destroy`
- **Auto-deleted:** YES (via Rails cascade)
- **Location:** `/Users/beaulazear/Desktop/voxxy-rails/app/models/event_invitation.rb`

#### 7. **vendor_applications**
- **Foreign Key:** `event_id` → `events.id`
- **Association:** `has_many :vendor_applications, dependent: :destroy`
- **Auto-deleted:** YES (via Rails cascade)

#### 8. **payment_integrations**
- **Foreign Key:** `event_id` → `events.id`
- **Association:** `has_many :payment_integrations, dependent: :destroy`
- **Auto-deleted:** YES (via Rails cascade)

#### 9. **payment_transactions**
- **Foreign Key:** `event_id` → `events.id`
- **Association:** `has_many :payment_transactions, dependent: :destroy`
- **Auto-deleted:** YES (via Rails cascade)

#### 10. **bulletins**
- **Foreign Key:** `event_id` → `events.id`
- **Association:** `has_many :bulletins, dependent: :destroy`
- **Auto-deleted:** YES (via Rails cascade)

#### 11. **event_portal**
- **Foreign Key:** `event_id` → `events.id`
- **Association:** `has_one :event_portal, dependent: :destroy`
- **Auto-deleted:** YES (via Rails cascade)

---

## Deletion Order

### Critical: Order Matters!

When deleting events, you **MUST** delete records in this order:

```
1. EmailDelivery     (references events, scheduled_emails, AND event_invitations)
2. EmailUnsubscribe  (references events)
3. UnsubscribeToken  (references events)
4. Event.destroy!    (Rails cascades delete the rest)
```

### Why This Order?

**EmailDelivery must be first** because it has foreign keys to:
- `events.id`
- `scheduled_emails.id` (which belongs to event)
- `event_invitations.id` (which belongs to event)

If you try to delete `event_invitations` or `scheduled_emails` before `EmailDelivery`, PostgreSQL will raise:
```
PG::ForeignKeyViolation: ERROR: update or delete on table "event_invitations"
violates foreign key constraint "fk_rails_d08e9f1a37" on table "email_deliveries"
```

### What Rails Handles Automatically

Once you delete the manual dependencies above, calling `event.destroy!` will automatically cascade delete:
- `scheduled_emails` (via `dependent: :destroy`)
- `registrations` (via `dependent: :destroy`)
- `event_invitations` (via `dependent: :destroy`)
- `vendor_applications` (via `dependent: :destroy`)
- `payment_integrations` (via `dependent: :destroy`)
- `payment_transactions` (via `dependent: :destroy`)
- `bulletins` (via `dependent: :destroy`)
- `event_portal` (via `dependent: :destroy`)

---

## Event Model Associations

### Current Associations (as of Jan 26, 2026)

**File:** `/Users/beaulazear/Desktop/voxxy-rails/app/models/event.rb`

```ruby
class Event < ApplicationRecord
  # Organization
  belongs_to :organization

  # Vendors & Applications
  has_many :registrations, dependent: :destroy
  has_many :vendor_applications, dependent: :destroy
  has_many :event_invitations, dependent: :destroy
  has_many :invited_contacts, through: :event_invitations, source: :vendor_contact

  # Email automation
  belongs_to :email_campaign_template, optional: true
  has_many :scheduled_emails, dependent: :destroy
  has_many :email_deliveries, through: :scheduled_emails
  has_many :unsubscribe_tokens, dependent: :delete_all  # ← Added Jan 26

  # Payments
  has_many :payment_integrations, dependent: :destroy
  has_many :payment_transactions, dependent: :destroy

  # Event features
  has_one :budget, as: :budgetable, dependent: :destroy
  has_one :event_portal, dependent: :destroy
  has_many :bulletins, dependent: :destroy
end
```

### Missing Associations (Should Add)

**Recommendation:** Add these to Event model to prevent future manual deletion needs:

```ruby
# Add to app/models/event.rb
has_many :email_unsubscribes, dependent: :delete_all
```

This would allow Rails to automatically handle cleanup instead of requiring manual deletion in rake tasks.

---

## Cleanup Task Implementation

### Current Implementation

**File:** `/Users/beaulazear/Desktop/voxxy-rails/lib/tasks/email_automation_test.rake`

**Task:** `email_automation:cleanup_test_events`

```ruby
test_events.each do |event|
  puts "🗑️  Deleting: #{event.title}"

  # Count associated records before deletion
  total_stats[:scheduled_emails] += event.scheduled_emails.count
  total_stats[:registrations] += event.registrations.count
  total_stats[:email_deliveries] += EmailDelivery.where(event_id: event.id).count
  total_stats[:invitations] += event.event_invitations.count rescue 0

  # DELETE FOREIGN KEY DEPENDENCIES FIRST (in order!)

  # 1. EmailDelivery (references events, scheduled_emails, AND event_invitations)
  EmailDelivery.where(event_id: event.id).delete_all

  # 2. EmailUnsubscribe (references events)
  EmailUnsubscribe.where(event_id: event.id).delete_all rescue nil

  # 3. UnsubscribeToken (references events)
  unsubscribe_count = UnsubscribeToken.where(event_id: event.id).count
  UnsubscribeToken.where(event_id: event.id).delete_all
  total_stats[:unsubscribe_tokens] += unsubscribe_count

  # 4. Delete event (Rails cascades the rest)
  event.destroy!
  total_stats[:events] += 1
end
```

### How to Add New Dependencies

If you discover a new table referencing events:

1. **Identify the constraint:**
   ```sql
   -- In PostgreSQL console
   SELECT
     tc.table_name,
     kcu.column_name,
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name,
     tc.constraint_name
   FROM information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY'
     AND ccu.table_name = 'events';
   ```

2. **Add manual deletion to rake task:**
   ```ruby
   # Add BEFORE event.destroy!
   NewTable.where(event_id: event.id).delete_all
   ```

3. **Update Event model (recommended):**
   ```ruby
   # In app/models/event.rb
   has_many :new_tables, dependent: :delete_all
   ```

4. **Update this documentation:**
   - Add to "Tables That Reference Events"
   - Update deletion order if needed

---

## Troubleshooting

### Error: Foreign Key Constraint Violation

**Error Message:**
```
ActiveRecord::InvalidForeignKey: PG::ForeignKeyViolation:
ERROR: update or delete on table "events" violates foreign key constraint
"fk_rails_XXXXXXXX" on table "table_name"
```

**Solution:**

1. **Identify the table:**
   - Error shows which table is blocking: `on table "table_name"`

2. **Add manual deletion:**
   ```ruby
   TableName.where(event_id: event.id).delete_all
   ```

3. **Place in correct order:**
   - If table references OTHER event-related tables, delete it FIRST
   - Otherwise, delete after EmailDelivery but before event.destroy!

4. **Test in development:**
   ```bash
   bundle exec rake email_automation:cleanup_test_events
   ```

5. **Update this doc and Event model**

### Error: Model Not Found

If you get:
```
NameError: uninitialized constant EmailUnsubscribe
```

**Solution:** Add `rescue nil` to handle environments where the table doesn't exist:
```ruby
EmailUnsubscribe.where(event_id: event.id).delete_all rescue nil
```

---

## Best Practices

### For Developers

1. **Always use `dependent: :destroy` or `dependent: :delete_all`** on Event associations
2. **Document new foreign keys** in this file immediately
3. **Test cleanup in development** before running in production
4. **Use transactions** for bulk deletions to maintain data integrity

### For Database Changes

When adding a new foreign key to events:

1. **Add the association to Event model:**
   ```ruby
   has_many :new_records, dependent: :delete_all
   ```

2. **Update this documentation**

3. **Test the cleanup task:**
   ```bash
   bundle exec rake email_automation:cleanup_test_events
   ```

### For Production

Before deleting events in production:

1. **Backup the database:**
   ```bash
   pg_dump database_name > backup.sql
   ```

2. **Test in staging first**

3. **Review what will be deleted:**
   ```ruby
   event = Event.find(id)
   puts "Scheduled Emails: #{event.scheduled_emails.count}"
   puts "Registrations: #{event.registrations.count}"
   puts "Email Deliveries: #{EmailDelivery.where(event_id: event.id).count}"
   # etc.
   ```

4. **Run cleanup task** (not manual deletion)

---

## Quick Reference

### Finding All Foreign Keys to Events

**PostgreSQL Query:**
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'event_id';
```

### Deletion Checklist

- [ ] EmailDelivery records deleted
- [ ] EmailUnsubscribe records deleted
- [ ] UnsubscribeToken records deleted
- [ ] Event destroyed (cascades the rest)

---

## Related Documentation

- **Email Automation System:** `/docs/email/EMAIL_AUTOMATION_SYSTEM_GUIDE.md`
- **Email Deliveries:** `/docs/email/WEBHOOK_PROCESSING_FIX_JAN_23_2026.md`
- **Event Model:** `/app/models/event.rb`
- **Cleanup Task:** `/lib/tasks/email_automation_test.rake`

---

## Changelog

### January 26, 2026
- **Discovered:** `email_deliveries`, `email_unsubscribes`, `unsubscribe_tokens` must be manually deleted
- **Fixed:** Cleanup task to delete in correct order
- **Added:** `has_many :unsubscribe_tokens, dependent: :delete_all` to Event model
- **Created:** This documentation

### Future Improvements

- [ ] Add `has_many :email_unsubscribes, dependent: :delete_all` to Event model
- [ ] Add database migration to add `ON DELETE CASCADE` to foreign keys
- [ ] Create automated test to verify deletion order
- [ ] Add Sidekiq job for bulk event cleanup

---

**Last Updated:** January 26, 2026
**Maintained By:** Development Team
**Questions?** Update this doc when discovering new dependencies!
