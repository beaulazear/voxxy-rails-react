class ModifyResponsesForGuestUsers < ActiveRecord::Migration[7.2]
  def change
    # Add email field first
    add_column :responses, :email, :string

    # Add unique constraint for email responses only (not affecting user responses)
    add_index :responses, [ :activity_id, :email ], unique: true, where: "email IS NOT NULL", name: 'index_responses_on_activity_and_email'

    # Add a check constraint to ensure either user_id or email is present
    # This will work with your existing validation logic
    add_check_constraint :responses,
      "(user_id IS NOT NULL) OR (email IS NOT NULL)",
      name: "responses_user_or_email_present"
  end

  def down
    remove_check_constraint :responses, name: "responses_user_or_email_present"
    remove_index :responses, name: 'index_responses_on_activity_and_email'
    remove_column :responses, :email
  end
end
