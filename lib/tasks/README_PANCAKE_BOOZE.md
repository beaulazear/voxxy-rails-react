# Pancake & Booze Email Sequence

This directory contains a seed script to create a complete 30-email campaign template for Pancake & Booze events.

## Overview

The Pancake & Booze email sequence includes:
- **30 total emails** covering the complete event lifecycle
- **Action-based triggers** (9): Application submit, approval, payment received, waitlist, rejection, event date
- **Time-based triggers** (21): Ranging from 70 days before event to day-of
- **Category-filtered emails** (22): Targeting Artists vs Vendors specifically
- **Universal emails** (8): Invitations, announcements, waitlist, rejection

## Running the Seed Script

### Option 1: From Rails Console
```bash
cd /path/to/voxxy-rails-react
rails console
```

Then in the console:
```ruby
require './lib/tasks/seed_pancake_booze_email_sequence.rb'
```

### Option 2: Using Rails Runner
```bash
cd /path/to/voxxy-rails-react
rails runner lib/tasks/seed_pancake_booze_email_sequence.rb
```

## Email Categories

### Pre-Application (5 emails)
1. Initial Invitation - Applications Open
2. Event Announcement - 10 Weeks Out (70 days)
3. Event Announcement - 8 Weeks Out (56 days)
4. Event Announcement - 4 Weeks Out (28 days)
5. Event Announcement - 12 Days Out

### Application (5 emails)
- Application Received - Artists
- Application Received - Vendors
- Application Accepted - Artists
- Application Accepted - Vendors
- Application Waitlisted
- Application Rejected

### Payment Reminders - Artists (6 emails)
- 39 days out
- 26 days out
- 16 days out
- 8 days out
- 4 days out
- 1 day out

### Payment Reminders - Vendors (4 emails)
- 29 days out
- 15 days out
- 9 days out
- 3 days out

### System (1 email)
- Payment Confirmation (on_payment_received trigger)

### Pre-Event Countdown - Artists (3 emails)
- Artist Guide - 17 days out
- Artist Countdown - 11 days out
- Artist Final Details - 3 days out

### Pre-Event Countdown - Vendors (3 emails)
- Vendor Guide - 12 days out
- Vendor Countdown - 7 days out
- Vendor Final Instructions - 3 days out

### Event Day (2 emails)
- Artist Day-Of Instructions
- Vendor Day-Of Load-In Info

## Filter Criteria

Many emails use `filter_criteria` to target specific groups:

### Category Filtering
```json
{"vendor_category": ["Artists"]}
{"vendor_category": ["Vendors"]}
```

### Payment Status Filtering
```json
{"vendor_category": ["Artists"], "payment_status": ["pending", "overdue"]}
{"vendor_category": ["Vendors"], "payment_status": ["paid"]}
```

## Variables Used

All emails use the existing variable system defined in `EmailVariableResolver`:

### Event Variables
- `[eventName]` - Event title
- `[eventDate]` - Formatted event date
- `[eventTime]` - Event time
- `[eventLocation]` - Event location/address
- `[eventVenue]` - Event venue name
- `[eventCity]` - City extracted from location
- `[organizationName]` - Organization name

### Registration Variables
- `[greetingName]` - Business name or first name
- `[firstName]` - Vendor first name
- `[fullName]` - Vendor full name
- `[businessName]` - Business name
- `[vendorCategory]` - Vendor category (Artists, Vendors, etc.)

### Vendor Application Variables
- `[boothPrice]` - Booth/space fee
- `[installDate]` - Installation date
- `[installTime]` - Installation time range
- `[categoryList]` - Bulleted list of vendor categories
- `[categoryPaymentLink]` - Payment link for the category

### Special Variables
- `[eventLink]` - Public event page URL
- `[dashboardLink]` - Event-specific vendor portal URL

## New Trigger Types

This template uses three new trigger types that were added to support the Pancake & Booze workflow:

1. **`on_payment_received`** - Triggered when a vendor completes payment
2. **`on_waitlist`** - Triggered when an applicant is placed on the waitlist
3. **`on_rejection`** - Triggered when an application is rejected

These have been added to the `EmailTemplateItem` model validation.

## Notes

- All emails have `enabled_by_default: true`
- The template is created as `template_type: "system"` and `is_default: false`
- Email bodies preserve line breaks and formatting for readability
- Subject lines avoid excessive variables to prevent display issues
- HTML formatting has been removed (per customer instructions)

## Verification

After running the script, verify in the Rails console:
```ruby
template = EmailCampaignTemplate.find_by(name: "Pancake & Booze Event Campaign")
puts "Total emails: #{template.email_template_items.count}"
puts "Categories: #{template.email_template_items.pluck(:category).uniq.sort}"
```

Expected output:
- Total emails: 30
- Categories: application, event_day, payment, pre_application, pre_event, system
