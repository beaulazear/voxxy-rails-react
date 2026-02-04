class AddAccessTokenToEventPortals < ActiveRecord::Migration[7.2]
  def change
    add_column :event_portals, :access_token, :string
    add_index :event_portals, :access_token, unique: true

    # Backfill existing event_portals with secure tokens
    reversible do |dir|
      dir.up do
        EventPortal.reset_column_information
        EventPortal.find_each do |portal|
          portal.update_column(:access_token, SecureRandom.urlsafe_base64(32))
        end
      end
    end

    # Make access_token NOT NULL after backfilling
    change_column_null :event_portals, :access_token, false
  end
end
