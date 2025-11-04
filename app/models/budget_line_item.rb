class BudgetLineItem < ApplicationRecord
  belongs_to :budget
  belongs_to :vendor, optional: true

  CATEGORIES = %w[venue catering entertainment marketing staffing other].freeze

  validates :name, presence: true
  validates :category, inclusion: { in: CATEGORIES }, allow_blank: true

  after_save :update_budget_totals
  after_destroy :update_budget_totals

  def variance
    budgeted_amount.to_f - actual_amount.to_f
  end

  private

  def update_budget_totals
    budget.save # Triggers budget's calculate_totals callback
  end
end
