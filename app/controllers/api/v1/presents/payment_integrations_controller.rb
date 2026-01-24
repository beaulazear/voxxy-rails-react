module Api
  module V1
    module Presents
      class PaymentIntegrationsController < AuthorizedController
        before_action :set_event
        before_action :set_payment_integration, only: [:show, :update, :destroy, :sync]

        # GET /api/v1/presents/events/:event_id/payment_integrations
        def index
          integrations = @event.payment_integrations.includes(:payment_sync_logs)
          render json: integrations.map { |integration| serialize_integration(integration) }, status: :ok
        end

        # POST /api/v1/presents/events/:event_id/payment_integrations
        # Create new payment integration (link Eventbrite event)
        def create
          provider = params[:provider] || 'eventbrite'
          provider_url = params[:provider_url]
          provider_event_id = params[:provider_event_id]

          # Extract event ID from URL if provided
          if provider_url.present? && provider_event_id.blank?
            provider_event_id = extract_provider_id(provider, provider_url)
          end

          if provider_event_id.blank?
            return render json: { error: 'Could not extract event ID from URL' }, status: :unprocessable_entity
          end

          # Create the integration
          integration = @event.payment_integrations.new(
            organization: @event.organization,
            provider: provider,
            provider_event_id: provider_event_id,
            provider_url: provider_url,
            auto_sync_enabled: params.fetch(:auto_sync_enabled, true),
            auto_update_payment_status: params.fetch(:auto_update_payment_status, true),
            auto_send_confirmations: params.fetch(:auto_send_confirmations, false)
          )

          if integration.save
            # Trigger initial full sync
            PaymentSyncWorker.perform_async(integration.id)

            render json: serialize_integration(integration), status: :created
          else
            render json: { errors: integration.errors.full_messages }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error("Error creating payment integration: #{e.message}")
          render json: { error: e.message }, status: :internal_server_error
        end

        # PATCH /api/v1/presents/payment_integrations/:id
        def update
          update_params = params.permit(:auto_sync_enabled, :auto_update_payment_status, :auto_send_confirmations, :sync_status)

          if @integration.update(update_params)
            render json: serialize_integration(@integration), status: :ok
          else
            render json: { errors: @integration.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/payment_integrations/:id
        def destroy
          @integration.update(sync_status: 'inactive')
          render json: { message: 'Payment integration deactivated' }, status: :ok
        end

        # POST /api/v1/presents/payment_integrations/:id/sync
        # Manually trigger full resync
        def sync
          PaymentSyncWorker.perform_async(@integration.id)
          render json: { message: 'Sync initiated' }, status: :accepted
        end

        private

        def set_event
          @event = current_user.organization.events.find(params[:event_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Event not found' }, status: :not_found
        end

        def set_payment_integration
          @integration = @event.payment_integrations.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Payment integration not found' }, status: :not_found
        end

        def extract_provider_id(provider, url)
          case provider
          when 'eventbrite'
            temp_integration = PaymentIntegration.new(organization: @event.organization, provider: 'eventbrite')
            provider_service = PaymentProviders::EventbriteProvider.new(temp_integration)
            provider_service.extract_provider_id_from_url(url)
          else
            nil
          end
        end

        def serialize_integration(integration)
          latest_log = integration.payment_sync_logs.order(created_at: :desc).first

          {
            id: integration.id,
            event_id: integration.event_id,
            provider: integration.provider,
            provider_event_id: integration.provider_event_id,
            provider_url: integration.provider_url,
            auto_sync_enabled: integration.auto_sync_enabled,
            auto_update_payment_status: integration.auto_update_payment_status,
            auto_send_confirmations: integration.auto_send_confirmations,
            sync_status: integration.sync_status,
            last_synced_at: integration.last_synced_at,
            sync_metadata: integration.sync_metadata,
            latest_sync_log: latest_log ? {
              sync_type: latest_log.sync_type,
              transactions_fetched: latest_log.transactions_fetched,
              transactions_inserted: latest_log.transactions_inserted,
              transactions_updated: latest_log.transactions_updated,
              contacts_matched: latest_log.contacts_matched,
              contacts_updated: latest_log.contacts_updated,
              registrations_updated: latest_log.registrations_updated,
              started_at: latest_log.started_at,
              completed_at: latest_log.completed_at,
              error_messages: latest_log.error_messages
            } : nil,
            created_at: integration.created_at,
            updated_at: integration.updated_at
          }
        end
      end
    end
  end
end
