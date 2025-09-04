#!/usr/bin/env ruby
# Test script for moderation emails
# Run with: rails runner test_moderation_emails.rb

puts "Testing Moderation Email Service..."
puts "=" * 50

# Find or create a test user
test_email = ENV['TEST_EMAIL'] || 'test@example.com'
test_user = User.find_or_create_by(email: test_email) do |u|
  u.name = 'Test User'
  u.password = 'TestPassword123!'
  u.email_notifications = true
end

puts "Using test user: #{test_user.name} (#{test_user.email})"
puts "Warnings count: #{test_user.warnings_count}"

# Create a sample report for context
report = Report.new(
  reporter: test_user,
  reportable: test_user,
  reportable_type: 'User',
  reason: 'Inappropriate content',
  description: 'Posted offensive language in comments',
  status: 'pending'
)

puts "\n1. Testing WARNING email..."
puts "-" * 30
begin
  # Increment warnings for testing
  test_user.update(warnings_count: 1)
  UserModerationEmailService.send_moderation_email(test_user, 'warning', report)
  puts "✅ Warning email sent successfully!"
rescue => e
  puts "❌ Error sending warning email: #{e.message}"
  puts e.backtrace.first(5)
end

puts "\n2. Testing SUSPENSION email..."
puts "-" * 30
begin
  # Set suspension details
  test_user.update(
    suspended_until: 3.days.from_now,
    suspension_reason: 'Multiple community guideline violations'
  )
  UserModerationEmailService.send_moderation_email(test_user, 'suspended', report)
  puts "✅ Suspension email sent successfully!"
  puts "   Suspended until: #{test_user.suspended_until}"
rescue => e
  puts "❌ Error sending suspension email: #{e.message}"
  puts e.backtrace.first(5)
end

puts "\n3. Testing BAN email..."
puts "-" * 30
begin
  # Set ban details
  test_user.update(
    banned_at: Time.current,
    ban_reason: 'Severe and repeated violations of community guidelines'
  )
  UserModerationEmailService.send_moderation_email(test_user, 'banned', report)
  puts "✅ Ban email sent successfully!"
rescue => e
  puts "❌ Error sending ban email: #{e.message}"
  puts e.backtrace.first(5)
end

puts "\n4. Testing backward compatibility (instance method)..."
puts "-" * 30
begin
  service = UserModerationEmailService.new(test_user, 'warned', report)
  service.send_email
  puts "✅ Backward compatibility works!"
rescue => e
  puts "❌ Error with backward compatibility: #{e.message}"
  puts e.backtrace.first(5)
end

puts "\n" + "=" * 50
puts "Email testing complete!"
puts "Check the email inbox for: #{test_user.email}"
puts "\nNote: If TEST_EMAIL env variable is not set, emails were sent to test@example.com"
puts "Set TEST_EMAIL to your email to receive the test emails:"
puts "  TEST_EMAIL=your@email.com rails runner test_moderation_emails.rb"

# Clean up test user if it was created just for testing
if test_user.email == 'test@example.com'
  puts "\nCleaning up test user..."
  test_user.destroy
end
