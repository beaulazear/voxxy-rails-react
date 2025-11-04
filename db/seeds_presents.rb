# Voxxy Presents - Test Seed Data
puts "Creating Voxxy Presents test data..."

# Clear existing Presents data (optional - comment out if you want to keep data)
puts "Cleaning existing Presents data..."
BudgetLineItem.destroy_all
Budget.destroy_all
Registration.destroy_all
Event.destroy_all
Vendor.destroy_all
Organization.destroy_all

# Create Venue Owner User
puts "Creating venue owner..."
venue_owner = User.create!(
  name: "Sarah Venue Owner",
  email: "sarah@venue.com",
  password: "password123",
  password_confirmation: "password123",
  role: "venue_owner",
  product_context: "presents",
  confirmed_at: Time.current,
  city: "New York",
  state: "NY"
)
puts "✓ Created venue owner: #{venue_owner.email}"

# Create Vendor User
puts "Creating vendor..."
vendor_user = User.create!(
  name: "Mike Catering",
  email: "mike@catering.com",
  password: "password123",
  password_confirmation: "password123",
  role: "vendor",
  product_context: "presents",
  confirmed_at: Time.current,
  city: "New York",
  state: "NY"
)
puts "✓ Created vendor: #{vendor_user.email}"

# Create Consumer User (for testing registrations)
puts "Creating consumer..."
consumer = User.create!(
  name: "John Consumer",
  email: "john@consumer.com",
  password: "password123",
  password_confirmation: "password123",
  role: "consumer",
  product_context: "mobile",
  confirmed_at: Time.current,
  city: "New York",
  state: "NY"
)
puts "✓ Created consumer: #{consumer.email}"

# Create Organizations
puts "\nCreating organizations..."
org1 = Organization.create!(
  user: venue_owner,
  name: "The Grand Ballroom",
  description: "Premier event venue in downtown Manhattan. Perfect for weddings, corporate events, and galas.",
  city: "New York",
  state: "NY",
  address: "123 5th Avenue",
  zip_code: "10001",
  email: "info@grandballroom.com",
  phone: "(212) 555-0100",
  website: "https://grandballroom.com",
  instagram_handle: "@grandballroom",
  verified: true,
  active: true,
  latitude: 40.7589,
  longitude: -73.9851
)
puts "✓ Created organization: #{org1.name} (slug: #{org1.slug})"

org2 = Organization.create!(
  user: venue_owner,
  name: "Brooklyn Event Space",
  description: "Hip, modern venue in Williamsburg. Great for concerts, art shows, and private parties.",
  city: "Brooklyn",
  state: "NY",
  address: "456 Bedford Ave",
  zip_code: "11249",
  email: "hello@brooklyneventspace.com",
  phone: "(718) 555-0200",
  website: "https://brooklyneventspace.com",
  verified: true,
  active: true,
  latitude: 40.7081,
  longitude: -73.9571
)
puts "✓ Created organization: #{org2.name} (slug: #{org2.slug})"

# Create Events
puts "\nCreating events..."
event1 = Event.create!(
  organization: org1,
  title: "Summer Gala 2025",
  description: "Join us for an elegant evening of music, dining, and dancing. Featuring a live orchestra and celebrity guest speakers.",
  event_date: 2.months.from_now.change(hour: 19, min: 0),
  event_end_date: 2.months.from_now.change(hour: 23, min: 0),
  location: "#{org1.address}, #{org1.city}, #{org1.state}",
  capacity: 200,
  ticket_price: 150.00,
  published: true,
  registration_open: true,
  status: "published"
)
puts "✓ Created event: #{event1.title} (slug: #{event1.slug})"

event2 = Event.create!(
  organization: org1,
  title: "New Year's Eve Celebration",
  description: "Ring in the new year with style! Champagne toast at midnight, DJ, photo booth, and more.",
  event_date: Time.new(2025, 12, 31, 20, 0, 0),
  event_end_date: Time.new(2026, 1, 1, 2, 0, 0),
  location: "#{org1.address}, #{org1.city}, #{org1.state}",
  capacity: 300,
  ticket_price: 250.00,
  published: true,
  registration_open: true,
  status: "published"
)
puts "✓ Created event: #{event2.title} (slug: #{event2.slug})"

