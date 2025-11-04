class AddProductFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :role, :string, default: 'consumer'
    add_column :users, :product_context, :string # 'mobile', 'presents', 'both'

    add_index :users, :role
  end
end
