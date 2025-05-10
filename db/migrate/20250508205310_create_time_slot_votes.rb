class CreateTimeSlotVotes < ActiveRecord::Migration[7.2]
  def change
    create_table :time_slot_votes do |t|
      t.references :user,       null: false, foreign_key: true
      t.references :time_slot,  null: false, foreign_key: true
      t.boolean    :upvote,     default: true, null: false
      t.timestamps
    end

    add_index :time_slot_votes, [ :user_id, :time_slot_id ], unique: true
  end
end
