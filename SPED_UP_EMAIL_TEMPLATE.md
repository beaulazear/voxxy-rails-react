# Implementation Plan: Sped-Up Event Email Sequence

**Objective:** Introduce a new, selectable "Sped-Up" email sequence template for events. This allows for a compressed 5-day email flow for faster event cycles, while retaining the existing default sequence. This document outlines the necessary database, backend, and implementation script changes.

---

## 1. Database Changes

To support multiple, selectable email sequences, we need to move from hardcoded logic to a data-driven model. This involves two new tables and a modification to the `events` table.

### New Table: `email_sequence_templates`

This table will store the high-level templates a user can choose from.

| Column | Type | Description |
|---|---|---|
| `id` | `bigint` | Primary Key |
| `name` | `string` | The user-facing name of the template (e.g., "Default", "Sped Up 5-Day"). |
| `created_at` | `datetime` | Rails default. |
| `updated_at` | `datetime` | Rails default. |

### New Table: `email_template_definitions`

This table will define each individual email within a sequence template, including its trigger conditions.

| Column | Type | Description |
|---|---|---|
| `id` | `bigint` | Primary Key |
| `email_sequence_template_id` | `bigint` | Foreign Key to `email_sequence_templates.id`. |
| `name` | `string` | Internal name for the email (e.g., "Event Announcement - Day Before Deadline"). |
| `trigger_type` | `string` | The type of trigger: `relative_to_date` or `action`. |
| `trigger_event_date_field` | `string` | (For `relative_to_date`) The event date field to calculate from (e.g., `application_deadline`, `start_date`). |
| `offset_days` | `integer`| (For `relative_to_date`) The number of days to offset from the date field (can be negative). |
| `trigger_action` | `string` | (For `action`) The application action that triggers the email (e.g., `event_created`, `application_accepted`). |
| `sendgrid_template_id` | `string` | The ID of the corresponding email design template in SendGrid. |
| `created_at` | `datetime` | Rails default. |
| `updated_at` | `datetime` | Rails default. |


### Modification to `events` Table

We need to add a foreign key to associate each event with a chosen email sequence.

| Column | Type | Description |
|---|---|---|
| `email_sequence_template_id` | `bigint` | Foreign Key to `email_sequence_templates.id`. Defaults to the "Default" template. |

---

## 2. Backend Code Changes

### New Models

Create the following ActiveRecord models to interface with the new tables.

**`app/models/email_sequence_template.rb`**
```ruby
class EmailSequenceTemplate < ApplicationRecord
  has_many :email_template_definitions, dependent: :destroy
  has_many :events

  validates :name, presence: true, uniqueness: true
end
```

**`app/models/email_template_definition.rb`**
```ruby
class EmailTemplateDefinition < ApplicationRecord
  belongs_to :email_sequence_template

  validates :name, :trigger_type, presence: true
end
```

### `Event` Model Modifications

Update the `Event` model to handle the new association and ensure a default template is always set.

**`app/models/event.rb`**
```ruby
# ... existing Event model code ...
belongs_to :email_sequence_template

before_validation :assign_default_email_sequence, on: :create

private

def assign_default_email_sequence
  self.email_sequence_template ||= EmailSequenceTemplate.find_by(name: 'Default')
end
# ... rest of model
```

### Refactor Email Scheduling Logic

The core email scheduling logic (likely in a service object or background job) must be refactored. Instead of containing hardcoded rules, it should now:
1.  On event creation or update, query the `email_template_definitions` associated with the event's chosen `email_sequence_template`.
2.  Clear any existing scheduled emails for the event to prevent duplicates if dates change.
3.  Iterate through the definitions where `trigger_type` is `relative_to_date`.
4.  For each, calculate the `send_at` timestamp based on the `trigger_event_date_field` and `offset_days`.
5.  Schedule a background job (e.g., `EmailSenderWorker`) for each email, passing the user/event info and the `sendgrid_template_id`.

Action-based emails (`trigger_type: 'action'`) will be triggered directly from the relevant controller actions or service objects (e.g., when a producer accepts an application).

---

## 3. Quick Implementation Rake Task

This Rake task will handle the database migration and seeding of the new templates, allowing for rapid setup.

