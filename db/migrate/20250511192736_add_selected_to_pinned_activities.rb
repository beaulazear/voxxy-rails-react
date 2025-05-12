class AddSelectedToPinnedActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :pinned_activities, :selected, :boolean, default: false, null: false
  end
end
