class AddSocialAndLocationToVendorContacts < ActiveRecord::Migration[7.2]
  def change
    # Add social media fields (matching Registration model)
    add_column :vendor_contacts, :instagram_handle, :string
    add_column :vendor_contacts, :tiktok_handle, :string
    add_column :vendor_contacts, :website, :string

    # Add location field
    add_column :vendor_contacts, :location, :string

    # Add categories array (JSONB) for multiple category support
    add_column :vendor_contacts, :categories, :jsonb, default: []

    # Add featured/favorite flag
    add_column :vendor_contacts, :featured, :boolean, default: false

    # Rename company_name to business_name for consistency with Registration model
    rename_column :vendor_contacts, :company_name, :business_name

    # Add indexes for performance
    add_index :vendor_contacts, :featured
    add_index :vendor_contacts, :location
    add_index :vendor_contacts, :categories, using: :gin
  end
end
