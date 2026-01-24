class AddEventbriteCredentialsToOrganizations < ActiveRecord::Migration[7.2]
  def change
    add_column :organizations, :eventbrite_api_token, :string
    add_column :organizations, :eventbrite_connected, :boolean, default: false
    add_column :organizations, :eventbrite_connected_at, :datetime
  end
end
