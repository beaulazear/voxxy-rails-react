class AddAvailabilityToResponses < ActiveRecord::Migration[7.2]
  def change
    add_column :responses, :availability, :jsonb, null: false, default: {}
  end
end
