#!/usr/bin/env ruby
# Generate a CSV file with 3,000 vendor contact records for testing
# Uses plus addressing to route all emails to valid inboxes while keeping them unique

require 'csv'

# Your available email domains
BASE_EMAILS = [
  'team@voxxypresents.com',
  'team@voxxyai.com',
  'courtneygreer@voxxyai.com',
  'staff@blacktechnews.cc',
  'team@wolfdevelopmentstudio.com',
  'events@voxxypresents.com'
]

# Sample business types for realistic data
BUSINESS_TYPES = [
  'Food Truck', 'Catering', 'Bakery', 'Coffee Shop', 'Restaurant',
  'Art Gallery', 'Jewelry', 'Crafts', 'Paintings', 'Photography',
  'Clothing Boutique', 'Accessories', 'Vintage Fashion', 'Handmade Goods',
  'Music Performance', 'DJ Services', 'Live Band', 'Entertainment',
  'Wellness & Spa', 'Fitness', 'Yoga Studio', 'Massage Therapy',
  'Tech Services', 'Consulting', 'Marketing Agency', 'Design Studio',
  'Event Planning', 'Floristry', 'Rentals', 'Photo Booth'
]

CATEGORIES = [
  'Food & Beverage',
  'Arts & Crafts',
  'Fashion & Apparel',
  'Entertainment',
  'Health & Wellness',
  'Services',
  'Technology',
  'Other'
]

STATUSES = ['new', 'contacted', 'interested']
CONTACT_TYPES = ['vendor', 'lead', 'partner']

# Cities for location variety
CITIES = [
  'Atlanta, GA', 'Brooklyn, NY', 'Los Angeles, CA', 'Chicago, IL',
  'Houston, TX', 'Miami, FL', 'Seattle, WA', 'Austin, TX',
  'Portland, OR', 'Denver, CO', 'Nashville, TN', 'Phoenix, AZ',
  'Boston, MA', 'San Francisco, CA', 'Detroit, MI', 'Charlotte, NC'
]

def generate_phone
  area_code = rand(200..999)
  prefix = rand(200..999)
  line = rand(1000..9999)
  "(#{area_code}) #{prefix}-#{line}"
end

def generate_instagram_handle(business_name)
  clean_name = business_name.downcase.gsub(/[^a-z0-9]/, '')
  suffix = ['official', 'co', 'studio', 'shop', ''].sample
  handle = "#{clean_name}#{suffix}".slice(0, 20)
  handle.empty? ? nil : "@#{handle}"
end

def generate_website(business_name)
  clean_name = business_name.downcase.gsub(/[^a-z0-9]/, '')
  extension = ['.com', '.co', '.io', '.studio'].sample
  "https://#{clean_name}#{extension}"
end

def generate_email(index, base_emails)
  # Rotate through base emails to distribute load
  base_email = base_emails[index % base_emails.length]

  # Use plus addressing: email+identifier@domain.com
  local_part, domain = base_email.split('@')
  "#{local_part}+testvendor#{index.to_s.rjust(4, '0')}@#{domain}"
end

# Generate the CSV
output_file = 'test_vendors_3000.csv'
num_records = 3000

puts "Generating #{num_records} vendor contact records..."
puts "Output file: #{output_file}"
puts "Using base emails: #{BASE_EMAILS.join(', ')}"
puts ""

CSV.open(output_file, 'w', write_headers: true, headers: [
  'name',
  'email',
  'phone',
  'business_name',
  'job_title',
  'contact_type',
  'status',
  'location',
  'instagram_handle',
  'tiktok_handle',
  'website',
  'categories',
  'tags',
  'notes',
  'featured'
]) do |csv|

  num_records.times do |i|
    business_type = BUSINESS_TYPES.sample
    business_number = rand(1..999)
    business_name = "#{business_type} #{business_number}"

    first_names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Dakota', 'Skylar',
                   'Courtney', 'Jamie', 'Kendall', 'Peyton', 'Cameron', 'Parker', 'Reese', 'Drew', 'Blake', 'Sage']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']

    name = "#{first_names.sample} #{last_names.sample}"
    email = generate_email(i + 1, BASE_EMAILS)
    phone = generate_phone
    job_title = ['Owner', 'Manager', 'Founder', 'CEO', 'Director', 'Partner'].sample
    contact_type = CONTACT_TYPES.sample
    status = STATUSES.sample
    location = CITIES.sample
    instagram = generate_instagram_handle(business_name)
    tiktok = rand < 0.3 ? instagram&.gsub('@', '@tiktok_') : nil # 30% have TikTok
    website = rand < 0.6 ? generate_website(business_name) : nil # 60% have website
    categories = CATEGORIES.sample(rand(1..3)).join(',')
    tags = ['test-batch-2025', 'bulk-import', 'load-test'].sample(rand(1..3)).join(',')
    notes = "Generated test record for load testing - Batch ID: #{Time.now.strftime('%Y%m%d')}"
    featured = rand < 0.05 ? 'true' : 'false' # 5% featured

    csv << [
      name,
      email,
      phone,
      business_name,
      job_title,
      contact_type,
      status,
      location,
      instagram,
      tiktok,
      website,
      categories,
      tags,
      notes,
      featured
    ]

    # Progress indicator
    if (i + 1) % 500 == 0
      puts "Generated #{i + 1} records..."
    end
  end
end

puts ""
puts "✅ Successfully generated #{num_records} records!"
puts "📁 File: #{output_file}"
puts ""
puts "File size: #{File.size(output_file) / 1024} KB"
puts ""
puts "Email distribution:"
BASE_EMAILS.each_with_index do |email, idx|
  count = (num_records.to_f / BASE_EMAILS.length).ceil
  puts "  #{email}: ~#{count} records"
end
puts ""
puts "To upload this CSV:"
puts "  1. Open your application's CSV upload interface"
puts "  2. Select the file: #{output_file}"
puts "  3. Ensure 'skip_duplicates' is enabled (default)"
puts "  4. Upload and monitor the import process"
puts ""
puts "⚠️  IMPORTANT: These emails use plus addressing (+testvendor####)"
puts "   All emails will be delivered to your base inboxes."
puts "   Gmail, Outlook, and most modern email providers support this."
puts ""
