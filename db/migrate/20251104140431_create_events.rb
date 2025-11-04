class CreateEvents < ActiveRecord::Migration[7.2]
  def change
    create_table :events do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :title, null: false
      t.string :slug, null: false
      t.text :description
      t.datetime :event_date
      t.datetime :event_end_date
      t.string :location
      t.string :poster_url
      t.string :ticket_url
      t.decimal :ticket_price, precision: 8, scale: 2
      t.integer :capacity
      t.integer :registered_count, default: 0
      t.boolean :published, default: false
      t.boolean :registration_open, default: true
      t.string :status # 'draft', 'published', 'cancelled', 'completed'

      t.timestamps
    end

    add_index :events, :slug, unique: true
    add_index :events, :event_date
    add_index :events, :published
    add_index :events, :status
  end
end
