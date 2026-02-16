class AddEmailTypeToEmailDeliveries < ActiveRecord::Migration[7.2]
  def up
    add_column :email_deliveries, :email_type, :string
    add_index :email_deliveries, :email_type

    # CRITICAL FIX: Update CHECK constraint to allow registration_id as valid email source
    # This allows notification emails (application received, approved, etc.) to be tracked
    remove_check_constraint :email_deliveries, name: "check_email_source_present"
    add_check_constraint :email_deliveries,
      "scheduled_email_id IS NOT NULL OR event_invitation_id IS NOT NULL OR registration_id IS NOT NULL",
      name: "check_email_source_present"

    # Set default values for existing records based on their associations
    # Existing invitation emails
    execute <<-SQL
      UPDATE email_deliveries
      SET email_type = 'invitation'
      WHERE event_invitation_id IS NOT NULL AND scheduled_email_id IS NULL
    SQL

    # Existing scheduled emails
    execute <<-SQL
      UPDATE email_deliveries
      SET email_type = 'scheduled'
      WHERE scheduled_email_id IS NOT NULL
    SQL

    # Any remaining emails default to notification
    execute <<-SQL
      UPDATE email_deliveries
      SET email_type = 'notification'
      WHERE email_type IS NULL
    SQL
  end

  def down
    # Restore original constraint
    remove_check_constraint :email_deliveries, name: "check_email_source_present"
    add_check_constraint :email_deliveries,
      "scheduled_email_id IS NOT NULL OR event_invitation_id IS NOT NULL",
      name: "check_email_source_present"

    remove_index :email_deliveries, :email_type
    remove_column :email_deliveries, :email_type
  end
end
