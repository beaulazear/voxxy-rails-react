# Delete Minneapolis Contacts Script
# Run in Rails console: load 'delete_minneapolis_contacts.rb'
#
# WARNING: This will DELETE all contacts with "Minneapolis" in location or tags
# Use this if you want to completely remove the Minneapolis import and start over

puts "\n=== DELETE MINNEAPOLIS CONTACTS ===\n\n"

# Configuration
user_email = "info@pancakesandbooze.com"
dry_run = true  # Set to false to actually delete

puts "⚠️  WARNING: This will delete ALL Minneapolis contacts!"
puts "DRY RUN MODE: #{dry_run ? 'YES (no changes will be made)' : 'NO (WILL DELETE CONTACTS)'}"
puts ""

# Find the user and organization
user = User.find_by(email: user_email)
if user.nil?
  puts "❌ User not found: #{user_email}"
  exit
end

org = user.organizations.first
if org.nil?
  puts "❌ No organization found for user"
  exit
end

puts "✓ Found organization: #{org.name} (ID: #{org.id})"
puts ""

# Get current counts
total_before = org.vendor_contacts.count
puts "📊 CURRENT STATE:"
puts "   Total contacts: #{total_before}"
puts ""

# Find Minneapolis contacts
# Location contains "Minneapolis, MN" OR tags contain "Minneapolis"
minneapolis_contacts = org.vendor_contacts.where(
  "location ILIKE ? OR tags @> ?",
  "%Minneapolis%",
  [ "Minneapolis" ].to_json
)

minneapolis_count = minneapolis_contacts.count

if minneapolis_count == 0
  puts "✅ No Minneapolis contacts found!"
  exit
end

puts "🔍 MINNEAPOLIS CONTACTS FOUND:"
puts "   Total to delete: #{minneapolis_count}"
puts ""

# Show sample
puts "📋 SAMPLE (first 10):"
minneapolis_contacts.limit(10).each do |contact|
  puts "   ID #{contact.id}: #{contact.contact_name} (#{contact.email}) - #{contact.location} - Tags: #{contact.tags&.join(', ')}"
end
puts ""

# Show when they were created
recent = minneapolis_contacts.where("created_at > ?", 48.hours.ago).count
puts "   Created in last 48 hours: #{recent}"
puts "   Created before that: #{minneapolis_count - recent}"
puts ""

if dry_run
  puts "⚠️  THIS IS A DRY RUN - NO CHANGES WILL BE MADE"
  puts ""
  puts "This would delete #{minneapolis_count} contacts"
  puts ""
  puts "To actually perform the deletion, edit this script and set:"
  puts "   dry_run = false"
else
  puts "🗑️  DELETING CONTACTS..."
  puts ""

  deleted = 0
  minneapolis_contacts.find_each do |contact|
    contact.destroy
    deleted += 1
    print "." if deleted % 100 == 0
  end

  puts ""
  puts ""

  total_after = org.vendor_contacts.count

  puts "=== DELETION COMPLETE ==="
  puts ""
  puts "📊 RESULTS:"
  puts "   Before: #{total_before} contacts"
  puts "   After: #{total_after} contacts"
  puts "   Deleted: #{deleted} Minneapolis contacts"
  puts ""
  puts "✅ All Minneapolis contacts have been removed!"
end

puts ""
