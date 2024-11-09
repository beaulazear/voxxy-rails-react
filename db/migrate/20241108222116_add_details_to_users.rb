class AddDetailsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :username, :string
    add_column :users, :email, :string
    add_column :users, :password_digest, :string
  end
end
