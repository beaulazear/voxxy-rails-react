# Test automatic payment matching
# Usage: rails runner test_matching.rb API_TOKEN EVENT_ID

api_token = ARGV[0] || '2TA23N55S35ZBJ6M5BNW'
event_id = ARGV[1] || '1981459683252'

puts "=== Testing Automatic Payment Matching ==="
puts

# Get the organization and integration
org = Organization.first
integration = PaymentIntegration.first

unless org && integration
  puts "✗ No organization or integration found. Run test_full_sync.rb first."
  exit 1
end

puts "1. Creating test vendor contact with email: greerlcourtney@gmail.com"
contact = VendorContact.find_or_create_by!(
  email: 'greerlcourtney@gmail.com',
  organization: org
) do |c|
  c.name = 'Courtney Greer'
  c.business_name = 'Test Vendor Business'
  c.contact_type = 'vendor'
  c.status = 'new'
  c.categories = ['Artist']
end

puts "✓ Contact created/found (ID: #{contact.id})"
puts "   Payment status before sync: #{contact.payment_status}"
puts

puts "2. Creating test registration..."
event = integration.event
registration = Registration.find_or_create_by!(
  email: 'greerlcourtney@gmail.com',
  event: event
) do |r|
  r.status = 'pending'
  r.vendor_category = 'Artist'
  r.business_name = 'Test Vendor Business'
end

puts "✓ Registration created/found (ID: #{registration.id})"
puts "   vendor_fee_paid before sync: #{registration.vendor_fee_paid}"
puts

puts "3. Running payment sync..."
sync_service = PaymentSyncService.new(integration)
log = sync_service.sync(sync_type: 'incremental')

puts "✓ Sync completed!"
puts "   Transactions fetched: #{log.transactions_fetched}"
puts "   Contacts matched: #{log.contacts_matched}"
puts "   Contacts updated: #{log.contacts_updated}"
puts "   Registrations updated: #{log.registrations_updated}"
puts

puts "4. Checking results..."
contact.reload
registration.reload

puts "✓ Contact updated:"
puts "   Payment status: #{contact.payment_status}"
puts "   Payment amount: $#{contact.payment_amount}"
puts "   Payment provider: #{contact.payment_provider}"
puts "   Payment date: #{contact.payment_date}"
puts

puts "✓ Registration updated:"
puts "   vendor_fee_paid: #{registration.vendor_fee_paid}"
puts "   Payment provider: #{registration.payment_provider}"
puts "   Payment amount: $#{registration.payment_amount}"
puts

if registration.vendor_fee_paid
  puts "🎉 SUCCESS! The vendor_fee_paid toggle worked!"
  puts "   This would normally trigger the payment confirmation email."
else
  puts "⚠️  vendor_fee_paid is still false. Check the sync logic."
end

puts
puts "=== Test Complete ==="
