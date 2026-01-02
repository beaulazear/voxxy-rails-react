# Controller for managing individual email template items within campaigns

module Api
  module V1
    module Presents
      class EmailTemplateItemsController < BaseController
        before_action :set_template
        before_action :set_item, only: [ :show, :update, :destroy, :reorder ]
        before_action :check_template_editable, only: [ :create, :update, :destroy, :reorder ]

        # GET /api/v1/presents/email_campaign_templates/:template_id/email_template_items
        def index
          items = @template.email_template_items.by_position
          items = items.where(category: params[:category]) if params[:category]

          render json: items
        end

        # GET /api/v1/presents/email_campaign_templates/:template_id/email_template_items/:id
        def show
          render json: @item
        end

        # POST /api/v1/presents/email_campaign_templates/:template_id/email_template_items
        def create
          if @template.email_template_items.count >= 40
            render json: { error: "Template cannot exceed 40 emails" }, status: :unprocessable_entity
            return
          end

          item = @template.email_template_items.build(item_params)

          if item.position.nil? || item.position == 0
            max_position = @template.email_template_items.maximum(:position) || 0
            item.position = max_position + 1
          end

          if item.save
            render json: item, status: :created
          else
            render json: { errors: item.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/presents/email_campaign_templates/:template_id/email_template_items/:id
        def update
          if @item.update(item_params)
            render json: @item
          else
            render json: { errors: @item.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/email_campaign_templates/:template_id/email_template_items/:id
        def destroy
          @item.destroy
          head :no_content
        end

        # PATCH /api/v1/presents/email_campaign_templates/:template_id/email_template_items/:id/reorder
        def reorder
          new_position = params[:position].to_i

          if new_position < 1 || new_position > 40
            render json: { error: "Position must be between 1 and 40" }, status: :unprocessable_entity
            return
          end

          old_position = @item.position

          if new_position > old_position
            @template.email_template_items
              .where("position > ? AND position <= ?", old_position, new_position)
              .update_all("position = position - 1")
          elsif new_position < old_position
            @template.email_template_items
              .where("position >= ? AND position < ?", new_position, old_position)
              .update_all("position = position + 1")
          end

          @item.update(position: new_position)

          render json: { message: "Item reordered successfully", item: @item }
        end

        private

        def set_template
          @template = EmailCampaignTemplate.find(params[:email_campaign_template_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Template not found" }, status: :not_found
        end

        def set_item
          @item = @template.email_template_items.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Email item not found" }, status: :not_found
        end

        def check_template_editable
          if @template.template_type == "system"
            render json: { error: "Cannot modify system template items" }, status: :forbidden
          end
        end

        def item_params
          params.require(:email_template_item).permit(
            :name, :category, :position, :subject_template, :body_template,
            :trigger_type, :trigger_value, :trigger_time, :enabled_by_default,
            filter_criteria: {}
          )
        end
      end
    end
  end
end
