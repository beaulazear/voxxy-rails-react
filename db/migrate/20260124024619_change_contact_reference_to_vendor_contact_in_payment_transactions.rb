class ChangeContactReferenceToVendorContactInPaymentTransactions < ActiveRecord::Migration[7.2]
  def change
    # Remove old foreign key constraint
    remove_foreign_key :payment_transactions, :contacts if foreign_key_exists?(:payment_transactions, :contacts)

    # Rename the column from contact_id to vendor_contact_id
    rename_column :payment_transactions, :contact_id, :vendor_contact_id

    # Add new foreign key to vendor_contacts
    add_foreign_key :payment_transactions, :vendor_contacts, column: :vendor_contact_id
  end
end
