class AddEmailUnsubscribedToVendorRegistrations < ActiveRecord::Migration[7.2]
  def change
    add_column :registrations, :email_unsubscribed, :boolean, default: false, null: false
  end
end
