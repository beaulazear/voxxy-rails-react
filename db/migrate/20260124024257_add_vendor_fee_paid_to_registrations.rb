class AddVendorFeePaidToRegistrations < ActiveRecord::Migration[7.2]
  def change
    add_column :registrations, :vendor_fee_paid, :boolean, default: false
    add_index :registrations, :vendor_fee_paid
  end
end
