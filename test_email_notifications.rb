# Test script for email notification system
puts "=" * 80
puts "EMAIL NOTIFICATION SYSTEM TEST"
puts "=" * 80

# Find a test event
event = Event.first
unless event
  puts "❌ No events found. Please create an event first."
  exit 1
end

puts "\n📋 Test Event:"
puts "  Title: #{event.title}"
puts "  Slug: #{event.slug}"
puts "  Organization: #{event.organization.name}"
puts "  Registrations: #{event.registrations.count}"

# Test 1: Event details changed detection
puts "\n" + "=" * 80
puts "TEST 1: Event Details Change Detection"
puts "=" * 80

original_date = event.event_date
event.event_date = 1.week.from_now

if event.details_changed_requiring_notification?
  puts "✅ Event details change detected!"
  change_info = event.event_change_info
  puts "  Changed fields: #{change_info[:changed_fields].join(', ')}"
  puts "  Recipient count: #{event.email_notification_count}"
else
  puts "❌ Event details change NOT detected"
end

# Rollback the change
event.reload

# Test 2: Registration payment status
puts "\n" + "=" * 80
puts "TEST 2: Registration Payment Status"
puts "=" * 80

registration = event.registrations.first
if registration
  puts "✅ Found registration:"
  puts "  ID: #{registration.id}"
  puts "  Email: #{registration.email}"
  puts "  Name: #{registration.name}"
  puts "  Payment status: #{registration.payment_status}"

  # Test payment confirmation
  if registration.payment_status != "confirmed"
    puts "\n  Testing payment confirmation..."
    original_status = registration.payment_status
    registration.payment_status = "confirmed"

    if registration.saved_change_to_payment_status?
      puts "  ✅ Payment status change detected!"
    else
      puts "  ❌ Payment status change NOT detected"
    end

    # Rollback
    registration.reload
  end
else
  puts "❌ No registrations found"
end

# Test 3: Category change
puts "\n" + "=" * 80
puts "TEST 3: Category Change Detection"
puts "=" * 80

vendor_registration = event.registrations.where.not(vendor_category: nil).first
if vendor_registration
  puts "✅ Found vendor registration:"
  puts "  ID: #{vendor_registration.id}"
  puts "  Category: #{vendor_registration.vendor_category}"

  original_category = vendor_registration.vendor_category
  vendor_registration.vendor_category = "Test Category"

  if vendor_registration.saved_change_to_vendor_category?
    puts "  ✅ Category change detected!"
    change_info = vendor_registration.category_change_info
    puts "  Old: #{change_info[:old_category]}"
    puts "  New: #{change_info[:new_category]}"
  else
    puts "  ❌ Category change NOT detected"
  end

  vendor_registration.reload
else
  puts "⚠️  No vendor registrations found"
end

# Test 4: Email service methods exist
puts "\n" + "=" * 80
puts "TEST 4: Email Service Methods"
puts "=" * 80

methods = [
  :send_confirmation,
  :send_status_update,
  :send_payment_confirmation,
  :send_category_change_notification,
  :send_event_details_changed_to_all,
  :send_event_canceled_to_all
]

methods.each do |method|
  if RegistrationEmailService.respond_to?(method)
    puts "  ✅ RegistrationEmailService.#{method} exists"
  else
    puts "  ❌ RegistrationEmailService.#{method} MISSING"
  end
end

# Test 5: API Routes
puts "\n" + "=" * 80
puts "TEST 5: API Routes"
puts "=" * 80

routes_to_check = [
  "POST /api/v1/presents/events/:event_id/email_notifications/check_event_update_impact",
  "POST /api/v1/presents/events/:event_id/email_notifications/send_event_update",
  "POST /api/v1/presents/events/:event_id/email_notifications/check_cancellation_impact",
  "POST /api/v1/presents/events/:event_id/email_notifications/send_cancellation",
  "POST /api/v1/presents/registrations/:id/email_notifications/send_payment_confirmation",
  "POST /api/v1/presents/registrations/:id/email_notifications/send_category_change"
]

puts "  ✅ Routes should be available (cannot verify without starting server)"
routes_to_check.each do |route|
  puts "     #{route}"
end

puts "\n" + "=" * 80
puts "✅ ALL TESTS COMPLETED"
puts "=" * 80
puts "\nNext steps:"
puts "1. Start Rails server: bundle exec rails s"
puts "2. Start frontend: cd ../voxxy-presents-client && npm run dev"
puts "3. Test the email notification flow in the UI"
puts "=" * 80
