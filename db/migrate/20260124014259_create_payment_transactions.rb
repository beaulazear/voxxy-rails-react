class CreatePaymentTransactions < ActiveRecord::Migration[7.2]
  def change
    create_table :payment_transactions do |t|
      t.references :payment_integration, foreign_key: true, null: false
      t.references :event, foreign_key: true, null: false
      t.references :contact, foreign_key: true # Matched vendor contact
      t.references :registration, foreign_key: true # Matched registration

      # Provider data
      t.string :provider_transaction_id, null: false # Eventbrite order ID
      t.string :provider, null: false # 'eventbrite'

      # Payer information
      t.string :payer_email, null: false
      t.string :payer_first_name
      t.string :payer_last_name

      # Transaction details
      t.string :provider_status # 'placed', 'refunded', 'cancelled' (provider-specific)
      t.integer :payment_status, default: 0, null: false # enum: pending, paid, refunded, cancelled
      t.decimal :amount, precision: 10, scale: 2
      t.string :currency, default: 'USD'

      # Timestamps
      t.datetime :transaction_created_at # From provider
      t.datetime :transaction_updated_at # From provider
      t.datetime :last_synced_at

      # Email tracking
      t.datetime :payment_confirmation_sent_at

      # Metadata
      t.jsonb :raw_provider_data, default: {} # Full JSON response for debugging
      t.text :notes # Manual notes from producer

      t.timestamps
    end

    add_index :payment_transactions, :provider_transaction_id, unique: true
    add_index :payment_transactions, [:event_id, :payer_email]
    add_index :payment_transactions, :payment_status
  end
end
