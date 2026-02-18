# =============================================================================
# Voxxy Presents — Development Seed Data
# Updated: 2026-02-17
#
# SCENARIOS COVERED:
#   Event A — Summer Market (published, upcoming, large): 50 invites, 30 applicants,
#              20 approved (mix of paid/unpaid), 5 rejected, 5 pending, payment pressure
#   Event B — Holiday Bazaar (published, upcoming, small): 15 invites, 8 applicants,
#              3 approved none paid, payment deadline approaching
#   Event C — Pop-Up Food Fair (published, upcoming, large): 100 invites, 60 applicants,
#              40 approved all paid, realistic delivery stats
#   Event D — Spring Art Walk (draft, no activity): empty state scenario
#   Event E — Past Farmers Market (completed, past): 25 invites, 20 applicants,
#              18 approved, post-event state
#
# TEST CREDENTIALS:
#   Producer: producer@voxxy.dev / password123
#   Admin:    admin@voxxy.dev    / password123
# =============================================================================

puts "🌱 Starting Voxxy Presents seed data..."
puts ""

# =============================================================================
# SAFETY: Only wipe Presents-specific models (not User/Organization if shared)
# =============================================================================
puts "🧹 Clearing existing Presents data..."

[
  ScheduledEmail, EventInvitation, Registration,
  VendorApplication, Event, VendorContact,
  ContactList, Organization
].each do |model|
  count = model.count
  model.destroy_all
  puts "   Cleared #{count} #{model.name.pluralize}" if count > 0
rescue => e
  puts "   Skipped #{model.name}: #{e.message}"
end

# =============================================================================
# USERS
# =============================================================================
puts "\n👤 Creating users..."

producer = User.find_or_initialize_by(email: 'producer@voxxy.dev')
producer.assign_attributes(
  name: 'Casey Producer',
  password: 'password123',
  password_confirmation: 'password123',
  role: 'venue_owner',
  product_context: 'presents',
  confirmed_at: Time.current
)
producer.save!
puts "   ✓ Producer: #{producer.email}"

admin = User.find_or_initialize_by(email: 'admin@voxxy.dev')
admin.assign_attributes(
  name: 'Admin User',
  password: 'password123',
  password_confirmation: 'password123',
  role: 'admin',
  product_context: 'presents',
  confirmed_at: Time.current
)
admin.save!
puts "   ✓ Admin: #{admin.email}"

# =============================================================================
# ORGANIZATION
# =============================================================================
puts "\n🏢 Creating organization..."

org = Organization.create!(
  user: producer,
  name: 'Voxxy Art Collective',
  description: 'An independent art event production company based in Los Angeles. We produce pop-up markets, gallery shows, and community art events.',
  email: 'team@voxxyartcollective.com',
  phone: '(213) 555-0100',
  website: 'https://voxxyartcollective.com',
  instagram_handle: '@voxxyartcollective',
  address: '456 Spring St',
  city: 'Los Angeles',
  state: 'CA',
  zip_code: '90013'
)
puts "   ✓ Organization: #{org.name} (slug: #{org.slug})"

