class AddIsSoloToActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :activities, :is_solo, :boolean, default: false, null: false
  end
end
