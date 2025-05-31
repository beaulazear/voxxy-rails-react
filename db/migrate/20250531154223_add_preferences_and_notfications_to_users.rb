class AddPreferencesAndNotficationsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :preferences, :string, default: "", null: false
    add_column :users, :text_notifications, :boolean, default: true, null: false
    add_column :users, :email_notifications, :boolean, default: true, null: false
    add_column :users, :push_notifications, :boolean, default: true, null: false
  end
end
