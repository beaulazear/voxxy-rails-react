class CreateUserActivities < ActiveRecord::Migration[7.2]
  def change
    create_table :user_activities do |t|
      # Foreign key associations
      t.references :user, null: false, foreign_key: true
      t.references :pinned_activity, null: false, foreign_key: true

      # Core fields mirroring pinned_activities structure
      t.string :title
      t.string :hours
      t.string :price_range
      t.string :address
      t.text :description
      t.text :reason
      t.string :website

      # JSON serialized fields (same as pinned_activities)
      t.text :reviews
      t.text :photos

      # New boolean fields for user interactions
      t.boolean :flagged, default: false, null: false
      t.boolean :favorited, default: false, null: false

      # Prevent duplicate user-pinned_activity combinations
      t.index [ :user_id, :pinned_activity_id ], unique: true, name: 'index_user_activities_on_user_and_pinned_activity'

      t.timestamps
    end
  end
end
