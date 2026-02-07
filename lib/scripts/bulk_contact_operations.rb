# frozen_string_literal: true

# Bulk Contact Operations Script
#
# This script provides reusable operations for managing vendor contacts in bulk:
# - Clear all contacts for an organization
# - Bulk import from CSV
# - Bulk update fields (tags, categories, etc.)
# - Bulk delete by criteria
#
# Usage:
#   rails runner lib/scripts/bulk_contact_operations.rb
#
# Or call specific methods:
#   BulkContactOperations.clear_organization_contacts("org@email.com", dry_run: true)
#   BulkContactOperations.bulk_import_csv("org@email.com", "/path/to/file.csv", dry_run: false)
#   BulkContactOperations.bulk_add_tag("org@email.com", contact_ids: [1,2,3], tag: "VIP")
#   BulkContactOperations.bulk_remove_category("org@email.com", contact_ids: [1,2,3], category: "Outdated")

require 'csv'

class BulkContactOperations
  # ANSI color codes for terminal output
  COLORS = {
    green: "\e[32m",
    red: "\e[31m",
    yellow: "\e[33m",
    blue: "\e[34m",
    cyan: "\e[36m",
    reset: "\e[0m"
  }.freeze

  class << self
    # ============================================================================
    # CLEAR ALL CONTACTS FOR AN ORGANIZATION
    # ============================================================================
    def clear_organization_contacts(organization_email, dry_run: true)
      log_header("Clear Organization Contacts")

      org = find_organization(organization_email)
      return unless org

      contacts = org.vendor_contacts
      contact_count = contacts.count

      log_info "Found #{contact_count} contacts for organization: #{org.name} (#{org.email})"

      if contact_count == 0
        log_warning "No contacts to delete"
        return { deleted: 0 }
      end

      if dry_run
        log_warning "DRY RUN MODE - No changes will be made"
        log_info "Would delete #{contact_count} contacts:"

        # Show first 10 contacts as preview
        contacts.limit(10).each do |contact|
          puts "  - #{contact.name} (#{contact.email || 'no email'})"
        end

        if contact_count > 10
          puts "  ... and #{contact_count - 10} more"
        end
      else
        log_warning "DELETING #{contact_count} contacts..."

        deleted_count = 0
        contacts.find_each do |contact|
          contact.destroy
          deleted_count += 1
          print "\rDeleted: #{deleted_count}/#{contact_count}" if deleted_count % 10 == 0
        end

        puts "" # New line after progress
        log_success "✓ Deleted #{deleted_count} contacts"

        return { deleted: deleted_count }
      end
    end

    # ============================================================================
    # BULK IMPORT FROM CSV
    # ============================================================================
    def bulk_import_csv(organization_email, csv_path, dry_run: true, update_existing: false)
      log_header("Bulk Import CSV")

      org = find_organization(organization_email)
      return unless org

      unless File.exist?(csv_path)
        log_error "CSV file not found: #{csv_path}"
        return
      end

      log_info "Reading CSV: #{csv_path}"

      csv_file = File.open(csv_path)

      if dry_run
        log_warning "DRY RUN MODE - No changes will be made"
        preview_csv_import(csv_file)
        csv_file.rewind
      end

      unless dry_run
        log_info "Starting import with update_existing: #{update_existing}"

        service = VendorContactImportService.new(
          org,
          csv_file,
          skip_duplicates: !update_existing,
          update_existing: update_existing
        )

        results = service.process

        log_success "\n✓ Import Complete!"
        log_info "Total rows: #{results[:total_rows]}"
        log_success "Created: #{results[:created]}"
        log_info "Updated: #{results[:updated]}" if update_existing
        log_warning "Skipped: #{results[:skipped]}"
        log_error "Failed: #{results[:failed]}"

        if results[:errors].any?
          log_error "\nErrors:"
          results[:errors].first(20).each do |error|
            puts "  Row #{error[:row]} - #{error[:field]}: #{error[:message]}"
          end

          if results[:errors].length > 20
            puts "  ... and #{results[:errors].length - 20} more errors"
          end
        end

        return results
      end
    ensure
      csv_file&.close
    end

    # ============================================================================
    # BULK ADD TAG TO CONTACTS
    # ============================================================================
    def bulk_add_tag(organization_email, contact_ids: [], tag:, dry_run: true)
      log_header("Bulk Add Tag")

      org = find_organization(organization_email)
      return unless org

      contacts = org.vendor_contacts.where(id: contact_ids)

      if contacts.empty?
        log_error "No contacts found with provided IDs"
        return
      end

      log_info "Found #{contacts.count} contacts to tag with '#{tag}'"

      if dry_run
        log_warning "DRY RUN MODE - No changes will be made"
        contacts.limit(10).each do |contact|
          current_tags = contact.tags || []
          will_add = current_tags.include?(tag) ? "(already has tag)" : "(will add)"
          puts "  - #{contact.name}: #{current_tags.inspect} #{will_add}"
        end
      else
        updated_count = 0
        contacts.find_each do |contact|
          contact.add_tag(tag)
          updated_count += 1
        end

        log_success "✓ Added tag '#{tag}' to #{updated_count} contacts"
        return { updated: updated_count }
      end
    end

    # ============================================================================
    # BULK REMOVE TAG FROM CONTACTS
    # ============================================================================
    def bulk_remove_tag(organization_email, contact_ids: [], tag:, dry_run: true)
      log_header("Bulk Remove Tag")

      org = find_organization(organization_email)
      return unless org

      contacts = org.vendor_contacts.where(id: contact_ids)

      if contacts.empty?
        log_error "No contacts found with provided IDs"
        return
      end

      log_info "Found #{contacts.count} contacts to remove tag '#{tag}'"

      if dry_run
        log_warning "DRY RUN MODE - No changes will be made"
        contacts.limit(10).each do |contact|
          current_tags = contact.tags || []
          will_remove = current_tags.include?(tag) ? "(will remove)" : "(doesn't have tag)"
          puts "  - #{contact.name}: #{current_tags.inspect} #{will_remove}"
        end
      else
        updated_count = 0
        contacts.find_each do |contact|
          contact.remove_tag(tag)
          updated_count += 1
        end

        log_success "✓ Removed tag '#{tag}' from #{updated_count} contacts"
        return { updated: updated_count }
      end
    end

    # ============================================================================
    # BULK ADD CATEGORY TO CONTACTS
    # ============================================================================
    def bulk_add_category(organization_email, contact_ids: [], category:, dry_run: true)
      log_header("Bulk Add Category")

      org = find_organization(organization_email)
      return unless org

      contacts = org.vendor_contacts.where(id: contact_ids)

      if contacts.empty?
        log_error "No contacts found with provided IDs"
        return
      end

      log_info "Found #{contacts.count} contacts to categorize as '#{category}'"

      if dry_run
        log_warning "DRY RUN MODE - No changes will be made"
        contacts.limit(10).each do |contact|
          current_categories = contact.categories || []
          will_add = current_categories.include?(category) ? "(already has category)" : "(will add)"
          puts "  - #{contact.name}: #{current_categories.inspect} #{will_add}"
        end
      else
        updated_count = 0
        contacts.find_each do |contact|
          contact.add_category(category)
          updated_count += 1
        end

        log_success "✓ Added category '#{category}' to #{updated_count} contacts"
        return { updated: updated_count }
      end
    end

    # ============================================================================
    # BULK REMOVE CATEGORY FROM CONTACTS
    # ============================================================================
    def bulk_remove_category(organization_email, contact_ids: [], category:, dry_run: true)
      log_header("Bulk Remove Category")

      org = find_organization(organization_email)
      return unless org

      contacts = org.vendor_contacts.where(id: contact_ids)

      if contacts.empty?
        log_error "No contacts found with provided IDs"
        return
      end

      log_info "Found #{contacts.count} contacts to remove category '#{category}'"

      if dry_run
        log_warning "DRY RUN MODE - No changes will be made"
        contacts.limit(10).each do |contact|
          current_categories = contact.categories || []
          will_remove = current_categories.include?(category) ? "(will remove)" : "(doesn't have category)"
          puts "  - #{contact.name}: #{current_categories.inspect} #{will_remove}"
        end
      else
        updated_count = 0
        contacts.find_each do |contact|
          contact.remove_category(category)
          updated_count += 1
        end

        log_success "✓ Removed category '#{category}' from #{updated_count} contacts"
        return { updated: updated_count }
      end
    end

    # ============================================================================
    # BULK DELETE CONTACTS BY IDS
    # ============================================================================
    def bulk_delete_contacts(organization_email, contact_ids: [], dry_run: true)
      log_header("Bulk Delete Contacts")

      org = find_organization(organization_email)
      return unless org

      contacts = org.vendor_contacts.where(id: contact_ids)

      if contacts.empty?
        log_error "No contacts found with provided IDs"
        return
      end

      log_info "Found #{contacts.count} contacts to delete"

      if dry_run
        log_warning "DRY RUN MODE - No changes will be made"
        contacts.each do |contact|
          puts "  - Would delete: #{contact.name} (#{contact.email || 'no email'})"
        end
      else
        log_warning "DELETING #{contacts.count} contacts..."
        deleted_count = contacts.destroy_all.length

        log_success "✓ Deleted #{deleted_count} contacts"
        return { deleted: deleted_count }
      end
    end

    # ============================================================================
    # HELPER: FIND ORGANIZATION BY EMAIL
    # ============================================================================
    private

    def find_organization(email)
      org = Organization.find_by(email: email.downcase.strip)

      if org
        log_success "✓ Found organization: #{org.name} (ID: #{org.id})"
        org
      else
        log_error "Organization not found with email: #{email}"
        log_info "Available organizations:"
        Organization.limit(10).each do |o|
          puts "  - #{o.name} (#{o.email})"
        end
        nil
      end
    end

    def preview_csv_import(csv_file)
      content = csv_file.read.force_encoding("UTF-8")
      content.gsub!("\xEF\xBB\xBF", "") # Remove BOM

      csv_data = CSV.parse(content, headers: true, header_converters: :symbol)

      log_info "CSV has #{csv_data.length} rows"
      log_info "Headers: #{csv_data.headers.join(', ')}"

      log_info "\nFirst 5 rows preview:"
      csv_data.first(5).each_with_index do |row, idx|
        puts "\n  Row #{idx + 1}:"
        puts "    Name: #{row[:name]}"
        puts "    Email: #{row[:email]}" if row[:email].present?
        puts "    Phone: #{row[:phone]}" if row[:phone].present?
        puts "    Business: #{row[:business_name]}" if row[:business_name].present?
        puts "    Instagram: #{row[:instagram_handle] || row[:instagram]}" if (row[:instagram_handle] || row[:instagram]).present?
        puts "    Portfolio/Website: #{row[:portfolio_url] || row[:website]}" if (row[:portfolio_url] || row[:website]).present?
        puts "    Categories: #{row[:categories]}" if row[:categories].present?
        puts "    Tags: #{row[:tags]}" if row[:tags].present?
      end

      if csv_data.length > 5
        puts "\n  ... and #{csv_data.length - 5} more rows"
      end
    end

    # ============================================================================
    # LOGGING HELPERS
    # ============================================================================
    def log_header(title)
      puts "\n#{COLORS[:cyan]}#{'=' * 80}"
      puts "  #{title.upcase}"
      puts "#{'=' * 80}#{COLORS[:reset]}\n"
    end

    def log_success(message)
      puts "#{COLORS[:green]}#{message}#{COLORS[:reset]}"
    end

    def log_info(message)
      puts "#{COLORS[:blue]}#{message}#{COLORS[:reset]}"
    end

    def log_warning(message)
      puts "#{COLORS[:yellow]}#{message}#{COLORS[:reset]}"
    end

    def log_error(message)
      puts "#{COLORS[:red]}#{message}#{COLORS[:reset]}"
    end
  end
