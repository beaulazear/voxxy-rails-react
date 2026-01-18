# Admin Email Testing Panel - Implementation Proposal

## Overview

Create a comprehensive admin panel for testing all 21 Voxxy Presents emails with one click.

---

## Current State Analysis

### Existing Testing Infrastructure

**RSpec Tests (Primary):**
- ✅ `spec/` directory with 50+ test files
- ✅ Factories for all models (FactoryBot)
- ✅ Service tests for email services
- ✅ Integration tests for workflows

**Mailer Previews (Rails Built-in):**
- ✅ `test/mailers/previews/event_invitation_mailer_preview.rb`
- ✅ Accessible at: `http://localhost:3000/rails/mailers`
- ⚠️ Only covers 5 invitation emails (not all 21)

**Standalone Test Scripts (Root Directory):**
- `test_email_automation_complete.rb` (16KB)
- `test_email_notifications.rb` (4KB)
- `test_email_invitation.rb` (2KB)
- `interactive_email_tests.rb` (6KB)
- ⚠️ Require manual execution via `rails runner`

**Admin Panel (Existing):**
- ✅ Basic admin namespace at `/admin/*`
- ✅ Moderation tools, reports, user management
- ✅ Sidekiq web UI at `/sidekiq`
- ❌ No email testing functionality

---

## Proposed Solution: Admin Email Testing Dashboard

### Architecture

```
/admin/emails
  ├── GET  /admin/emails              → Email testing dashboard (HTML)
  ├── POST /admin/emails/send_all     → Send all 21 emails to test inbox
  ├── POST /admin/emails/send/:type   → Send specific email type
  └── GET  /admin/emails/preview/:id  → Preview email HTML
```

### Features

1. **Email Gallery Dashboard**
   - Visual cards for all 21 emails grouped by category
   - Preview thumbnails or sample subjects
   - Status indicators (ready to send, needs data, etc.)

2. **One-Click Testing**
   - "Send All to My Inbox" button
   - Sends all 21 emails in sequence
   - Shows progress with real-time updates
   - Email address configurable (defaults to current admin email)

3. **Individual Email Testing**
   - Each email has its own "Send Test" button
   - Uses sample data or creates test records
   - Shows last sent timestamp

4. **Sample Data Management**
   - Auto-generates required test data (events, registrations, etc.)
   - Reusable test data marked with "TEST_" prefix
   - Cleanup utility to remove test data

5. **Email Preview**
   - View rendered HTML before sending
   - Variable substitution preview
   - Mobile/desktop viewport toggle

---

## Implementation Details

### Files to Create

1. **Controller:**
   ```
   app/controllers/admin/emails_controller.rb
   ```

2. **Views:**
   ```
   app/views/admin/emails/
     ├── index.html.erb       (Main dashboard)
     ├── _email_card.html.erb (Email card partial)
     └── preview.html.erb     (Email preview)
   ```

3. **Service:**
   ```
   app/services/admin/email_test_service.rb
   ```

4. **Helper:**
   ```
   app/helpers/admin/emails_helper.rb
   ```

### Route Addition

```ruby
# config/routes.rb
namespace :admin do
  # ... existing admin routes ...

  namespace :emails do
    get "/", to: "emails#index", as: :root
    post "/send_all", to: "emails#send_all"
    post "/send/:email_type", to: "emails#send_one"
    get "/preview/:email_type", to: "emails#preview"
    post "/setup_test_data", to: "emails#setup_test_data"
    delete "/cleanup_test_data", to: "emails#cleanup_test_data"
  end
end
```

### Email Categories

**Category A: Scheduled Automated (7 emails)**
- 1 Day Before Application Deadline
- Application Deadline Day
- 1 Day Before Payment Due
- Payment Due Today
- 1 Day Before Event
- Day of Event
- Day After Event

**Category B: Vendor Application (4 emails)**
- Application Confirmation
- Application Approved
- Application Rejected
- Moved to Waitlist

