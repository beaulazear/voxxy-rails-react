class MakeEmailDeliveryFlexibleForInvitations < ActiveRecord::Migration[7.2]
  def change
    # Make scheduled_email_id and registration_id nullable for invitation emails
    change_column_null :email_deliveries, :scheduled_email_id, true
    change_column_null :email_deliveries, :registration_id, true

    # Add event_invitation_id for tracking invitation email deliveries
    add_reference :email_deliveries, :event_invitation, foreign_key: true, index: true

    # Add validation check constraint to ensure either scheduled_email_id OR event_invitation_id is present
    # This maintains data integrity while allowing both types of email tracking
    reversible do |dir|
      dir.up do
        execute <<-SQL
          ALTER TABLE email_deliveries
          ADD CONSTRAINT check_email_source
          CHECK (
            (scheduled_email_id IS NOT NULL AND event_invitation_id IS NULL) OR
            (scheduled_email_id IS NULL AND event_invitation_id IS NOT NULL)
          );
        SQL
      end

      dir.down do
        execute "ALTER TABLE email_deliveries DROP CONSTRAINT IF EXISTS check_email_source;"
      end
    end
  end
end
