class EventbriteApiClient
  BASE_URL = 'https://www.eventbriteapi.com/v3'

  class Error < StandardError; end
  class AuthenticationError < Error; end
  class NotFoundError < Error; end
  class RateLimitError < Error; end
  class ServerError < Error; end

  def initialize(api_token)
    @api_token = api_token
    @http = build_http_client
  end

  def get(path, params = {})
    uri = URI("#{BASE_URL}#{path}")
    uri.query = URI.encode_www_form(params) if params.any?

    request = Net::HTTP::Get.new(uri)
    request['Authorization'] = "Bearer #{@api_token}"
    request['Content-Type'] = 'application/json'

    response = @http.request(request)

    handle_response(response)
  rescue => e
    Rails.logger.error("Eventbrite API request failed: #{e.message}")
    raise
  end

  # Test connection to validate API token
  def test_connection
    get('/users/me/')
    true
  rescue AuthenticationError
    false
  end

  private

  def build_http_client
    uri = URI(BASE_URL)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 30
    http.open_timeout = 10
    http
  end

  def handle_response(response)
    case response.code.to_i
    when 200..299
      JSON.parse(response.body)
    when 401
      raise AuthenticationError, "Eventbrite authentication failed. Check API token."
    when 404
      raise NotFoundError, "Eventbrite resource not found. Check event ID."
    when 429
      retry_after = response['Retry-After']&.to_i || 60
      raise RateLimitError, "Rate limited. Retry after #{retry_after} seconds."
    when 500..599
      raise ServerError, "Eventbrite server error: #{response.code}"
    else
      raise Error, "Unexpected response: #{response.code} - #{response.body}"
    end
  end
end
