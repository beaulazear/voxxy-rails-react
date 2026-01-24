module Api
  module V1
    module Presents
      class OrganizationIntegrationsController < AuthorizedController
        before_action :set_organization

        # POST /api/v1/presents/organizations/:organization_id/integrations/eventbrite/connect
        def connect_eventbrite
          api_token = params[:api_token]

          if api_token.blank?
            return render json: { error: 'API token is required' }, status: :unprocessable_entity
          end

          # Test the connection
          client = EventbriteApiClient.new(api_token)
          unless client.test_connection
            return render json: { error: 'Invalid API token or connection failed' }, status: :unprocessable_entity
          end

          # Save the token
          @organization.update!(
            eventbrite_api_token: api_token,
            eventbrite_connected: true,
            eventbrite_connected_at: Time.current
          )

          render json: {
            message: 'Eventbrite connected successfully',
            organization: {
              id: @organization.id,
              eventbrite_connected: @organization.eventbrite_connected,
              eventbrite_connected_at: @organization.eventbrite_connected_at
            }
          }, status: :ok
        rescue => e
          Rails.logger.error("Eventbrite connection error: #{e.message}")
          render json: { error: 'Failed to connect to Eventbrite' }, status: :internal_server_error
        end

        # DELETE /api/v1/presents/organizations/:organization_id/integrations/eventbrite/disconnect
        def disconnect_eventbrite
          @organization.update!(
            eventbrite_api_token: nil,
            eventbrite_connected: false,
            eventbrite_connected_at: nil
          )

          render json: { message: 'Eventbrite disconnected successfully' }, status: :ok
        end

        # GET /api/v1/presents/organizations/:organization_id/integrations/eventbrite/status
        def eventbrite_status
          render json: {
            connected: @organization.eventbrite_connected?,
            connected_at: @organization.eventbrite_connected_at
          }, status: :ok
        end

        # GET /api/v1/presents/organizations/:organization_id/integrations/eventbrite/events
        # Fetches list of events from Eventbrite for dropdown
        def eventbrite_events
          unless @organization.eventbrite_connected?
            return render json: { error: 'Eventbrite not connected' }, status: :unprocessable_entity
          end

          # Create a temporary payment integration object to use the provider
          temp_integration = PaymentIntegration.new(
            organization: @organization,
            provider: 'eventbrite'
          )
          provider = PaymentProviders::EventbriteProvider.new(temp_integration)

          events = provider.fetch_events_list

          render json: { events: events }, status: :ok
        rescue => e
          Rails.logger.error("Error fetching Eventbrite events: #{e.message}")
          render json: { error: 'Failed to fetch Eventbrite events' }, status: :internal_server_error
        end

        private

        def set_organization
          @organization = current_user.organization
          unless @organization
            render json: { error: 'Organization not found' }, status: :not_found
          end
        end
      end
    end
  end
end
