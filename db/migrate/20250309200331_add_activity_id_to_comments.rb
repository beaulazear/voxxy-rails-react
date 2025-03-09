class AddActivityIdToComments < ActiveRecord::Migration[7.2]
  def change
    add_column :comments, :activity_id, :bigint
  end
end