**`lib/tasks/setup_email_sequences.rake`**
```ruby
namespace :email_sequences do
  desc "Set up email sequence templates and definitions"
  task setup: :environment do
    puts "--> Creating Email Sequence tables..."

    # 1. Create Migration
    migration_content = <<-RUBY
class CreateEmailSequences < ActiveRecord::Migration[6.1]
  def change
    create_table :email_sequence_templates do |t|
      t.string :name, null: false
      t.timestamps
    end
    add_index :email_sequence_templates, :name, unique: true

    create_table :email_template_definitions do |t|
      t.references :email_sequence_template, null: false, foreign_key: true
      t.string :name, null: false
      t.string :trigger_type, null: false # 'relative_to_date' or 'action'
      t.string :trigger_event_date_field
      t.integer :offset_days
      t.string :trigger_action
      t.string :sendgrid_template_id
      t.timestamps
    end

    add_reference :events, :email_sequence_template, foreign_key: true
  end
end
    RUBY

    migration_path = Rails.root.join("db/migrate/#{Time.now.utc.strftime('%Y%m%d%H%M%S')}_create_email_sequences.rb")
    File.write(migration_path, migration_content)
    puts "Generated migration: #{migration_path}"
    puts "--> Run 'rails db:migrate' to apply the changes."

    # 2. Seed Data
    puts "--> Seeding Email Templates..."

    # Create Templates
    default_template = EmailSequenceTemplate.find_or_create_by!(name: 'Default')
    sped_up_template = EmailSequenceTemplate.find_or_create_by!(name: 'Sped Up 5-Day')

    # Clear existing definitions to prevent duplicates on re-run
    EmailTemplateDefinition.where(email_sequence_template: sped_up_template).destroy_all

    # Define and Create "Sped Up" Email Definitions
    sped_up_definitions = [
      # Event Announcement
      { name: 'Event Announcement (Immediate)', trigger_type: 'action', trigger_action: 'event_created', sendgrid_template_id: 'your-sendgrid-id-here' },
      { name: 'Event Announcement (1 Day Before App Deadline)', trigger_type: 'relative_to_date', trigger_event_date_field: 'application_deadline', offset_days: -1, sendgrid_template_id: 'your-sendgrid-id-here' },
      { name: 'Event Announcement (Day of App Deadline)', trigger_type: 'relative_to_date', trigger_event_date_field: 'application_deadline', offset_days: 0, sendgrid_template_id: 'your-sendgrid-id-here' },
      # Payment
      { name: 'Payment Details', trigger_type: 'action', trigger_action: 'application_accepted', sendgrid_template_id: 'your-sendgrid-id-here' },
      { name: 'Payment Reminder (1 Day Before Payment Deadline)', trigger_type: 'relative_to_date', trigger_event_date_field: 'payment_deadline', offset_days: -1, sendgrid_template_id: 'your-sendgrid-id-here' },
      { name: 'Payment Reminder (Day of Payment Deadline)', trigger_type: 'relative_to_date', trigger_event_date_field: 'payment_deadline', offset_days: 0, sendgrid_template_id: 'your-sendgrid-id-here' },
      # Event Countdown
      { name: 'Event Detail Countdown (2 Days Before Event)', trigger_type: 'relative_to_date', trigger_event_date_field: 'start_date', offset_days: -2, sendgrid_template_id: 'your-sendgrid-id-here' },
      { name: 'Event Detail Countdown (1 Day Before Event)', trigger_type: 'relative_to_date', trigger_event_date_field: 'start_date', offset_days: -1, sendgrid_template_id: 'your-sendgrid-id-here' },
      { name: 'Event Detail Countdown (Day of Event)', trigger_type: 'relative_to_date', trigger_event_date_field: 'start_date', offset_days: 0, sendgrid_template_id: 'your-sendgrid-id-here' },
      { name: 'Post Event Email', trigger_type: 'relative_to_date', trigger_event_date_field: 'end_date', offset_days: 1, sendgrid_template_id: 'your-sendgrid-id-here' },
    ]

    sped_up_definitions.each do |definition|
      sped_up_template.email_template_definitions.create!(definition)
    end

    puts "Seeded #{sped_up_template.email_template_definitions.count} definitions for 'Sped Up 5-Day' template."
    puts "NOTE: 'Default' template definitions should be added here as well, based on the current system's logic."

    # 3. Backfill Existing Events
    puts "--> Backfilling existing events to use the 'Default' template..."
    Event.where(email_sequence_template_id: nil).update_all(email_sequence_template_id: default_template.id)
    puts "Done."
  end
end
```
**To run the task:** `rails email_sequences:setup`

---

## 4. UI/Frontend (Future Consideration)

While out of scope for the initial implementation, a dropdown menu should be added to the event creation/edit form. This will allow producers to select either the "Default" or "Sped Up 5-Day" `EmailSequenceTemplate` for their event. The selected ID will be saved to the `events.email_sequence_template_id` field.
