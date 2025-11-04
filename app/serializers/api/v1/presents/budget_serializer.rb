module Api
  module V1
    module Presents
      class BudgetSerializer
        def initialize(budget, options = {})
          @budget = budget
          @include_line_items = options[:include_line_items] || false
          @include_budgetable = options[:include_budgetable] || false
        end

        def as_json
          {
            id: @budget.id,
            title: @budget.title,
            amounts: {
              total: @budget.total_amount&.to_f,
              spent: @budget.spent_amount&.to_f,
              remaining: @budget.remaining_amount&.to_f
            },
            percentage_spent: @budget.percentage_spent&.to_f,
            status: @budget.status,
            budgetable_type: @budget.budgetable_type,
            budgetable_id: @budget.budgetable_id,
            created_at: @budget.created_at,
            updated_at: @budget.updated_at
          }.tap do |json|
            json[:line_items] = line_items_json if @include_line_items
            json[:budgetable] = budgetable_json if @include_budgetable
          end
        end

        private

        def line_items_json
          @budget.budget_line_items.map do |line_item|
            Api::V1::Presents::BudgetLineItemSerializer.new(line_item, include_vendor: true).as_json
          end
        end

        def budgetable_json
          case @budget.budgetable_type
          when "Event"
            {
              type: "Event",
              id: @budget.budgetable.id,
              title: @budget.budgetable.title,
              slug: @budget.budgetable.slug,
              event_date: @budget.budgetable.event_date
            }
          when "Organization"
            {
              type: "Organization",
              id: @budget.budgetable.id,
              name: @budget.budgetable.name,
              slug: @budget.budgetable.slug
            }
          end
        end
      end
    end
  end
end
