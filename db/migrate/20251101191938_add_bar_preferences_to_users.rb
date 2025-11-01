class AddBarPreferencesToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :bar_preferences, :string
  end
end
