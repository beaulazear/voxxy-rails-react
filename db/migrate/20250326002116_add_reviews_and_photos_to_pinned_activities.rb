class AddReviewsAndPhotosToPinnedActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :pinned_activities, :reviews, :text
    add_column :pinned_activities, :photos, :text
  end
end
