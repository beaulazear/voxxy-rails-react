# Pancake & Booze Email Sequence - Variable Mapping Analysis

## Current System Variables (Available)

### Event Variables (from EmailVariableResolver)
- `[eventName]` - Event title
- `[eventDate]` - Formatted event date (e.g., "Monday, January 15, 2024")
- `[dateRange]` - Date range for multi-day events
- `[eventTime]` - Event start time
- `[eventCity]` - City extracted from location
- `[eventLocation]` - Full location/address
- `[eventVenue]` - Venue name
- `[eventDescription]` - Event description
- `[applicationDeadline]` - Application deadline date
- `[paymentDueDate]` - Payment due date
- `[organizationName]` - Organization name
- `[organizationEmail]` - Organization contact email
- `[ageRestriction]` - Event age restriction

### Vendor/Registration Variables (from EmailVariableResolver)
- `[greetingName]` - Business name or first name (smart fallback)
- `[firstName]` - Vendor first name
- `[lastName]` - Vendor last name
- `[fullName]` - Vendor full name
- `[businessName]` - Business name
- `[email]` - Vendor email
- `[vendorCategory]` - Vendor category (e.g., "Artists", "Vendors")
- `[boothNumber]` - Assigned booth number
- `[applicationDate]` - Date application was submitted
- `[boothPrice]` - Booth/space fee from vendor application
- `[installDate]` - Installation date from vendor application
- `[installTime]` - Installation time range from vendor application
- `[categoryList]` - Bulleted list of vendor categories
- `[categoryPaymentLink]` - Payment link for vendor category

### Special Variables
- `[unsubscribeLink]` - Unsubscribe URL
- `[eventLink]` - Public event page URL
- `[bulletinLink]` - Public event bulletin page (same as eventLink)
- `[dashboardLink]` - Event-specific vendor portal URL
- `[invitationLink]` - Same as eventLink

## Pancake & Booze Variables → System Variable Mapping

### ✅ Direct Mappings (Already Supported)

| P&B Variable | System Variable | Notes |
|--------------|----------------|-------|
| `%recipient_fname%` | `[firstName]` | Extracted from registration name |
| `%city%` | `[eventCity]` | Extracted from location field |
| `%venue%` | `[eventVenue]` | Direct match |
| `%date%` | `[eventDate]` | Formatted date |
| `%date_range%` | `[dateRange]` | Multi-day support |
| `%event_time%` | `[eventTime]` | Event start time |
| `%address%` | `[eventLocation]` | Full location string |
| `%age%` | `[ageRestriction]` | Age restriction |

### ⚠️ Category-Specific Variables (Need Special Handling)

These variables have different values based on vendor category (Artists vs Vendors):

| P&B Variable | Category | System Approach | Implementation |
|--------------|----------|----------------|----------------|
| `%call_artists%` | Artists | Use `[eventLink]` | Link to event page with application |
| `%call_vendors%` | Vendors | Use `[eventLink]` | Link to event page with application |
| `%artists_price%` | Artists | Use `[boothPrice]` | From vendor_applications table where name='Artists' |
| `%vendors_price%` | Vendors | Use `[boothPrice]` | From vendor_applications table where name='Vendors' |
| `%artists_details%` | Artists | Static text | Hardcode in email template |
| `%artists_install_date%` | Artists | Use `[installDate]` | From vendor_applications where name='Artists' |
| `%artists_install_time%` | Artists | Use `[installTime]` | From vendor_applications where name='Artists' |
| `%vendors_install_time%` | Vendors | Use `[installTime]` | From vendor_applications where name='Vendors' |
| `%vendors_install_date%` | Vendors | Use `[installDate]` | From vendor_applications where name='Vendors' |
| `%payment_link%` | Both | Use `[categoryPaymentLink]` | From vendor_application.payment_link |

### ❌ Missing Variables (Need New Implementation or Hardcoding)

| P&B Variable | Replacement Strategy | Notes |
|--------------|---------------------|-------|
| N/A | `[organizationName]` will be "Pancake & Booze" | Set in organization record |

## Email Sequence Structure Comparison

### Current Default System
- **7 emails total**
- **Categories**: event_announcements (2), payment_reminders (2), event_countdown (3)
- **Trigger types**:
  - days_before_deadline (1 day, 0 days)
  - days_before_payment_deadline (1 day)
  - on_payment_deadline (0 days)
  - days_before_event (1 day)
  - on_event_date (0 days)
  - days_after_event (1 day)
- **Filter criteria**: Uses JSONB field with `statuses` and `payment_status` arrays
- **Category filtering**: Not used (all emails go to all vendors)

### Pancake & Booze Requirements
- **27+ emails total** (varies by category)
- **Categories**: ALL emails are category-specific (Artists vs Vendors)
- **New trigger types needed**:
  - `days_before_event` with multiple values (70, 56, 28, 12 days for announcements)
  - `days_before_payment_deadline` with multiple artist values (39, 26, 16, 8, 4, 1 days)
  - `days_before_payment_deadline` with multiple vendor values (29, 15, 9, 3 days)
  - `days_before_event` for countdowns (17, 11, 3, 0 days for artists)
  - `days_before_event` for countdowns (12, 7, 3, 0 days for vendors)
  - `on_application_submit` (immediate)
  - `on_approval` (immediate)
