#!/usr/bin/env ruby
# Simple test script for report notification emails
# Run with: rails runner test_report_notification_simple.rb

puts "Testing Report Notification Service (Simple)..."
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
puts "Reporter: #{reporter.name} (ID: #{reporter.id})"
puts "Reported user: #{reported_user.name} (ID: #{reported_user.id})"

# Create a simple user-on-user report (User model exists)
puts "\nTesting User report notification..."
puts "-" * 30

begin
  # Create a report on a user
  report = Report.new(
    reporter_id: reporter.id,  # Set reporter_id explicitly
    reportable_type: 'User',
    reportable_id: reported_user.id,
    reason: 'harassment',
    description: 'This user has been harassing multiple members with offensive messages.',
    status: 'pending'
  )

  # Set some reported content
  report.reported_content = "Example of offensive content: [inappropriate message removed for safety]"

  if report.save
    puts "✅ Report ##{report.id} created successfully"

    # Send the notification
    ReportNotificationService.new(report).send_admin_notification

    puts "✅ Notification sent to admin!"
    puts "   - Report ID: #{report.id}"
    puts "   - Reporter: #{report.reporter.name}"
    puts "   - Reported User: #{reported_user.name}"
    puts "   - Reason: #{report.reason}"

    # Test with an overdue report by updating created_at
    puts "\nTesting OVERDUE notification..."
    report.update_column(:created_at, 30.hours.ago)

    ReportNotificationService.new(report).send_admin_notification
    puts "✅ Overdue notification sent!"

    # Clean up
    report.destroy
  else
    puts "❌ Failed to create report: #{report.errors.full_messages.join(', ')}"
  end
rescue => e
  puts "❌ Error: #{e.message}"
  puts e.backtrace.first(3)
end

puts "\n" + "=" * 50
puts "Testing complete!"
puts "Check the email inbox for: #{admin_user.email}"
puts "\nThe email should now:"
puts "- Use Voxxy branding with logo"
puts "- Have proper styling with gradient background"
puts "- Include a 'Review Report' button"
puts "- Show the correct URL based on PRIMARY_DOMAIN env variable"
puts "- Display 24-hour response requirement prominently"

# Clean up test users if they were created just for testing
if admin_user.email == 'admin@example.com'
  puts "\nCleaning up test users..."
  admin_user.destroy if admin_user.persisted?
  reporter.destroy if reporter.persisted?
  reported_user.destroy if reported_user.persisted?
end
