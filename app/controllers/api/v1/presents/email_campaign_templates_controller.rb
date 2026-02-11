# Controller for managing email campaign templates
# Provides CRUD operations and cloning functionality

module Api
  module V1
    module Presents
      class EmailCampaignTemplatesController < BaseController
        before_action :set_template, only: [ :show, :update, :destroy, :clone, :preview_email ]
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

          # Add usage stats for each template
          templates_with_stats = templates.map do |template|
            usage_count = template.events.select(:organization_id).distinct.count
            organizations_using = template.events.includes(:organization).map(&:organization).uniq.compact

            template.as_json(include: :email_template_items).merge(
              usage_count: usage_count,
              organizations_using: organizations_using.map { |org| { id: org.id, name: org.name } }
            )
          end

          render json: templates_with_stats
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

        # GET /api/v1/presents/email_campaign_templates/:id/preview/:email_template_item_id
        # Preview a specific email template item with variable resolution
        def preview_email
          @email_item = @template.email_template_items.find(params[:email_template_item_id])

          # Get a sample event or create dummy data for preview
          sample_event = @current_user.organization&.events&.first || create_sample_event_data
          sample_registration = create_sample_registration_data(sample_event)

          # Resolve variables in subject and body
          resolver = EmailVariableResolver.new(sample_event, sample_registration)
          resolved_subject = resolver.resolve(@email_item.subject_template)
          resolved_body = resolver.resolve(@email_item.body_template)

          render json: {
            email_item: {
              id: @email_item.id,
              name: @email_item.name,
              category: @email_item.category,
              position: @email_item.position,
              subject_template: @email_item.subject_template,
              body_template: @email_item.body_template,
              subject: resolved_subject,
              body: resolved_body,
              trigger_type: @email_item.trigger_type,
              trigger_value: @email_item.trigger_value,
              trigger_time: @email_item.trigger_time
            },
            sample_data_used: sample_event.is_a?(OpenStruct)
          }
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Email template item not found" }, status: :not_found
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

        def create_sample_event_data
          # Create OpenStruct with sample event data for preview
          OpenStruct.new(
            title: "Sample Art Show",
            slug: "sample-art-show",
            event_date: 30.days.from_now,
            event_end_date: 30.days.from_now,
            start_time: "7:00 PM",
            venue: "Sample Venue",
            location: "San Francisco, CA",
            description: "An amazing art show featuring local artists",
            application_deadline: 15.days.from_now,
            payment_deadline: 20.days.from_now,
            age_restriction: "21",
            organization: OpenStruct.new(
              name: @current_user.organization&.name || "Sample Organization",
              email: @current_user.email
            ),
            vendor_applications: [
              OpenStruct.new(
                name: "Artists",
                booth_price: 150,
                install_date: 29.days.from_now,
                install_start_time: "2:00 PM",
                install_end_time: "6:00 PM",
                payment_link: "https://example.com/payment",
                active: true
              )
            ]
          )
        end

        def create_sample_registration_data(event)
          OpenStruct.new(
            name: "Jane Artist",
            business_name: "Jane's Gallery",
            email: @current_user.email,
            vendor_category: "Artists",
            booth_number: "A12",
            created_at: Time.current,
            vendor_application: event.vendor_applications&.first
          )
        end
      end
    end
  end
end
