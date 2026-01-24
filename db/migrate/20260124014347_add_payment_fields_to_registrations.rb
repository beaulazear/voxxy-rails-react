class AddPaymentFieldsToRegistrations < ActiveRecord::Migration[7.2]
  def change
    add_column :registrations, :payment_transaction_id, :bigint
    add_column :registrations, :payment_provider, :string
    add_column :registrations, :payment_amount, :decimal, precision: 10, scale: 2

    add_index :registrations, :payment_transaction_id
    add_foreign_key :registrations, :payment_transactions, column: :payment_transaction_id
  end
end
