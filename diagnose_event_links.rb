#!/usr/bin/env ruby
# Diagnostic script to analyze event portal link inconsistencies

puts "=" * 80
puts "EVENT PORTAL LINK DIAGNOSTIC REPORT"
puts "=" * 80
puts ""

# 1. Environment Configuration
puts "1. ENVIRONMENT CONFIGURATION"
puts "-" * 80
puts "Rails.env: #{Rails.env}"
puts "PRIMARY_DOMAIN env var: #{ENV['PRIMARY_DOMAIN'].inspect}"
puts "FRONTEND_URL env var: #{ENV['FRONTEND_URL'].inspect}"
puts "PRESENTS_FRONTEND_URL env var: #{ENV['PRESENTS_FRONTEND_URL'].inspect}"
puts ""

# 2. URL Helper Output
puts "2. URL HELPER OUTPUT"
puts "-" * 80
puts "FrontendUrlHelper.presents_frontend_url: #{FrontendUrlHelper.presents_frontend_url}"
puts ""

# 3. Sample Event Analysis
puts "3. SAMPLE EVENT ANALYSIS"
puts "-" * 80

event = Event.joins(:organization).order(created_at: :desc).first
if event
  puts "Event: #{event.title} (slug: #{event.slug})"
  puts "Organization: #{event.organization.name}"
  puts ""

  # Different URL generation methods
  puts "URL Generation Methods:"
  puts "  a) EmailVariableResolver [eventLink]: #{EmailVariableResolver.new(event).send(:event_link)}"

  if event.registrations.first
    registration = event.registrations.first
    resolver = EmailVariableResolver.new(event, registration)
    puts "  b) EmailVariableResolver [dashboardLink]: #{resolver.send(:dashboard_link)}"
  end

  if event.event_portal
    puts "  c) EventPortal#portal_url: #{event.event_portal.portal_url}"
    puts "  d) EventPortal#portal_url (with email): #{event.event_portal.portal_url('test@example.com')}"
  end

  if event.event_invitations.first
    invitation = event.event_invitations.first
    puts "  e) EventInvitation#invitation_url: #{invitation.invitation_url}"
  end

  puts ""

  # Check RegistrationEmailService approval email
  puts "URL in RegistrationEmailService (approval email, line 334):"
  base_url = ENV["FRONTEND_URL"] || "https://voxxy.io"
  puts "  ENV['FRONTEND_URL']: #{ENV['FRONTEND_URL'].inspect}"
  puts "  Fallback: https://voxxy.io"
  puts "  Result: #{base_url}/portal/#{event.slug}"
  puts ""

  # Check RegistrationEmailService payment confirmation (line 564)
  puts "URL in RegistrationEmailService (payment confirmation, line 564):"
  base_url2 = ENV["FRONTEND_URL"] || "https://voxxy.io"
  puts "  Result: #{base_url2}/portal/#{event.slug}"
  puts ""

  # Check RegistrationEmailService attendee confirmation (line 256-265)
  puts "URL in RegistrationEmailService (attendee confirmation, line 256-265):"
  if Rails.env.production?
    primary_domain = ENV.fetch("PRIMARY_DOMAIN", "voxxyai.com")
    if primary_domain.include?("voxxyai.com")
      frontend_url = "https://voxxy-presents-client-staging.onrender.com"
    else
      frontend_url = "https://www.voxxypresents.com"
    end
  else
    frontend_url = ENV.fetch("PRESENTS_FRONTEND_URL", "http://localhost:5173")
  end
  puts "  Result: #{frontend_url}/events/#{event.slug}"
  puts ""
else
  puts "No events found in database"
  puts ""
end

# 4. Check Scheduled Emails
puts "4. SCHEDULED EMAIL TEMPLATES"
puts "-" * 80

scheduled_emails = ScheduledEmail.where(status: 'scheduled').limit(3)
if scheduled_emails.any?
  scheduled_emails.each do |email|
    puts "Email: #{email.name} (Event: #{email.event.title})"
    puts "Subject: #{email.subject_template}"

    # Look for URL patterns in body
    body = email.body_template
    if body =~ /\[dashboardLink\]/
      puts "  Contains: [dashboardLink] variable"
    end
    if body =~ /\[eventLink\]/
      puts "  Contains: [eventLink] variable"
    end
    if body =~ /\[bulletinLink\]/
      puts "  Contains: [bulletinLink] variable"
    end
    if body =~ /https?:\/\//
      puts "  Contains hardcoded URL(s):"
      body.scan(/(https?:\/\/[^\s<>"']+)/).flatten.each do |url|
        puts "    - #{url}"
      end
    end
    puts ""
  end
else
  puts "No scheduled emails found"
  puts ""
end

# 5. Summary of Inconsistencies
puts "5. INCONSISTENCY SUMMARY"
puts "-" * 80
puts ""
puts "PROBLEM 1: Multiple URL generation patterns"
puts "  - EmailVariableResolver uses FrontendUrlHelper (correct)"
puts "  - RegistrationEmailService uses ENV['FRONTEND_URL'] with fallback 'https://voxxy.io' (WRONG)"
puts "  - EventPortal model duplicates FrontendUrlHelper logic"
puts "  - EventInvitation model duplicates FrontendUrlHelper logic"
puts ""

puts "PROBLEM 2: Hardcoded fallback domains"
puts "  - RegistrationEmailService::send_approval_email line 334: ENV['FRONTEND_URL'] || 'https://voxxy.io'"
puts "  - RegistrationEmailService::send_payment_confirmation line 564: ENV['FRONTEND_URL'] || 'https://voxxy.io'"
puts "  - This causes wrong URLs when FRONTEND_URL is not set"
puts ""

puts "PROBLEM 3: Inconsistent environment variable usage"
puts "  - FrontendUrlHelper checks FRONTEND_URL in non-production, PRESENTS_FRONTEND_URL fallback"
puts "  - RegistrationEmailService uses only FRONTEND_URL with wrong fallback"
puts "  - EventPortal/EventInvitation check FRONTEND_URL only"
puts ""

puts "=" * 80
puts "RECOMMENDATION: Centralize all URL generation through FrontendUrlHelper"
puts "=" * 80
puts ""
