class CreateFeedbacks < ActiveRecord::Migration[7.2]
  def change
    create_table :feedbacks do |t|
      t.string  :name,    null: false
      t.string  :email,   null: false
      t.integer :rating,  null: false
      t.text    :message, null: false

      t.timestamps
    end
    add_index :feedbacks, :email
  end
end
