class CreateVotes < ActiveRecord::Migration[7.2]
  def change
    create_table :votes do |t|
      t.references :user, null: false, foreign_key: true
      t.references :pinned_activity, null: false, foreign_key: true
      t.boolean :upvote

      t.timestamps
    end
  end
end
