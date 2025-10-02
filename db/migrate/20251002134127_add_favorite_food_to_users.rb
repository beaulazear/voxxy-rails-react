class AddFavoriteFoodToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :favorite_food, :string
  end
end
