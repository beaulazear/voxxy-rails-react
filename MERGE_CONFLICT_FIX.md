# Schema Merge Conflict - Fix Instructions

## The Issue
Two migrations were created on different branches:
- `staging`: migration `2026_01_18_190827` (your email delivery work)
- `feature/vendor-event-portal`: migration `2026_01_18_193338` (colleague's portal work)

## The Fix

### Step 1: Resolve the conflict in schema.rb

Replace this:
```ruby
<<<<<<< feature/vendor-event-portal
ActiveRecord::Schema[7.2].define(version: 2026_01_18_193338) do
=======
ActiveRecord::Schema[7.2].define(version: 2026_01_18_190827) do
>>>>>>> staging
```

With this (use the HIGHER version number):
```ruby
ActiveRecord::Schema[7.2].define(version: 2026_01_18_193338) do
```

### Step 2: Verify both migrations exist

Check that you have BOTH migration files:

```bash
ls db/migrate/*2026_01_18_190827*.rb  # Your migration
ls db/migrate/*2026_01_18_193338*.rb  # Colleague's migration
```

Both should exist. If either is missing, you have a bigger problem.

### Step 3: Run migrations

```bash
bundle exec rails db:migrate
```

This will ensure both migrations have been applied in the correct order.

### Step 4: Commit the resolved schema

```bash
git add db/schema.rb
git commit -m "Resolve schema merge conflict - both migrations applied"
```

## Why This Works

Rails tracks migrations by their timestamp. When you merge:
1. Both migration files are included
2. Rails runs them in timestamp order (yours first at 19:08, then theirs at 19:33)
3. The schema version reflects the LATEST migration applied

## What Each Migration Added

**Your migration (190827)**:
- Likely email delivery tracking changes

**Colleague's migration (193338)**:
- Added `event_portals` table
- Added foreign key from `event_portals` to `events`

Both changes are preserved in the final schema, so no work is lost!
