class CreateEmailUnsubscribes < ActiveRecord::Migration[7.2]
  def change
    create_table :email_unsubscribes do |t|
      t.string :email, null: false
      t.string :scope, null: false # 'event', 'organization', 'global'
      t.references :event, null: true, foreign_key: true
      t.references :organization, null: true, foreign_key: true
      t.datetime :unsubscribed_at, null: false
      t.string :unsubscribe_source # 'user_action', 'sendgrid_webhook', 'admin_action'

      t.timestamps
    end

    add_index :email_unsubscribes, [:email, :scope]
    add_index :email_unsubscribes, [:email, :event_id], unique: true, where: "scope = 'event'"
    add_index :email_unsubscribes, [:email, :organization_id], unique: true, where: "scope = 'organization'"
    add_index :email_unsubscribes, :email, unique: true, where: "scope = 'global'"
  end
end
