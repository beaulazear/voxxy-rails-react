class CreateTimeSlots < ActiveRecord::Migration[7.2]
  def change
    create_table :time_slots do |t|
      t.references :activity, null: false, foreign_key: true
      t.date       :date,     null: false
      t.time       :time,     null: false
      t.timestamps
    end

    add_index :time_slots, [ :activity_id, :date, :time ], unique: true
  end
end
