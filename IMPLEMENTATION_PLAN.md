# Implementation Plan: Category-Specific Application Links

**Feature Branch:** `feature/email-preview-improvements`
**Target Launch:** Pancakes & Booze Pilot (Granby, CO)
**Timeline:** Tonight (February 5, 2026)
**Estimated Time:** 2 hours 40 minutes

---

## 🎯 P0 Requirements

- [x] Embed guest info into email links (pre-populate application screen)
- [x] Direct links to category-specific applications (artist/vendor screens)
- [x] Hyperlink styling on application links (clean text, no raw URLs)
- [x] Fix duplicate footers on application received emails *(completed in staging)*
- [ ] Updated invitation email copy
- [ ] Remove payment details from main application page
- [ ] Remove application description from page
- [ ] Exclude unsubscribe list from sends

---

## 📋 Task Breakdown

### BACKEND TASKS (Rails - This Repo)

#### Task 1: Add Category-Specific URL Methods to EventInvitation Model
**File:** `app/models/event_invitation.rb`
**Estimated Time:** 15 minutes
**Status:** ❌ To Do

**Implementation:**
```ruby
# Generate category-specific application URL with pre-fill token
def vendor_application_url(vendor_application, base_url = nil)
  base_url ||= presents_frontend_url
  "#{base_url}/events/#{event.slug}/#{vendor_application.id}/apply?token=#{invitation_token}"
end

# Get all vendor application links for email display
def vendor_application_links(base_url = nil)
  event.vendor_applications.active.map do |vendor_app|
    {
      id: vendor_app.id,
      name: vendor_app.name,
      description: vendor_app.description,
      url: vendor_application_url(vendor_app, base_url)
    }
  end
end
```

---

#### Task 2: Create Pre-Fill Token Decoding Endpoint
**Files:**
- `config/routes.rb`
- `app/controllers/api/v1/presents/event_invitations_controller.rb`

**Estimated Time:** 20 minutes
**Status:** ❌ To Do

**Route to add:**
```ruby
# config/routes.rb (in presents namespace)
get 'event_invitations/prefill/:token', to: 'event_invitations#prefill'
```

**Controller action:**
```ruby
# GET /api/v1/presents/event_invitations/prefill/:token
def prefill
  invitation = EventInvitation.find_by!(invitation_token: params[:token])
  vendor_contact = invitation.vendor_contact

  # Parse name into first/last
  name_parts = (vendor_contact.name || "").split(" ", 2)

  render json: {
    email: vendor_contact.email,
    first_name: name_parts[0] || "",
    last_name: name_parts[1] || "",
    business_name: vendor_contact.business_name
  }
rescue ActiveRecord::RecordNotFound
  render json: { error: "Invalid invitation token" }, status: :not_found
end
```

---

#### Task 3: Update Email Invitation Mailer
**File:** `app/mailers/event_invitation_mailer.rb`
**Estimated Time:** 5 minutes
**Status:** ❌ To Do

**Change:**
Add `@vendor_applications = @event.vendor_applications.active` to the `invitation_email` method.

---

#### Task 4: Update Email Template with Category Links
**File:** `app/views/event_invitation_mailer/invitation_email.html.erb`
**Estimated Time:** 15 minutes
**Status:** ❌ To Do

**Replace:**
```html
<p>Submit your work here:<br/>
<a href="<%= @invitation_url %>" class="link"><%= @invitation_url %></a></p>
```

**With:**
```html
<p>Submit your work below:</p>

<% @invitation.vendor_application_links.each do |app_link| %>
  <p><strong><%= app_link[:name] %></strong> - <a href="<%= app_link[:url] %>" class="link">Apply Here</a></p>
<% end %>
```

**Custom Copy for Pancakes & Booze:**
```html
<p>For those of you exhibiting artwork on the walls (paintings, sculptures, photography, body painters, etc): <strong>ARTIST/GALLERY SUBMISSIONS</strong> - <a href="<%= artist_link_url %>" class="link">Apply Here</a></p>

<p>For those setting up a TABLE space (ie: clothing, jewelry, and other table merch): <strong>VENDOR/TABLE SUBMISSIONS</strong> - <a href="<%= vendor_link_url %>" class="link">Apply Here</a></p>
```

---

#### Task 5: Update Email Copy via Rake Task
**File:** `lib/tasks/update_email_templates_pilot.rake`
**Estimated Time:** 30 minutes
**Status:** ❌ To Do

**Templates to update:**

1. **Initial Invitation Email:**
   - Subject: `[eventName] is coming in Granby, CO`
   - Body: Custom copy with category-specific links

2. **Application Received Email:**
   - Subject: `Application Received - [eventName]`
   - Body: Updated with pricing, installation, and guidelines

3. **Footer Update (ALL emails):**
   ```
   Questions? Reply to this email or contact team@voxxypresents.com directly.

   [unsubscribeLink]

   Powered by Voxxy Presents
   ```

---

#### Task 6: Test Backend Changes
**Estimated Time:** 15 minutes
**Status:** ❌ To Do

**Test Script:**
```ruby
# Rails console
invitation = EventInvitation.last

# Test URL generation
links = invitation.vendor_application_links
puts links.inspect

# Test pre-fill endpoint (use curl or Postman)
token = invitation.invitation_token
# GET http://localhost:3000/api/v1/presents/event_invitations/prefill/{token}
```

---

### FRONTEND TASKS (voxxy-presents-client - Separate Repo)

#### Task 7: Handle Pre-Fill Token on Apply Page
**Estimated Time:** 30 minutes
**Status:** ❌ To Do

