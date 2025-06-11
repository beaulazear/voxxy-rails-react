class AddCollectingAndVotingToActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :activities, :collecting, :boolean, default: false
    add_column :activities, :voting,    :boolean, default: false
  end
end
