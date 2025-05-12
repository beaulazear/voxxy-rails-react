class AddFinalizedToActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :activities, :finalized, :boolean, default: false
  end
end
