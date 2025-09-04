#!/usr/bin/env ruby
# Final test script for report notification emails
# Run with: rails runner test_report_notification_final.rb

puts "Testing Report Notification Service..."
puts "=" * 50

# Make sure we have an admin to receive notifications
admin_email = ENV['TEST_EMAIL'] || 'beaulazear@gmail.com'
admin_user = User.find_by(email: admin_email)

if admin_user.nil?
  puts "Creating admin user: #{admin_email}"
  admin_user = User.create!(
    email: admin_email,
    name: 'Admin User',
    password: 'AdminPassword123!',
    password_confirmation: 'AdminPassword123!',
    admin: true,
    email_notifications: true
  )
else
  puts "Using existing admin: #{admin_user.name} (#{admin_user.email})"
  admin_user.update(admin: true, email_notifications: true) unless admin_user.admin?
end

# Create test users for the report scenario
reporter = User.find_or_create_by(email: 'test_reporter@example.com') do |u|
  u.name = 'Test Reporter'
  u.password = 'TestPassword123!'
  u.password_confirmation = 'TestPassword123!'
end

reported_user = User.find_or_create_by(email: 'test_offender@example.com') do |u|
  u.name = 'Test Offender'
  u.password = 'TestPassword123!'
  u.password_confirmation = 'TestPassword123!'
  u.warnings_count = 1
end

puts "Reporter: #{reporter.name} (ID: #{reporter.id})"
puts "Reported User: #{reported_user.name} (ID: #{reported_user.id})"

# Test 1: Normal report
puts "\n1. Testing NORMAL report notification..."
puts "-" * 40

begin
  # Check if report already exists
  existing_report = Report.find_by(
    reporter_id: reporter.id,
    reportable_type: 'User',
    reportable_id: reported_user.id
  )

  if existing_report
    puts "Deleting existing report ##{existing_report.id}"
    existing_report.destroy
  end

  # Create a new report
  report = Report.create!(
    reporter_id: reporter.id,
    reportable_type: 'User',
    reportable_id: reported_user.id,
    reason: 'harassment',
    description: 'This user has been sending inappropriate messages to multiple members.',
    status: 'pending'
  )

  puts "✅ Report ##{report.id} created"

  # Send notification
  service = ReportNotificationService.new(report)
  service.send_admin_notification

  puts "✅ Notification sent to admin: #{admin_user.email}"

  # Clean up
  report.destroy

rescue => e
  puts "❌ Error: #{e.message}"
  puts e.backtrace.first(3).join("\n")
end

# Test 2: Overdue report
puts "\n2. Testing OVERDUE report notification..."
puts "-" * 40

begin
  # Create an overdue report
  overdue_report = Report.create!(
    reporter_id: reporter.id,
    reportable_type: 'User',
    reportable_id: reported_user.id,
    reason: 'hate_speech',
    description: 'URGENT: User posted hateful content that violates community guidelines.',
    status: 'pending'
  )

  # Make it overdue by backdating creation
  overdue_report.update_column(:created_at, 30.hours.ago)

  puts "✅ Overdue report ##{overdue_report.id} created (30 hours old)"

  # Send notification
  service = ReportNotificationService.new(overdue_report)
  service.send_admin_notification

  puts "✅ Overdue notification sent to admin: #{admin_user.email}"

  # Clean up
  overdue_report.destroy

rescue => e
  puts "❌ Error: #{e.message}"
  puts e.backtrace.first(3).join("\n")
end

puts "\n" + "=" * 50
puts "✅ Testing complete!"
puts "\nEmails sent to: #{admin_user.email}"
puts "\nThe emails should include:"
puts "- Voxxy logo and branding"
puts "- Gradient background styling"
puts "- 24-hour response requirement alert"
puts "- 'Review Report' button with correct URL"
puts "- Report details and user information"
puts "- Overdue warning for the second email"

# Clean up test users if they were created for testing
if reporter.email.include?('test_')
  puts "\nCleaning up test users..."
  reporter.destroy
  reported_user.destroy
end
