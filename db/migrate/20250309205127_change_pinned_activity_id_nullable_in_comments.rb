class ChangePinnedActivityIdNullableInComments < ActiveRecord::Migration[7.2]
  def change
    change_column_null :comments, :pinned_activity_id, true
  end
end
