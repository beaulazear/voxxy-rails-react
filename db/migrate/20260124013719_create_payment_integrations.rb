class CreatePaymentIntegrations < ActiveRecord::Migration[7.2]
  def change
    create_table :payment_integrations do |t|
      t.references :event, foreign_key: true, null: false
      t.references :organization, foreign_key: true, null: false

      # Provider info
      t.string :provider, null: false # 'eventbrite', 'stripe', etc.
      t.string :provider_event_id # External event ID
      t.string :provider_url # Full payment link

      # Configuration
      t.boolean :auto_sync_enabled, default: true
      t.boolean :auto_update_payment_status, default: true
      t.boolean :auto_send_confirmations, default: false

      # Sync state
      t.string :sync_status, default: 'active' # 'active', 'paused', 'error', 'inactive'
      t.datetime :last_synced_at
      t.jsonb :sync_metadata, default: {}

      t.timestamps
    end

    add_index :payment_integrations, [:event_id, :provider], unique: true
  end
end