event3 = Event.create!(
  organization: org2,
  title: "Indie Music Festival",
  description: "Three stages, 20+ bands, food trucks, and craft beer. A celebration of independent music.",
  event_date: 3.months.from_now.change(hour: 15, min: 0),
  event_end_date: 3.months.from_now.change(hour: 23, min: 0),
  location: "#{org2.address}, #{org2.city}, #{org2.state}",
  capacity: 500,
  ticket_price: 75.00,
  published: true,
  registration_open: true,
  status: "published"
)
puts "✓ Created event: #{event3.title} (slug: #{event3.slug})"

# Create draft event (not published)
event4 = Event.create!(
  organization: org2,
  title: "Art Exhibition Opening",
  description: "Opening night for our contemporary art exhibition. Wine and cheese reception.",
  event_date: 4.months.from_now.change(hour: 18, min: 0),
  location: "#{org2.address}, #{org2.city}, #{org2.state}",
  capacity: 100,
  published: false,
  registration_open: false,
  status: "draft"
)
puts "✓ Created draft event: #{event4.title}"

# Create Vendors
puts "\nCreating vendors..."
vendor1 = Vendor.create!(
  user: vendor_user,
  name: "Elite Catering Co",
  vendor_type: "catering",
  description: "Full-service catering for events of all sizes. Specializing in contemporary American cuisine with international influences.",
  city: "New York",
  state: "NY",
  contact_email: "bookings@elitecatering.com",
  phone: "(212) 555-0300",
  website: "https://elitecatering.com",
  instagram_handle: "@elitecatering",
  services: {
    "meal_types": [ "breakfast", "lunch", "dinner", "cocktail_hour" ],
    "dietary_options": [ "vegetarian", "vegan", "gluten_free", "kosher" ],
    "service_styles": [ "buffet", "plated", "family_style", "stations" ]
  },
  pricing: {
    "per_person_range": "$50-200",
    "minimum_guests": 25,
    "deposit_required": "50%"
  },
  verified: true,
  active: true,
  rating: 4.8,
  latitude: 40.7589,
  longitude: -73.9851
)
puts "✓ Created vendor: #{vendor1.name} (slug: #{vendor1.slug})"

vendor2 = Vendor.create!(
  user: vendor_user,
  name: "NYC Event Productions",
  vendor_type: "entertainment",
  description: "Complete event production services including DJs, live bands, lighting, and sound systems.",
  city: "New York",
  state: "NY",
  contact_email: "info@nyceventpro.com",
  phone: "(212) 555-0400",
  website: "https://nyceventpro.com",
  services: {
    "entertainment_types": [ "DJ", "live_band", "string_quartet", "jazz_trio" ],
    "equipment": [ "sound_system", "lighting", "projection", "stage" ],
    "add_ons": [ "photo_booth", "karaoke", "MC_services" ]
  },
  pricing: {
    "hourly_rate": "$150-500",
    "minimum_hours": 4,
    "equipment_included": true
  },
  verified: true,
  active: true,
  rating: 4.9,
  latitude: 40.7589,
  longitude: -73.9851
)
puts "✓ Created vendor: #{vendor2.name} (slug: #{vendor2.slug})"

vendor3 = Vendor.create!(
  user: vendor_user,
  name: "Artisan Market Collective",
  vendor_type: "market_vendor",
  description: "Curated collection of local artisans for craft fairs and markets. Jewelry, pottery, textiles, and more.",
  city: "Brooklyn",
  state: "NY",
  contact_email: "hello@artisanmarket.com",
  phone: "(718) 555-0500",
  services: {
    "vendor_types": [ "jewelry", "pottery", "textiles", "paintings", "woodwork" ],
    "booth_sizes": [ "10x10", "10x20", "custom" ],
    "amenities": [ "tables", "tents", "signage" ]
  },
  verified: false,
  active: true,
  rating: 4.5,
  latitude: 40.7081,
  longitude: -73.9571
)
puts "✓ Created vendor: #{vendor3.name}"

