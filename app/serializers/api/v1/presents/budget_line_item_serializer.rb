module Api
  module V1
    module Presents
      class BudgetLineItemSerializer
        def initialize(line_item, options = {})
          @line_item = line_item
          @include_vendor = options[:include_vendor] || false
        end

        def as_json
          {
            id: @line_item.id,
            name: @line_item.name,
            category: @line_item.category,
            amounts: {
              budgeted: @line_item.budgeted_amount&.to_f,
              actual: @line_item.actual_amount&.to_f,
              variance: @line_item.variance&.to_f
            },
            notes: @line_item.notes,
            created_at: @line_item.created_at,
            updated_at: @line_item.updated_at
          }.tap do |json|
            json[:vendor] = vendor_json if @include_vendor && @line_item.vendor.present?
          end
        end

        private

        def vendor_json
          {
            id: @line_item.vendor.id,
            name: @line_item.vendor.name,
            slug: @line_item.vendor.slug,
            vendor_type: @line_item.vendor.vendor_type,
            rating: @line_item.vendor.rating&.to_f
          }
        end
      end
    end
  end
end
