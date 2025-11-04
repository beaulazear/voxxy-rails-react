class CreateVendors < ActiveRecord::Migration[7.2]
  def change
    create_table :vendors do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :slug, null: false
      t.string :vendor_type, null: false # 'venue', 'catering', 'entertainment', 'market_vendor'
      t.text :description
      t.string :logo_url
      t.string :website
      t.string :instagram_handle
      t.string :contact_email
      t.string :phone
      t.json :services # Flexible field for vendor-specific services
      t.json :pricing # Flexible field for pricing info
      t.string :address
      t.string :city
      t.string :state
      t.string :zip_code
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6
      t.boolean :verified, default: false
      t.boolean :active, default: true
      t.integer :views_count, default: 0
      t.decimal :rating, precision: 3, scale: 2

      t.timestamps
    end

    add_index :vendors, :slug, unique: true
    add_index :vendors, :vendor_type
    add_index :vendors, :active
    add_index :vendors, :verified
  end
end