# Create Registrations
puts "\nCreating registrations..."
reg1 = Registration.create!(
  event: event1,
  user: consumer,
  email: consumer.email,
  name: consumer.name,
  phone: "(555) 123-4567",
  status: "confirmed",
  subscribed: true
)
puts "✓ Created registration for #{event1.title} - Ticket: #{reg1.ticket_code}"

# Guest registration (no user)
reg2 = Registration.create!(
  event: event1,
  email: "guest1@example.com",
  name: "Jane Guest",
  phone: "(555) 234-5678",
  status: "confirmed",
  subscribed: false
)
puts "✓ Created guest registration - Ticket: #{reg2.ticket_code}"

reg3 = Registration.create!(
  event: event2,
  email: "guest2@example.com",
  name: "Bob Smith",
  status: "confirmed"
)
puts "✓ Created guest registration - Ticket: #{reg3.ticket_code}"

reg4 = Registration.create!(
  event: event3,
  email: "guest3@example.com",
  name: "Alice Johnson",
  phone: "(555) 345-6789",
  status: "confirmed"
)
puts "✓ Created guest registration - Ticket: #{reg4.ticket_code}"

# Create Budget for Event
puts "\nCreating budgets..."
budget1 = Budget.create!(
  budgetable: event1,
  user: venue_owner,
  title: "#{event1.title} Budget",
  total_amount: 30000.00,
  spent_amount: 12500.00,
  status: "active"
)
puts "✓ Created budget for #{event1.title}"

# Create Budget Line Items
line_item1 = BudgetLineItem.create!(
  budget: budget1,
  name: "Catering Services",
  category: "catering",
  budgeted_amount: 15000.00,
  actual_amount: 7500.00,
  notes: "Dinner for 200 guests, includes bar service",
  vendor: vendor1
)

line_item2 = BudgetLineItem.create!(
  budget: budget1,
  name: "Entertainment (DJ + Lighting)",
  category: "entertainment",
  budgeted_amount: 5000.00,
  actual_amount: 5000.00,
  notes: "6 hours of DJ service with full lighting package",
  vendor: vendor2
)

line_item3 = BudgetLineItem.create!(
  budget: budget1,
  name: "Marketing & Promotion",
  category: "marketing",
  budgeted_amount: 3000.00,
  actual_amount: 0.00,
  notes: "Social media ads, print materials"
)

line_item4 = BudgetLineItem.create!(
  budget: budget1,
  name: "Decorations & Flowers",
  category: "other",
  budgeted_amount: 7000.00,
  actual_amount: 0.00,
  notes: "Floral centerpieces, table settings"
)
puts "✓ Created #{budget1.budget_line_items.count} budget line items"

# Create Budget for Organization
budget2 = Budget.create!(
  budgetable: org1,
  user: venue_owner,
  title: "Annual Marketing Budget 2025",
  total_amount: 50000.00,
  spent_amount: 15000.00,
  status: "active"
)
puts "✓ Created budget for #{org1.name}"

puts "\n" + "="*60
puts "🎉 Seed data created successfully!"
puts "="*60

puts "\nTest Credentials:"
puts "  Venue Owner: sarah@venue.com / password123"
puts "  Vendor:      mike@catering.com / password123"
puts "  Consumer:    john@consumer.com / password123"

puts "\nOrganizations:"
puts "  - #{org1.name} (slug: #{org1.slug})"
puts "  - #{org2.name} (slug: #{org2.slug})"

puts "\nEvents:"
puts "  - #{event1.title} (slug: #{event1.slug}) - #{event1.registered_count} registrations"
puts "  - #{event2.title} (slug: #{event2.slug}) - #{event2.registered_count} registrations"
puts "  - #{event3.title} (slug: #{event3.slug}) - #{event3.registered_count} registrations"

puts "\nVendors:"
puts "  - #{vendor1.name} (#{vendor1.vendor_type})"
puts "  - #{vendor2.name} (#{vendor2.vendor_type})"
puts "  - #{vendor3.name} (#{vendor3.vendor_type})"

puts "\nStats:"
puts "  Total Organizations: #{Organization.count}"
puts "  Total Events: #{Event.count}"
puts "  Total Vendors: #{Vendor.count}"
puts "  Total Registrations: #{Registration.count}"
puts "  Total Budgets: #{Budget.count}"
puts "="*60
