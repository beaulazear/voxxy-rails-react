class CreatePinnedActivities < ActiveRecord::Migration[7.2]
  def change
    create_table :pinned_activities do |t|
      t.references :activity, null: false, foreign_key: true
      t.string :title
      t.string :hours
      t.string :price_range
      t.string :address
      t.integer :votes
      t.text :description

      t.timestamps
    end
  end
end
