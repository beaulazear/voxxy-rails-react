class AddEmojiToActivities < ActiveRecord::Migration[7.2]
  def change
    add_column :activities, :emoji, :string
  end
end
