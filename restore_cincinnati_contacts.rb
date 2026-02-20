org   = Organization.find(4)
event = Event.find_by(slug: "cincinnati-pancakes-booze-art-show")
raise "Event not found!" if event.nil?
raise "Event is not live!" unless event.is_live
artists_app = event.vendor_applications.find_by(name: "Artists")
raise "Artists VendorApplication not found!" if artists_app.nil?

puts "Org: #{org.id} — #{org.name}"
puts "Event: #{event.id} — #{event.title} (live: #{event.is_live})"
puts "Artists app: #{artists_app.id}"

Registration.skip_callback(:create, :after, :send_confirmation_email)
Registration.skip_callback(:update, :after, :send_status_update_email)
puts "Email callbacks disabled."

invited_emails = %w[
  1473hazar@gmail.com
  513reece@gmail.com
  afeworkaholic@gmail.com
  alexispend@gmail.com
  antevinbrown@gmail.com
  artbytell@artbytell.com
  artbytell@outlook.com
  artbytiarad@gmail.com
  arttbyjeb@gmail.com
  artxsav@gmail.com
  ashnkingsland@gmail.com
  athena5897@yahoo.com
  autumnlwalsh@gmail.com
  ayannaniambi@live.com
  bee.jones@protonmail.ch
  beingtiffanyb@gmail.com
  ben.dressman3@gmail.com
  bobbiereekers@gmail.com
  brandon@purplemorel.com
  briana.beckler@yahoo.com
  brittneylindsey2223@gmail.com
  brookelynne.duell@gmail.com
  bwhity@hotmail.com
  byeager2298@gmail.com
  carterkenniya@gmail.com
  cassieranson333@gmail.com
  chikinart@gmail.com
  claireelisemusic@gmail.com
  cottonkandym1@gmail.com
  craver205@gmail.com
  creaturecraftworks@gmail.com
  cvaartistry@gmail.com
  darialove@yahoo.com
  deadtoothlocal@gmail.com
  delaneyandbluclay@gmail.com
  designsbynaimah@yahoo.com
  dexter34924@gmail.com
  drich346@gmail.com
  duwonnebiggers@gmail.com
  dvmvgedgxxds@gmail.com
  ecaseywage@gmail.com
  eleanorkremer@gmail.com
  elexusrenner1@gmail.com
  emfunel@gmail.com
  emilycoopercreations@gmail.com
  emmamurphree@yahoo.com
  ethancash.clifton@gmail.com
  exoticclosetcincy@gmail.com
  ezrakalmusart@gmail.com
  fahrenc451@gmail.com
  findersretro@gmail.com
  fungusfairycreations@gmail.com
  gabriellemgates@gmail.com
  gettothecorner@gmail.com
  giom.paintings@gmail.com
  groundswellpsychotherapy@gmail.com
  harmonyhemssewing@gmail.com
  hello@racheldupuis.com
  hlareej93@gmail.com
  ig.saalik@gmail.com
  inflywetrust859@gmail.com
  info@cosmikgardens.com
  info@preciousjewelart.com
  inspiringcanvases@gmail.com
  iwera.illustration@gmail.com
  izzyoh@icloud.com
  j.maples09@gmail.com
  jabrahiman@gmail.com
  jacquelineboyd89@gmail.com
  jamaal.durr@icloud.com
  jardaniwise@gmail.com
  jbaskin004@gmail.com
  john.ramsey@artacademy.edu
  kammiechilton@gmail.com
  kanokye0201@gmail.com
  kat.taylor0046@gmail.com
  kawaiitattoo@gmail.com
  kelsy.kelz513@gmail.com
  kenzie.recker@icloud.com
  keyashascreations@gmail.com
  kyla@p31art.com
  kyler.runk00@gmail.com
  lacecreationzart@yahoo.com
  lamumbaart@gmail.com
  laveltraveltattoos@gmail.com
  ljchilds2007@gmail.com
  lmshea69@gmail.com
  look.what.i.drew@icloud.com
  louisescreations86@gmail.com
  maddieimm@gmail.com
  mahaganyshawtattoos@gmail.com
  malikanaiyma@gmail.com
  mckenziedunlapart@gmail.com
  megan.e.gurley@gmail.com
  mekajcollective@gmail.com
  melsmysticalgems1@gmail.com
  mle2018@yahoo.com
  mohamed.syraaj@gmail.com
  mrsbosslimah@gmail.com
  mulfordpamela97@gmail.com
  nathan.gittleman@gmail.com
  nickjbridgeman@gmail.com
  niya4199@gmail.com
  nubianluxxllc@gmail.com
  nwaltersart@gmail.com
  peteyisking@gmail.com
  piercemillsart@gmail.com
  plumvirtu@gmail.com
  popwaterstudio@gmail.com
  prettydrvgs@gmail.com
  quietsoundsofqualia@gmail.com
  r.maupin96@gmail.com
  rainbowpoptartkittys@gmail.com
  rcscreates@gmail.com
  reillystasienko@gmail.com
  richiegould@gmail.com
  roninarthaus@gmail.com
  samhetlerart@gmail.com
  samsamspraypaints@gmail.com
  sarah-walker@comcast.net
  sarakollig@gmail.com
  schnurmm98@gmail.com
  schornako1@gmail.com
  sebastian@arthasnorules.com
  sheurkadanner@yahoo.com
  shopartsykloset@yahoo.com
  smolbeancompany@gmail.com
  sneakherapp@gmail.com
  snowdenbf@gmail.com
  steph14frank@yahoo.com
  stephanie@funkysunshine.com
  stephanie@p31art.com
  streetstains@gmail.com
  studiozhane@outlook.com
  tabithaparks@icloud.com
  taliaellen878@gmail.com
  teastainedstudio@gmail.com
  technocolorart@gmail.com
  terrestrialvessel@gmail.com
  thelmastrinkets.nmore@yahoo.com
  therealdj5point0@gmail.com
  thespinningfairy@gmail.com
  thisnot4you@gmail.com
  tlewis4208@icloud.com
  toriturner0326@gmail.com
  toroperceptions_art@icloud.com
  truleedominique@gmail.com
  undyingart513@gmail.com
  unusualgraphic@gmail.com
  waid.designs.llc@gmail.com
  youthwingsociety@gmail.com
  zoeasyates@gmail.com
]

