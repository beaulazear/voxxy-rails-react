class CreatePaymentSyncLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :payment_sync_logs do |t|
      t.references :payment_integration, foreign_key: true, null: false
      t.string :sync_type # 'full', 'incremental', 'manual'
      t.integer :transactions_fetched, default: 0
      t.integer :transactions_inserted, default: 0
      t.integer :transactions_updated, default: 0
      t.integer :contacts_matched, default: 0
      t.integer :contacts_updated, default: 0 # Payment status updated
      t.integer :registrations_updated, default: 0 # vendor_fee_paid toggled
      t.text :errors
      t.jsonb :metadata, default: {} # API response times, pagination info, etc.
      t.datetime :started_at
      t.datetime :completed_at
      t.timestamps
    end
  end
end
