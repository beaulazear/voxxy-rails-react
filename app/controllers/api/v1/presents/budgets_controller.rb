module Api
  module V1
    module Presents
      class BudgetsController < BaseController
        before_action :set_budgetable, only: [ :create ]
        before_action :set_budget, only: [ :show, :update, :destroy ]

        # GET /api/v1/presents/budgets
        def index
          budgets = @current_user.budgets.includes(:budgetable, :budget_line_items)

          serialized = budgets.map do |budget|
            BudgetSerializer.new(budget, include_line_items: true, include_budgetable: true).as_json
          end

          render json: serialized, status: :ok
        end

        # GET /api/v1/presents/budgets/:id
        def show
          serialized = BudgetSerializer.new(@budget, include_line_items: true, include_budgetable: true).as_json
          render json: serialized, status: :ok
        end

        # POST /api/v1/presents/events/:event_id/budgets
        # POST /api/v1/presents/organizations/:organization_id/budgets
        def create
          budget = @budgetable.budgets.build(budget_params)
          budget.user = @current_user

          if budget.save
            serialized = BudgetSerializer.new(budget, include_budgetable: true).as_json
            render json: serialized, status: :created
          else
            render json: { errors: budget.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/presents/budgets/:id
        def update
          if @budget.update(budget_params)
            serialized = BudgetSerializer.new(@budget, include_line_items: true, include_budgetable: true).as_json
            render json: serialized, status: :ok
          else
            render json: { errors: @budget.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/budgets/:id
        def destroy
          @budget.destroy
          head :no_content
        end

        private

        def set_budgetable
          if params[:event_id]
            @budgetable = Event.find_by!(slug: params[:event_id])
            # Check ownership
            unless @budgetable.organization.user_id == @current_user.id || @current_user.admin?
              render json: { error: "Not authorized" }, status: :forbidden
            end
          elsif params[:organization_id]
            @budgetable = Organization.find_by!(slug: params[:organization_id])
            # Check ownership
            unless @budgetable.user_id == @current_user.id || @current_user.admin?
              render json: { error: "Not authorized" }, status: :forbidden
            end
          else
            render json: { error: "Must specify event_id or organization_id" },
                   status: :bad_request
          end
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Event or Organization not found" }, status: :not_found
        end

        def set_budget
          @budget = @current_user.budgets.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Budget not found" }, status: :not_found
        end

        def budget_params
          params.require(:budget).permit(:title, :total_amount, :status)
        end
      end
    end
  end
end