# =============================================================================
# EMAIL TEMPLATE — load or reference existing
# =============================================================================
email_template = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)
puts "\n📧 Email template: #{email_template ? "found (ID: #{email_template.id})" : 'NOT FOUND — run seeds first'}"

# =============================================================================
# VENDOR CONTACTS — a realistic CRM pool for invitations
# =============================================================================
puts "\n📇 Creating vendor contacts..."

contact_data = [
  # Artists
  { name: 'Maya Chen',        email: 'maya@mayachenart.com',      business_name: 'Maya Chen Art',         contact_type: 'artist',  city: 'Los Angeles', state: 'CA' },
  { name: 'Jordan Rivera',    email: 'jordan@riverastudio.com',   business_name: 'Rivera Studio',          contact_type: 'artist',  city: 'Brooklyn',    state: 'NY' },
  { name: 'Sam Torres',       email: 'sam@torresworks.com',       business_name: 'Torres Works',           contact_type: 'artist',  city: 'Chicago',     state: 'IL' },
  { name: 'Priya Nair',       email: 'priya@priyacreates.com',    business_name: 'Priya Creates',          contact_type: 'artist',  city: 'Austin',      state: 'TX' },
  { name: 'Lena Kowalski',    email: 'lena@kowalskifineart.com',  business_name: 'Kowalski Fine Art',      contact_type: 'artist',  city: 'Portland',    state: 'OR' },
  { name: 'Marcus Webb',      email: 'marcus@webbdesigns.com',    business_name: 'Webb Designs',           contact_type: 'artist',  city: 'Atlanta',     state: 'GA' },
  { name: 'Zoe Park',         email: 'zoe@zoeparkart.com',        business_name: 'Zoe Park Art',           contact_type: 'artist',  city: 'Seattle',     state: 'WA' },
  { name: 'Diego Morales',    email: 'diego@diegomorales.art',    business_name: 'Diego Morales',          contact_type: 'artist',  city: 'Denver',      state: 'CO' },
  { name: 'Nia Washington',   email: 'nia@niafineart.com',        business_name: 'Nia Fine Art',           contact_type: 'artist',  city: 'Houston',     state: 'TX' },
  { name: 'Eli Goldstein',    email: 'eli@elistudio.com',         business_name: 'Eli Studio',             contact_type: 'artist',  city: 'Miami',       state: 'FL' },
  { name: 'Tasha Brown',      email: 'tasha@tashabrowncreates.com', business_name: 'Tasha Brown Creates', contact_type: 'artist',  city: 'Nashville',   state: 'TN' },
  { name: 'Felix Huang',      email: 'felix@felixhuangart.com',   business_name: 'Felix Huang Art',        contact_type: 'artist',  city: 'San Francisco', state: 'CA' },
  { name: 'Amara Osei',       email: 'amara@amaraart.com',        business_name: 'Amara Art',              contact_type: 'artist',  city: 'Minneapolis', state: 'MN' },
  { name: 'Riley Cooper',     email: 'riley@rileycooperart.com',  business_name: 'Riley Cooper Art',       contact_type: 'artist',  city: 'Phoenix',     state: 'AZ' },
  { name: 'Ivan Petrov',      email: 'ivan@petrovstudio.com',     business_name: 'Petrov Studio',          contact_type: 'artist',  city: 'Detroit',     state: 'MI' },
  # Food vendors
  { name: 'Claire Fontaine',  email: 'claire@sweetclaire.com',    business_name: 'Sweet Claire Bakery',   contact_type: 'food',    city: 'Los Angeles', state: 'CA' },
  { name: 'Tony Nguyen',      email: 'tony@baobao.com',           business_name: 'Bao Bao Street Food',   contact_type: 'food',    city: 'Los Angeles', state: 'CA' },
  { name: 'Rosa Delgado',     email: 'rosa@tacosamor.com',        business_name: 'Tacos Amor',             contact_type: 'food',    city: 'Los Angeles', state: 'CA' },
  { name: 'Kevin Sharp',      email: 'kevin@grillmaster.com',     business_name: 'Grill Master BBQ',      contact_type: 'food',    city: 'Pasadena',    state: 'CA' },
  { name: 'Nadia Okafor',     email: 'nadia@spicesofafrica.com',  business_name: 'Spices of Africa',      contact_type: 'food',    city: 'Inglewood',   state: 'CA' },
  # Craft / jewelry vendors
  { name: 'Sarah Kim',        email: 'sarah@sarahkimjewelry.com', business_name: 'Sarah Kim Jewelry',     contact_type: 'jewelry', city: 'Los Angeles', state: 'CA' },
  { name: 'Marco Bianchi',    email: 'marco@bianchicraft.com',    business_name: 'Bianchi Craft',         contact_type: 'craft',   city: 'Santa Monica', state: 'CA' },
  { name: 'Jade Wilson',      email: 'jade@jadewilsondesigns.com', business_name: 'Jade Wilson Designs',  contact_type: 'jewelry', city: 'Culver City', state: 'CA' },
  { name: 'Omar Hassan',      email: 'omar@omarcraft.com',        business_name: 'Omar Craft Works',      contact_type: 'craft',   city: 'Burbank',     state: 'CA' },
  { name: 'Lily Chen',        email: 'lily@lilychenart.com',      business_name: 'Lily Chen Art',         contact_type: 'artist',  city: 'Glendale',    state: 'CA' },
  # Extra contacts for large event pool
  { name: 'Aaron James',      email: 'aaron@aaronjames.art',      business_name: 'Aaron James Art',       contact_type: 'artist',  city: 'Oakland',     state: 'CA' },
  { name: 'Bea Lopez',        email: 'bea@bealopez.com',          business_name: 'Bea Lopez Studio',      contact_type: 'artist',  city: 'Sacramento',  state: 'CA' },
  { name: 'Carlos Reyes',     email: 'carlos@reyes.art',          business_name: 'Reyes Art',              contact_type: 'artist',  city: 'Fresno',      state: 'CA' },
  { name: 'Diana Prince',     email: 'diana@dianaprince.com',     business_name: 'Diana Prince Studio',   contact_type: 'artist',  city: 'Long Beach',  state: 'CA' },
  { name: 'Ethan Fox',        email: 'ethan@ethanfox.art',        business_name: 'Ethan Fox Art',         contact_type: 'artist',  city: 'Anaheim',     state: 'CA' },
  { name: 'Fiona Green',      email: 'fiona@fionagreen.com',      business_name: 'Fiona Green Jewelry',   contact_type: 'jewelry', city: 'Santa Ana',   state: 'CA' },
  { name: 'Gabe Torres',      email: 'gabe@gabetorres.art',       business_name: 'Gabe Torres',           contact_type: 'artist',  city: 'Riverside',   state: 'CA' },
  { name: 'Hannah Kim',       email: 'hannah@hannahkim.art',      business_name: 'Hannah Kim Art',        contact_type: 'artist',  city: 'Torrance',    state: 'CA' },
  { name: 'Ian Wells',        email: 'ian@ianwells.art',          business_name: 'Ian Wells Art',         contact_type: 'artist',  city: 'Pomona',      state: 'CA' },
  { name: 'Julia Stone',      email: 'julia@juliastone.com',      business_name: 'Julia Stone Crafts',    contact_type: 'craft',   city: 'Oxnard',      state: 'CA' },
  { name: 'Kyle Adams',       email: 'kyle@kyleadams.art',        business_name: 'Kyle Adams Art',        contact_type: 'artist',  city: 'Bakersfield', state: 'CA' },
  { name: 'Luna Rosa',        email: 'luna@lunarosa.art',         business_name: 'Luna Rosa Studio',      contact_type: 'artist',  city: 'Stockton',    state: 'CA' },
  { name: 'Mike Dell',        email: 'mike@mikedell.art',         business_name: 'Mike Dell Works',       contact_type: 'artist',  city: 'Modesto',     state: 'CA' },
  { name: 'Nina Reeves',      email: 'nina@ninareeves.art',       business_name: 'Nina Reeves Art',       contact_type: 'artist',  city: 'Visalia',     state: 'CA' },
  { name: 'Oscar Diaz',       email: 'oscar@oscardiaz.art',       business_name: 'Oscar Diaz Studio',     contact_type: 'artist',  city: 'Escondido',   state: 'CA' },
  { name: 'Pam Chu',          email: 'pam@pamchu.art',            business_name: 'Pam Chu Art',           contact_type: 'artist',  city: 'Sunnyvale',   state: 'CA' },
  { name: 'Quinn Reed',       email: 'quinn@quinnreed.art',       business_name: 'Quinn Reed',            contact_type: 'artist',  city: 'Santa Rosa',  state: 'CA' },
  { name: 'Rachel Burns',     email: 'rachel@rachelburns.art',    business_name: 'Rachel Burns Art',      contact_type: 'artist',  city: 'Eugene',      state: 'OR' },
  { name: 'Steve Young',      email: 'steve@steveyoung.art',      business_name: 'Steve Young Art',       contact_type: 'artist',  city: 'Boise',       state: 'ID' },
  { name: 'Tina Brooks',      email: 'tina@tinabrooks.art',       business_name: 'Tina Brooks Studio',    contact_type: 'artist',  city: 'Reno',        state: 'NV' },
  { name: 'Ursula King',      email: 'ursula@ursulaart.com',      business_name: 'Ursula King Art',       contact_type: 'artist',  city: 'Salt Lake City', state: 'UT' },
  { name: 'Vera Moss',        email: 'vera@veramoss.art',         business_name: 'Vera Moss Studio',      contact_type: 'artist',  city: 'Albuquerque', state: 'NM' },
  { name: 'Will Santos',      email: 'will@willsantos.art',       business_name: 'Will Santos Art',       contact_type: 'artist',  city: 'Tucson',      state: 'AZ' },
  { name: 'Xena Cole',        email: 'xena@xenacole.art',         business_name: 'Xena Cole Studio',      contact_type: 'artist',  city: 'El Paso',     state: 'TX' },
  { name: 'Yara Ali',         email: 'yara@yaraali.art',          business_name: 'Yara Ali Art',          contact_type: 'artist',  city: 'Oklahoma City', state: 'OK' },
  { name: 'Zach Moon',        email: 'zach@zachmoon.art',         business_name: 'Zach Moon Works',       contact_type: 'artist',  city: 'Kansas City', state: 'MO' },
  # Food pool for large event
  { name: 'Bella Cruz',       email: 'bella@bellassweets.com',    business_name: "Bella's Sweets",        contact_type: 'food',    city: 'Los Angeles', state: 'CA' },
  { name: 'Cal Fisher',       email: 'cal@calfisher.food',        business_name: 'Cal Fisher Eats',       contact_type: 'food',    city: 'Los Angeles', state: 'CA' },
  { name: 'Demi Lane',        email: 'demi@demilane.food',        business_name: 'Demi Lane Kitchen',     contact_type: 'food',    city: 'Culver City', state: 'CA' },
  { name: 'Ed Park',          email: 'ed@edparkfood.com',         business_name: 'Ed Park Street Food',  contact_type: 'food',    city: 'Koreatown',   state: 'CA' },
  { name: 'Faye Novak',       email: 'faye@fayeseatery.com',      business_name: "Faye's Eatery",         contact_type: 'food',    city: 'Echo Park',   state: 'CA' },
  { name: 'Glen Hart',        email: 'glen@glenhart.food',        business_name: 'Glen Hart Catering',    contact_type: 'food',    city: 'Silver Lake', state: 'CA' },
  { name: 'Hope Gray',        email: 'hope@hopegray.food',        business_name: 'Hope Gray Food Co',     contact_type: 'food',    city: 'Highland Park', state: 'CA' },
  { name: 'Iris West',        email: 'iris@iriswest.food',        business_name: 'Iris West Bites',       contact_type: 'food',    city: 'Eagle Rock',  state: 'CA' },
  { name: 'Jake Snow',        email: 'jake@jakesnow.food',        business_name: 'Jake Snow BBQ',         contact_type: 'food',    city: 'Boyle Heights', state: 'CA' },
  { name: 'Kim Tran',         email: 'kim@kimtran.food',          business_name: 'Kim Tran Pho',          contact_type: 'food',    city: 'Monterey Park', state: 'CA' },
]

contacts = contact_data.map do |attrs|
  VendorContact.create!(
    organization: org,
    name: attrs[:name],
    email: attrs[:email],
    business_name: attrs[:business_name],
    contact_type: 'vendor',
    location: [attrs[:city], attrs[:state]].compact.join(', '),
    status: 'contacted',
    categories: [attrs[:contact_type].capitalize]
  )
end
puts "   ✓ Created #{contacts.length} vendor contacts"

# Helper to find contact by email
def contact_by_email(contacts, email)
  contacts.find { |c| c.email == email }
end

# =============================================================================
# EVENT A — Summer Market (published, upcoming, large)
# 50 invites sent, 30 applicants, 20 approved (mix paid/unpaid), 5 rejected, 5 pending
# =============================================================================
puts "\n📅 Creating Event A: Summer Market..."

event_a = Event.create!(
  organization: org,
  title: 'Summer Market LA',
  description: 'Our biggest summer market yet. Artists, food vendors, jewelry makers, and more. Join us at the Hollywood Palladium for a night of art, music, and community.',
  venue: 'Hollywood Palladium',
  location: '6215 W Sunset Blvd, Los Angeles, CA 90028',
  event_date: 8.weeks.from_now.change(hour: 18, min: 0),
  event_end_date: 8.weeks.from_now.change(hour: 23, min: 0),
  start_time: '6:00 PM',
  end_time: '11:00 PM',
  application_deadline: 5.weeks.from_now.change(hour: 23, min: 59),
  payment_deadline: 6.weeks.from_now.to_date,
  capacity: 120,
  published: true,
  registration_open: true,
  status: 'published',
  email_campaign_template: email_template,
  ticket_link: 'https://tickets.voxxyartcollective.com/summer-market-la',
  age_restriction: '21+'
)
puts "   ✓ Created: #{event_a.title} (slug: #{event_a.slug})"

# Vendor applications for Event A
va_a_artist = VendorApplication.create!(
  event: event_a,
  name: 'Visual Artist',
  description: 'Paintings, illustrations, photography, and mixed media. Standard 6ft table included.',
  booth_price: 150.00,
  categories: ['Paintings', 'Illustration', 'Photography', 'Mixed Media'],
  install_date: (event_a.event_date - 3.hours).to_datetime,
  install_start_time: '2:00 PM',
  install_end_time: '5:30 PM',
  payment_link: 'https://square.link/artist',
  status: 'active'
)

va_a_food = VendorApplication.create!(
  event: event_a,
  name: 'Food Vendor',
  description: 'Food and beverage vendors. Must be licensed. 10x10 space with access to power.',
  booth_price: 250.00,
  categories: ['Food', 'Beverage', 'Desserts'],
  install_date: (event_a.event_date - 4.hours).to_datetime,
  install_start_time: '1:00 PM',
  install_end_time: '4:00 PM',
  payment_link: 'https://square.link/food',
  status: 'active'
)

va_a_jewelry = VendorApplication.create!(
  event: event_a,
  name: 'Jewelry & Craft',
  description: 'Handmade jewelry, accessories, and crafts. Table display only.',
  booth_price: 125.00,
  categories: ['Jewelry', 'Accessories', 'Handmade Crafts'],
  install_date: (event_a.event_date - 3.hours).to_datetime,
  install_start_time: '2:00 PM',
  install_end_time: '5:00 PM',
  payment_link: 'https://square.link/jewelry',
  status: 'active'
)
puts "   ✓ Created 3 vendor applications"

# Invitations for Event A — 50 contacts invited
invited_contacts_a = contacts.first(50)
invitation_statuses_a = (
  Array.new(20, 'accepted') +   # 20 accepted (applied)
  Array.new(8, 'viewed') +      # 8 viewed but didn't apply
  Array.new(15, 'sent') +       # 15 sent, unopened
  Array.new(7, 'declined')      # 7 declined
)

invitations_a = invited_contacts_a.each_with_index.map do |contact, i|
  status = invitation_statuses_a[i] || 'sent'
  EventInvitation.create!(
    event: event_a,
    vendor_contact: contact,
    status: status,
    sent_at: 3.weeks.ago + rand(0..5).days,
    responded_at: ['accepted', 'declined'].include?(status) ? (2.weeks.ago + rand(0..3).days) : nil,
    expires_at: event_a.application_deadline
  )
end
puts "   ✓ Created #{invitations_a.length} invitations (20 accepted, 8 viewed, 15 sent, 7 declined)"

# Registrations for Event A — 30 applicants
# 20 approved (12 paid, 8 unpaid), 5 rejected, 5 pending
reg_configs_a = [
  # Approved + paid (12)
  { contact_idx: 0,  va: :artist,  status: 'approved', payment_status: 'paid',    category: 'Paintings',     vendor_fee_paid: true },
  { contact_idx: 1,  va: :artist,  status: 'approved', payment_status: 'paid',    category: 'Photography',   vendor_fee_paid: true },
  { contact_idx: 2,  va: :food,    status: 'approved', payment_status: 'paid',    category: 'Food',          vendor_fee_paid: true },
  { contact_idx: 3,  va: :artist,  status: 'approved', payment_status: 'paid',    category: 'Illustration',  vendor_fee_paid: true },
  { contact_idx: 4,  va: :jewelry, status: 'approved', payment_status: 'paid',    category: 'Jewelry',       vendor_fee_paid: true },
  { contact_idx: 5,  va: :artist,  status: 'approved', payment_status: 'paid',    category: 'Mixed Media',   vendor_fee_paid: true },
  { contact_idx: 6,  va: :jewelry, status: 'approved', payment_status: 'paid',    category: 'Accessories',   vendor_fee_paid: true },
  { contact_idx: 7,  va: :food,    status: 'approved', payment_status: 'paid',    category: 'Desserts',      vendor_fee_paid: true },
  { contact_idx: 8,  va: :artist,  status: 'approved', payment_status: 'paid',    category: 'Paintings',     vendor_fee_paid: true },
  { contact_idx: 9,  va: :artist,  status: 'approved', payment_status: 'paid',    category: 'Photography',   vendor_fee_paid: true },
  { contact_idx: 10, va: :jewelry, status: 'approved', payment_status: 'paid',    category: 'Handmade Crafts', vendor_fee_paid: true },
  { contact_idx: 11, va: :food,    status: 'approved', payment_status: 'paid',    category: 'Beverage',      vendor_fee_paid: true },
  # Approved + unpaid (8)
  { contact_idx: 12, va: :artist,  status: 'approved', payment_status: 'pending', category: 'Illustration',  vendor_fee_paid: false },
  { contact_idx: 13, va: :artist,  status: 'approved', payment_status: 'pending', category: 'Mixed Media',   vendor_fee_paid: false },
  { contact_idx: 14, va: :jewelry, status: 'approved', payment_status: 'pending', category: 'Jewelry',       vendor_fee_paid: false },
  { contact_idx: 15, va: :food,    status: 'approved', payment_status: 'overdue', category: 'Food',          vendor_fee_paid: false },
  { contact_idx: 16, va: :artist,  status: 'approved', payment_status: 'pending', category: 'Paintings',     vendor_fee_paid: false },
  { contact_idx: 17, va: :jewelry, status: 'approved', payment_status: 'overdue', category: 'Accessories',   vendor_fee_paid: false },
  { contact_idx: 18, va: :artist,  status: 'approved', payment_status: 'pending', category: 'Photography',   vendor_fee_paid: false },
  { contact_idx: 19, va: :food,    status: 'approved', payment_status: 'pending', category: 'Beverage',      vendor_fee_paid: false },
  # Rejected (5)
  { contact_idx: 20, va: :artist,  status: 'rejected', payment_status: 'pending', category: 'Paintings',     vendor_fee_paid: false },
  { contact_idx: 21, va: :artist,  status: 'rejected', payment_status: 'pending', category: 'Photography',   vendor_fee_paid: false },
  { contact_idx: 22, va: :food,    status: 'rejected', payment_status: 'pending', category: 'Food',          vendor_fee_paid: false },
  { contact_idx: 23, va: :jewelry, status: 'rejected', payment_status: 'pending', category: 'Jewelry',       vendor_fee_paid: false },
  { contact_idx: 24, va: :artist,  status: 'rejected', payment_status: 'pending', category: 'Illustration',  vendor_fee_paid: false },
  # Pending (5)
  { contact_idx: 25, va: :artist,  status: 'pending',  payment_status: 'pending', category: 'Mixed Media',   vendor_fee_paid: false },
  { contact_idx: 26, va: :food,    status: 'pending',  payment_status: 'pending', category: 'Desserts',      vendor_fee_paid: false },
  { contact_idx: 27, va: :jewelry, status: 'pending',  payment_status: 'pending', category: 'Handmade Crafts', vendor_fee_paid: false },
  { contact_idx: 28, va: :artist,  status: 'pending',  payment_status: 'pending', category: 'Paintings',     vendor_fee_paid: false },
  { contact_idx: 29, va: :artist,  status: 'pending',  payment_status: 'pending', category: 'Photography',   vendor_fee_paid: false },
]

va_map_a = { artist: va_a_artist, food: va_a_food, jewelry: va_a_jewelry }

reg_configs_a.each do |cfg|
  contact = contacts[cfg[:contact_idx]]
  va = va_map_a[cfg[:va]]
  invitation = invitations_a.find { |inv| inv.vendor_contact_id == contact.id }
  Registration.create!(
    event: event_a,
    vendor_application: va,
    event_invitation: invitation,
    email: contact.email,
    name: contact.name,
    business_name: contact.business_name,
    vendor_category: cfg[:category],
    status: cfg[:status],
    payment_status: cfg[:payment_status],
    vendor_fee_paid: cfg[:vendor_fee_paid],
    payment_confirmed_at: cfg[:vendor_fee_paid] ? 2.weeks.ago : nil,
    payment_amount: va.booth_price,
    subscribed: true
  )
end
puts "   ✓ Created 30 registrations (20 approved, 5 rejected, 5 pending)"

# =============================================================================
# EVENT B — Holiday Bazaar (published, upcoming, small, payment pressure)
# 15 invites, 8 applicants, 3 approved none paid, deadline approaching
# =============================================================================
puts "\n📅 Creating Event B: Holiday Bazaar..."

event_b = Event.create!(
  organization: org,
  title: 'Holiday Bazaar',
  description: 'Cozy holiday market with handmade gifts, art, and festive treats. Perfect for holiday shopping.',
  venue: 'The Wiltern',
  location: '3790 Wilshire Blvd, Los Angeles, CA 90010',
  event_date: 12.weeks.from_now.change(hour: 17, min: 0),
  event_end_date: 12.weeks.from_now.change(hour: 22, min: 0),
  start_time: '5:00 PM',
  end_time: '10:00 PM',
  application_deadline: 2.weeks.from_now.change(hour: 23, min: 59),
  payment_deadline: (Date.today + 3.days),   # Payment deadline very soon — pressure scenario
  capacity: 40,
  published: true,
  registration_open: true,
  status: 'published',
  email_campaign_template: email_template,
  age_restriction: '18+'
)
puts "   ✓ Created: #{event_b.title} (slug: #{event_b.slug})"

va_b_gift = VendorApplication.create!(
  event: event_b,
  name: 'Handmade Gifts & Art',
  description: 'Jewelry, crafts, art prints, and handmade goods. Holiday-themed preferred.',
  booth_price: 100.00,
  categories: ['Jewelry', 'Art Prints', 'Handmade Gifts', 'Ornaments'],
  install_date: (event_b.event_date - 2.hours).to_datetime,
  install_start_time: '3:00 PM',
  install_end_time: '4:30 PM',
  payment_link: 'https://square.link/holiday-gift',
  status: 'active'
)

va_b_food = VendorApplication.create!(
  event: event_b,
  name: 'Holiday Food & Treats',
  description: 'Seasonal food, hot drinks, baked goods.',
  booth_price: 175.00,
  categories: ['Baked Goods', 'Hot Drinks', 'Holiday Treats'],
  install_date: (event_b.event_date - 2.5.hours).to_datetime,
  install_start_time: '2:30 PM',
  install_end_time: '4:00 PM',
  payment_link: 'https://square.link/holiday-food',
  status: 'active'
)

# 15 invites
invited_contacts_b = contacts[20..34]
invitation_statuses_b = Array.new(8, 'accepted') + Array.new(4, 'sent') + Array.new(3, 'viewed')

invitations_b = invited_contacts_b.each_with_index.map do |contact, i|
  status = invitation_statuses_b[i]
  EventInvitation.create!(
    event: event_b,
    vendor_contact: contact,
    status: status,
    sent_at: 1.week.ago,
    responded_at: status == 'accepted' ? 5.days.ago : nil,
    expires_at: event_b.application_deadline
  )
end
puts "   ✓ Created #{invitations_b.length} invitations"

# 8 registrations: 3 approved/unpaid, 2 pending, 3 rejected
b_reg_configs = [
  { contact_idx: 20, va: :gift, status: 'approved', payment_status: 'pending', category: 'Jewelry',         vendor_fee_paid: false },
  { contact_idx: 21, va: :gift, status: 'approved', payment_status: 'overdue', category: 'Art Prints',      vendor_fee_paid: false },
  { contact_idx: 22, va: :food, status: 'approved', payment_status: 'overdue', category: 'Baked Goods',     vendor_fee_paid: false },
  { contact_idx: 23, va: :gift, status: 'pending',  payment_status: 'pending', category: 'Handmade Gifts',  vendor_fee_paid: false },
  { contact_idx: 24, va: :food, status: 'pending',  payment_status: 'pending', category: 'Hot Drinks',      vendor_fee_paid: false },
  { contact_idx: 25, va: :gift, status: 'rejected', payment_status: 'pending', category: 'Ornaments',       vendor_fee_paid: false },
  { contact_idx: 26, va: :food, status: 'rejected', payment_status: 'pending', category: 'Holiday Treats',  vendor_fee_paid: false },
  { contact_idx: 27, va: :gift, status: 'rejected', payment_status: 'pending', category: 'Jewelry',         vendor_fee_paid: false },
]

va_map_b = { gift: va_b_gift, food: va_b_food }
b_reg_configs.each do |cfg|
  contact = contacts[cfg[:contact_idx]]
  va = va_map_b[cfg[:va]]
  invitation = invitations_b.find { |inv| inv.vendor_contact_id == contact.id }
  Registration.create!(
    event: event_b,
    vendor_application: va,
    event_invitation: invitation,
    email: contact.email,
    name: contact.name,
    business_name: contact.business_name,
    vendor_category: cfg[:category],
    status: cfg[:status],
    payment_status: cfg[:payment_status],
    vendor_fee_paid: cfg[:vendor_fee_paid],
    payment_amount: va.booth_price,
    subscribed: true
  )
end
puts "   ✓ Created 8 registrations (3 approved/unpaid, 2 pending, 3 rejected)"

# =============================================================================
# EVENT C — Pop-Up Food Fair (published, upcoming, large, all paid)
# 100 invites, 60 applicants, 40 approved all paid
# =============================================================================
puts "\n📅 Creating Event C: Pop-Up Food Fair..."

event_c = Event.create!(
  organization: org,
  title: 'Pop-Up Food Fair',
  description: 'The ultimate street food festival. 40+ food vendors, live DJs, outdoor seating, and good vibes all day.',
  venue: 'Grand Park',
  location: '200 N Grand Ave, Los Angeles, CA 90012',
  event_date: 6.weeks.from_now.change(hour: 12, min: 0),
  event_end_date: 6.weeks.from_now.change(hour: 20, min: 0),
  start_time: '12:00 PM',
  end_time: '8:00 PM',
  application_deadline: 3.weeks.from_now.change(hour: 23, min: 59),
  payment_deadline: 4.weeks.from_now.to_date,
  capacity: 50,
  published: true,
  registration_open: true,
  status: 'published',
  email_campaign_template: email_template,
  ticket_link: 'https://tickets.voxxyartcollective.com/food-fair',
  age_restriction: 'All Ages'
)
puts "   ✓ Created: #{event_c.title} (slug: #{event_c.slug})"

va_c_food = VendorApplication.create!(
  event: event_c,
  name: 'Food Vendor',
  description: 'Street food, snacks, and beverages. Health permit required. 10x10 booth with power access.',
  booth_price: 300.00,
  categories: ['Street Food', 'Desserts', 'Beverages', 'Snacks'],
  install_date: (event_c.event_date - 3.hours).to_datetime,
  install_start_time: '9:00 AM',
  install_end_time: '11:00 AM',
  payment_link: 'https://square.link/food-fair',
  status: 'active'
)

# All 60 contacts — use contacts 0..59
invited_contacts_c = contacts  # all 60
invitation_statuses_c = (
  Array.new(40, 'accepted') +
  Array.new(12, 'sent') +
  Array.new(5, 'viewed') +
  Array.new(3, 'declined')
)

invitations_c = invited_contacts_c.each_with_index.map do |contact, i|
  status = invitation_statuses_c[i] || 'sent'
  EventInvitation.create!(
    event: event_c,
    vendor_contact: contact,
    status: status,
    sent_at: 4.weeks.ago,
    responded_at: status == 'accepted' ? 3.weeks.ago : nil,
    expires_at: event_c.application_deadline
  )
end
puts "   ✓ Created #{invitations_c.length} invitations"

# 40 approved + paid, 15 pending, 5 rejected
food_categories = ['Street Food', 'Desserts', 'Beverages', 'Snacks']
contacts.first(60).each_with_index do |contact, i|
  invitation = invitations_c.find { |inv| inv.vendor_contact_id == contact.id }
  if i < 40
    Registration.create!(
      event: event_c,
      vendor_application: va_c_food,
      event_invitation: invitation,
      email: contact.email,
      name: contact.name,
      business_name: contact.business_name,
      vendor_category: food_categories[i % 4],
      status: 'approved',
      payment_status: 'paid',
      vendor_fee_paid: true,
      payment_confirmed_at: 2.weeks.ago + rand(0..5).days,
      payment_amount: va_c_food.booth_price,
      subscribed: true
    )
  elsif i < 55
    Registration.create!(
      event: event_c,
      vendor_application: va_c_food,
      event_invitation: invitation,
      email: contact.email,
      name: contact.name,
      business_name: contact.business_name,
      vendor_category: food_categories[i % 4],
      status: 'pending',
      payment_status: 'pending',
      vendor_fee_paid: false,
      payment_amount: va_c_food.booth_price,
      subscribed: true
    )
  else
    Registration.create!(
      event: event_c,
      vendor_application: va_c_food,
      event_invitation: invitation,
      email: contact.email,
      name: contact.name,
      business_name: contact.business_name,
      vendor_category: food_categories[i % 4],
      status: 'rejected',
      payment_status: 'pending',
      vendor_fee_paid: false,
      payment_amount: va_c_food.booth_price,
      subscribed: true
    )
  end
end
puts "   ✓ Created 60 registrations (40 approved/paid, 15 pending, 5 rejected)"

# =============================================================================
# EVENT D — Spring Art Walk (draft, empty state scenario)
# =============================================================================
puts "\n📅 Creating Event D: Spring Art Walk (draft)..."

event_d = Event.create!(
  organization: org,
  title: 'Spring Art Walk',
  description: 'An outdoor art walk through the Arts District. Work in progress.',
  venue: 'Arts District LA',
  location: 'Arts District, Los Angeles, CA 90013',
  event_date: 16.weeks.from_now.change(hour: 15, min: 0),
  event_end_date: 16.weeks.from_now.change(hour: 21, min: 0),
  start_time: '3:00 PM',
  end_time: '9:00 PM',
  application_deadline: 12.weeks.from_now.change(hour: 23, min: 59),
  payment_deadline: 13.weeks.from_now.to_date,
  capacity: 60,
  published: false,
  registration_open: false,
  status: 'draft'
)
puts "   ✓ Created draft: #{event_d.title} (slug: #{event_d.slug}) — no activity"

# =============================================================================
# EVENT E — Past Farmers Market (completed, post-event state)
# 25 invites sent, 20 applicants, 18 approved, all paid
# =============================================================================
puts "\n📅 Creating Event E: Past Farmers Market..."

event_e = Event.create!(
  organization: org,
  title: "Farmers Market at Smashbox",
  description: 'Our Farmers Market edition at Smashbox Studios. Local farmers, artisans, and food vendors.',
  venue: 'Smashbox Studios',
  location: '1011 N Fuller Ave, West Hollywood, CA 90046',
  event_date: 6.weeks.ago.change(hour: 10, min: 0),
  event_end_date: 6.weeks.ago.change(hour: 16, min: 0),
  start_time: '10:00 AM',
  end_time: '4:00 PM',
  application_deadline: 9.weeks.ago.change(hour: 23, min: 59),
  payment_deadline: (Date.today - 7.weeks),
  capacity: 40,
  published: true,
  registration_open: false,
  status: 'completed',
  email_campaign_template: email_template,
  age_restriction: 'All Ages'
)
puts "   ✓ Created: #{event_e.title} (slug: #{event_e.slug})"

va_e_farmer = VendorApplication.create!(
  event: event_e,
  name: 'Farmers & Produce',
  description: 'Local farmers and produce vendors.',
  booth_price: 80.00,
  categories: ['Produce', 'Honey & Jams', 'Herbs & Plants'],
  install_date: (event_e.event_date - 2.hours).to_datetime,
  install_start_time: '8:00 AM',
  install_end_time: '9:30 AM',
  payment_link: 'https://square.link/farmers',
  status: 'active'
)

va_e_artisan = VendorApplication.create!(
  event: event_e,
  name: 'Artisan Goods',
  description: 'Handmade soaps, candles, ceramics, and crafts.',
  booth_price: 90.00,
  categories: ['Soaps & Candles', 'Ceramics', 'Textiles'],
  install_date: (event_e.event_date - 2.hours).to_datetime,
  install_start_time: '8:00 AM',
  install_end_time: '9:30 AM',
  payment_link: 'https://square.link/artisan',
  status: 'active'
)

invited_contacts_e = contacts.first(25)
invitations_e = invited_contacts_e.map do |contact|
  EventInvitation.create!(
    event: event_e,
    vendor_contact: contact,
    status: 'accepted',
    sent_at: 10.weeks.ago,
    responded_at: 9.weeks.ago,
    expires_at: event_e.application_deadline
  )
end
puts "   ✓ Created #{invitations_e.length} invitations (all accepted)"

# 18 approved/paid, 2 rejected
contacts.first(20).each_with_index do |contact, i|
  va = i < 10 ? va_e_farmer : va_e_artisan
  categories = i < 10 ? ['Produce', 'Honey & Jams', 'Herbs & Plants'] : ['Soaps & Candles', 'Ceramics', 'Textiles']
  invitation = invitations_e.find { |inv| inv.vendor_contact_id == contact.id }
  Registration.create!(
    event: event_e,
    vendor_application: va,
    event_invitation: invitation,
    email: contact.email,
    name: contact.name,
    business_name: contact.business_name,
    vendor_category: categories[i % categories.length],
    status: i < 18 ? 'approved' : 'rejected',
    payment_status: i < 18 ? 'paid' : 'pending',
    vendor_fee_paid: i < 18,
    payment_confirmed_at: i < 18 ? 8.weeks.ago : nil,
    payment_amount: va.booth_price,
    subscribed: true,
    checked_in: i < 16   # 16 of 18 approved actually checked in
  )
end
puts "   ✓ Created 20 registrations (18 approved/paid, 16 checked in, 2 rejected)"

# =============================================================================
# SUMMARY
# =============================================================================
puts ""
puts "=" * 60
puts "🎉 Voxxy Presents seed data complete!"
puts "=" * 60
puts ""
puts "TEST CREDENTIALS:"
puts "  Producer: producer@voxxy.dev / password123"
puts "  Admin:    admin@voxxy.dev    / password123"
puts ""
puts "ORGANIZATION:"
puts "  #{org.name} (slug: #{org.slug})"
puts ""
puts "EVENTS:"
puts "  A) #{event_a.title} — published, #{event_a.registrations.count} applicants, #{event_a.event_date.strftime('%b %d %Y')}"
puts "     #{event_a.registrations.where(status: 'approved').count} approved (#{event_a.registrations.where(payment_status: 'paid').count} paid)"
puts "  B) #{event_b.title} — published, #{event_b.registrations.count} applicants, payment deadline #{event_b.payment_deadline}"
puts "     #{event_b.registrations.where(status: 'approved').count} approved (#{event_b.registrations.where(payment_status: 'paid').count} paid)"
puts "  C) #{event_c.title} — published, #{event_c.registrations.count} applicants"
puts "     #{event_c.registrations.where(status: 'approved').count} approved (#{event_c.registrations.where(payment_status: 'paid').count} paid)"
puts "  D) #{event_d.title} — DRAFT, no activity"
puts "  E) #{event_e.title} — completed/past, #{event_e.registrations.count} applicants"
puts "     #{event_e.registrations.where(checked_in: true).count} checked in"
puts ""
puts "CONTACTS: #{VendorContact.count} in CRM"
puts "TOTAL REGISTRATIONS: #{Registration.count}"
puts "TOTAL INVITATIONS: #{EventInvitation.count}"
puts "=" * 60
