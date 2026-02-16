class AddSubjectToEmailDeliveries < ActiveRecord::Migration[7.2]
  def up
    add_column :email_deliveries, :subject, :string
    add_index :email_deliveries, :subject

    # Backfill subject for existing scheduled emails
    execute <<-SQL
      UPDATE email_deliveries
      SET subject = scheduled_emails.subject_template
      FROM scheduled_emails
      WHERE email_deliveries.scheduled_email_id = scheduled_emails.id
        AND email_deliveries.subject IS NULL
        AND scheduled_emails.subject_template IS NOT NULL
    SQL

    # For invitation and notification emails without subjects,
    # the serializer will provide fallback subjects
  end

  def down
    remove_index :email_deliveries, :subject
    remove_column :email_deliveries, :subject
  end
end
