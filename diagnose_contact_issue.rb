# Diagnostic Script for Contact Import Issue
# Run in Rails console: load 'diagnose_contact_issue.rb'

puts "\n=== CONTACT IMPORT DIAGNOSTIC ===\n\n"

# Find the user
user_email = "info@pancakesandbooze.com"
user = User.find_by(email: user_email)

if user.nil?
  puts "❌ User not found: #{user_email}"
  puts "   Please verify the email address is correct"
  exit
end

puts "✓ Found user: #{user.email} (ID: #{user.id})"

# Get their organization
org = user.organizations.first

if org.nil?
  puts "❌ No organization found for user"
  exit
end

puts "✓ Organization: #{org.name} (ID: #{org.id})"
puts ""

# Get contact counts
total_contacts = org.vendor_contacts.count
puts "📊 CONTACT COUNTS:"
puts "   Total contacts for this org: #{total_contacts}"
puts ""

# Check Minnesota contacts
minnesota_location = org.vendor_contacts.where("location ILIKE ?", "%Minnesota%").count
minnesota_tags = org.vendor_contacts.by_tags([ 'Minnesota' ]).count rescue 0

puts "🔍 MINNESOTA FILTER RESULTS:"
puts "   By location (contains 'Minnesota'): #{minnesota_location}"
puts "   By tags (has 'Minnesota' tag): #{minnesota_tags}"
puts ""

# Get all unique locations
locations = org.vendor_contacts.where.not(location: nil).distinct.pluck(:location).sort
puts "📍 ALL UNIQUE LOCATIONS (#{locations.count} total):"
locations.first(20).each { |loc| puts "   - #{loc}" }
puts "   ... (#{locations.count - 20} more)" if locations.count > 20
puts ""

# Get all unique tags
all_tags = org.vendor_contacts.where.not(tags: nil).pluck(:tags).flatten.uniq.compact.sort
puts "🏷️  ALL UNIQUE TAGS (#{all_tags.count} total):"
all_tags.first(20).each { |tag| puts "   - #{tag}" }
puts "   ... (#{all_tags.count - 20} more)" if all_tags.count > 20
puts ""

# Check for recent imports
recent_contacts = org.vendor_contacts.where("created_at > ?", 24.hours.ago).count
puts "📥 RECENT ACTIVITY:"
puts "   Contacts created in last 24 hours: #{recent_contacts}"
puts ""

# Database-wide statistics
puts "🌐 DATABASE-WIDE STATISTICS:"
puts "   Total contacts (all organizations): #{VendorContact.count}"
puts "   Total organizations: #{Organization.count}"
puts "   Total users: #{User.count}"
puts ""

# Check for potential duplicates
duplicate_emails = org.vendor_contacts
  .where.not(email: nil)
  .group(:email)
  .having("COUNT(*) > 1")
  .count

if duplicate_emails.any?
  puts "⚠️  POTENTIAL DUPLICATES FOUND:"
  duplicate_emails.first(10).each do |email, count|
    puts "   - #{email}: #{count} records"
  end
  puts "   Total duplicate emails: #{duplicate_emails.count}"
else
  puts "✓ No duplicate emails found"
end
puts ""

# Sample Minnesota contacts
puts "📋 SAMPLE MINNESOTA CONTACTS (first 5):"
org.vendor_contacts
  .where("location ILIKE ?", "%Minnesota%")
  .limit(5)
  .each do |contact|
    puts "   - #{contact.name} (#{contact.email})"
    puts "     Location: #{contact.location}"
    puts "     Tags: #{contact.tags&.join(', ') || 'none'}"
    puts ""
  end

puts "=== DIAGNOSTIC COMPLETE ===\n\n"
