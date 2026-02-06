# Preview email templates without sending
# Usage: bin/rails runner preview_email_templates.rb > email_preview.html

# Find a test event
event = Event.find_by(title: "Test") || Event.first

if event.nil?
  puts "❌ No events found"
  exit
end

# Find or create test registration
registration = Registration.where(event: event).first

if registration.nil?
  puts "❌ No registrations found"
  exit
end

# Mock data for template
vendor_contact = registration.vendor_contact || VendorContact.new(
  first_name: "Pricklyash",
  email: "test@example.com"
)

vendor_app = registration.vendor_application || VendorApplication.new(
  name: "Artists"
)

# Get artist template
artist_template = RegistrationEmailService.artist_application_received_template

# Replace placeholders with test data
artist_html = artist_template.gsub("[firstName]", vendor_contact.first_name)
  .gsub("[eventName]", event.title)
  .gsub("[dateRange]", "Wednesday, April 1, 2026")
  .gsub("[eventVenue]", event.venue || "Red Rocks Park and Amphitheatre")
  .gsub("[vendorCategory]", vendor_app.name)
  .gsub("[paymentDueDate]", "Thursday, March 19, 2026")
  .gsub("[categoryPaymentLink]", "https://www.eventbrite.com/e/test-tickets")
  .gsub("[installDate]", "Wednesday, April 1, 2026")
  .gsub("[installTime]", "08:00 - 11:00")
  .gsub("[ageRestriction]", "All Ages")
  .gsub("[organizationName]", event.organization.name)
  .gsub("[unsubscribeLink]", "https://voxxypresents.com/unsubscribe/token123")

# Get vendor template
vendor_template = RegistrationEmailService.vendor_table_application_received_template

vendor_html = vendor_template.gsub("[firstName]", "Tansy")
  .gsub("[eventCity]", event.city || "Test")
  .gsub("[dateRange]", "Wednesday, April 1, 2026")
  .gsub("[eventVenue]", event.venue || "Red Rocks Park and Amphitheatre")
  .gsub("[vendorCategory]", "Vendor Table")
  .gsub("[categoryPaymentLink]", "https://www.eventbrite.com/e/test-tickets")
  .gsub("[installTime]", "09:00 - 10:00")
  .gsub("[ageRestriction]", "All Ages")
  .gsub("[organizationName]", event.organization.name)
  .gsub("[unsubscribeLink]", "https://voxxypresents.com/unsubscribe/token456")

# Output HTML
puts <<~HTML
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Template Preview</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .email-preview { background: white; padding: 30px; margin: 20px 0; border: 1px solid #ddd; max-width: 600px; }
    h1 { color: #333; }
    .divider { margin: 40px 0; border-top: 3px solid #333; padding-top: 20px; }
  </style>
</head>
<body>
  <h1>📧 Artist Application Received Email</h1>
  <div class="email-preview">
    #{artist_html}
  </div>

  <div class="divider"></div>

  <h1>📧 Vendor Table Application Received Email</h1>
  <div class="email-preview">
    #{vendor_html}
  </div>
</body>
</html>
HTML
