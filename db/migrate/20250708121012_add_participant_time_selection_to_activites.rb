class AddParticipantTimeSelectionToActivites < ActiveRecord::Migration[7.2]
  def change
    add_column :activities, :allow_participant_time_selection, :boolean, default: false
  end
end
