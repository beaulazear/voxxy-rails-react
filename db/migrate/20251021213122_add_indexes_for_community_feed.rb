class AddIndexesForCommunityFeed < ActiveRecord::Migration[7.2]
  def change
    # Composite index for querying community favorites efficiently
    add_index :user_activities, [ :user_id, :favorited, :created_at ],
              name: "index_user_activities_on_community_feed"

    # Additional indexes for the activity_participants table queries
    add_index :activity_participants, [ :activity_id, :accepted ],
              name: "index_activity_participants_on_activity_and_accepted",
              if_not_exists: true

    add_index :activity_participants, [ :user_id, :accepted ],
              name: "index_activity_participants_on_user_and_accepted",
              if_not_exists: true
  end
end
