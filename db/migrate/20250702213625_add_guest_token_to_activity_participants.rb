class AddGuestTokenToActivityParticipants < ActiveRecord::Migration[7.2]
  def change
    add_column :activity_participants, :guest_response_token, :string
    add_index :activity_participants, :guest_response_token, unique: true

    # Generate tokens for existing participants
    reversible do |dir|
      dir.up do
        ActivityParticipant.find_each do |participant|
          participant.update_column(:guest_response_token, SecureRandom.urlsafe_base64(32))
        end
      end
    end
  end
end
