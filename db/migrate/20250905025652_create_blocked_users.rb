class CreateBlockedUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :blocked_users do |t|
      t.references :blocker, null: false, foreign_key: { to_table: :users }
      t.references :blocked, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end

    # Ensure a user can't block the same person twice
    add_index :blocked_users, [ :blocker_id, :blocked_id ], unique: true
  end
end
