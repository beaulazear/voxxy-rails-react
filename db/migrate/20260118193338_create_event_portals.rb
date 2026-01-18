class CreateEventPortals < ActiveRecord::Migration[7.2]
  def change
    create_table :event_portals do |t|
      t.references :event, null: false, foreign_key: true, index: { unique: true }
      t.integer :view_count, default: 0
      t.datetime :last_viewed_at

      t.timestamps
    end
  end
end
