# frozen_string_literal: true

# CSV Data Quality Analysis Script
# Analyzes the Pancakes and Booze CSV for import compatibility

require 'csv'
require 'uri'

class CsvDataQualityAnalyzer
  COLORS = {
    green: "\e[32m",
    red: "\e[31m",
    yellow: "\e[33m",
    blue: "\e[34m",
    cyan: "\e[36m",
    reset: "\e[0m"
  }.freeze

  def initialize(csv_path)
    @csv_path = csv_path
    @issues = {
      critical: [],  # Will fail import
      warnings: [],  # Might cause issues
      info: []       # Informational notes
    }
    @stats = {
      total_rows: 0,
      valid_rows: 0,
      rows_with_warnings: 0,
      rows_with_errors: 0,
      duplicate_emails: 0
    }
  end

  def analyze
    log_header("CSV Data Quality Analysis")

    unless File.exist?(@csv_path)
      log_error "CSV file not found: #{@csv_path}"
      return
    end

    # Parse CSV
    csv_file = File.open(@csv_path)
    content = csv_file.read.force_encoding("UTF-8")
    content.gsub!("\xEF\xBB\xBF", "") # Remove BOM
    csv_data = CSV.parse(content, headers: true, header_converters: :symbol)
    csv_file.close

    @stats[:total_rows] = csv_data.length

    log_info "Total rows: #{@stats[:total_rows]}"
    log_info "Headers: #{csv_data.headers.join(', ')}\n"

    # Check headers
    check_headers(csv_data.headers)

    # Track emails for duplicate detection
    email_tracker = Hash.new(0)

    # Analyze each row
    csv_data.each_with_index do |row, idx|
      line_number = idx + 2 # Account for header and 0-indexing
      row_has_errors = false
      row_has_warnings = false

      # Required field: name
      if row[:name].blank?
        add_critical(line_number, "name", "Name is required (will fail import)")
        row_has_errors = true
      end

      # Email validation
      if row[:email].present?
        email = row[:email].strip
        email_tracker[email.downcase] += 1

        unless email.match?(URI::MailTo::EMAIL_REGEXP)
          add_critical(line_number, "email", "Invalid email format: #{email}")
          row_has_errors = true
        end
      else
        add_warning(line_number, "email", "No email provided (contact will be hard to identify)")
        row_has_warnings = true
      end

      # Phone validation
      if row[:phone].present?
        phone = row[:phone].strip
        unless phone.match?(/\A[0-9\-\(\)\s\+\.]*\z/)
          add_critical(line_number, "phone", "Invalid phone format: #{phone}")
          row_has_errors = true
        end
      end

      # Contact type validation
      valid_types = %w[lead vendor partner client other]
      if row[:contact_type].present?
        contact_type = row[:contact_type].strip.downcase
        unless valid_types.include?(contact_type)
          add_critical(line_number, "contact_type", "Invalid contact_type '#{row[:contact_type]}' (must be: #{valid_types.join(', ')})")
          row_has_errors = true
        end
      end

      # Status validation
      valid_statuses = %w[new contacted interested converted closed]
      if row[:status].present?
        status = row[:status].strip.downcase
        unless valid_statuses.include?(status)
          add_critical(line_number, "status", "Invalid status '#{row[:status]}' (must be: #{valid_statuses.join(', ')})")
          row_has_errors = true
        end
      end

      # Instagram handle validation
      if row[:instagram_handle].present?
        handle = row[:instagram_handle].strip
        unless handle.match?(/\A@?[\w\.]+\z/)
          add_warning(line_number, "instagram_handle", "Instagram handle may have invalid characters: #{handle}")
          row_has_warnings = true
        end
      end

      # TikTok handle validation
      if row[:tiktok_handle].present?
        handle = row[:tiktok_handle].strip
        unless handle.match?(/\A@?[\w\.]+\z/)
          add_warning(line_number, "tiktok_handle", "TikTok handle may have invalid characters: #{handle}")
          row_has_warnings = true
        end
      end

      # Website URL validation
      if row[:website].present?
        website = row[:website].strip
        begin
          uri = URI.parse(website)
          unless uri.is_a?(URI::HTTP) || uri.is_a?(URI::HTTPS)
            add_warning(line_number, "website", "Website URL should start with http:// or https://: #{website}")
            row_has_warnings = true
          end
        rescue URI::InvalidURIError
          add_critical(line_number, "website", "Invalid website URL format: #{website}")
          row_has_errors = true
        end
      end

      # Track stats
      if row_has_errors
        @stats[:rows_with_errors] += 1
      elsif row_has_warnings
        @stats[:rows_with_warnings] += 1
      else
        @stats[:valid_rows] += 1
      end
    end

    # Check for duplicate emails
    email_tracker.each do |email, count|
      if count > 1
        @stats[:duplicate_emails] += count
        add_warning("Multiple", "email", "Email '#{email}' appears #{count} times (import will skip duplicates)")
      end
    end

    # Print report
    print_report
  end

  private

  def check_headers(headers)
    expected_headers = [:name, :email, :phone, :business_name, :job_title, :contact_type,
                       :status, :location, :instagram_handle, :tiktok_handle, :website,
                       :categories, :tags, :notes, :featured]

    missing_headers = expected_headers - headers
    extra_headers = headers - expected_headers

    if missing_headers.any?
      add_warning("Header", "columns", "Missing optional columns: #{missing_headers.join(', ')}")
    end

    if extra_headers.any?
      add_info("Header", "columns", "Extra columns (will be ignored): #{extra_headers.join(', ')}")
    end

    # Check critical required columns
    unless headers.include?(:name)
      add_critical("Header", "name", "CRITICAL: 'name' column is missing (required)")
    end
  end

  def add_critical(row, field, message)
    @issues[:critical] << { row: row, field: field, message: message }
  end

  def add_warning(row, field, message)
    @issues[:warnings] << { row: row, field: field, message: message }
  end

  def add_info(row, field, message)
    @issues[:info] << { row: row, field: field, message: message }
  end

  def print_report
    log_header("Analysis Results")

    # Summary
    log_info "Total rows analyzed: #{@stats[:total_rows]}"
    log_success "✓ Valid rows (no issues): #{@stats[:valid_rows]}"
    log_warning "⚠ Rows with warnings: #{@stats[:rows_with_warnings]}"
    log_error "✗ Rows with errors (will fail import): #{@stats[:rows_with_errors]}"

    if @stats[:duplicate_emails] > 0
      log_warning "\n⚠ Duplicate emails found: #{@stats[:duplicate_emails]} total occurrences"
    end

    # Critical issues (will fail import)
    if @issues[:critical].any?
      log_header("Critical Issues (Will Fail Import)")
      @issues[:critical].first(50).each do |issue|
        puts "#{COLORS[:red]}Row #{issue[:row]} - #{issue[:field]}: #{issue[:message]}#{COLORS[:reset]}"
      end
      if @issues[:critical].length > 50
        puts "#{COLORS[:red]}... and #{@issues[:critical].length - 50} more critical issues#{COLORS[:reset]}"
      end
    else
      log_success "\n✓ No critical issues found!"
    end

    # Warnings (might cause issues)
    if @issues[:warnings].any?
      log_header("Warnings (Review Recommended)")
      @issues[:warnings].first(50).each do |issue|
        puts "#{COLORS[:yellow]}Row #{issue[:row]} - #{issue[:field]}: #{issue[:message]}#{COLORS[:reset]}"
      end
      if @issues[:warnings].length > 50
        puts "#{COLORS[:yellow]}... and #{@issues[:warnings].length - 50} more warnings#{COLORS[:reset]}"
      end
    end

    # Info
    if @issues[:info].any?
      log_header("Informational Notes")
      @issues[:info].each do |issue|
        puts "#{COLORS[:blue]}#{issue[:row]} - #{issue[:field]}: #{issue[:message]}#{COLORS[:reset]}"
      end
    end

    # Recommendations
    print_recommendations
  end

  def print_recommendations
    log_header("Recommendations")

    if @stats[:rows_with_errors] > 0
      log_error "❌ CSV has critical errors that will cause import failures"
      puts "   → Fix the #{@stats[:rows_with_errors]} rows with errors before importing"
      puts "   → Pay special attention to: email format, phone format, contact_type/status enums"
    elsif @stats[:rows_with_warnings] > 0
      log_warning "⚠️  CSV has warnings but should import successfully"
      puts "   → Review #{@stats[:rows_with_warnings]} rows with warnings for data quality"
      puts "   → Consider fixing URLs, social handles for better data consistency"
    else
      log_success "✅ CSV is ready for import!"
      puts "   → All #{@stats[:valid_rows]} rows should import successfully"
    end

    if @stats[:duplicate_emails] > 0
      log_warning "\n⚠️  Duplicate emails detected"
      puts "   → Import service will skip duplicate emails (keeps first occurrence)"
      puts "   → Consider deduplicating before import if you want different behavior"
    end

    puts "\n#{COLORS[:cyan]}Next Steps:#{COLORS[:reset]}"
    puts "  1. Fix any critical errors in the CSV"
    puts "  2. Review and optionally fix warnings"
    puts "  3. Run the import script in DRY RUN mode first:"
    puts "     #{COLORS[:blue]}rails runner lib/scripts/pancakesandbooze_contact_reset.rb #{@csv_path}#{COLORS[:reset]}"
    puts "  4. If preview looks good, run actual import:"
    puts "     #{COLORS[:blue]}rails runner lib/scripts/pancakesandbooze_contact_reset.rb #{@csv_path} run#{COLORS[:reset]}"
  end

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

# Usage
if ARGV[0].nil?
  puts "Usage: rails runner lib/scripts/analyze_pancake_csv.rb /path/to/csv"
  exit 1
end

analyzer = CsvDataQualityAnalyzer.new(ARGV[0])
analyzer.analyze
