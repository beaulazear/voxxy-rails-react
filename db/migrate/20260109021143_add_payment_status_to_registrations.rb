class AddPaymentStatusToRegistrations < ActiveRecord::Migration[7.2]
  def change
    add_column :registrations, :payment_status, :string, default: "pending"
    add_column :registrations, :payment_confirmed_at, :datetime
    add_index :registrations, :payment_status
  end
end