- **Category field usage**: CRITICAL - every email must specify category="Artists" or category="Vendors"
- **Filter criteria**: Need to filter by approval status, payment status

## Implementation Strategy

### 1. Use Existing Schema ✅
- No database changes needed
- `category` field on email_template_items supports filtering by vendor type
- `filter_criteria` JSONB supports complex rules
- `trigger_type` and `trigger_value` support all timing needs

### 2. Category-Based Email Variants
Each email will have TWO versions (one for Artists, one for Vendors):
```ruby
# Example: Application Accepted email
create_email(template, {
  name: 'Application Accepted - Artists',
  category: 'Artists',  # This filters to only Artists
  subject_template: '...',
  body_template: '...with %artists_price%, %artists_install_time%, etc...',
  trigger_type: 'on_approval'
})

create_email(template, {
  name: 'Application Accepted - Vendors',
  category: 'Vendors',  # This filters to only Vendors
  subject_template: '...',
  body_template: '...with %vendors_price%, %vendors_install_time%, etc...',
  trigger_type: 'on_approval'
})
```

### 3. Variable Substitution
Create custom variable resolver for Pancake & Booze that maps their variables to system variables:

```ruby
class PancakeAndBoozeVariableResolver < EmailVariableResolver
  def resolve(template)
    # First do standard resolution
    resolved = super(template)

    # Then map P&B specific variables
    resolved = resolved
      .gsub('%recipient_fname%', '[firstName]')
      .gsub('%city%', '[eventCity]')
      .gsub('%venue%', '[eventVenue]')
      .gsub('%date%', '[eventDate]')
      .gsub('%date_range%', '[dateRange]')
      .gsub('%event_time%', '[eventTime]')
      .gsub('%address%', '[eventLocation]')
      .gsub('%age%', '[ageRestriction]')
      .gsub('%call_artists%', '[eventLink]')
      .gsub('%call_vendors%', '[eventLink]')
      .gsub('%artists_price%', '[boothPrice]')
      .gsub('%vendors_price%', '[boothPrice]')
      .gsub('%artists_install_date%', '[installDate]')
      .gsub('%artists_install_time%', '[installTime]')
      .gsub('%vendors_install_date%', '[installDate]')
      .gsub('%vendors_install_time%', '[installTime]')
      .gsub('%payment_link%', '[categoryPaymentLink]')

    # Now resolve the standard variables
    super(resolved)
  end
end
```

Actually, BETTER approach: Store P&B variables directly in templates, then resolve them at send time. This keeps templates cleaner and more readable.

## Email Breakdown by Category

### Emails for BOTH Categories (4 emails x 2 = 8 total)

1. **Event Announcement - 10 weeks out**
   - Trigger: 70 days_before_event
   - Category: Artists, Vendors (separate emails)

2. **Event Announcement - 8 weeks out**
   - Trigger: 56 days_before_event
   - Category: Artists, Vendors (separate emails)

3. **Event Announcement - 4 weeks out**
   - Trigger: 28 days_before_event
   - Category: Artists, Vendors (separate emails)

4. **Event Announcement - 12 days out**
   - Trigger: 12 days_before_event (already used for countdown, use position to differentiate)
   - Category: Artists, Vendors (separate emails)

### Emails for ARTISTS Only (14 emails)

5. **Application Received - Artists**
   - Trigger: on_application_submit
   - Category: Artists

6. **Application Accepted - Artists**
   - Trigger: on_approval
   - Category: Artists

7-12. **Payment Reminders - Artists** (6 emails)
   - 39, 26, 16, 8, 4, 1 days before payment deadline
   - Category: Artists

13. **Payment Confirmation - Artists**
   - Trigger: on_payment_confirmation (or check payment_status = 'paid')
   - Category: Artists

14-17. **Event Countdown - Artists** (4 emails)
   - 17, 11, 3 days before event + day of event
   - Category: Artists

### Emails for VENDORS Only (11 emails)

18. **Application Received - Vendors**
   - Trigger: on_application_submit
   - Category: Vendors

19. **Application Accepted - Vendors**
   - Trigger: on_approval
   - Category: Vendors

20-25. **Payment Reminders - Vendors** (6 emails)
   - 29, 15, 9, 3 days before payment deadline
   - Category: Vendors

26. **Payment Confirmation - Vendors**
   - Trigger: on_payment_confirmation
   - Category: Vendors

27-30. **Event Countdown - Vendors** (4 emails)
   - 12, 7, 3 days before event + day of event (morning)
   - Category: Vendors

### TOTAL: 8 + 14 + 11 = 33 emails

## Next Steps

1. ✅ Complete variable mapping analysis
2. Create Ruby seed script to generate all 33 email template items
3. Test with sample event and registrations
4. Add UI to select "Pancake & Booze Campaign" when creating event
5. Verify category filtering works correctly
6. Test variable substitution with real data
