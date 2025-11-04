class Budget < ApplicationRecord
  belongs_to :budgetable, polymorphic: true
  belongs_to :user
  has_many :budget_line_items, dependent: :destroy

  validates :status, inclusion: { in: %w[draft active completed] }, allow_blank: true

  before_save :calculate_totals

  scope :active, -> { where(status: "active") }

  def remaining_amount
    total_amount.to_f - spent_amount.to_f
  end

  def percentage_spent
    return 0 if total_amount.to_f.zero?
    (spent_amount.to_f / total_amount.to_f * 100).round(2)
  end

  private

  def calculate_totals
    self.total_amount = budget_line_items.sum(:budgeted_amount)
    self.spent_amount = budget_line_items.sum(:actual_amount)
  end
end
