class CreateBudgets < ActiveRecord::Migration[7.2]
  def change
    create_table :budgets do |t|
      # Polymorphic - can belong to Event or Organization
      t.references :budgetable, polymorphic: true, null: false
      t.references :user, null: false, foreign_key: true
      t.string :title
      t.decimal :total_amount, precision: 10, scale: 2
      t.decimal :spent_amount, precision: 10, scale: 2, default: 0
      t.string :status # 'draft', 'active', 'completed'

      t.timestamps
    end

    # Note: budgetable index is already created by t.references :budgetable, polymorphic: true
  end
end
