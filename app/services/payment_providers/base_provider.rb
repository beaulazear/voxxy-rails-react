module PaymentProviders
  class BaseProvider
    attr_reader :payment_integration

    def initialize(payment_integration)
      @payment_integration = payment_integration
    end

    # Must be implemented by subclasses
    def fetch_transactions(changed_since: nil)
      raise NotImplementedError, "Subclass must implement fetch_transactions"
    end

    def validate_credentials
      raise NotImplementedError, "Subclass must implement validate_credentials"
    end

    def extract_provider_id_from_url(url)
      raise NotImplementedError, "Subclass must implement extract_provider_id_from_url"
    end

    def map_to_payment_status(provider_status)
      raise NotImplementedError, "Subclass must implement map_to_payment_status"
    end
  end
end
