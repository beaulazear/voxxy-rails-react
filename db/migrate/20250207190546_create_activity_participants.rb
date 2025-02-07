class CreateActivityParticipants < ActiveRecord::Migration[7.2]
  def change
    create_table :activity_participants do |t|
      t.references :user, foreign_key: true, null: true  # Nullable for pending invites
      t.references :activity, foreign_key: true, null: false
      t.string :invited_email, null: true  # Stores email for users who haven't signed up
      t.boolean :accepted, default: false, null: false  # Tracks invite status

      t.timestamps
    end
  end
end
