class AddVendorFieldsToRegistrations < ActiveRecord::Migration[7.2]
  def change
    add_reference :registrations, :vendor_application, null: true, foreign_key: true
    add_column :registrations, :business_name, :string
    add_column :registrations, :vendor_category, :string

    add_index :registrations, :vendor_category
    add_index :registrations, [ :vendor_application_id, :status ]
  end
end
