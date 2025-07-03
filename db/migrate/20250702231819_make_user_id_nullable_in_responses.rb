class MakeUserIdNullableInResponses < ActiveRecord::Migration[7.2]
  def change
    change_column_null :responses, :user_id, true
  end
end
