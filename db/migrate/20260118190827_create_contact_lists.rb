class CreateContactLists < ActiveRecord::Migration[7.2]
  def change
    create_table :contact_lists do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :name, null: false
      t.string :list_type, null: false # 'smart' or 'manual'
      t.text :description

      # For smart lists (dynamic filters)
      t.jsonb :filters, default: {}

      # For manual lists (static selection)
      t.integer :contact_ids, array: true, default: []

      # Metadata
      t.integer :contacts_count, default: 0
      t.datetime :last_used_at

      t.timestamps
    end

    add_index :contact_lists, [ :organization_id, :name ], unique: true
    add_index :contact_lists, :list_type
    add_index :contact_lists, :filters, using: :gin
  end
end
