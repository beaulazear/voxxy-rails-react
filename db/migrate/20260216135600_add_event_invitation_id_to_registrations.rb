class AddEventInvitationIdToRegistrations < ActiveRecord::Migration[7.2]
  def change
    # Add foreign key to link registrations back to the invitation that led to them
    # NULL allowed because not all registrations come from invitations (some apply directly)
    add_reference :registrations, :event_invitation, null: true, foreign_key: true, index: true
  end
end
