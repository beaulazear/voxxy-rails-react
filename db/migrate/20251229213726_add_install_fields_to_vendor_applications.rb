class AddInstallFieldsToVendorApplications < ActiveRecord::Migration[7.2]
  def change
    add_column :vendor_applications, :install_date, :datetime
    add_column :vendor_applications, :install_start_time, :string
    add_column :vendor_applications, :install_end_time, :string
    add_column :vendor_applications, :payment_link, :string
  end
end
