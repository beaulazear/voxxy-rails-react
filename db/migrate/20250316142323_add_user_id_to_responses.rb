class AddUserIdToResponses < ActiveRecord::Migration[7.2]
  def change
    add_reference :responses, :user, null: false, foreign_key: true
  end
end
