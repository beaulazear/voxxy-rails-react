class CreateBugReports < ActiveRecord::Migration[7.2]
  def change
    create_table :bug_reports do |t|
      t.string :name,               null: false
      t.string :email,              null: false
      t.text   :bug_description,    null: false
      t.text   :steps_to_reproduce

      t.timestamps
    end
    add_index :bug_reports, :email
  end
end
