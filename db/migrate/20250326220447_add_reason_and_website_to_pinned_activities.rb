class AddReasonAndWebsiteToPinnedActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :pinned_activities, :reason, :text
    add_column :pinned_activities, :website, :string
  end
end