**Category C: Event Invitation (5 emails)**
- Vendor Invitation
- Invitation Accepted (Vendor)
- Invitation Accepted (Producer)
- Invitation Declined (Vendor)
- Invitation Declined (Producer)

**Category D: Admin/Producer (5 emails)**
- New Vendor Submission Notification
- Payment Confirmed
- Category Changed
- Event Details Changed (Bulk)
- Event Canceled (Bulk)

---

## User Flow

### Primary Use Case: Test All Emails

1. Admin navigates to `/admin/emails`
2. Sees dashboard with 21 email cards organized by category
3. Enters test email address (defaults to admin's email)
4. Clicks "Send All 21 Emails to Inbox"
5. System:
   - Creates/reuses test data (test event, test vendor, etc.)
   - Sends each email in sequence
   - Shows progress (5/21 sent...)
   - Displays success/error for each email
6. Admin checks inbox - receives all 21 emails within 1-2 minutes
7. Reviews emails for styling, content, and deliverability

### Alternative: Test Individual Email

1. Admin navigates to `/admin/emails`
2. Finds specific email card (e.g., "Application Approved")
3. Clicks "Preview" to see HTML
4. Clicks "Send Test" to receive in inbox
5. Verifies that specific email

---

## Technical Implementation

### Sample Test Data Creation

```ruby
# app/services/admin/email_test_service.rb
class Admin::EmailTestService
  def self.setup_test_data
    # Create test user (producer)
    user = User.find_or_create_by!(email: "test.producer@voxxypresents.com") do |u|
      u.name = "Test Producer"
      u.password = SecureRandom.hex(16)
      u.role = "venue_owner"
      u.confirmed_at = Time.current
      u.product_context = "presents"
    end

    # Create test organization
    org = Organization.find_or_create_by!(name: "TEST - Sample Venue", user: user) do |o|
      o.description = "Test organization for email testing"
      o.email = "venue@voxxypresents.com"
      o.city = "Raleigh"
      o.state = "NC"
    end

    # Create test event
    event = Event.find_or_create_by!(
      title: "TEST - Summer Market 2026",
      organization: org
    ) do |e|
      e.description = "Test event for email testing"
      e.event_date = 1.month.from_now
      e.application_deadline = 1.week.from_now
      e.payment_deadline = 3.weeks.from_now
      e.venue = "Downtown Art Gallery"
      e.location = "Raleigh, NC"
      e.published = true
    end

    # Create test vendor application
    vendor_app = VendorApplication.find_or_create_by!(
      event: event,
      name: "Vendor Application Form"
    ) do |va|
      va.categories = ["Food", "Art", "Entertainment"]
      va.booth_price = 150.00
      va.status = "active"
    end

    # Create test registration
    registration = Registration.find_or_create_by!(
      email: "test.vendor@voxxypresents.com",
      event: event
    ) do |r|
      r.name = "Test Vendor"
      r.business_name = "Test Artisan Goods"
      r.vendor_category = "Art"
      r.status = "pending"
      r.payment_status = "pending"
      r.vendor_application = vendor_app
    end

    # Create test vendor contact
    vendor_contact = VendorContact.find_or_create_by!(
      email: "contact.vendor@voxxypresents.com",
      organization: org
    ) do |vc|
      vc.contact_name = "Test Contact"
      vc.business_name = "Test Business"
      vc.contact_type = "vendor"
      vc.status = "active"
    end

    # Create test invitation
    invitation = EventInvitation.find_or_create_by!(
      event: event,
      vendor_contact: vendor_contact
    ) do |inv|
      inv.status = "pending"
    end

    {
      user: user,
      organization: org,
      event: event,
      vendor_application: vendor_app,
      registration: registration,
      vendor_contact: vendor_contact,
      invitation: invitation
    }
  end
end
```

### Email Sending Logic

```ruby
def send_all_emails(recipient_email)
  test_data = Admin::EmailTestService.setup_test_data
  results = []

  # Category A: Scheduled Emails (using EmailVariableResolver)
  # Note: These use template variables [eventName], etc.
  # We'll send them directly with resolved variables

  # Category B: Vendor Application Emails
  results << send_email("Application Confirmation") do
    RegistrationEmailService.send_confirmation(test_data[:registration])
  end

  results << send_email("Application Approved") do
    test_data[:registration].update!(status: "approved")
    RegistrationEmailService.send_approval_email(test_data[:registration])
  end

  # ... send all 21 emails ...

  results
end

def send_email(name)
  begin
    yield
    { name: name, status: "sent", timestamp: Time.current }
  rescue => e
    { name: name, status: "failed", error: e.message }
  end
end
```

---

## UI Mockup (Dashboard)

```
╔═══════════════════════════════════════════════════════════╗
║  Admin Email Testing Dashboard                            ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Test Email Address: [admin@example.com       ] [Change] ║
║                                                           ║
║  [📧 Send All 21 Emails to Inbox]  [⚙️ Setup Test Data]  ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  📨 Scheduled Automated Emails (7)                        ║
║  ┌─────────────────────────────────────────────────┐     ║
║  │ 1 Day Before Application Deadline               │     ║
║  │ Last sent: Never                                │     ║
║  │ [Preview] [Send Test]                           │     ║
║  └─────────────────────────────────────────────────┘     ║
║  ┌─────────────────────────────────────────────────┐     ║
║  │ Application Deadline Day                        │     ║
║  │ Last sent: 2 hours ago                          │     ║
║  │ [Preview] [Send Test]                           │     ║
║  └─────────────────────────────────────────────────┘     ║
║  ... (5 more)                                             ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  ✉️ Vendor Application Emails (4)                         ║
║  ┌─────────────────────────────────────────────────┐     ║
║  │ Application Confirmation                        │     ║
║  │ Subject: Application Received - Summer Market   │     ║
║  │ [Preview] [Send Test]                           │     ║
║  └─────────────────────────────────────────────────┘     ║
║  ... (3 more)                                             ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  📩 Event Invitation Emails (5)                           ║
║  ... (email cards)                                        ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  📢 Admin/Producer Notification Emails (5)                ║
║  ... (email cards)                                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Benefits

### For Development
- ✅ Test all emails with realistic data instantly
- ✅ Visual verification of styling changes
- ✅ No need to run separate scripts
- ✅ Test scheduled emails without waiting for triggers

### For QA
- ✅ Comprehensive email testing checklist
- ✅ Verify all emails before deployment
- ✅ Test across different email clients
- ✅ Document email catalog

### For Production
- ✅ Verify email deliverability in production
- ✅ Test SendGrid integration
- ✅ Check spam scores with real sending
- ✅ Admin-only access (secure)

---

## Alternative: Extend Mailer Previews (Simpler but Limited)

Instead of a full admin panel, you could extend the existing mailer preview system:

**Pros:**
- ✅ Uses built-in Rails functionality
- ✅ No new controllers/routes needed
- ✅ Works great for development

**Cons:**
- ❌ Only previews HTML (doesn't send to inbox)
- ❌ Can't test "send all at once"
- ❌ No real email delivery testing
- ❌ Awkward URL structure (`/rails/mailers/...`)

**My recommendation:** Admin panel is better for your use case since you want to test deliverability and receive emails in your inbox.

---

## Next Steps

1. **Decision Point:** Confirm you want the admin panel approach
2. **Implementation:** I can build the complete system (controller, views, service)
3. **Testing:** Test locally first, then deploy to staging
4. **Documentation:** Update email docs with testing instructions

---

## Estimated Implementation Time

- Controller + Service: 2 hours
- Views (HTML/CSS): 2 hours
- Testing & Refinement: 1 hour
- **Total: ~5 hours**

---

## Questions to Consider

1. **Email Address:** Should test emails go to a specific address or current admin's email?
2. **Test Data:** Should test data persist or be cleaned up after sending?
3. **Rate Limiting:** Should there be a delay between sending all 21 emails?
4. **Access Control:** Should this be admin-only or available to all venue owners?

---

**Ready to implement?** Let me know and I'll build the complete admin email testing panel for you!
