class AddNewFieldsToEvents < ActiveRecord::Migration[7.2]
  def change
    add_column :events, :venue, :string
    add_column :events, :start_time, :string
    add_column :events, :end_time, :string
    add_column :events, :age_restriction, :string
    add_column :events, :ticket_link, :string
  end
end
