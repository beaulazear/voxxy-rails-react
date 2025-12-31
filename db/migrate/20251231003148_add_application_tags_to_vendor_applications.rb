class AddApplicationTagsToVendorApplications < ActiveRecord::Migration[7.2]
  def change
    add_column :vendor_applications, :application_tags, :string
  end
end
