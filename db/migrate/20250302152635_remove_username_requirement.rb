class RemoveUsernameRequirement < ActiveRecord::Migration[7.0]
  def change
    change_column_null :users, :username, true
  end
end
