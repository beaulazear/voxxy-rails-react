class CreateEventInvitations < ActiveRecord::Migration[7.2]
  def change
    create_table :event_invitations do |t|
      t.references :event, null: false, foreign_key: true
      t.references :vendor_contact, null: false, foreign_key: true
      t.string :status, default: "pending", null: false
      t.string :invitation_token, null: false
      t.datetime :sent_at
      t.datetime :responded_at
      t.text :response_notes
      t.datetime :expires_at

      t.timestamps
    end

    # Ensure unique invitation per event per contact
    add_index :event_invitations, [ :event_id, :vendor_contact_id ], unique: true
    # Fast lookups by token
    add_index :event_invitations, :invitation_token, unique: true
    # Filter by status
    add_index :event_invitations, :status
  end
end
