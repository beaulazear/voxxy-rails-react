class RenameErrorsColumnInPaymentSyncLogs < ActiveRecord::Migration[7.2]
  def change
    rename_column :payment_sync_logs, :errors, :error_messages
  end
end
