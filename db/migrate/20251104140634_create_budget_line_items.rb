class CreateBudgetLineItems < ActiveRecord::Migration[7.2]
  def change
    create_table :budget_line_items do |t|
      t.references :budget, null: false, foreign_key: true
      t.string :name, null: false
      t.string :category # 'venue', 'catering', 'entertainment', 'marketing', 'other'
      t.decimal :budgeted_amount, precision: 10, scale: 2
      t.decimal :actual_amount, precision: 10, scale: 2, default: 0
      t.text :notes
      t.references :vendor, foreign_key: true # optional link to vendor

      t.timestamps
    end

    add_index :budget_line_items, :category
  end
end
