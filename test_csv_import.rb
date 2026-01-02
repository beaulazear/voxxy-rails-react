# Test the VendorContactImportService
puts 'Testing VendorContactImportService...'

# Find a user with an organization (or create one for testing)
user = User.where(role: 'venue_owner').first || User.first
if user.nil?
  puts 'No users found. Please create a user first.'
  exit 1
end

organization = user.organizations.first
if organization.nil?
  puts "Creating test organization for user: #{user.email}"
  organization = Organization.create!(
    user: user,
    name: 'Test Organization',
    email: user.email
  )
end

puts "Using organization: #{organization.name} (ID: #{organization.id})"
puts "Initial contact count: #{organization.vendor_contacts.count}"

# Open the test CSV file
csv_file = File.open('test_contacts.csv')

# Create the import service
service = VendorContactImportService.new(organization, csv_file)

# Process the import
result = service.process

# Display results
puts "\nImport Results:"
puts "Total rows: #{result[:total_rows]}"
puts "Created: #{result[:created]}"
puts "Updated: #{result[:updated]}"
puts "Skipped: #{result[:skipped]}"
puts "Failed: #{result[:failed]}"

if result[:errors].any?
  puts "\nErrors:"
  result[:errors].each do |error|
    puts "  Row #{error[:row]}: #{error[:message]}"
  end
end

puts "\nFinal contact count: #{organization.vendor_contacts.count}"

# Show the created contacts
puts "\nCreated contacts:"
organization.vendor_contacts.last(3).each do |contact|
  puts "  - #{contact.name} (#{contact.email}) - #{contact.company_name}"
end

csv_file.close
