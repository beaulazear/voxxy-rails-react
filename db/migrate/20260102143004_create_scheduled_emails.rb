class CreateScheduledEmails < ActiveRecord::Migration[7.2]
  def change
    create_table :scheduled_emails do |t|
      # Event association
      t.references :event, foreign_key: true, null: false

      # Template tracking (where this email came from)
      t.references :email_campaign_template, foreign_key: true  # Which template collection
      t.references :email_template_item, foreign_key: true      # Which specific email in template

      # Email details (customizable per event - copied from template_item)
      t.string :name, null: false
      t.string :subject_template                        # Can be edited from template
      t.text :body_template                             # Can be edited from template

      # Scheduling (customizable per event)
      t.string :trigger_type                            # Can override template
      t.integer :trigger_value                          # Can override template
      t.time :trigger_time                              # Can override template
      t.datetime :scheduled_for                         # Computed: when to actually send (UTC)

      # Recipient filtering (customizable per event)
      t.jsonb :filter_criteria, default: {}

      # Status tracking
      t.string :status, default: 'scheduled'            # 'scheduled', 'paused', 'sent', 'failed', 'cancelled'
      t.datetime :sent_at
      t.integer :recipient_count, default: 0            # How many recipients received this email
      t.text :error_message                             # If status='failed'

      t.timestamps
    end

    add_index :scheduled_emails, [ :event_id, :status ]
    add_index :scheduled_emails, [ :status, :scheduled_for ]  # For background job queries
    # Note: index on email_campaign_template_id is automatically created by t.references above
    add_index :scheduled_emails, :filter_criteria, using: :gin
  end
end
