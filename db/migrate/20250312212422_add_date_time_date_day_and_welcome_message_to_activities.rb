class AddDateTimeDateDayAndWelcomeMessageToActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :activities, :date_time, :time
    add_column :activities, :date_day, :date
    add_column :activities, :welcome_message, :text
  end
end
