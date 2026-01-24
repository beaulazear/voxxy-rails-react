module PaymentProviders
  class EventbriteProvider < BaseProvider
    BASE_URL = 'https://www.eventbriteapi.com/v3'

    def initialize(payment_integration)
      super
      @api_token = payment_integration.organization.eventbrite_api_token
      @api_client = EventbriteApiClient.new(@api_token)
    end

    # Extract event ID from Eventbrite URLs
    # Handles formats like:
    # - https://www.eventbrite.com/e/event-name-1980152043065
    # - https://www.eventbrite.com/checkout-external?eid=1980152043065
    # - https://eventbrite.com/e/1980152043065
    def extract_provider_id_from_url(url)
      return nil if url.blank?

      # Try event page format: /e/event-name-1234567890 or /e/1234567890
      if url.match(/\/e\/(?:.*?-)?(\d+)/)
        return $1
      end

      # Try checkout format: ?eid=1234567890
      if url.match(/[?&]eid=(\d+)/)
        return $1
      end

      nil
    end

    # Fetch event metadata from Eventbrite
    def fetch_event_details
      event_id = payment_integration.provider_event_id
      @api_client.get("/events/#{event_id}/")
    end

    # Fetch all orders with pagination support
    def fetch_transactions(changed_since: nil)
      event_id = payment_integration.provider_event_id
      transactions = []
      continuation = nil

      loop do
        params = build_params(continuation, changed_since)
        response = @api_client.get("/events/#{event_id}/orders/", params)

        orders = response['orders'] || []
        transactions.concat(normalize_transactions(orders))

        pagination = response['pagination']
        break unless pagination && pagination['has_more_items']

        continuation = pagination['continuation']
      end

      transactions
    rescue => e
      Rails.logger.error("Eventbrite fetch transactions error: #{e.message}")
      raise
    end

    # Test API connection with current credentials
    def validate_credentials
      @api_client.test_connection
    end

    # Fetch list of events for dropdown (for linking)
    def fetch_events_list
      response = @api_client.get('/users/me/events/')
      events = response['events'] || []

      events.map do |event|
        {
          id: event['id'],
          name: event['name']['text'],
          url: event['url'],
          status: event['status'],
          start: event['start']['local'],
          end: event['end']['local']
        }
      end
    rescue => e
      Rails.logger.error("Eventbrite fetch events list error: #{e.message}")
      []
    end

    private

    def build_params(continuation, changed_since)
      params = {}
      params[:continuation] = continuation if continuation.present?
      params[:changed_since] = changed_since.iso8601 if changed_since.present?
      params
    end

    def normalize_transactions(orders)
      orders.map do |order|
        {
          provider_transaction_id: order['id'],
          provider: 'eventbrite',
          payer_email: order['email']&.downcase&.strip,
          payer_first_name: order['first_name'],
          payer_last_name: order['last_name'],
          provider_status: order['status'],
          payment_status: map_to_payment_status(order['status']),
          amount: parse_amount(order.dig('costs', 'gross', 'value')),
          currency: order.dig('costs', 'gross', 'currency') || 'USD',
          transaction_created_at: parse_datetime(order['created']),
          transaction_updated_at: parse_datetime(order['changed']),
          raw_provider_data: order
        }
      end
    end

    def map_to_payment_status(eventbrite_status)
      case eventbrite_status&.downcase
      when 'placed'
        :paid
      when 'refunded'
        :refunded
      when 'cancelled', 'deleted'
        :cancelled
      else
        :pending
      end
    end

    def parse_amount(value)
      return nil if value.nil?
      # Eventbrite returns amounts in cents
      value.to_f / 100.0
    end

    def parse_datetime(datetime_string)
      return nil if datetime_string.blank?
      Time.zone.parse(datetime_string)
    rescue => e
      Rails.logger.warn("Failed to parse datetime: #{datetime_string} - #{e.message}")
      nil
    end
  end
end
