class AddLatitudeLongitudeToUserActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :user_activities, :latitude, :decimal, precision: 10, scale: 6
    add_column :user_activities, :longitude, :decimal, precision: 10, scale: 6
  end
end
