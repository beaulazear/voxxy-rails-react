class AddRadiusAndChangeGroupSizeTypeToActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :activities, :radius, :integer
    change_column :activities, :group_size, :string
  end
end
