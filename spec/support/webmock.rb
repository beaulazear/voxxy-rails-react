require 'webmock/rspec'

RSpec.configure do |config|
  config.before(:suite) do
    WebMock.disable_net_connect!(allow_localhost: true)
  end

  config.before(:each) do
    # Stub common external services for each test
    stub_expo_push_notifications
    stub_openai_requests  
    stub_sendgrid_requests
  end
end

def stub_expo_push_notifications
  stub_request(:post, "https://exp.host/--/api/v2/push/send")
    .to_return(
      status: 200,
      body: { data: [{ status: "ok" }] }.to_json,
      headers: { 'Content-Type' => 'application/json' }
    )
end

def stub_openai_requests
  stub_request(:post, /api\.openai\.com/)
    .to_return(
      status: 200,
      body: {
        choices: [{
          message: {
            content: "Mocked OpenAI response for testing"
          }
        }]
      }.to_json,
      headers: { 'Content-Type' => 'application/json' }
    )
end

def stub_sendgrid_requests
  stub_request(:post, /api\.sendgrid\.com/)
    .to_return(
      status: 202,
      body: "Accepted",
      headers: { 'Content-Type' => 'text/plain' }
    )
end