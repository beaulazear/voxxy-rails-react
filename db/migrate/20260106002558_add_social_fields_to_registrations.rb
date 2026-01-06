class AddSocialFieldsToRegistrations < ActiveRecord::Migration[7.2]
  def change
    add_column :registrations, :instagram_handle, :string
    add_column :registrations, :tiktok_handle, :string
    add_column :registrations, :website, :string
    add_column :registrations, :note_to_host, :text
  end
end
