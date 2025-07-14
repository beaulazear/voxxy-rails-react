class AddPushTokenToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :push_token, :string
    add_column :users, :platform, :string
  end
end
