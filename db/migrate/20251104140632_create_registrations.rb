class CreateRegistrations < ActiveRecord::Migration[7.2]
  def change
    create_table :registrations do |t|
      t.references :event, null: false, foreign_key: true
      t.references :user, foreign_key: true # nullable for guest registrations
      t.string :email, null: false
      t.string :name
      t.string :phone
      t.boolean :subscribed, default: false
      t.string :ticket_code
      t.string :qr_code_url
      t.boolean :checked_in, default: false
      t.datetime :checked_in_at
      t.string :status # 'pending', 'confirmed', 'cancelled'

      t.timestamps
    end

    add_index :registrations, :email
    add_index :registrations, :ticket_code, unique: true
    add_index :registrations, :status
  end
end
