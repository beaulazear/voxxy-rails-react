class RemoveCheckEmailSourceConstraint < ActiveRecord::Migration[7.2]
  def up
    # Remove the old constraint that blocked valid invitation-based scheduled emails
    # Old rule: EXACTLY ONE of (scheduled_email_id OR event_invitation_id) must be set
    # Problem: This blocked scheduled_email_id + event_invitation_id (invitation reminders)
    remove_check_constraint :email_deliveries, name: "check_email_source"

    # Add new constraint that allows valid combinations:
    # ✓ scheduled_email_id + registration_id (registration-based scheduled emails)
    # ✓ scheduled_email_id + event_invitation_id (invitation-based scheduled emails)
    # ✓ event_invitation_id only (initial invitations)
    # ✗ registration_id + event_invitation_id (ambiguous recipient - blocked by model validation)
    #
    # New rule: Must have at least one source (scheduled_email_id OR event_invitation_id)
    add_check_constraint :email_deliveries,
      "scheduled_email_id IS NOT NULL OR event_invitation_id IS NOT NULL",
      name: "check_email_source_present"
  end

  def down
    # Restore the old constraint if rolling back
    remove_check_constraint :email_deliveries, name: "check_email_source_present"

    add_check_constraint :email_deliveries,
      "scheduled_email_id IS NOT NULL AND event_invitation_id IS NULL OR scheduled_email_id IS NULL AND event_invitation_id IS NOT NULL",
      name: "check_email_source"
  end
end
