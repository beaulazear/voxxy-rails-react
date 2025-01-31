class CreateResponses < ActiveRecord::Migration[7.2]
  def change
    create_table :responses do |t|
      t.references :activity, null: false, foreign_key: true
      t.text :notes

      t.timestamps
    end
  end
end
