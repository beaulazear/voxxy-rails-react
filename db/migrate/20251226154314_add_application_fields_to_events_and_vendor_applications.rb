class AddApplicationFieldsToEventsAndVendorApplications < ActiveRecord::Migration[7.2]
  def change
    # Add application_deadline to events (nullable to support legacy data)
    add_column :events, :application_deadline, :datetime
    add_index :events, :application_deadline

    # Add booth_price to vendor_applications (nullable to support legacy data)
    add_column :vendor_applications, :booth_price, :decimal, precision: 8, scale: 2
  end
end
