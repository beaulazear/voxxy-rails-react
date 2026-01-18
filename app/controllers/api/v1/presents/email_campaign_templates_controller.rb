# Controller for managing email campaign templates
# Provides CRUD operations and cloning functionality

module Api
  module V1
    module Presents
      class EmailCampaignTemplatesController < BaseController
        before_action :set_template, only: [ :show, :update, :destroy, :clone ]
        before_action :set_organization, only: [ :index, :create, :clone ]

        # GET /api/v1/presents/email_campaign_templates
        def index
          system_templates = EmailCampaignTemplate.system_templates
          user_templates = @organization.email_campaign_templates if @organization

          templates = if @organization
            (system_templates + user_templates.to_a).uniq
          else
            system_templates
          end

          render json: templates, include: [ :email_template_items ]
        end

        # GET /api/v1/presents/email_campaign_templates/:id
        def show
          render json: @template, include: {
            email_template_items: {
              only: [ :id, :name, :category, :position, :subject_template, :body_template,
                     :trigger_type, :trigger_value, :trigger_time, :filter_criteria, :enabled_by_default ]
            }
          }
        end

        # POST /api/v1/presents/email_campaign_templates
        def create
          unless @organization
            render json: { error: "Organization required" }, status: :unauthorized
            return
          end

          template = @organization.email_campaign_templates.build(template_params)
          template.template_type = "user"

          if template.save
            render json: template, status: :created
          else
            render json: { errors: template.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/presents/email_campaign_templates/:id
        def update
          if @template.template_type == "system"
            render json: { error: "Cannot modify system templates" }, status: :forbidden
            return
          end

          if @template.update(template_params)
            render json: @template
          else
            render json: { errors: @template.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/email_campaign_templates/:id
        def destroy
          if @template.template_type == "system"
            render json: { error: "Cannot delete system templates" }, status: :forbidden
            return
          end

          if @template.is_default
            render json: { error: "Cannot delete default template" }, status: :forbidden
            return
          end

          if @template.events_count > 0
            render json: {
              error: "Cannot delete template with #{@template.events_count} associated events"
            }, status: :unprocessable_entity
            return
          end

          @template.destroy
          head :no_content
        end

        # POST /api/v1/presents/email_campaign_templates/:id/clone
        def clone
          unless @organization
            render json: { error: "Organization required" }, status: :unauthorized
            return
          end

          cloner = EmailCampaignTemplateCloner.new(@template, @organization)

          unless cloner.can_clone?
            render json: { error: "Cannot clone this template" }, status: :forbidden
            return
          end

          cloned_template = cloner.clone(
            name: params[:name],
            description: params[:description],
            include_disabled: params[:include_disabled]
          )

          if cloned_template
            render json: cloned_template, include: [ :email_template_items ], status: :created
          else
            render json: { errors: cloner.errors }, status: :unprocessable_entity
          end
        end

        private

        def set_template
          @template = EmailCampaignTemplate.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Template not found" }, status: :not_found
        end

        def set_organization
          # Get the first organization for the current user (since user has_many organizations)
          @organization = @current_user&.organizations&.first if @current_user
          @organization ||= Organization.find(params[:organization_id]) if params[:organization_id]
        end

        def template_params
          params.require(:email_campaign_template).permit(:name, :description, :is_default)
        end
      end
    end
  end
end
