# Find the event
event = Event.find_by(slug: 'crepe-tornado-2026')

if event
  puts "\n📧 EVENT: #{event.title}"
  puts "=" * 60

  # Check registrations
  puts "\n👥 REGISTRATIONS:"
  event.registrations.each do |reg|
    puts "  - #{reg.name} (#{reg.business_name})"
    puts "    Status: #{reg.status}"
    puts "    Email: #{reg.email}"
    puts "    Subscribed: #{reg.subscribed}"
    puts "    Unsubscribed: #{reg.email_unsubscribed}"
  end

  # Check a few scheduled emails
  puts "\n📬 SCHEDULED EMAILS (first 3):"
  event.scheduled_emails.limit(3).each do |email|
    puts "\n  📨 #{email.name}"
    puts "    Filter Criteria: #{email.filter_criteria.inspect}"
    puts "    Recipient Count: #{email.recipient_count}"
    puts "    Status: #{email.status}"
  end

  # Check one event countdown email specifically
  countdown_email = event.scheduled_emails.find_by("name LIKE ?", "%Days Before Event%")
  if countdown_email
    puts "\n🔍 DETAILED CHECK - Event Countdown Email:"
    puts "  Name: #{countdown_email.name}"
    puts "  Filter Criteria: #{countdown_email.filter_criteria.inspect}"
    puts "  Recipient Count: #{countdown_email.recipient_count}"

    # Manually check what matches the filter
    filter = countdown_email.filter_criteria || {}
    matching_regs = event.registrations

    if filter['status'].present?
      matching_regs = matching_regs.where(status: filter['status'])
      puts "  Filtering by status: #{filter['status'].inspect}"
    end

    puts "  Manually calculated matches: #{matching_regs.count}"
    matching_regs.each do |reg|
      puts "    ✓ #{reg.name} - #{reg.status}"
    end
  end
else
  puts "❌ Event not found!"
end