end

# ============================================================================
# INTERACTIVE MODE (when run directly)
# ============================================================================
if __FILE__ == $PROGRAM_NAME || ARGV.include?('interactive')
  puts <<~BANNER
    #{BulkContactOperations::COLORS[:cyan]}
    ╔════════════════════════════════════════════════════════════════╗
    ║                                                                ║
    ║           BULK CONTACT OPERATIONS SCRIPT                       ║
    ║                                                                ║
    ╚════════════════════════════════════════════════════════════════╝
    #{BulkContactOperations::COLORS[:reset]}
  BANNER

  puts "\nAvailable operations:"
  puts "  1. Clear all contacts for organization"
  puts "  2. Bulk import from CSV"
  puts "  3. Bulk add tag"
  puts "  4. Bulk remove tag"
  puts "  5. Bulk add category"
  puts "  6. Bulk remove category"
  puts "  7. Bulk delete specific contacts"
  puts "  0. Exit"

  print "\nSelect operation (0-7): "
  operation = gets.chomp.to_i

  case operation
  when 1
    print "Organization email: "
    org_email = gets.chomp

    print "Dry run? (y/n, default: y): "
    dry_run = gets.chomp.downcase != 'n'

    BulkContactOperations.clear_organization_contacts(org_email, dry_run: dry_run)

  when 2
    print "Organization email: "
    org_email = gets.chomp

    print "CSV file path: "
    csv_path = gets.chomp

    print "Update existing contacts? (y/n, default: n): "
    update_existing = gets.chomp.downcase == 'y'

    print "Dry run? (y/n, default: y): "
    dry_run = gets.chomp.downcase != 'n'

    BulkContactOperations.bulk_import_csv(org_email, csv_path, dry_run: dry_run, update_existing: update_existing)

  when 3
    print "Organization email: "
    org_email = gets.chomp

    print "Contact IDs (comma-separated): "
    contact_ids = gets.chomp.split(',').map(&:strip).map(&:to_i)

    print "Tag to add: "
    tag = gets.chomp

    print "Dry run? (y/n, default: y): "
    dry_run = gets.chomp.downcase != 'n'

    BulkContactOperations.bulk_add_tag(org_email, contact_ids: contact_ids, tag: tag, dry_run: dry_run)

  when 0
    puts "Exiting..."
  else
    puts "Invalid operation"
  end
end
