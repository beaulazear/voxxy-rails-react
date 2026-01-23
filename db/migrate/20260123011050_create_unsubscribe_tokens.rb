class CreateUnsubscribeTokens < ActiveRecord::Migration[7.2]
  def change
    create_table :unsubscribe_tokens do |t|
      t.string :token, null: false, index: { unique: true }
      t.string :email, null: false
      t.references :event, null: true, foreign_key: true
      t.references :organization, null: true, foreign_key: true
      t.datetime :expires_at, null: false
      t.datetime :used_at

      t.timestamps
    end

    add_index :unsubscribe_tokens, :email
    add_index :unsubscribe_tokens, :expires_at
  end
end
