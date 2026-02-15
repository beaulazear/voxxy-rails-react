# Deduplication Script for Vendor Contacts
# Run in Rails console: load 'deduplicate_contacts.rb'
#
# This script will:
# 1. Find all duplicate contacts (same email within an organization)
# 2. Keep the OLDEST record for each email
# 3. Delete all newer duplicates
# 4. Provide detailed stats

puts "\n=== CONTACT DEDUPLICATION SCRIPT ===\n\n"

# Configuration
user_email = "info@pancakesandbooze.com"
dry_run = true  # Set to false to actually delete duplicates

puts "DRY RUN MODE: #{dry_run ? 'YES (no changes will be made)' : 'NO (WILL DELETE DUPLICATES)'}"
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

# Find duplicates by email
duplicates = org.vendor_contacts
  .where.not(email: nil)
  .where.not(email: '')
  .group(:email)
  .having("COUNT(*) > 1")
  .count

if duplicates.empty?
  puts "✅ No duplicates found! All contacts have unique emails."
  exit
end

puts "🔍 DUPLICATE ANALYSIS:"
puts "   Unique emails with duplicates: #{duplicates.count}"
puts "   Total duplicate records: #{duplicates.values.sum - duplicates.count}"
puts ""

# Show top 10 most duplicated
top_duplicates = duplicates.sort_by { |_, count| -count }.first(10)
puts "📋 TOP 10 MOST DUPLICATED EMAILS:"
top_duplicates.each do |email, count|
  puts "   #{email}: #{count} copies"
end
puts ""

# Process each duplicate email
deleted_count = 0
kept_count = 0

puts "🔄 PROCESSING DUPLICATES:"
puts ""

duplicates.each do |email, count|
  # Get all contacts with this email, ordered by created_at (oldest first)
  contacts_with_email = org.vendor_contacts
    .where(email: email)
    .order(created_at: :asc)
    .to_a

  # Keep the first (oldest), mark rest for deletion
  keeper = contacts_with_email.first
  to_delete = contacts_with_email[1..-1]

  kept_count += 1

  if dry_run
    puts "   #{email}: Would keep ID #{keeper.id} (#{keeper.created_at.strftime('%Y-%m-%d %H:%M')}), delete #{to_delete.count} duplicates"
  else
    puts "   #{email}: Keeping ID #{keeper.id} (#{keeper.created_at.strftime('%Y-%m-%d %H:%M')})"
    to_delete.each do |dup|
      dup.destroy
      deleted_count += 1
    end
    puts "      Deleted #{to_delete.count} duplicates"
  end
end

puts ""
puts "=== SUMMARY ==="
puts ""
puts "Unique emails processed: #{duplicates.count}"
puts "Records kept: #{kept_count}"

if dry_run
  puts "Records that WOULD be deleted: #{duplicates.values.sum - duplicates.count}"
  puts ""
  puts "⚠️  THIS WAS A DRY RUN - NO CHANGES WERE MADE"
  puts ""
  puts "To actually perform the deduplication, edit this script and set:"
  puts "   dry_run = false"
else
  puts "Records deleted: #{deleted_count}"
  puts ""
  total_after = org.vendor_contacts.count
  puts "📊 RESULTS:"
  puts "   Before: #{total_before} contacts"
  puts "   After: #{total_after} contacts"
  puts "   Removed: #{total_before - total_after} duplicates"
  puts ""
  puts "✅ DEDUPLICATION COMPLETE!"
end

puts ""