**Location:** Application form component

**Implementation:**
```javascript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token) {
    fetch(`/api/v1/presents/event_invitations/prefill/${token}`)
      .then(res => res.json())
      .then(data => {
        setEmail(data.email);
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setBusinessName(data.business_name);
      })
      .catch(err => console.error('Failed to prefill form:', err));
  }
}, []);
```

---

#### Task 8: Remove Payment/Booth Price from UI
**Estimated Time:** 20 minutes
**Status:** ❌ To Do

**Changes:**
- Hide `booth_price` field from event detail page
- Hide `booth_price` from application form display
- Make `booth_price` optional (not required) in event creation
- Keep field in database for internal tracking

---

#### Task 9: Remove Application Description from Page
**Estimated Time:** 10 minutes
**Status:** ❌ To Do

**Changes:**
- Hide `event.description` from application page
- Keep in database, just don't render in UI

---

### MANUAL TASKS

#### Task 10: Process Unsubscribe List
**Estimated Time:** 5 minutes (when list is received)
**Status:** ⏳ Waiting on Customer

**Script:**
```ruby
# Rails console (run when list is provided)
unsubscribe_emails = [
  "email1@example.com",
  "email2@example.com"
  # ... from customer
]

organization_id = Organization.find_by(name: "Pancakes & Booze").id
VendorContact.where(email: unsubscribe_emails, organization_id: organization_id).destroy_all
```

---

## ⏰ Timeline

| Time | Task | Duration |
|------|------|----------|
| **Start** | Begin backend work | - |
| +15 min | Task 1: EventInvitation methods | 15 min |
| +35 min | Task 2: Pre-fill endpoint | 20 min |
| +40 min | Task 3: Update mailer | 5 min |
| +55 min | Task 4: Update email template | 15 min |
| +1h 25m | Task 5: Update email copy | 30 min |
| +1h 40m | Task 6: Test backend | 15 min |
| **Backend Complete** | Push to staging | - |
| +2h 10m | Task 7: Frontend pre-fill (parallel) | 30 min |
| +2h 30m | Task 8: Hide payment fields (parallel) | 20 min |
| +2h 40m | Task 9: Hide description (parallel) | 10 min |
| **Frontend Complete** | Push to staging | - |
| +3h 10m | End-to-end testing | 30 min |
| **Ready for Production** | Deploy | - |

---

## 🚀 Deployment Steps

### Step 1: Backend Deployment to Staging
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add category-specific application links with pre-fill tokens

- Add vendor_application_url() and vendor_application_links() to EventInvitation
- Create prefill endpoint for token-based contact data retrieval
- Update invitation email template with hyperlinked category options
- Update email copy for Pancakes & Booze pilot
- Remove raw URLs, replace with clean clickable text

Supports P0 launch requirements for pilot customer"

# Push to remote
git push -u origin feature/email-preview-improvements
```

### Step 2: Create Pull Request to Staging
1. Go to GitHub repository
2. Create PR: `feature/email-preview-improvements` → `staging`
3. Add description with P0 checklist
4. Request review
5. Merge after approval

### Step 3: Deploy to Staging Environment
1. Render.com auto-deploys staging branch
2. Monitor deployment logs
3. Run manual smoke tests

### Step 4: Testing on Staging
```bash
# Send test invitation
rails console
> event = Event.find_by(slug: 'test-event')
> contact = VendorContact.first
> invitation = EventInvitation.create!(event: event, vendor_contact: contact)
> EventInvitationMailer.invitation_email(invitation).deliver_now

# Check email for:
# - Hyperlinked category text (not raw URLs)
# - Multiple category options
# - Clean footer formatting

# Test pre-fill:
# - Click category link in email
# - Verify ?token= parameter in URL
# - Verify form fields populate
```

### Step 5: Production Deployment
1. Test thoroughly on staging
2. Create PR: `staging` → `main`
3. Merge after final review
4. Monitor production deployment
5. Send real invitation to test vendor
6. Verify delivery in SendGrid dashboard

---

## ✅ Acceptance Criteria

### Backend
- [x] EventInvitation model has `vendor_application_url()` method
- [x] EventInvitation model has `vendor_application_links()` method
- [x] Pre-fill endpoint returns contact data for valid tokens
- [x] Pre-fill endpoint returns 404 for invalid tokens
- [x] Email mailer passes vendor applications to template
- [x] Email template loops through categories
- [x] Email displays hyperlinked text (not raw URLs)
- [x] Email copy matches customer requirements

### Frontend
- [ ] Form detects `?token=` parameter
- [ ] Form calls pre-fill endpoint
- [ ] Form populates email, first_name, last_name, business_name
- [ ] Payment/booth price hidden from UI
- [ ] Event description hidden from application page
- [ ] All features work without breaking existing flows

### Testing
- [ ] Backend tests pass
- [ ] Manual testing complete
- [ ] Email preview looks correct
- [ ] End-to-end flow works
- [ ] No errors in logs

---

## 🔧 Rollback Plan

If issues occur in production:

1. **Quick Fix:** Revert email template to show single invitation link
2. **Full Rollback:** `git revert` commit and redeploy
3. **Data Safety:** No migrations, so rollback is safe

---

## 📞 Support Contacts

- **Developer:** Team via GitHub Issues
- **Customer:** Pancakes & Booze organizer
- **Email Support:** team@voxxypresents.com

---

**Status:** Ready to Begin
**Next Step:** Start Task 1 (Add URL methods to EventInvitation model)
