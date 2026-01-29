# Test script for Eventbrite integration
# Usage: rails runner test_eventbrite.rb

puts "=== Testing Eventbrite Integration ==="
puts

# Your API token (from team@voxxypresents.com account)
# Pass token as argument or set environment variable
api_token = ARGV[0] || ENV['EVENTBRITE_API_TOKEN']

if api_token.blank?
  puts "ERROR: Please provide Eventbrite API token"
  puts "Usage: rails runner test_eventbrite.rb YOUR_API_TOKEN"
  exit 1
end

puts "Using API token: #{api_token[0..15]}..." # Show first 16 chars only

puts "1. Testing API Client connection..."
client = EventbriteApiClient.new(api_token)

begin
  if client.test_connection
    puts "✓ API connection successful!"
  else
    puts "✗ API connection failed"
    exit 1
  end
rescue => e
  puts "✗ Error: #{e.class.name}"
  puts "✗ Message: #{e.message}"
  puts "✗ Backtrace:"
  puts e.backtrace.first(5).join("\n")
  exit 1
end

puts
puts "2. Testing URL parsing..."
# Create a mock organization with the token
mock_org = OpenStruct.new(eventbrite_api_token: api_token)
mock_integration = OpenStruct.new(organization: mock_org, provider: 'eventbrite')
provider = PaymentProviders::EventbriteProvider.new(mock_integration)

test_urls = [
  'https://www.eventbrite.com/e/test-event-1980152043065',
  'https://www.eventbrite.com/checkout-external?eid=1980152043065',
  'https://eventbrite.com/e/1980152043065'
]

test_urls.each do |url|
  event_id = provider.extract_provider_id_from_url(url)
  puts "  URL: #{url}"
  puts "  Extracted ID: #{event_id}"
  puts
end

puts "3. Fetching user's Eventbrite events..."
begin
  events = provider.fetch_events_list
  puts "✓ Found #{events.count} events in your Eventbrite account"
  puts

  if events.empty?
    puts "  No events found. You may need to create an event in Eventbrite first."
  else
    events.first(5).each do |event|
      puts "  📅 #{event[:name]}"
      puts "     ID: #{event[:id]}"
      puts "     Status: #{event[:status]}"
      puts "     Start: #{event[:start]}"
      puts
    end
  end
rescue => e
  puts "✗ Error: #{e.message}"
  puts e.backtrace.first(3).join("\n")
end

puts
puts "=== Test Complete ==="
