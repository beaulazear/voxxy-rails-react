#!/usr/bin/env ruby
# Test script for report notification emails
# Run with: rails runner test_report_notification.rb

puts "Testing Report Notification Service..."
puts "=" * 50

# Find or create a test admin user
admin_email = ENV['TEST_EMAIL'] || 'admin@example.com'
admin_user = User.find_or_create_by(email: admin_email) do |u|
  u.name = 'Admin User'
  u.password = 'AdminPassword123!'
  u.admin = true
  u.email_notifications = true
end

# Find or create a reporter user
reporter = User.find_or_create_by(email: 'reporter@example.com') do |u|
  u.name = 'Reporter User'
  u.password = 'ReporterPassword123!'
end

# Find or create a reported user
reported_user = User.find_or_create_by(email: 'reported@example.com') do |u|
  u.name = 'Reported User'
  u.password = 'ReportedPassword123!'
  u.warnings_count = 2
end

puts "Admin user: #{admin_user.name} (#{admin_user.email})"
puts "Reporter: #{reporter.name}"
puts "Reported user: #{reported_user.name} (warnings: #{reported_user.warnings_count})"

# Create different types of reports to test
test_cases = [
  {
    reportable_type: 'Activity',
    reportable_id: 1,
    reason: 'spam',
    description: 'This activity is promoting unauthorized commercial content repeatedly.',
    activity_id: 1
  },
  {
    reportable_type: 'Comment',
    reportable_id: 1,
    reason: 'harassment',
    description: 'User posted offensive language targeting another member.',
    activity_id: nil
  },
  {
    reportable_type: 'User',
    reportable_id: reported_user.id,
    reason: 'inappropriate_content',
    description: 'User profile contains inappropriate images.',
    activity_id: nil
  }
]

puts "\nTesting report notifications for different content types..."
puts "-" * 50

test_cases.each_with_index do |test_case, index|
  puts "\n#{index + 1}. Testing #{test_case[:reportable_type]} report..."

  begin
    # Create a report
    report = Report.create!(
      reporter: reporter,
      reportable_type: test_case[:reportable_type],
      reportable_id: test_case[:reportable_id],
      reason: test_case[:reason],
      description: test_case[:description],
      activity_id: test_case[:activity_id],
      status: 'pending'
    )

    # Set some reported content for testing
    if test_case[:reportable_type] == 'Comment'
      report.update(reported_content: "This is an example of the reported comment content that violates our community guidelines...")
    elsif test_case[:reportable_type] == 'Activity'
      report.update(reported_content: "Spam activity title: Buy cheap products now! Click here for amazing deals...")
    end

    # Send the notification
    ReportNotificationService.new(report).send_admin_notification

    puts "   ✅ Report ##{report.id} created and notification sent!"
    puts "   - Type: #{report.reportable_type}"
    puts "   - Reason: #{report.reason}"
    puts "   - Has content: #{report.reported_content.present? ? 'Yes' : 'No'}"

    # Clean up
    report.destroy
  rescue => e
    puts "   ❌ Error: #{e.message}"
    puts e.backtrace.first(3)
  end
end

# Test overdue report
puts "\n4. Testing OVERDUE report notification..."
puts "-" * 30
begin
  overdue_report = Report.create!(
    reporter: reporter,
    reportable_type: 'User',
    reportable_id: reported_user.id,
    reason: 'hate_speech',
    description: 'User posted hateful content that needs immediate review.',
    status: 'pending',
    created_at: 30.hours.ago # Make it overdue
  )

  ReportNotificationService.new(overdue_report).send_admin_notification
  puts "   ✅ Overdue report notification sent!"

  overdue_report.destroy
rescue => e
  puts "   ❌ Error: #{e.message}"
  puts e.backtrace.first(3)
end

puts "\n" + "=" * 50
puts "Testing complete!"
puts "Check the email inbox for: #{admin_user.email}"
puts "\nNote: If TEST_EMAIL env variable is not set, emails were sent to admin@example.com"
puts "Set TEST_EMAIL to your email to receive the test emails:"
puts "  TEST_EMAIL=your@email.com rails runner test_report_notification.rb"

# Clean up test users if they were created just for testing
if admin_user.email == 'admin@example.com'
  puts "\nCleaning up test users..."
  admin_user.destroy
  reporter.destroy
  reported_user.destroy
end
