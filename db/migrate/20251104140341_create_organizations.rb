class CreateOrganizations < ActiveRecord::Migration[7.2]
  def change
    create_table :organizations do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.string :logo_url
      t.string :website
      t.string :instagram_handle
      t.string :phone
      t.string :email
      t.string :address
      t.string :city
      t.string :state
      t.string :zip_code
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6
      t.boolean :verified, default: false
      t.boolean :active, default: true

      t.timestamps
    end

    add_index :organizations, :slug, unique: true
    add_index :organizations, :active
  end
end
