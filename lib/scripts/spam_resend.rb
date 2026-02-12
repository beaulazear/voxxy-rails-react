#!/usr/bin/env ruby
# frozen_string_literal: true

# Spam Resend Script
# Purpose: Resend emails that were marked as spam by SendGrid
#
# Usage:
#   # Resend to specific email addresses
#   rails runner lib/scripts/spam_resend.rb --event=summer-market-2026 --emails=user1@me.com,user2@me.com --dry-run
#
#   # Resend all emails marked as spam in last 24 hours
#   rails runner lib/scripts/spam_resend.rb --event=summer-market-2026 --since=24h
#
#   # Resend from a CSV file of email addresses
#   rails runner lib/scripts/spam_resend.rb --event=summer-market-2026 --file=spam_reports.csv
#
#   # Mark emails as "resent due to spam" without sending
#   rails runner lib/scripts/spam_resend.rb --event=summer-market-2026 --emails=user@example.com --mark-only
#
# Options:
#   --event=SLUG          Event slug (required)
#   --emails=EMAIL,EMAIL  Comma-separated list of email addresses
#   --file=PATH           CSV file with email addresses (one per line or in 'email' column)
#   --since=TIME          Resend emails marked as spam since time (e.g., 24h, 7d, 2024-02-08)
#   --mark-only           Mark as resent without actually sending
#   --dry-run             Preview without sending or marking
#   --help                Show this help message

require "optparse"
require "csv"

