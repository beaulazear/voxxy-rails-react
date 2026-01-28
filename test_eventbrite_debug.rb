# Debug test for Eventbrite API
require 'net/http'
require 'json'

api_token = ARGV[0]

if api_token.blank?
  puts "ERROR: Please provide API token"
  puts "Usage: rails runner test_eventbrite_debug.rb YOUR_TOKEN"
  exit 1
end

puts "=== Debugging Eventbrite Connection ==="
puts "Token: #{api_token[0..10]}..."
puts

# Test 1: Raw HTTP request
puts "1. Testing raw HTTP connection to Eventbrite..."
uri = URI('https://www.eventbriteapi.com/v3/users/me/')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
http.read_timeout = 30

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Bearer #{api_token}"
request['Content-Type'] = 'application/json'

begin
  response = http.request(request)
  puts "Response code: #{response.code}"
  puts "Response message: #{response.message}"

  if response.code == '200'
    data = JSON.parse(response.body)
    puts "✓ SUCCESS! Connected to Eventbrite"
    puts "User: #{data['name']}"
    puts "Email: #{data['emails']&.first&.dig('email')}"
  else
    puts "✗ FAILED"
    puts "Response body: #{response.body[0..500]}"
  end
rescue => e
  puts "✗ ERROR: #{e.class.name}"
  puts "Message: #{e.message}"
  puts "Backtrace:"
  puts e.backtrace.first(10).join("\n")
end

puts
puts "2. Testing with our EventbriteApiClient..."
begin
  client = EventbriteApiClient.new(api_token)
  result = client.get('/users/me/')
  puts "✓ Client works!"
  puts "User: #{result['name']}"
rescue => e
  puts "✗ Client failed: #{e.class.name}"
  puts "Message: #{e.message}"
end
