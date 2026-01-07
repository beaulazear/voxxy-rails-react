class AddPaymentDeadlineToEvents < ActiveRecord::Migration[7.2]
  def change
    add_column :events, :payment_deadline, :date
  end
end
