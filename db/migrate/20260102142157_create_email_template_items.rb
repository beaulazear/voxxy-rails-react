class CreateEmailTemplateItems < ActiveRecord::Migration[7.2]
  def change
    create_table :email_template_items do |t|
      # Belongs to a campaign template
      t.references :email_campaign_template, foreign_key: true, null: false

      # Email identity
      t.string :name, null: false                       # "Applications Now Open"
      t.text :description                               # "Announces application opening"
      t.string :category                                # 'event_announcements', 'payment_reminders', etc.
      t.integer :position, default: 0                   # Order within template (1-40)

      # Email content (with variables like [eventName])
      t.string :subject_template, null: false
      t.text :body_template, null: false                # HTML with variables

      # Trigger configuration
      t.string :trigger_type, null: false               # 'days_before_event', 'days_after_event', 'days_before_deadline', 'on_event_date'
      t.integer :trigger_value                          # Number of days (e.g., 7 for "7 days before")
      t.time :trigger_time                              # What time to send (e.g., 09:00)

      # Recipient filtering (JSONB for flexible filtering)
      t.jsonb :filter_criteria, default: {}

      # Control
      t.boolean :enabled_by_default, default: true

      t.timestamps
    end

    add_index :email_template_items, [ :email_campaign_template_id, :position ]
    add_index :email_template_items, :category
    add_index :email_template_items, :filter_criteria, using: :gin

    # Add check constraint: position between 1 and 40
    add_check_constraint :email_template_items, "position >= 1 AND position <= 40", name: "position_range"
  end
end
