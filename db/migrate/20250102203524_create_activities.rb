class CreateActivities < ActiveRecord::Migration[7.2]
  def change
    create_table :activities do |t|
      t.references :user, null: false, foreign_key: true
      t.string :activity_name
      t.string :activity_location
      t.integer :group_size
      t.string :date_notes
      t.string :activity_type

      t.timestamps
    end
  end
end
