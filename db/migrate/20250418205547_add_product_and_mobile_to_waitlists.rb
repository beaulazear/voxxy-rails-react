class AddProductAndMobileToWaitlists < ActiveRecord::Migration[7.2]
  def change
    add_column :waitlists, :product, :boolean, default: false, null: false
    add_column :waitlists, :mobile,  :boolean, default: false, null: false
  end
end
