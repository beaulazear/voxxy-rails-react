class AddCompletedToActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :activities, :completed, :boolean, default: false
  end
end
