class CreateVendorContacts < ActiveRecord::Migration[7.2]
  def change
    create_table :vendor_contacts do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :vendor, null: true, foreign_key: true
      t.references :registration, null: true, foreign_key: true

      # Contact information
      t.string :name, null: false
      t.string :email
      t.string :phone
      t.string :company_name
      t.string :job_title

      # CRM fields
      t.string :contact_type  # lead, vendor, partner, etc
      t.string :status, default: "new"  # new, contacted, interested, converted, closed
      t.text :notes
      t.jsonb :tags, default: []
      t.integer :interaction_count, default: 0
      t.datetime :last_contacted_at

      # Source tracking
      t.string :source  # application, import, manual_entry
      t.datetime :imported_at

      t.timestamps
    end

    # Note: organization_id, vendor_id, and registration_id indexes are created automatically by t.references
    add_index :vendor_contacts, :status
    add_index :vendor_contacts, :email
    add_index :vendor_contacts, :contact_type
    add_index :vendor_contacts, [ :organization_id, :status ]
    add_index :vendor_contacts, :created_at
  end
end