applicants = [
  { email: "deadtoothlocal@gmail.com",    status: "approved", from_invite: true  },
  { email: "drich346@gmail.com",          status: "pending",  from_invite: true  },
  { email: "ig.saalik@gmail.com",         status: "pending",  from_invite: true  },
  { email: "kelsy.kelz513@gmail.com",     status: "approved", from_invite: true  },
  { email: "keyashascreations@gmail.com", status: "approved", from_invite: true  },
  { email: "lacecreationzart@yahoo.com",  status: "approved", from_invite: true  },
  { email: "nathan.gittleman@gmail.com",  status: "approved", from_invite: true  },
  { email: "1alextanveer2@gmail.com",     status: "pending",  from_invite: false },
  { email: "autumntwin@aol.com",          status: "approved", from_invite: false },
  { email: "brian@imgbat.com",            status: "pending",  from_invite: false },
  { email: "briantaylor1973@gmail.com",   status: "pending",  from_invite: false },
  { email: "dchenderson91@gmail.com",     status: "pending",  from_invite: false },
  { email: "livpaints22@gmail.com",       status: "pending",  from_invite: false },
  { email: "trenasuggs@yahoo.com",        status: "pending",  from_invite: false }
]

invitations = {}
inv_ok = 0
inv_fail = 0

invited_emails.each do |email|
  begin
    contact = VendorContact.create!(
      organization: org,
      name:         email.split("@").first,
      email:        email,
      status:       "new",
      contact_type: "lead"
    )
    inv = EventInvitation.create!(
      event:          event,
      vendor_contact: contact,
      status:         "sent"
    )
    invitations[email] = inv
    inv_ok += 1
  rescue => e
    puts "FAIL invite #{email}: #{e.message}"
    inv_fail += 1
  end
end

puts "Invitations: #{inv_ok} created, #{inv_fail} failed"

reg_ok = 0
reg_fail = 0

applicants.each do |row|
  begin
    inv = row[:from_invite] ? invitations[row[:email]] : nil
    r = Registration.new(
      event:              event,
      vendor_application: artists_app,
      event_invitation:   inv,
      email:              row[:email],
      name:               row[:email].split("@").first,
      business_name:      row[:email].split("@").first,
      vendor_category:    "Artists",
      status:             row[:status],
      payment_status:     "pending"
    )
    if r.save
      puts "OK [#{row[:status]}] #{row[:email]}"
      reg_ok += 1
    else
      puts "FAIL #{row[:email]}: #{r.errors.full_messages}"
      reg_fail += 1
    end
  rescue => e
    puts "FAIL #{row[:email]}: #{e.message}"
    reg_fail += 1
  end
end

puts "Registrations: #{reg_ok} created, #{reg_fail} failed"

Registration.set_callback(:create, :after, :send_confirmation_email)
Registration.set_callback(:update, :after, :send_status_update_email)

puts ""
puts "EventInvitations: #{event.event_invitations.count}  (expected 152)"
puts "Registrations:    #{event.registrations.count}  (expected 14)"
puts "  approved:       #{event.registrations.where(status: 'approved').count}  (expected 6)"
puts "  pending:        #{event.registrations.where(status: 'pending').count}  (expected 8)"