class SpamResendScript
  def initialize(options = {})
    @event_slug = options[:event]
    @specific_emails = options[:emails]
    @csv_file = options[:file]
    @since = options[:since]
    @mark_only = options[:mark_only]
    @dry_run = options[:dry_run]
    @results = { success: 0, failed: 0, skipped: 0, marked: 0 }
  end

  def run
    validate_options!

    puts "\n" + "="*80
    puts "SPAM RESEND SCRIPT"
    puts "="*80
    puts "Event: #{@event.title} (#{@event_slug})"

    if @dry_run
      puts "Mode: DRY RUN (no emails will be sent, no marks will be made)"
    elsif @mark_only
      puts "Mode: MARK ONLY (no emails will be sent, only marking in database)"
    else
      puts "Mode: LIVE - emails will be sent and marked"
    end

    puts "="*80 + "\n"

    # Get list of email addresses to process
    email_addresses = collect_email_addresses

    if email_addresses.empty?
      puts "\n⚠️  No email addresses found matching the criteria."
      return
    end

    # Find deliveries for these addresses
    deliveries = find_deliveries_for_emails(email_addresses)

    if deliveries.empty?
      puts "\n⚠️  No email deliveries found for these addresses in this event."
      puts "   The addresses may not have been sent emails, or they're not in the system."
      return
    end

    puts "\n📧 Found #{deliveries.count} email deliveries to process:\n\n"
    display_summary(deliveries, email_addresses)

    unless @dry_run
      puts "\n⚠️  WARNING: This will #{@mark_only ? 'mark' : 'resend'} #{deliveries.count} emails!"
      print "Type 'yes' to continue: "
      confirmation = STDIN.gets.chomp

      unless confirmation.downcase == "yes"
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
    if Rails.env.production? && !ENV["ALLOW_PRODUCTION_SCRIPTS"]
      raise "⛔️ SAFETY CHECK: Cannot run scripts in production without ALLOW_PRODUCTION_SCRIPTS=true"
    end

    # Event slug is required
    raise "❌ Event slug is required (use --event=SLUG)" if @event_slug.blank?

    # Find event
    @event = Event.find_by(slug: @event_slug)
    raise "❌ Event not found: #{@event_slug}" unless @event

    # Must specify emails, file, or since
    if @specific_emails.blank? && @csv_file.blank? && @since.blank?
      raise "❌ Must specify --emails, --file, or --since"
    end

    # Validate file exists if specified
    if @csv_file.present? && !File.exist?(@csv_file)
      raise "❌ File not found: #{@csv_file}"
    end

    # Validate specific emails format if provided
    if @specific_emails.present?
      emails = @specific_emails.split(",").map(&:strip)
      invalid_emails = emails.reject { |e| e.match?(URI::MailTo::EMAIL_REGEXP) }
      if invalid_emails.any?
        raise "❌ Invalid email format: #{invalid_emails.join(', ')}"
      end
    end
  end

  def collect_email_addresses
    addresses = []

    # From --emails parameter
    if @specific_emails.present?
      addresses += @specific_emails.split(",").map(&:strip)
    end

    # From CSV file
    if @csv_file.present?
      addresses += parse_csv_file
    end

    # From database (spam reports since time)
    if @since.present?
      addresses += find_spam_emails_since
    end

    # Remove duplicates and return
    addresses.uniq
  end

  def parse_csv_file
    emails = []

    CSV.foreach(@csv_file, headers: true) do |row|
      # Try to find email in 'email' column or first column
      email = row["email"] || row["Email"] || row[0]

      if email && email.match?(URI::MailTo::EMAIL_REGEXP)
        emails << email.strip
      end
    end

    puts "📄 Loaded #{emails.count} email addresses from CSV file"
    emails
  rescue CSV::MalformedCSVError
    # If CSV parsing fails, try reading as plain text (one email per line)
    File.readlines(@csv_file).map(&:strip).select { |line| line.match?(URI::MailTo::EMAIL_REGEXP) }
  end

  def find_spam_emails_since
    since_time = parse_time_string(@since)

    # Find deliveries marked as spam or bounced with spam-related bounce reasons
    spam_deliveries = @event.email_deliveries
      .where("created_at >= ?", since_time)
      .where(
        "status = 'bounced' OR status = 'dropped' OR bounce_reason LIKE '%spam%'"
      )

    emails = spam_deliveries.pluck(:recipient_email).uniq
    puts "🕐 Found #{emails.count} spam-related emails since #{since_time.strftime('%Y-%m-%d %H:%M:%S')}"

    emails
  end

  def parse_time_string(time_str)
    # Parse relative time strings like "24h", "7d", "30m"
    if time_str.match?(/^(\d+)(h|d|m)$/)
      amount = time_str[0..-2].to_i
      unit = time_str[-1]

      case unit
      when "h"
        amount.hours.ago
      when "d"
        amount.days.ago
      when "m"
        amount.minutes.ago
      end
    else
      # Try to parse as date string
      Time.parse(time_str)
    end
  rescue ArgumentError
    raise "❌ Invalid time format: #{time_str}. Use format like '24h', '7d', or '2024-02-08'"
  end

  def find_deliveries_for_emails(email_addresses)
    # Find all deliveries for these email addresses in this event
    deliveries = @event.email_deliveries
      .where(recipient_email: email_addresses)
      .order(created_at: :desc)

    # For each email address, get only the most recent delivery
    # (we don't want to resend the same email multiple times)
    latest_deliveries = {}

    deliveries.each do |delivery|
      email = delivery.recipient_email

      # Keep only the most recent delivery per email
      unless latest_deliveries[email]
        latest_deliveries[email] = delivery
      end
    end

    latest_deliveries.values
  end

  def display_summary(deliveries, requested_emails)
    puts "Requested: #{requested_emails.count} email addresses"
    puts "Found: #{deliveries.count} deliveries to process"

    # Show which emails were not found
    found_emails = deliveries.map(&:recipient_email)
    not_found = requested_emails - found_emails

    if not_found.any?
      puts "\n⚠️  Not found in event (#{not_found.count}):"
      not_found.first(5).each { |email| puts "  - #{email}" }
      puts "  ... and #{not_found.count - 5} more" if not_found.count > 5
    end

    # Group by email type
    invitation_count = deliveries.count { |d| d.event_invitation_id.present? }
    scheduled_count = deliveries.count { |d| d.scheduled_email_id.present? }

    puts "\nBy Type:"
    puts "  Invitation emails: #{invitation_count}"
    puts "  Scheduled emails: #{scheduled_count}"

    # Group by current status
    by_status = deliveries.group_by(&:status)
    puts "\nCurrent Status:"
    by_status.each do |status, items|
      puts "  #{status}: #{items.count}"
    end

    puts "\nSample Deliveries:"
    deliveries.first(5).each do |d|
      email_type = d.event_invitation_id ? "invitation" : "scheduled"
      puts "  - #{d.recipient_email} (#{d.status}, #{email_type})"
    end
    puts "  ... and #{deliveries.count - 5} more" if deliveries.count > 5
  end

  def process_delivery(delivery, current, total)
    email_type = delivery.event_invitation_id ? "invitation" : "scheduled"

    print "[#{current}/#{total}] #{delivery.recipient_email} (#{email_type})... "

    if @dry_run
      puts "would #{@mark_only ? 'mark' : 'resend'}"
      @results[:success] += 1
      return
    end

    begin
      # Mark the delivery as resent due to spam
      mark_resent_due_to_spam(delivery)

      if @mark_only
        puts "✅ marked"
        @results[:marked] += 1
      else
        # Actually resend the email
        resend_email(delivery)
        puts "✅ resent"
        @results[:success] += 1
      end

    rescue => e
      puts "❌ failed (#{e.message})"
      @results[:failed] += 1
      Rails.logger.error("Spam resend failed for #{delivery.id}: #{e.message}\n#{e.backtrace.join("\n")}")
    end
  end

  def mark_resent_due_to_spam(delivery)
    # Add a note to the delivery record
    notes = delivery.notes || {}
    notes["resent_due_to_spam"] = true
    notes["resent_at"] = Time.current.iso8601

    delivery.update!(
      notes: notes,
      retry_count: (delivery.retry_count || 0) + 1,
      last_retry_at: Time.current
    )
  end

  def resend_email(delivery)
    # Determine which mailer to use based on the email type
    if delivery.event_invitation_id
      resend_invitation_email(delivery)
    elsif delivery.scheduled_email_id
      resend_scheduled_email(delivery)
    else
      raise "Unknown email type for delivery #{delivery.id}"
    end
  end

  def resend_invitation_email(delivery)
    invitation = delivery.event_invitation
    raise "Invitation not found" unless invitation

    # Resend the invitation email
    EventMailer.send_invitation(
      event: @event,
      contact: invitation.vendor_contact,
      invitation: invitation
    ).deliver_now
  end

  def resend_scheduled_email(delivery)
    scheduled_email = delivery.scheduled_email
    registration = delivery.registration
    invitation = delivery.event_invitation

    raise "Scheduled email not found" unless scheduled_email

    # Determine the recipient
    recipient = if registration
      registration
    elsif invitation
      invitation.vendor_contact
    else
      raise "No recipient found for delivery"
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
  end

  def substitute_variables(template, recipient)
    # Basic variable substitution (matches the logic in EmailSenderWorker)
    result = template.dup

    if recipient.is_a?(Registration)
      result.gsub!("{{vendor_name}}", recipient.business_name || recipient.name || "")
      result.gsub!("{{contact_name}}", recipient.name || "")
      result.gsub!("{{event_name}}", @event.title)
      result.gsub!("{{event_date}}", @event.event_date.strftime("%B %d, %Y"))
    elsif recipient.respond_to?(:name)
      result.gsub!("{{contact_name}}", recipient.name || "")
      result.gsub!("{{event_name}}", @event.title)
      result.gsub!("{{event_date}}", @event.event_date.strftime("%B %d, %Y"))
    end

    result
  end

  def display_results
    puts "\n" + "="*80
    puts "RESULTS"
    puts "="*80

    if @mark_only
      puts "✅ Successfully marked: #{@results[:marked]}"
    else
      puts "✅ Successfully resent: #{@results[:success]}"
    end

    puts "❌ Failed: #{@results[:failed]}"
    puts "⚠️  Skipped: #{@results[:skipped]}"
    puts "="*80 + "\n"

    if @dry_run
      puts "ℹ️  This was a DRY RUN. No emails were sent and no marks were made."
      puts "   Run without --dry-run to actually process.\n\n"
    elsif @mark_only
      puts "ℹ️  Emails were marked as 'resent due to spam' but not actually sent."
      puts "   Run without --mark-only to send emails.\n\n"
    end
  end
end

# Parse command line options
options = {}
OptionParser.new do |opts|
  opts.banner = "Usage: rails runner lib/scripts/spam_resend.rb [options]"

  opts.on("--event=SLUG", "Event slug (required)") do |slug|
    options[:event] = slug
  end

  opts.on("--emails=EMAILS", "Comma-separated list of email addresses") do |emails|
    options[:emails] = emails
  end

  opts.on("--file=PATH", "CSV file with email addresses") do |file|
    options[:file] = file
  end

  opts.on("--since=TIME", "Resend emails marked as spam since time (e.g., 24h, 7d)") do |time|
    options[:since] = time
  end

  opts.on("--mark-only", "Mark as resent without actually sending") do
    options[:mark_only] = true
  end

  opts.on("--dry-run", "Preview without sending or marking") do
    options[:dry_run] = true
  end

  opts.on("-h", "--help", "Show this help message") do
    puts opts
    exit
  end
end.parse!

# Run the script
begin
  script = SpamResendScript.new(options)
  script.run
rescue => e
  puts "\n❌ ERROR: #{e.message}\n\n"
  exit 1
end
