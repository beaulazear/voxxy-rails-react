module Api
  module V1
    module Presents
      class BudgetLineItemsController < BaseController
        before_action :set_budget
        before_action :set_budget_line_item, only: [ :show, :update, :destroy ]

        # GET /api/v1/presents/budgets/:budget_id/budget_line_items
        def index
          line_items = @budget.budget_line_items.includes(:vendor)

          serialized = line_items.map do |line_item|
            BudgetLineItemSerializer.new(line_item, include_vendor: true).as_json
          end

          render json: serialized, status: :ok
        end

        # GET /api/v1/presents/budgets/:budget_id/budget_line_items/:id
        def show
          serialized = BudgetLineItemSerializer.new(@line_item, include_vendor: true).as_json
          render json: serialized, status: :ok
        end

        # POST /api/v1/presents/budgets/:budget_id/budget_line_items
        def create
          line_item = @budget.budget_line_items.build(line_item_params)

          if line_item.save
            serialized = BudgetLineItemSerializer.new(line_item, include_vendor: true).as_json
            render json: serialized, status: :created
          else
            render json: { errors: line_item.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/presents/budgets/:budget_id/budget_line_items/:id
        def update
          if @line_item.update(line_item_params)
            serialized = BudgetLineItemSerializer.new(@line_item, include_vendor: true).as_json
            render json: serialized, status: :ok
          else
            render json: { errors: @line_item.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/budgets/:budget_id/budget_line_items/:id
        def destroy
          @line_item.destroy
          head :no_content
        end

        private

        def set_budget
          @budget = @current_user.budgets.find(params[:budget_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Budget not found" }, status: :not_found
        end

        def set_budget_line_item
          @line_item = @budget.budget_line_items.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Budget line item not found" }, status: :not_found
        end

        def line_item_params
          params.require(:budget_line_item).permit(
            :name, :category, :budgeted_amount, :actual_amount, :notes, :vendor_id
          )
        end
      end
    end
  end
end
