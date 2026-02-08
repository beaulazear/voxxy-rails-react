#!/usr/bin/env ruby
# frozen_string_literal: true

# Email Retry Script
# Purpose: Manually retry failed email deliveries for specific events/recipients
#
# Usage:
#   rails runner lib/scripts/email_retry.rb --event=summer-market-2026 --status=failed --dry-run
#   rails runner lib/scripts/email_retry.rb --event=summer-market-2026 --emails=user1@example.com,user2@example.com
#   rails runner lib/scripts/email_retry.rb --event=summer-market-2026 --status=bounced,dropped
#
# Options:
#   --event=SLUG          Event slug (required)
#   --emails=EMAIL,EMAIL  Comma-separated list of specific email addresses to retry
#   --status=STATUS       Filter by delivery status (bounced, dropped, failed)
#   --type=TYPE           Filter by email type (invitation, scheduled)
#   --dry-run             Show what would be retried without actually sending
#   --help                Show this help message

require 'optparse'

class EmailRetryScript
  VALID_STATUSES = %w[bounced dropped failed].freeze
  VALID_TYPES = %w[invitation scheduled all].freeze

  def initialize(options = {})
    @event_slug = options[:event]
    @specific_emails = options[:emails]
    @status_filter = options[:status]
    @type_filter = options[:type] || 'all'
    @dry_run = options[:dry_run]
    @results = { success: 0, failed: 0, skipped: 0 }
  end

  def run
    validate_options!

    puts "\n" + "="*80
    puts "EMAIL RETRY SCRIPT"
    puts "="*80
    puts "Event: #{@event.title} (#{@event_slug})"
    puts "Mode: #{@dry_run ? 'DRY RUN (no emails will be sent)' : 'LIVE - emails will be sent'}"
    puts "="*80 + "\n"

    deliveries = find_deliveries_to_retry

    if deliveries.empty?
      puts "\n⚠️  No email deliveries found matching the criteria."
      return
    end

    puts "\n📧 Found #{deliveries.count} email deliveries to retry:\n\n"

    display_summary(deliveries)

    unless @dry_run
      puts "\n⚠️  WARNING: This will resend #{deliveries.count} emails!"
      print "Type 'yes' to continue: "
      confirmation = STDIN.gets.chomp

      unless confirmation.downcase == 'yes'
        puts "❌ Aborted."
        return
      end
    end

    puts "\n" + "-"*80
    puts "PROCESSING..."
    puts "-"*80 + "\n"

    deliveries.each_with_index do |delivery, index|
      process_delivery(delivery, index + 1, deliveries.count)
    end

    display_results
  end

  private

  def validate_options!
    # Check environment safety
    if Rails.env.production? && !ENV['ALLOW_PRODUCTION_SCRIPTS']
      raise "⛔️ SAFETY CHECK: Cannot run scripts in production without ALLOW_PRODUCTION_SCRIPTS=true"
    end

    # Event slug is required
    raise "❌ Event slug is required (use --event=SLUG)" if @event_slug.blank?

    # Find event
    @event = Event.find_by(slug: @event_slug)
    raise "❌ Event not found: #{@event_slug}" unless @event

    # Validate status filter
    if @status_filter.present?
      statuses = @status_filter.split(',').map(&:strip)
      invalid_statuses = statuses - VALID_STATUSES
      if invalid_statuses.any?
        raise "❌ Invalid status: #{invalid_statuses.join(', ')}. Valid: #{VALID_STATUSES.join(', ')}"
      end
    end

    # Validate type filter
    unless VALID_TYPES.include?(@type_filter)
      raise "❌ Invalid type: #{@type_filter}. Valid: #{VALID_TYPES.join(', ')}"
    end

    # Validate specific emails format
    if @specific_emails.present?
      emails = @specific_emails.split(',').map(&:strip)
      invalid_emails = emails.reject { |e| e.match?(URI::MailTo::EMAIL_REGEXP) }
      if invalid_emails.any?
        raise "❌ Invalid email format: #{invalid_emails.join(', ')}"
      end
    end
  end

  def find_deliveries_to_retry
    deliveries = @event.email_deliveries

    # Filter by specific emails if provided
    if @specific_emails.present?
      email_list = @specific_emails.split(',').map(&:strip)
      deliveries = deliveries.where(recipient_email: email_list)
    end

    # Filter by status
    if @status_filter.present?
      statuses = @status_filter.split(',').map(&:strip)
      if statuses.include?('failed')
        # 'failed' is a shorthand for bounced + dropped
        deliveries = deliveries.where(status: ['bounced', 'dropped'])
      else
        deliveries = deliveries.where(status: statuses)
      end
    end

    # Filter by type (invitation vs scheduled)
    case @type_filter
    when 'invitation'
      deliveries = deliveries.where.not(event_invitation_id: nil)
    when 'scheduled'
      deliveries = deliveries.where.not(scheduled_email_id: nil)
    end

    deliveries.order(created_at: :desc)
  end

  def display_summary(deliveries)
    # Group by status
    by_status = deliveries.group_by(&:status)
    puts "By Status:"
    by_status.each do |status, items|
      puts "  #{status}: #{items.count}"
    end

    # Group by type
    invitation_count = deliveries.where.not(event_invitation_id: nil).count
    scheduled_count = deliveries.where.not(scheduled_email_id: nil).count
    puts "\nBy Type:"
    puts "  Invitation emails: #{invitation_count}"
    puts "  Scheduled emails: #{scheduled_count}"

    # Show sample recipients
    puts "\nSample Recipients:"
    deliveries.limit(5).each do |d|
      email_type = d.event_invitation_id ? 'invitation' : 'scheduled'
      puts "  - #{d.recipient_email} (#{d.status}, #{email_type})"
    end
    puts "  ... and #{deliveries.count - 5} more" if deliveries.count > 5
  end

  def process_delivery(delivery, current, total)
    email_type = delivery.event_invitation_id ? 'invitation' : 'scheduled'

    print "[#{current}/#{total}] #{delivery.recipient_email} (#{email_type})... "

    if @dry_run
      puts "would retry"
      @results[:success] += 1
      return
    end

    begin
      # Determine which mailer to use based on the email type
      if delivery.event_invitation_id
        retry_invitation_email(delivery)
      elsif delivery.scheduled_email_id
        retry_scheduled_email(delivery)
      else
        puts "⚠️  skipped (unknown type)"
        @results[:skipped] += 1
        return
      end

      puts "✅ retried"
      @results[:success] += 1

      # Log the retry attempt
      log_retry(delivery)

    rescue => e
      puts "❌ failed (#{e.message})"
      @results[:failed] += 1
      Rails.logger.error("Email retry failed for #{delivery.id}: #{e.message}\n#{e.backtrace.join("\n")}")
    end
  end

  def retry_invitation_email(delivery)
    invitation = delivery.event_invitation
    return unless invitation

    # Resend the invitation email
    EventMailer.send_invitation(
      event: @event,
      contact: invitation.vendor_contact,
      invitation: invitation
    ).deliver_now

    # Create new delivery record (the mailer should handle this via webhook)
    # But we'll update the old one to track it was retried
    delivery.update(
      retry_count: (delivery.retry_count || 0) + 1,
      last_retry_at: Time.current
    )
  end

  def retry_scheduled_email(delivery)
    scheduled_email = delivery.scheduled_email
    registration = delivery.registration
    invitation = delivery.event_invitation

    return unless scheduled_email

    # Determine the recipient
    recipient = if registration
      registration
    elsif invitation
      invitation.vendor_contact
    else
      return # Can't retry without a recipient
    end

    # Get the email subject and body (with variable substitution)
    subject = substitute_variables(scheduled_email.subject_template, recipient)
    body = substitute_variables(scheduled_email.body_template, recipient)

    # Send via the appropriate mailer
    if registration
      RegistrationMailer.custom_email(
        registration: registration,
        subject: subject,
        body: body
      ).deliver_now
    else
      EventMailer.custom_email(
        event: @event,
        contact: recipient,
        subject: subject,
        body: body
      ).deliver_now
    end

    # Update retry tracking
    delivery.update(
      retry_count: (delivery.retry_count || 0) + 1,
      last_retry_at: Time.current
    )
  end

  def substitute_variables(template, recipient)
    # Basic variable substitution (matches the logic in EmailSenderWorker)
    result = template.dup

    if recipient.is_a?(Registration)
      result.gsub!('{{vendor_name}}', recipient.business_name || recipient.name || '')
      result.gsub!('{{contact_name}}', recipient.name || '')
      result.gsub!('{{event_name}}', @event.title)
      result.gsub!('{{event_date}}', @event.event_date.strftime('%B %d, %Y'))
    elsif recipient.respond_to?(:name)
      result.gsub!('{{contact_name}}', recipient.name || '')
      result.gsub!('{{event_name}}', @event.title)
      result.gsub!('{{event_date}}', @event.event_date.strftime('%B %d, %Y'))
    end

    result
  end

  def log_retry(delivery)
    # Simple logging to track retry attempts
    Rails.logger.info("Email retry: delivery_id=#{delivery.id}, recipient=#{delivery.recipient_email}, event=#{@event_slug}")
  end

  def display_results
    puts "\n" + "="*80
    puts "RESULTS"
    puts "="*80
    puts "✅ Successfully retried: #{@results[:success]}"
    puts "❌ Failed: #{@results[:failed]}"
    puts "⚠️  Skipped: #{@results[:skipped]}"
    puts "="*80 + "\n"

    if @dry_run
      puts "ℹ️  This was a DRY RUN. No emails were actually sent."
      puts "   Run without --dry-run to send emails.\n\n"
    end
  end
end

# Parse command line options
options = {}
OptionParser.new do |opts|
  opts.banner = "Usage: rails runner lib/scripts/email_retry.rb [options]"

  opts.on("--event=SLUG", "Event slug (required)") do |slug|
    options[:event] = slug
  end

  opts.on("--emails=EMAILS", "Comma-separated list of email addresses") do |emails|
    options[:emails] = emails
  end

  opts.on("--status=STATUS", "Filter by status (bounced, dropped, failed)") do |status|
    options[:status] = status
  end

  opts.on("--type=TYPE", "Filter by type (invitation, scheduled, all)") do |type|
    options[:type] = type
  end

  opts.on("--dry-run", "Preview without sending") do
    options[:dry_run] = true
  end

  opts.on("-h", "--help", "Show this help message") do
    puts opts
    exit
  end
end.parse!

# Run the script
begin
  script = EmailRetryScript.new(options)
  script.run
rescue => e
  puts "\n❌ ERROR: #{e.message}\n\n"
  exit 1
end
