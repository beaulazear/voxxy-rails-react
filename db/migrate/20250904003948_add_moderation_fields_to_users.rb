class AddModerationFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :status, :string, default: 'active', null: false
    add_column :users, :suspended_until, :datetime
    add_column :users, :suspension_reason, :text
    add_column :users, :banned_at, :datetime
    add_column :users, :ban_reason, :text
    add_column :users, :warnings_count, :integer, default: 0, null: false
    add_column :users, :reports_count, :integer, default: 0, null: false

    add_index :users, :status
    add_index :users, :suspended_until
    add_index :users, :banned_at
  end
end
