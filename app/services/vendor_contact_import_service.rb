# frozen_string_literal: true

require "csv"

class VendorContactImportService
  attr_reader :organization, :csv_file, :options, :results

  def initialize(organization, csv_file, options = {})
    @organization = organization
    @csv_file = csv_file
    @options = {
      skip_duplicates: options.fetch(:skip_duplicates, true),
      update_existing: options.fetch(:update_existing, false),
      tags: options.fetch(:tags, [])
    }
    @results = {
      total_rows: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }
  end

  def process
    # Parse CSV with proper encoding
    csv_data = parse_csv

    @results[:total_rows] = csv_data.length

    # Process in batches of 200 to avoid memory issues
    csv_data.each_slice(200).with_index do |batch, batch_index|
      process_batch(batch, batch_index * 200)
    end

    @results
  rescue CSV::MalformedCSVError => e
    @results[:errors] << {
      row: "N/A",
      field: "file",
      message: "Invalid CSV format: #{e.message}"
    }
    @results
  rescue StandardError => e
    @results[:errors] << {
      row: "N/A",
      field: "file",
      message: "Import failed: #{e.message}"
    }
    @results
  end

  private

  def parse_csv
    # Read file with UTF-8 encoding, handle BOM
    content = @csv_file.read.force_encoding("UTF-8")
    content.gsub!("\xEF\xBB\xBF", "") # Remove BOM if present

    CSV.parse(content, headers: true, header_converters: :symbol)
  rescue ArgumentError => e
    # Try with ISO-8859-1 encoding if UTF-8 fails
    content = @csv_file.read.force_encoding("ISO-8859-1").encode("UTF-8")
    CSV.parse(content, headers: true, header_converters: :symbol)
  end

  def process_batch(batch, offset)
    batch.each_with_index do |row, index|
      line_number = offset + index + 2 # +2 for header row and 0-indexing
      process_row(row, line_number)
    end
  end

  def process_row(row, line_number)
    # Validate row
    validation_result = validate_row(row, line_number)

    unless validation_result[:valid]
      @results[:failed] += 1
      @results[:errors].concat(validation_result[:errors])
      return
    end

    # Build contact attributes
    contact_data = build_contact_data(row)

    # Check for duplicates by email
    existing_contact = find_existing_contact(contact_data[:email])

    if existing_contact
      handle_existing_contact(existing_contact, contact_data, line_number)
    else
      create_new_contact(contact_data, line_number)
    end
  rescue StandardError => e
    @results[:failed] += 1
    @results[:errors] << {
      row: line_number,
      field: "general",
      message: "Unexpected error: #{e.message}"
    }
  end

  def validate_row(row, line_number)
    errors = []

    # Required: name
    if row[:name].blank?
      errors << {
        row: line_number,
        field: "name",
        message: "Name is required"
      }
    end

    # Email format (if provided)
    if row[:email].present? && !row[:email].match?(URI::MailTo::EMAIL_REGEXP)
      errors << {
        row: line_number,
        field: "email",
        message: "Invalid email format"
      }
    end

    # Phone format (if provided)
    if row[:phone].present? && !row[:phone].match?(/\A[0-9\-\(\)\s\+\.]*\z/)
      errors << {
        row: line_number,
        field: "phone",
        message: "Invalid phone format"
      }
    end

    # Location format (if provided) - should contain a comma (e.g., "City, State")
    if row[:location].present? && !row[:location].include?(",")
      errors << {
        row: line_number,
        field: "location",
        message: "Location should include city and state/region separated by comma (e.g., 'San Francisco, CA')"
      }
    end

    # Contact type enum
    valid_types = %w[lead vendor partner client other]
    if row[:contact_type].present? && !valid_types.include?(row[:contact_type].downcase)
      errors << {
        row: line_number,
        field: "contact_type",
        message: "Invalid contact_type (must be: #{valid_types.join(', ')})"
      }
    end

    # Status enum
    valid_statuses = %w[new contacted interested converted closed]
    if row[:status].present? && !valid_statuses.include?(row[:status].downcase)
      errors << {
        row: line_number,
        field: "status",
        message: "Invalid status (must be: #{valid_statuses.join(', ')})"
      }
    end

    { valid: errors.empty?, errors: errors }
  end

  def build_contact_data(row)
    # Parse tags (comma-separated string to array)
    tags = if row[:tags].present?
             row[:tags].to_s.split(",").map(&:strip).reject(&:blank?)
    else
             []
    end

    # Merge with additional tags from options
    tags = (tags + @options[:tags]).uniq

    # Parse categories (comma-separated string to array)
    categories = if row[:categories].present?
                   row[:categories].to_s.split(",").map(&:strip).reject(&:blank?)
    else
                   []
    end

    {
      name: row[:name]&.strip,
      email: row[:email]&.strip&.downcase,
      phone: row[:phone]&.strip,
      business_name: row[:business_name]&.strip,
      job_title: row[:job_title]&.strip,
      contact_type: row[:contact_type]&.strip&.downcase || "vendor",
      status: row[:status]&.strip&.downcase || "new",
      tags: tags,
      categories: categories,
      notes: row[:notes]&.strip,
      location: row[:location]&.strip,
      instagram_handle: row[:instagram_handle]&.strip || row[:instagram]&.strip,
      tiktok_handle: row[:tiktok_handle]&.strip || row[:tiktok]&.strip,
      website: row[:website]&.strip || row[:portfolio_url]&.strip,
      featured: row[:featured].to_s.downcase.in?([ "true", "1", "yes" ]),
      source: "csv_import",
      imported_at: Time.current,
      organization_id: @organization.id
    }
  end

  def find_existing_contact(email)
    return nil if email.blank?
    @organization.vendor_contacts.find_by(email: email)
  end

  def handle_existing_contact(existing_contact, contact_data, line_number)
    if @options[:update_existing]
      if existing_contact.update(contact_data.except(:organization_id))
        @results[:updated] += 1
      else
        @results[:failed] += 1
        @results[:errors] << {
          row: line_number,
          field: "general",
          message: "Update failed: #{existing_contact.errors.full_messages.join(', ')}"
        }
      end
    elsif @options[:skip_duplicates]
      @results[:skipped] += 1
      @results[:errors] << {
        row: line_number,
        field: "email",
        message: "Email already exists: #{contact_data[:email]}"
      }
    else
      # Allow duplicates - create new contact
      create_new_contact(contact_data, line_number)
    end
  end

  def create_new_contact(contact_data, line_number)
    contact = @organization.vendor_contacts.build(contact_data)

    if contact.save
      @results[:created] += 1
    else
      @results[:failed] += 1
      @results[:errors] << {
        row: line_number,
        field: "general",
        message: contact.errors.full_messages.join(", ")
      }
    end
  end
end
