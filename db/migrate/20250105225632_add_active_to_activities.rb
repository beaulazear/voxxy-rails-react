class AddActiveToActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :activities, :active, :boolean, default: true, null: false
  end
end
