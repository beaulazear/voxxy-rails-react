class CreateNotifications < ActiveRecord::Migration[7.2]
  def up
    # Check if table already exists - if so, just return
    return if table_exists?(:notifications)
    
    # Drop any existing indexes that might be orphaned
    begin
      connection.execute("DROP INDEX IF EXISTS index_notifications_on_activity_id")
      connection.execute("DROP INDEX IF EXISTS index_notifications_on_user_id_and_read") 
      connection.execute("DROP INDEX IF EXISTS index_notifications_on_user_id_and_created_at")
      connection.execute("DROP INDEX IF EXISTS index_notifications_on_notification_type")
    rescue => e
      Rails.logger.info "Indexes already cleaned up or don't exist: #{e.message}"
    end
    
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :body, null: false
      t.string :notification_type, null: false # activity_invite, activity_update, activity_finalized, comment, reminder, general
      t.boolean :read, default: false, null: false
      t.json :data # Store additional data like activity_id, comment_id, etc.
      t.references :activity, null: true, foreign_key: true # Optional reference to related activity
      t.references :triggering_user, null: true, foreign_key: { to_table: :users } # User who triggered this notification (e.g., who commented)
      
      t.timestamps
    end

    # Add indexes only if they don't exist
    add_index :notifications, [:user_id, :read] unless index_exists?(:notifications, [:user_id, :read])
    add_index :notifications, [:user_id, :created_at] unless index_exists?(:notifications, [:user_id, :created_at])
    add_index :notifications, [:notification_type] unless index_exists?(:notifications, [:notification_type])
    add_index :notifications, [:activity_id] unless index_exists?(:notifications, [:activity_id])
  end

  def down
    drop_table :notifications if table_exists?(:notifications)
  end
end