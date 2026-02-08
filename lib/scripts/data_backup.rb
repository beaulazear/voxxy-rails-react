#!/usr/bin/env ruby
# frozen_string_literal: true

# Data Backup/Export Script
# Purpose: Export event data to JSON for disaster recovery
#
# Usage:
#   # Export single event
#   rails runner lib/scripts/data_backup.rb --event=summer-market-2026
#
#   # Export all events for organization
#   rails runner lib/scripts/data_backup.rb --organization=voxxy-presents
#
#   # Restore from backup (creates new event)
#   rails runner lib/scripts/data_backup.rb --restore=backups/summer-market-2026-2026-02-08.json
#
#   # List available backups
#   rails runner lib/scripts/data_backup.rb --list
#
# Options:
#   --event=SLUG            Export single event by slug
#   --organization=SLUG     Export all events for organization by slug
#   --restore=FILE          Restore from backup file (creates new event)
#   --output=PATH           Output directory (default: ./backups)
#   --list                  List all available backups
#   --help                  Show this help message

require 'optparse'
require 'json'
require 'fileutils'

class DataBackupScript
  BACKUP_DIR = Rails.root.join('backups').freeze

  def initialize(options = {})
    @event_slug = options[:event]
    @organization_slug = options[:organization]
    @restore_file = options[:restore]
    @output_dir = options[:output] || BACKUP_DIR
    @list_backups = options[:list]

    # Ensure backup directory exists
    FileUtils.mkdir_p(@output_dir)
  end

  def run
    if @list_backups
      list_backups
    elsif @restore_file
      restore_from_backup
    elsif @event_slug
      export_event
    elsif @organization_slug
      export_organization
    else
      raise "❌ Must specify --event, --organization, --restore, or --list"
    end
  end

  private

  # ============================================================================
  # EXPORT METHODS
  # ============================================================================

  def export_event
    validate_safety!

    event = Event.find_by(slug: @event_slug)
    raise "❌ Event not found: #{@event_slug}" unless event

    puts "\n" + "="*80
    puts "EVENT DATA EXPORT"
    puts "="*80
    puts "Event: #{event.title} (#{@event_slug})"
    puts "Organization: #{event.organization.name}"
    puts "="*80 + "\n"

    # Collect all event data
    data = build_event_data(event)

    # Generate filename
    timestamp = Time.current.strftime('%Y-%m-%d-%H%M%S')
    filename = "#{event.slug}-#{timestamp}.json"
    filepath = File.join(@output_dir, filename)

    # Write to file
    File.write(filepath, JSON.pretty_generate(data))

    puts "\n✅ Event data exported successfully!"
    puts "📁 File: #{filepath}"
    puts "📊 Size: #{File.size(filepath)} bytes"
    puts "\nBackup includes:"
    puts "  - Event details"
    puts "  - #{data[:registrations].count} vendor applications/registrations"
    puts "  - #{data[:event_invitations].count} invitation list contacts"
    puts "  - #{data[:scheduled_emails].count} scheduled emails"
    puts "  - #{data[:email_deliveries].count} email delivery records"
    puts "  - #{data[:vendor_applications].count} vendor application forms"
    puts "  - #{data[:payment_integrations].count} payment integrations"
    puts "  - Event portal settings"
    puts "\n"
  end

  def export_organization
    validate_safety!

    organization = Organization.find_by(slug: @organization_slug)
    raise "❌ Organization not found: #{@organization_slug}" unless organization

    puts "\n" + "="*80
    puts "ORGANIZATION DATA EXPORT"
    puts "="*80
    puts "Organization: #{organization.name} (#{@organization_slug})"
    puts "Events: #{organization.events.count}"
    puts "="*80 + "\n"

    events_exported = 0
    organization.events.each do |event|
      begin
        @event_slug = event.slug
        export_event
        events_exported += 1
      rescue => e
        puts "❌ Failed to export #{event.slug}: #{e.message}"
      end
    end

    puts "\n" + "="*80
    puts "✅ Exported #{events_exported} events for #{organization.name}"
    puts "="*80 + "\n"
  end

  def build_event_data(event)
    {
      # Metadata
      exported_at: Time.current.iso8601,
      export_version: '1.0',
      original_event_id: event.id,

      # Core event data
      event: event.attributes.except('id', 'created_at', 'updated_at'),

      # Organization reference (for context)
      organization: {
        id: event.organization.id,
        name: event.organization.name,
        slug: event.organization.slug
      },

      # Registrations (vendor applications/registrations)
      registrations: event.registrations.map do |reg|
        reg.attributes.except('id', 'event_id', 'created_at', 'updated_at')
      end,

      # Event invitations (invitation list)
      event_invitations: event.event_invitations.map do |inv|
        {
          **inv.attributes.except('id', 'event_id', 'vendor_contact_id', 'created_at', 'updated_at'),
          vendor_contact: inv.vendor_contact&.attributes&.except('id', 'organization_id', 'created_at', 'updated_at')
        }
      end,

      # Scheduled emails
      scheduled_emails: event.scheduled_emails.map do |email|
        email.attributes.except('id', 'event_id', 'email_campaign_template_id', 'email_template_item_id', 'created_at', 'updated_at')
      end,

      # Email deliveries (for tracking/analytics)
      email_deliveries: event.email_deliveries.map do |delivery|
        delivery.attributes.except('id', 'event_id', 'scheduled_email_id', 'registration_id', 'event_invitation_id', 'created_at', 'updated_at')
      end,

      # Vendor application forms
      vendor_applications: event.vendor_applications.map do |app|
        app.attributes.except('id', 'event_id', 'created_at', 'updated_at')
      end,

      # Event portal settings
      event_portal: event.event_portal&.attributes&.except('id', 'event_id', 'created_at', 'updated_at'),

      # Payment integrations
      payment_integrations: event.payment_integrations.map do |integration|
        integration.attributes.except('id', 'event_id', 'created_at', 'updated_at')
      end,

      # Email campaign template reference (for context)
      email_campaign_template: event.email_campaign_template&.attributes&.except('id', 'organization_id', 'created_at', 'updated_at')
    }
  end

  # ============================================================================
  # RESTORE METHODS
  # ============================================================================

  def restore_from_backup
    validate_safety!

    raise "❌ Backup file not found: #{@restore_file}" unless File.exist?(@restore_file)

    puts "\n" + "="*80
    puts "RESTORE FROM BACKUP"
    puts "="*80
    puts "File: #{@restore_file}"
    puts "="*80 + "\n"

    # Load backup data
    data = JSON.parse(File.read(@restore_file), symbolize_names: true)

    puts "📊 Backup Information:"
    puts "  Exported at: #{data[:exported_at]}"
    puts "  Original Event: #{data[:event][:title]}"
    puts "  Organization: #{data[:organization][:name]}"
    puts "\nThis will create a NEW event with the backed up data."
    puts "⚠️  WARNING: This is a restore operation. Data will be written to the database!"
    print "\nType 'yes' to continue: "

    confirmation = STDIN.gets.chomp
    unless confirmation.downcase == 'yes'
      puts "❌ Aborted."
      return
    end

    # Restore the event
    restored_event = restore_event_from_data(data)

    puts "\n" + "="*80
    puts "✅ EVENT RESTORED SUCCESSFULLY"
    puts "="*80
    puts "New Event ID: #{restored_event.id}"
    puts "Event Slug: #{restored_event.slug}"
    puts "Title: #{restored_event.title}"
    puts "\nRestored data:"
    puts "  - Event details ✅"
    puts "  - #{data[:registrations].count} registrations"
    puts "  - #{data[:event_invitations].count} invitations"
    puts "  - #{data[:scheduled_emails].count} scheduled emails"
    puts "  - #{data[:vendor_applications].count} vendor application forms"
    puts "  - Event portal settings"
    puts "\n⚠️  Note: Email deliveries and payment integrations were NOT restored."
    puts "   These are historical records and should not be duplicated."
    puts "="*80 + "\n"
  end

  def restore_event_from_data(data)
    ActiveRecord::Base.transaction do
      # Find the organization
      organization = Organization.find_by(slug: data[:organization][:slug])
      raise "❌ Organization not found: #{data[:organization][:slug]}" unless organization

      # Create new event
      event_attrs = data[:event].dup
      event_attrs[:organization_id] = organization.id
      event_attrs[:slug] = generate_unique_slug(event_attrs[:slug])

      # Skip email template assignment (will be done in after_create)
      event = Event.new(event_attrs)
      event.skip_email_generation = true if event.respond_to?(:skip_email_generation=)
      event.save!

      puts "\n✅ Event created: #{event.slug}"

      # Restore registrations
      if data[:registrations].present?
        data[:registrations].each do |reg_data|
          reg = event.registrations.create!(reg_data)
        end
        puts "✅ Restored #{data[:registrations].count} registrations"
      end

      # Restore event invitations with contacts
      if data[:event_invitations].present?
        data[:event_invitations].each do |inv_data|
          contact_data = inv_data.delete(:vendor_contact)

          # Find or create vendor contact
          contact = if contact_data
            organization.vendor_contacts.find_or_create_by(email: contact_data[:email]) do |c|
              c.assign_attributes(contact_data.except(:id))
            end
          end

          # Create invitation
          inv_attrs = inv_data.except(:id)
          inv_attrs[:vendor_contact_id] = contact.id if contact
          event.event_invitations.create!(inv_attrs)
        end
        puts "✅ Restored #{data[:event_invitations].count} invitations"
      end

      # Restore scheduled emails
      if data[:scheduled_emails].present?
        data[:scheduled_emails].each do |email_data|
          event.scheduled_emails.create!(email_data)
        end
        puts "✅ Restored #{data[:scheduled_emails].count} scheduled emails"
      end

      # Restore vendor applications
      if data[:vendor_applications].present?
        data[:vendor_applications].each do |app_data|
          event.vendor_applications.create!(app_data)
        end
        puts "✅ Restored #{data[:vendor_applications].count} vendor applications"
      end

      # Restore event portal
      if data[:event_portal].present?
        event.create_event_portal!(data[:event_portal])
        puts "✅ Restored event portal"
      end

      event
    end
  rescue => e
    puts "\n❌ Restore failed: #{e.message}"
    puts e.backtrace.first(5).join("\n")
    raise
  end

  # ============================================================================
  # LIST BACKUPS
  # ============================================================================

  def list_backups
    puts "\n" + "="*80
    puts "AVAILABLE BACKUPS"
    puts "="*80
    puts "Directory: #{@output_dir}"
    puts "="*80 + "\n"

    backup_files = Dir.glob(File.join(@output_dir, '*.json')).sort_by { |f| File.mtime(f) }.reverse

    if backup_files.empty?
      puts "No backup files found.\n\n"
      return
    end

    backup_files.each do |file|
      begin
        data = JSON.parse(File.read(file), symbolize_names: true)
        size = File.size(file)
        mtime = File.mtime(file)

        puts "📁 #{File.basename(file)}"
        puts "   Event: #{data[:event][:title]}"
        puts "   Exported: #{data[:exported_at]}"
        puts "   Size: #{format_bytes(size)}"
        puts "   Modified: #{mtime.strftime('%Y-%m-%d %H:%M:%S')}"
        puts ""
      rescue => e
        puts "📁 #{File.basename(file)} (⚠️  could not read: #{e.message})"
        puts ""
      end
    end

    puts "Total: #{backup_files.count} backup files\n\n"
  end

  # ============================================================================
  # HELPER METHODS
  # ============================================================================

  def validate_safety!
    # Check environment safety
    if Rails.env.production? && !ENV['ALLOW_PRODUCTION_SCRIPTS']
      raise "⛔️ SAFETY CHECK: Cannot run scripts in production without ALLOW_PRODUCTION_SCRIPTS=true"
    end
  end

  def generate_unique_slug(original_slug)
    base_slug = original_slug
    counter = 1
    new_slug = "#{base_slug}-restored"

    while Event.exists?(slug: new_slug)
      new_slug = "#{base_slug}-restored-#{counter}"
      counter += 1
    end

    new_slug
  end

  def format_bytes(bytes)
    if bytes < 1024
      "#{bytes} B"
    elsif bytes < 1024 * 1024
      "#{(bytes / 1024.0).round(1)} KB"
    else
      "#{(bytes / (1024.0 * 1024)).round(1)} MB"
    end
  end
end

# Parse command line options
options = {}
OptionParser.new do |opts|
  opts.banner = "Usage: rails runner lib/scripts/data_backup.rb [options]"

  opts.on("--event=SLUG", "Export single event by slug") do |slug|
    options[:event] = slug
  end

  opts.on("--organization=SLUG", "Export all events for organization") do |slug|
    options[:organization] = slug
  end

  opts.on("--restore=FILE", "Restore from backup file") do |file|
    options[:restore] = file
  end

  opts.on("--output=PATH", "Output directory (default: ./backups)") do |path|
    options[:output] = path
  end

  opts.on("--list", "List available backups") do
    options[:list] = true
  end

  opts.on("-h", "--help", "Show this help message") do
    puts opts
    exit
  end
end.parse!

# Run the script
begin
  script = DataBackupScript.new(options)
  script.run
rescue => e
  puts "\n❌ ERROR: #{e.message}\n\n"
  exit 1
end
