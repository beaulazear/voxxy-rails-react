class AddActivitySummaryToActivities < ActiveRecord::Migration[6.1]
  def change
    add_column :activities, :activity_summary, :text
  end
end
