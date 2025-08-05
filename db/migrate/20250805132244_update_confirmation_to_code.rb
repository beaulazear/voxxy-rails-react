class UpdateConfirmationToCode < ActiveRecord::Migration[7.2]
  def change
    rename_column :users, :confirmation_token, :confirmation_code
    add_column :users, :confirmation_sent_at, :datetime
  end
end
