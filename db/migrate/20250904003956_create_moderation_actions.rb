class CreateModerationActions < ActiveRecord::Migration[7.2]
  def change
    create_table :moderation_actions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :moderator, null: false, foreign_key: { to_table: :users }
      t.references :report, null: true, foreign_key: true

      t.string :action_type, null: false # warned, suspended, banned, unbanned, content_removed
      t.text :reason
      t.text :details
      t.datetime :expires_at

      t.timestamps
    end

    add_index :moderation_actions, :action_type
    add_index :moderation_actions, :created_at
  end
end
