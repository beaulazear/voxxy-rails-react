class AddUserIdToResponses < ActiveRecord::Migration[7.2]
  def change
    add_column :responses, :user_id, :bigint, null: true
    add_foreign_key :responses, :users, column: :user_id, on_delete: :cascade
  end
end
