class EnforceCompletedNotNull < ActiveRecord::Migration[7.2]
  def up
    # Ensure all existing NULL values become false
    Activity.where(completed: nil).update_all(completed: false)

    # Enforce the NOT NULL constraint and default value
    change_column_default :activities, :completed, false
    change_column_null :activities, :completed, false, false
  end

  def down
    # Rollback: Allow NULL values again (if ever needed)
    change_column_null :activities, :completed, true
  end
end
