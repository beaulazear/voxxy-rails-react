# Full end-to-end test of Eventbrite payment sync
# Usage: rails runner test_full_sync.rb API_TOKEN EVENT_ID

api_token = ARGV[0]
event_id = ARGV[1]

if api_token.blank? || event_id.blank?
  puts "ERROR: Please provide both API token and event ID"
  puts "Usage: rails runner test_full_sync.rb YOUR_TOKEN YOUR_EVENT_ID"
  exit 1
end

puts "=== Full Eventbrite Sync Test ==="
puts "Event ID: #{event_id}"
puts "Token: #{api_token[0..10]}..."
puts

# Step 1: Fetch event details
puts "1. Fetching event details from Eventbrite..."
client = EventbriteApiClient.new(api_token)

begin
  event_data = client.get("/events/#{event_id}/")
  puts "✓ Event found!"
  puts "   Name: #{event_data['name']['text']}"
  puts "   Status: #{event_data['status']}"
  puts "   Start: #{event_data['start']['local']}"
  puts "   URL: #{event_data['url']}"
rescue => e
  puts "✗ Error: #{e.message}"
  exit 1
end

puts
puts "2. Fetching orders for this event..."
begin
  orders_response = client.get("/events/#{event_id}/orders/")
  orders = orders_response['orders'] || []
  pagination = orders_response['pagination']

  puts "✓ Found #{orders.count} orders"
  puts "   Pagination: #{pagination['object_count']} total, #{pagination['page_count']} pages"
  puts

  if orders.empty?
    puts "   ℹ️  No orders yet. To test payment sync:"
    puts "   1. Go to your Eventbrite event"
    puts "   2. Click 'Add attendees' or create a test order"
    puts "   3. Run this test again to see the orders"
  else
    puts "   Orders found:"
    orders.each_with_index do |order, i|
      puts "   #{i+1}. #{order['name']} (#{order['email']})"
      puts "      Status: #{order['status']}"
      puts "      Amount: #{order['costs']['gross']['display']}"
      puts
    end
  end
rescue => e
  puts "✗ Error: #{e.message}"
  puts e.backtrace.first(3).join("\n")
end

puts
puts "3. Testing full sync process..."
puts "   Creating test data in database..."

# Find or create an organization
org = Organization.first
unless org
  puts "   ⚠️  No organization found. Creating test organization..."
  user = User.first || User.create!(
    email: 'test@voxxypresents.com',
    password: 'password123',
    confirmed: true
  )
  org = Organization.create!(
    name: 'Test Organization',
    user: user,
    eventbrite_api_token: api_token,
    eventbrite_connected: true,
    eventbrite_connected_at: Time.current
  )
  puts "   ✓ Created organization: #{org.name}"
else
  puts "   ✓ Using existing organization: #{org.name}"
  org.update(
    eventbrite_api_token: api_token,
    eventbrite_connected: true,
    eventbrite_connected_at: Time.current
  )
end

# Find or create an event
voxxy_event = org.events.first
unless voxxy_event
  puts "   ⚠️  No events found. Creating test event..."
  voxxy_event = org.events.create!(
    title: 'Test Event for Eventbrite Sync',
    slug: 'test-event-sync',
    event_date: 1.month.from_now,
    application_deadline: 2.weeks.from_now,
    venue: 'Test Venue',
    location: 'Chicago, IL'
  )
  puts "   ✓ Created event: #{voxxy_event.title}"
else
  puts "   ✓ Using existing event: #{voxxy_event.title}"
end

# Create payment integration
puts
puts "4. Creating payment integration..."
integration = PaymentIntegration.find_or_initialize_by(
  event: voxxy_event,
  provider: 'eventbrite'
)

integration.assign_attributes(
  organization: org,
  provider_event_id: event_id,
  provider_url: "https://www.eventbrite.com/e/#{event_id}",
  auto_sync_enabled: true,
  auto_update_payment_status: true
)

if integration.save
  puts "✓ Payment integration created/updated (ID: #{integration.id})"
else
  puts "✗ Failed to create integration: #{integration.errors.full_messages.join(', ')}"
  exit 1
end

puts
puts "5. Running payment sync..."
begin
  sync_service = PaymentSyncService.new(integration)
  log = sync_service.sync(sync_type: 'full')

  puts "✓ Sync completed!"
  puts "   Transactions fetched: #{log.transactions_fetched}"
  puts "   Transactions inserted: #{log.transactions_inserted}"
  puts "   Transactions updated: #{log.transactions_updated}"
  puts "   Contacts matched: #{log.contacts_matched}"
  puts "   Contacts updated: #{log.contacts_updated}"
  puts "   Registrations updated: #{log.registrations_updated}"

  if log.errors.present?
    puts "   ⚠️  Errors: #{log.errors}"
  end
rescue => e
  puts "✗ Sync failed: #{e.message}"
  puts e.backtrace.first(5).join("\n")
  exit 1
end

puts
puts "6. Checking synced data..."
transactions = PaymentTransaction.where(payment_integration: integration)
puts "✓ Total payment transactions in database: #{transactions.count}"

if transactions.any?
  puts
  puts "   Synced transactions:"
  transactions.each do |txn|
    puts "   • #{txn.payer_email}"
    puts "     Status: #{txn.payment_status}"
    puts "     Amount: $#{txn.amount}"
    puts "     Matched to contact: #{txn.contact ? 'Yes' : 'No'}"
    puts "     Matched to registration: #{txn.registration ? 'Yes' : 'No'}"
    puts
  end
end

puts
puts "=== Test Complete! ==="
puts
puts "Summary:"
puts "✓ API connection works"
puts "✓ Event found in Eventbrite"
puts "✓ Payment integration created"
puts "✓ Sync service works"
puts "✓ #{transactions.count} transaction(s) synced"
puts
puts "Next steps:"
puts "1. Create vendor contacts in Voxxy with emails matching Eventbrite orders"
puts "2. Run sync again to see automatic matching"
puts "3. Check that vendor_fee_paid toggles automatically"
