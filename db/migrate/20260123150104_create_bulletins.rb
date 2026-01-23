class CreateBulletins < ActiveRecord::Migration[7.2]
  def change
    create_table :bulletins do |t|
      t.references :event, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }

      t.string :subject, null: false
      t.text :body, null: false
      t.string :bulletin_type, default: "announcement"
      t.boolean :pinned, default: false
      t.integer :view_count, default: 0

      # For future features like attachments metadata, styling, etc.
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :bulletins, [ :event_id, :pinned ]
    add_index :bulletins, [ :event_id, :created_at ]
  end
end
