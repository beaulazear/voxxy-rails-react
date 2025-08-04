class AddLocationToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :neighborhood, :string
    add_column :users, :city, :string
    add_column :users, :state, :string
    add_column :users, :latitude, :decimal, precision: 10, scale: 6
    add_column :users, :longitude, :decimal, precision: 10, scale: 6

    # Add indexes for commonly queried location fields
    add_index :users, :city
    add_index :users, :state
    add_index :users, [ :latitude, :longitude ]
  end
end
