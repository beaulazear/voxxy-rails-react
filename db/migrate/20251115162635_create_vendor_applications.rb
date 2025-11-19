class CreateVendorApplications < ActiveRecord::Migration[7.2]
  def change
    create_table :vendor_applications do |t|
      t.references :event, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.string :status, default: 'active', null: false
      t.jsonb :categories, default: []
      t.integer :submissions_count, default: 0

      t.timestamps
    end

    add_index :vendor_applications, :status
    add_index :vendor_applications, :created_at
  end
end
