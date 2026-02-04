#!/usr/bin/env ruby
# Test script to verify portal URL generation with tokens

event = Event.first
registration = event.registrations.first

unless registration
  registration = event.registrations.create!(
    name: 'Test Vendor',
    email: 'test@vendor.com',
    vendor_category: 'Art',
    status: 'approved'
  )
end

puts '=' * 80
puts 'EMAIL URL GENERATION TEST'
puts '=' * 80
puts ''

puts '1. EmailVariableResolver [dashboardLink]:'
resolver = EmailVariableResolver.new(event, registration)
dashboard_link = resolver.send(:dashboard_link)
puts "   #{dashboard_link}"
puts ''

puts '2. EventPortal#portal_url:'
portal = event.event_portal
puts "   #{portal.portal_url}"
puts ''

puts '3. RegistrationEmailService approval email (simulated):'
portal = event.event_portal || event.create_event_portal!
dashboard_link = portal.portal_url
puts "   #{dashboard_link}"
puts ''

puts '4. Token details:'
puts "   Token: #{portal.access_token[0..15]}..."
puts "   Length: #{portal.access_token.length} chars"
puts "   Format: #{portal.access_token =~ /^[A-Za-z0-9_-]+$/ ? 'Valid URL-safe base64' : 'Invalid format'}"
puts ''

puts '5. Verify all URLs match:'
resolver_link = resolver.send(:dashboard_link)
portal_link = portal.portal_url
approval_link = dashboard_link

if resolver_link == portal_link && portal_link == approval_link
  puts "   ✅ ALL URLS MATCH! Token-based URLs working correctly."
else
  puts "   ❌ URL MISMATCH!"
  puts "      EmailVariableResolver: #{resolver_link}"
  puts "      EventPortal:           #{portal_link}"
  puts "      Approval Email:        #{approval_link}"
end

puts ''
puts '=' * 80
