class CreateEmailDeliveries < ActiveRecord::Migration[7.2]
  def change
    create_table :email_deliveries do |t|
      # Email associations
      t.references :scheduled_email, foreign_key: true, null: false, index: true
      t.references :event, foreign_key: true, null: false
      t.references :registration, foreign_key: true, null: false

      # Email identifiers
      t.string :sendgrid_message_id, null: false        # From SendGrid response
      t.string :recipient_email, null: false

      # Delivery tracking (updated via SendGrid webhook)
      t.string :status, null: false, default: 'queued'
      # Status values: 'queued', 'sent', 'delivered', 'bounced', 'dropped', 'unsubscribed'

      t.string :bounce_type              # 'soft' or 'hard'
      t.text :bounce_reason              # From SendGrid bounce event
      t.text :drop_reason                # From SendGrid dropped event

      # Event timestamps (from SendGrid webhook)
      t.datetime :sent_at
      t.datetime :delivered_at
      t.datetime :bounced_at
      t.datetime :dropped_at
      t.datetime :unsubscribed_at

      # Auto-retry logic for soft bounces
      t.integer :retry_count, default: 0
      t.datetime :next_retry_at
      t.integer :max_retries, default: 3

      t.timestamps
    end

    add_index :email_deliveries, :sendgrid_message_id, unique: true
    add_index :email_deliveries, [ :event_id, :status ]
    add_index :email_deliveries, [ :registration_id, :status ]
    add_index :email_deliveries, :next_retry_at, where: "next_retry_at IS NOT NULL"
  end
end
