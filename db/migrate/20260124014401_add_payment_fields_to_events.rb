class AddPaymentFieldsToEvents < ActiveRecord::Migration[7.2]
  def change
    add_column :events, :vendor_payment_link, :string
    add_column :events, :vendor_fee_amount, :decimal, precision: 10, scale: 2
    add_column :events, :vendor_fee_currency, :string, default: 'USD'
  end
end
