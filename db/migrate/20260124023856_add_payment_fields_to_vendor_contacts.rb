class AddPaymentFieldsToVendorContacts < ActiveRecord::Migration[7.2]
  def change
    add_column :vendor_contacts, :payment_status, :integer, default: 0
    add_column :vendor_contacts, :payment_transaction_id, :bigint
    add_column :vendor_contacts, :payment_provider, :string
    add_column :vendor_contacts, :payment_amount, :decimal, precision: 10, scale: 2
    add_column :vendor_contacts, :payment_date, :datetime

    add_index :vendor_contacts, :payment_status
    add_index :vendor_contacts, :payment_transaction_id
    add_foreign_key :vendor_contacts, :payment_transactions, column: :payment_transaction_id
  end
end
