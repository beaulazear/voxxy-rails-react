class AddTimezoneToOrganizations < ActiveRecord::Migration[7.2]
  def change
    add_column :organizations, :timezone, :string, default: 'America/Los_Angeles'
    add_index :organizations, :timezone
  end
end
