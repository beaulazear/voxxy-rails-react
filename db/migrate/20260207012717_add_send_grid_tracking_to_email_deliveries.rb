class AddSendGridTrackingToEmailDeliveries < ActiveRecord::Migration[7.2]
  def change
    # Add fields for tracking email opens and clicks
    add_column :email_deliveries, :opened_at, :datetime
    add_column :email_deliveries, :clicked_at, :datetime
    add_column :email_deliveries, :failed_at, :datetime
    add_column :email_deliveries, :error_message, :text

    # Add index for failed emails for monitoring
    add_index :email_deliveries, :failed_at, where: "failed_at IS NOT NULL"
  end
end
