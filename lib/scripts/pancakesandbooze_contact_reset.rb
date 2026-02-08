# frozen_string_literal: true

# One-time script to reset Pancakes and Booze contacts
#
# This script:
# 1. Clears all vendor_contacts for info@pancakesandbooze.com
# 2. Imports fresh contacts from CSV with portfolio_url, instagram, and phone
#
# Usage (DRY RUN):
#   rails runner lib/scripts/pancakesandbooze_contact_reset.rb /path/to/contacts.csv
#
# Usage (ACTUAL RUN):
#   rails runner lib/scripts/pancakesandbooze_contact_reset.rb /path/to/contacts.csv run
#
# Example:
#   rails runner lib/scripts/pancakesandbooze_contact_reset.rb ~/Downloads/pancake_contacts.csv
#   rails runner lib/scripts/pancakesandbooze_contact_reset.rb ~/Downloads/pancake_contacts.csv run

ORG_EMAIL = "info@pancakesandbooze.com"

def colorize(text, color_code)
  "\e[#{color_code}m#{text}\e[0m"
end

def log_success(msg)
  puts colorize(msg, 32)
end

def log_error(msg)
  puts colorize(msg, 31)
end

def log_warning(msg)
  puts colorize(msg, 33)
end

def log_info(msg)
  puts colorize(msg, 34)
end

def log_header(title)
  puts "\n" + colorize("=" * 80, 36)
  puts colorize("  #{title.upcase}", 36)
  puts colorize("=" * 80, 36) + "\n"
end

# Parse arguments
csv_path = ARGV[0]
dry_run = ARGV[1] != "run"

if csv_path.nil?
  log_error "ERROR: Please provide a CSV file path"
  puts "\nUsage:"
  puts "  rails runner lib/scripts/pancakesandbooze_contact_reset.rb /path/to/contacts.csv          # Dry run"
  puts "  rails runner lib/scripts/pancakesandbooze_contact_reset.rb /path/to/contacts.csv run     # Actual run"
  exit 1
end

unless File.exist?(csv_path)
  log_error "ERROR: CSV file not found: #{csv_path}"
  exit 1
end

log_header("Pancakes and Booze - Contact Reset")

if dry_run
  log_warning "🔍 DRY RUN MODE - No changes will be made"
  log_info "To actually run this script, add 'run' as the second argument"
else
  log_warning "⚠️  LIVE MODE - Changes will be committed to database!"
end

# Step 1: Find organization
log_info "\n[Step 1] Finding organization..."
org = Organization.find_by(email: ORG_EMAIL)

unless org
  log_error "Organization not found: #{ORG_EMAIL}"
  log_info "\nAvailable organizations:"
  Organization.limit(10).each do |o|
    puts "  - #{o.name} (#{o.email})"
  end
  exit 1
end

log_success "✓ Found: #{org.name} (ID: #{org.id})"

# Step 2: Check existing contacts
log_info "\n[Step 2] Checking existing contacts..."
existing_contacts = org.vendor_contacts
contact_count = existing_contacts.count

log_info "Current contact count: #{contact_count}"

if contact_count > 0
  log_info "Sample contacts:"
  existing_contacts.limit(5).each do |contact|
    puts "  - #{contact.name} (#{contact.email || 'no email'})"
  end
  puts "  ... and #{contact_count - 5} more" if contact_count > 5
end

# Step 3: Preview CSV
log_info "\n[Step 3] Previewing CSV import..."
csv_file = File.open(csv_path)
content = csv_file.read.force_encoding("UTF-8")
content.gsub!("\xEF\xBB\xBF", "") # Remove BOM
csv_data = CSV.parse(content, headers: true, header_converters: :symbol)

log_info "CSV file: #{csv_path}"
log_info "Total rows: #{csv_data.length}"
log_info "Headers: #{csv_data.headers.join(', ')}"

log_info "\nFirst 3 rows preview:"
csv_data.first(3).each_with_index do |row, idx|
  puts "\n  #{colorize("Row #{idx + 1}:", 36)}"
  puts "    Name: #{row[:name]}"
  puts "    Email: #{row[:email]}" if row[:email].present?
  puts "    Phone: #{row[:phone]}" if row[:phone].present?
  puts "    Business: #{row[:business_name]}" if row[:business_name].present?
  puts "    Instagram: #{row[:instagram_handle] || row[:instagram]}" if (row[:instagram_handle] || row[:instagram]).present?
  puts "    TikTok: #{row[:tiktok_handle] || row[:tiktok]}" if (row[:tiktok_handle] || row[:tiktok]).present?
  puts "    Portfolio/Website: #{row[:portfolio_url] || row[:website]}" if (row[:portfolio_url] || row[:website]).present?
  puts "    Categories: #{row[:categories]}" if row[:categories].present?
  puts "    Tags: #{row[:tags]}" if row[:tags].present?
end

csv_file.close

if dry_run
  log_warning "\n" + "=" * 80
  log_warning "DRY RUN SUMMARY"
  log_warning "=" * 80
  log_info "Would delete: #{contact_count} existing contacts"
  log_info "Would import: #{csv_data.length} new contacts"
  log_warning "\nTo actually execute this, run:"
  puts "  rails runner lib/scripts/pancakesandbooze_contact_reset.rb #{csv_path} run"
  exit 0
end

# Step 4: Delete existing contacts
log_warning "\n[Step 4] Deleting #{contact_count} existing contacts..."

if contact_count > 0
  deleted_count = 0
  existing_contacts.find_each do |contact|
    contact.destroy
    deleted_count += 1
    print "\rDeleting: #{deleted_count}/#{contact_count}" if deleted_count % 10 == 0
  end
  puts ""
  log_success "✓ Deleted #{deleted_count} contacts"
else
  log_info "No existing contacts to delete"
end

# Step 5: Import new contacts
log_info "\n[Step 5] Importing #{csv_data.length} contacts from CSV..."

csv_file = File.open(csv_path)

service = VendorContactImportService.new(
  org,
  csv_file,
  skip_duplicates: false,
  update_existing: false
)

results = service.process
csv_file.close

# Step 6: Show results
log_header("Results")

log_success "✓ Import Complete!"
puts ""
log_info "Total rows processed: #{results[:total_rows]}"
log_success "✓ Created: #{results[:created]}"
log_warning "⚠ Skipped: #{results[:skipped]}" if results[:skipped] > 0
log_error "✗ Failed: #{results[:failed]}" if results[:failed] > 0

if results[:errors].any?
  log_error "\nErrors encountered:"
  results[:errors].first(20).each do |error|
    puts "  Row #{error[:row]} - #{error[:field]}: #{error[:message]}"
  end

  if results[:errors].length > 20
    puts "  ... and #{results[:errors].length - 20} more errors"
  end
end

# Verify final count
final_count = org.vendor_contacts.count
log_info "\nFinal contact count: #{final_count}"

log_success "\n✓ Script completed successfully!"
