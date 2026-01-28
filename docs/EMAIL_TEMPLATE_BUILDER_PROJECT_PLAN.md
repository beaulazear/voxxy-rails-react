# Email Template Builder - Project Plan

**Version:** 1.0
**Date:** January 25, 2026
**Status:** Planning Phase
**Stakeholders:** Product Owner, Technical Lead, Engineering Team

---

## Executive Summary

We are building a visual email template builder that allows event producers to create, customize, and manage automated email sequences for their events. This project leverages our existing email automation infrastructure (built in January 2026) and adds a user-facing interface for template management.

**Timeline:** 6-8 weeks
**Risk Level:** Low-Medium
**Backend Changes Required:** Minimal (template content updates only)
**Frontend Work:** New UI components and screens

---

## 1. Business Context & Goals

### Why We're Doing This

**Current State:**
- All organizations use a single system-wide default email template (7 emails)
- Email content can only be customized by editing raw HTML in scheduled emails
- No way for users to create reusable custom templates
- Template updates require engineer intervention

**Problems This Solves:**
1. **No Customization at Scale** - Event producers can't create branded email sequences for different event types
2. **Poor User Experience** - Raw HTML editing is intimidating and error-prone
3. **Limited Flexibility** - Can't easily add/remove emails from sequences
4. **Maintenance Burden** - Engineers must update templates manually

### Success Metrics

- [ ] 80% of active organizations create at least 1 custom template within 30 days of launch
- [ ] 50% reduction in support tickets related to email customization
- [ ] Average time to create custom template < 15 minutes
- [ ] Zero data loss during migration/updates

---

## 2. What We Have Today (Backend Infrastructure)

Our email automation system is **production-ready** and supports all necessary features. Here's what's already built:

### Database Architecture ✅

| Model | Purpose | Key Features |
|-------|---------|--------------|
| **EmailCampaignTemplate** | Container for email sequences | System templates (shared) + User templates (org-owned) |
| **EmailTemplateItem** | Individual emails in sequence | Position ordering (1-40), trigger rules, filter criteria (JSONB) |
| **ScheduledEmail** | Event-specific email instances | Customizable overrides, status tracking |
| **EmailDelivery** | Individual send tracking | SendGrid webhook integration, delivery status |
| **EmailUnsubscribe** | Granular unsubscribe management | Event/org/global scopes |

**Schema Files:**
- [app/models/email_campaign_template.rb](app/models/email_campaign_template.rb)
- [app/models/email_template_item.rb](app/models/email_template_item.rb)
- [app/models/scheduled_email.rb](app/models/scheduled_email.rb)

### API Endpoints ✅

**Template Management:**
- `GET /api/v1/presents/organizations/:org_id/email_campaign_templates` - List templates
- `GET /api/v1/presents/organizations/:org_id/email_campaign_templates/:id` - Get template details
- `POST /api/v1/presents/organizations/:org_id/email_campaign_templates` - Create blank template
- `POST /api/v1/presents/organizations/:org_id/email_campaign_templates/:id/clone` - Clone template
- `PATCH /api/v1/presents/organizations/:org_id/email_campaign_templates/:id` - Update template
- `DELETE /api/v1/presents/organizations/:org_id/email_campaign_templates/:id` - Delete template

**Email Item Management:**
- `GET /api/v1/presents/email_campaign_templates/:template_id/email_template_items` - List emails
- `POST /api/v1/presents/email_campaign_templates/:template_id/email_template_items` - Add email
- `PATCH /api/v1/presents/email_template_items/:id` - Update email
- `DELETE /api/v1/presents/email_template_items/:id` - Delete email
- `POST /api/v1/presents/email_template_items/reorder` - Change position

**Event Email Management:**
- `GET /api/v1/presents/events/:event_id/scheduled_emails` - List event emails
- `PATCH /api/v1/presents/events/:event_id/scheduled_emails/:id` - Customize email
- `GET /api/v1/presents/events/:event_id/scheduled_emails/:id/preview` - Preview with variables

**Controllers:**
- [app/controllers/api/v1/presents/email_campaign_templates_controller.rb](app/controllers/api/v1/presents/email_campaign_templates_controller.rb) (136 lines)
- [app/controllers/api/v1/presents/email_template_items_controller.rb](app/controllers/api/v1/presents/email_template_items_controller.rb) (116 lines)
- [app/controllers/api/v1/presents/scheduled_emails_controller.rb](app/controllers/api/v1/presents/scheduled_emails_controller.rb) (316 lines)

### Services & Business Logic ✅

| Service | Purpose | Location |
|---------|---------|----------|
| **EmailScheduleCalculator** | Computes send times from trigger rules | [app/services/email_schedule_calculator.rb](app/services/email_schedule_calculator.rb) |
| **EmailVariableResolver** | Resolves [eventName] tokens in templates | [app/services/email_variable_resolver.rb](app/services/email_variable_resolver.rb) |
| **RecipientFilterService** | Applies filter criteria to registrations | [app/services/recipient_filter_service.rb](app/services/recipient_filter_service.rb) |
| **EmailCampaignTemplateCloner** | Clones templates with all items | [app/services/email_campaign_template_cloner.rb](app/services/email_campaign_template_cloner.rb) |
| **EmailSenderService** | Sends emails via SendGrid API | [app/services/email_sender_service.rb](app/services/email_sender_service.rb) |

### Background Workers ✅

- **EmailSenderWorker** - Sends scheduled emails every 5 minutes (Sidekiq cron)
- **EmailDeliveryProcessorJob** - Processes SendGrid webhooks (delivered, bounced, unsubscribed)
- **EmailRetryJob** - Retries soft bounces with exponential backoff

### Variable System ✅

**Available Template Variables** (from [EmailVariableResolver](app/services/email_variable_resolver.rb:8-35)):

**Event Variables:**
- `[eventName]`, `[eventDate]`, `[eventTime]`, `[eventLocation]`, `[eventVenue]`
- `[eventDescription]`, `[applicationDeadline]`, `[paymentDueDate]`
- `[organizationName]`, `[organizationEmail]`

**Vendor Variables:**
- `[firstName]`, `[lastName]`, `[fullName]`, `[businessName]`, `[email]`
- `[vendorCategory]`, `[boothNumber]`, `[applicationDate]`

**Special Links:**
- `[unsubscribeLink]`, `[eventLink]`, `[bulletinLink]`, `[dashboardLink]`

### Trigger Types ✅

Current trigger system supports:
- `days_before_event` - X days before event_date
- `days_after_event` - X days after event_date
- `days_before_deadline` - X days before application_deadline
- `on_event_date` - On the event_date at trigger_time
- `days_before_payment_deadline` - X days before payment_deadline
- `on_payment_deadline` - On payment_deadline at trigger_time
- `on_application_submit` - Immediate (callback-triggered)
- `on_approval` - Immediate (callback-triggered)

---

## 3. Current Default Template

**Template Name:** "Default Event Campaign"
**Type:** System (shared across all organizations)
**Email Count:** 7 emails
**Location:** [db/seeds/email_campaign_templates.rb](db/seeds/email_campaign_templates.rb)

### Current Email Sequence

| Position | Name | Category | Trigger | Recipients |
|----------|------|----------|---------|------------|
| 1 | 1 Day Before Application Deadline | event_announcements | 1 day before deadline, 9:00 AM | Pending vendors |
| 2 | Application Deadline Day | event_announcements | Deadline day, 8:00 AM | Pending vendors |
| 3 | 1 Day Before Payment Due | payment_reminders | 1 day before payment deadline, 9:00 AM | Approved vendors |
| 4 | Payment Due Today | payment_reminders | Payment deadline day, 8:00 AM | Approved vendors |
| 5 | 1 Day Before Event | event_countdowns | 1 day before event, 9:00 AM | All vendors |
| 6 | Day of Event | event_countdowns | Event day, 8:00 AM | All vendors |
| 7 | Day After Event - Thank You | event_countdowns | 1 day after event, 9:00 AM | All vendors |

---

## 4. Immediate Template Update Requirements

### Goal: Simplified Default Template

**Reduce from 7 emails to 6 emails** with clearer trigger logic:

| Position | Name | Trigger Type | Trigger Value | Time | Category | Recipients |
|----------|------|--------------|---------------|------|----------|------------|
| 1 | Day Before Application Deadline | days_before_deadline | 1 | 09:00 | event_announcements | Pending |
| 2 | Application Deadline Day | days_before_deadline | 0 | 08:00 | event_announcements | Pending |
| 3 | Day Before Payment Deadline | days_before_payment_deadline | 1 | 09:00 | payment_reminders | Approved |
| 4 | Payment Deadline Day | on_payment_deadline | - | 08:00 | payment_reminders | Approved |
| 5 | Day Before Event | days_before_event | 1 | 09:00 | event_countdowns | All |
| 6 | Event Day | on_event_date | - | 08:00 | event_countdowns | All |

**Removed:** "Day After Event - Thank You" (position 7) - can be added back by users who want it

### System Notification Emails (Auto-Triggered)

These are **separate from the template system** and are always sent:
- Application Received (on_application_submit)
- Payment Confirmed (on payment received via Eventbrite integration)
- Moved to Waitlist (on status change)
- Category Changed (on category change)
- Event Details Changed (on event update)
- Event Cancelled (on event cancellation)

**Location:** These are shown in the UI but are **not part of EmailCampaignTemplate** - they're hardcoded system emails.

### Implementation Plan for Template Update

**Step 1: Update Seed File**
- Edit [db/seeds/email_campaign_templates.rb](db/seeds/email_campaign_templates.rb)
- Replace all 7 email definitions with new 6-email sequence
- Update subject_template and body_template with new copy (provided by product owner)

**Step 2: Create Migration Script**
- Use rake task: [lib/tasks/update_default_email_template.rake](lib/tasks/update_default_email_template.rake)
- Update existing system template in production database
- Delete position 7 email
- Update positions 1-6 with new content

**Step 3: Testing**
- Test in staging with real event data
- Verify scheduled_for calculations are correct
- Check email preview rendering
- Confirm recipient filtering works

**Pending: New Email Copy**
- Product owner to provide final email text for all 6 emails
- Text should include subject lines and HTML body templates
- Must use existing variable syntax: `[eventName]`, `[firstName]`, etc.

---

## 5. What We Need to Build (Frontend)

### UI Screens (Designed, Ready for Implementation)

Based on provided mockups, we need to build:

#### Screen 1: Mail Tab - Template Library
**Route:** `/presents/mail/templates`

**Features:**
- List all available templates (system + org's custom)
- Show template metadata:
  - Name (e.g., "Default Template", "Short Sequence")
  - Type badge (System/Custom)
  - Email count
  - Last updated date
- "Create New Template" button → opens modal
- "Customize" button on each template → opens sequence editor

**API Integration:**
```javascript
GET /api/v1/presents/organizations/:org_id/email_campaign_templates
// Returns: Array of EmailCampaignTemplate objects
```

#### Screen 2: Template Import Modal
**Triggered by:** "Import Template" button in event creation flow

**Features:**
- "Create New Template" button (creates blank or clones)
- List of available templates to import:
  - Default Template (GREATEST badge)
  - Short Sequence (QUICK badge)
  - User's custom templates
- Description text for each template
- "No custom templates yet" empty state
- "Cancel" button

**API Integration:**
```javascript
// Clone template
POST /api/v1/presents/organizations/:org_id/email_campaign_templates/:id/clone
Body: { name: "New Template Name", description: "..." }

// Create blank
POST /api/v1/presents/organizations/:org_id/email_campaign_templates
Body: { name: "...", description: "..." }
```

#### Screen 3: Email Sequence Editor (Template Detail View)
**Route:** `/presents/mail/templates/:template_id`

**Features:**
- Header showing template name and email count (e.g., "18/30 emails")
- "Add Section" button (creates new category)
- "Save as Template" button (saves all changes)
- Grouped email sections by category:
  - Event Announcements (X/Y enabled)
  - Application Updates (X/Y enabled)
  - Payment Reminders (X/Y enabled)
  - Event Countdown (X/Y enabled)
- Each email item shows:
  - Name and trigger description (e.g., "Sent 1 day before applications close")
  - Subject line preview
  - Recipient filter (e.g., "All Vendors")
  - Enable/disable toggle
  - Edit button → opens email editor
  - Delete button
- "Add Email to [Category]" button at bottom of each section
- "Rename" and "Remove" buttons for each category
- Collapsible sections (accordion style)

**API Integration:**
```javascript
GET /api/v1/presents/email_campaign_templates/:template_id/email_template_items
// Returns: Array of EmailTemplateItem objects

POST /api/v1/presents/email_campaign_templates/:template_id/email_template_items
PATCH /api/v1/presents/email_template_items/:id
DELETE /api/v1/presents/email_template_items/:id
POST /api/v1/presents/email_template_items/reorder
```

#### Screen 4: Email Item Editor
**Route:** `/presents/mail/templates/:template_id/emails/:email_id/edit`

**Features:**

**Left Panel (Main Editor):**
- "Back" button
- Email name at top (e.g., "Immediate Announcement")
- "Preview" button
- "Save Email" button
- Subject Line input (text field with variable picker)
- Email Body textarea/rich text editor with variable picker

**Right Panel (Settings):**

**Tab 1: Details**
- **Trigger Settings**
  - "Send Trigger" dropdown:
    - Immediately (on application submit)
    - Immediately (on approval)
    - X days before event
    - X days after event
    - X days before application deadline
    - On application deadline
    - X days before payment deadline
    - On payment deadline
    - On event date
  - "Days" number input (conditional on trigger type)
  - "Time" time picker
- **Recipients**
  - Status multi-select (All Vendors / filter by status)
  - Category filter (if needed)
- **Used in this email** section
  - Shows variables currently in the template (e.g., firstName → [firstName])
- **Available tags** section
  - Clickable variable tokens grouped by category:
    - Event variables
    - Vendor variables
    - Special links
  - Click to insert at cursor position

**Tab 2: Components** (Future feature - not in MVP)

**API Integration:**
```javascript
GET /api/v1/presents/email_template_items/:id
PATCH /api/v1/presents/email_template_items/:id
Body: {
  subject_template: "...",
  body_template: "...",
  trigger_type: "days_before_event",
  trigger_value: 1,
  trigger_time: "09:00",
  filter_criteria: { statuses: ["approved"] }
}

// Preview
GET /api/v1/presents/events/:event_id/scheduled_emails/:id/preview?registration_id=123
```

#### Screen 5: Event Creation - Automation Tab
**Route:** `/presents/events/new` (step 4/5)

**Features:**
- Step indicator showing "Automation" step active
- "Automatic Messages" section header
- Template selector dropdown (e.g., "Short Sequence" selected)
- "Import Template" button → opens template import modal
- Expandable sections showing email groups:
  - Event Announcements (3/3 enabled)
  - Application Updates (1/1 enabled)
  - Payment Reminders (3/3 enabled)
  - Event Countdown (4/4 enabled)
- Each email shows:
  - Name and subject preview
  - Recipient filter (e.g., "All Vendors")
  - Enable toggle
  - Preview icon (eye)
- "Automatic System Emails" section (non-editable)
  - Shows auto-triggered emails (Application Received, Payment Confirmed, etc.)
  - Toggle to enable/disable individual system emails

**API Integration:**
```javascript
// Event already has email_campaign_template_id field
PATCH /api/v1/presents/events/:id
Body: { email_campaign_template_id: 123 }

// Scheduled emails are auto-generated via after_create callback
// Can be customized per event via ScheduledEmailsController
```

---

## 6. Implementation Phases

### Phase 0: Template Content Update (Week 1)
**Owner:** Product Owner + Engineer
**Effort:** 2-3 days

**Tasks:**
- [ ] Product owner provides final email copy for 6-email sequence
- [ ] Engineer updates seed file with new content
- [ ] Engineer updates rake task to migrate existing system template
- [ ] Test in staging environment
- [ ] Run migration in production
- [ ] Verify all existing events still have correct scheduled emails

**Deliverables:**
- Updated default template in production
- New seed file for future deployments

---

### Phase 1: Template Library & Management (Weeks 2-3)
**Owner:** Frontend Engineer
**Effort:** 1.5 weeks

**Tasks:**
- [ ] Build Mail tab navigation item
- [ ] Build template list view (Screen 1)
- [ ] Build "Create New Template" modal with clone functionality
- [ ] Integrate with existing API endpoints
- [ ] Add loading states and error handling
- [ ] Write frontend tests

**API Endpoints Used:**
- `GET /api/v1/presents/organizations/:org_id/email_campaign_templates`
- `POST /api/v1/presents/organizations/:org_id/email_campaign_templates/:id/clone`
- `DELETE /api/v1/presents/organizations/:org_id/email_campaign_templates/:id`

**Acceptance Criteria:**
- User can view all available templates
- User can clone system default template
- User can clone their own custom templates
- User can delete custom templates (not system templates)
- Loading states show during API calls
- Error messages display for failed operations

---

### Phase 2: Sequence Editor (Weeks 3-4)
**Owner:** Frontend Engineer
**Effort:** 1.5 weeks

**Tasks:**
- [ ] Build template detail view (Screen 3)
- [ ] Implement category grouping and collapsible sections
- [ ] Build "Add Email" functionality
- [ ] Implement enable/disable toggles
- [ ] Add edit/delete buttons (delete opens email editor, for now)
- [ ] Implement position reordering (drag-and-drop - optional in MVP)
- [ ] Add email count validation (max 40)
- [ ] Write frontend tests

**API Endpoints Used:**
- `GET /api/v1/presents/email_campaign_templates/:id`
- `GET /api/v1/presents/email_campaign_templates/:template_id/email_template_items`
- `POST /api/v1/presents/email_campaign_templates/:template_id/email_template_items`
- `DELETE /api/v1/presents/email_template_items/:id`
- `POST /api/v1/presents/email_template_items/reorder` (for drag-and-drop)

**Acceptance Criteria:**
- User can view all emails in template grouped by category
- User can add new email to category
- User can delete emails from template
- User can enable/disable emails
- Email count displays correctly (X/40 emails)
- Category sections collapse/expand

**Optional (Can defer to Phase 4):**
- Drag-and-drop reordering
- Rename/remove categories

---

### Phase 3: Email Editor (Weeks 4-6)
**Owner:** Frontend Engineer
**Effort:** 2 weeks

**Tasks:**
- [ ] Build email editor layout (Screen 4)
- [ ] Implement subject line editor with plain text
- [ ] Implement email body editor (start with textarea, rich text in Phase 4)
- [ ] Build trigger settings UI:
  - Trigger type dropdown
  - Conditional days input
  - Time picker
- [ ] Build recipient filter UI:
  - Status multi-select
  - Category checkboxes (if needed)
- [ ] Build variable picker sidebar:
  - "Used in this email" auto-detection
  - "Available tags" grouped list
  - Click to insert functionality
- [ ] Implement preview functionality
- [ ] Add form validation
- [ ] Write frontend tests

**API Endpoints Used:**
- `GET /api/v1/presents/email_template_items/:id`
- `PATCH /api/v1/presents/email_template_items/:id`
- `GET /api/v1/presents/events/:event_id/scheduled_emails/:id/preview`

**Acceptance Criteria:**
- User can edit subject and body templates
- User can select trigger type and configure timing
- User can filter recipients by status
- User can click variables to insert them
- "Used in this email" updates dynamically
- Preview shows rendered email with real data
- Validation prevents saving invalid triggers
- Save updates template item successfully

**Deferred to Phase 4:**
- Rich text editor (use textarea for MVP)
- Advanced recipient filtering (payment status, categories)

---

### Phase 4: Event Template Picker & Polish (Weeks 6-7)
**Owner:** Frontend Engineer
**Effort:** 1 week

**Tasks:**
- [ ] Add template selector to Event creation flow (Automation tab)
- [ ] Build template import modal (Screen 2)
- [ ] Show preview of selected template's email sequence
- [ ] Update event update flow to allow template changes
- [ ] Add "Import Template" functionality to replace event's scheduled emails
- [ ] Polish UI/UX based on feedback
- [ ] Write end-to-end tests

**API Endpoints Used:**
- `PATCH /api/v1/presents/events/:id` (update email_campaign_template_id)
- `GET /api/v1/presents/events/:event_id/scheduled_emails` (show current emails)

**Acceptance Criteria:**
- User can select template during event creation
- User can import template into existing event
- Preview shows email count and categories
- Importing template regenerates scheduled emails
- System emails section displays correctly

---

### Phase 5: Rich Text Editor & Advanced Features (Week 8+)
**Owner:** Frontend Engineer
**Effort:** 1-2 weeks

**Tasks:**
- [ ] Integrate rich text editor (Quill, TipTap, or React Email)
- [ ] Add variable insertion button to rich text toolbar
- [ ] Implement drag-and-drop email reordering
- [ ] Add bulk actions (duplicate email, enable/disable multiple)
- [ ] Build email template preview modal
- [ ] Add category rename/remove functionality
- [ ] Implement template versioning (optional)

**Deferred Features (Post-MVP):**
- Visual email builder (block-based editor)
- A/B testing support
- Email analytics dashboard
- Conditional content blocks
- Custom variable definitions

---

## 7. Risks & Mitigation Strategies

### Risk 1: Data Loss During Template Updates
**Severity:** HIGH
**Likelihood:** LOW

**Scenario:**
Updating the system default template could affect existing events that reference it.

**Impact:**
- Existing scheduled emails might change unexpectedly
- Users who relied on old template text see different content

**Mitigation:**
1. **ScheduledEmail records are COPIES, not references**
   - When an event is created, it COPIES template content to ScheduledEmail records
   - Updating the template does NOT affect existing scheduled emails
   - Only NEW events created after the update will use new template

2. **Seed file vs. Production database**
   - Seed file only affects NEW organizations
   - Use rake task to update EXISTING system template
   - Test rake task in staging first

3. **Backup strategy**
   - Take database snapshot before running rake task
   - Export current template content to JSON before update
   - Create rollback script if needed

**Action Items:**
- [ ] Confirm ScheduledEmail.subject_template and body_template are copied, not joined
- [ ] Test template update in staging with real event data
- [ ] Document rollback procedure

**Status:** ✅ LOW RISK - Architecture already handles this correctly

---

### Risk 2: Breaking Existing Scheduled Emails
**Severity:** HIGH
**Likelihood:** LOW

**Scenario:**
Deleting position 7 from system template might break existing events that have that email scheduled.

**Impact:**
- Orphaned ScheduledEmail records
- Emails scheduled to send with no parent template item

**Mitigation:**
1. **ScheduledEmail has optional reference to template**
   - `email_template_item_id` is OPTIONAL (nullable foreign key)
   - Deleting template item does NOT cascade delete scheduled emails
   - Scheduled emails continue to work independently

2. **Query existing data before deletion**
   ```ruby
   # Check how many scheduled emails reference position 7
   EmailTemplateItem.find_by(position: 7).scheduled_emails.count
   ```

3. **Soft delete vs. hard delete**
   - Option 1: Set `enabled_by_default: false` instead of deleting
   - Option 2: Delete from template but keep existing scheduled emails

**Action Items:**
- [ ] Query production to count scheduled emails for position 7
- [ ] Decide: soft delete (disable) or hard delete (remove from template)
- [ ] Test deletion in staging

**Recommendation:** Use `enabled_by_default: false` to soft-delete. Existing scheduled emails remain intact, but new events won't include it.

**Status:** ⚠️ MEDIUM RISK - Needs testing in staging

---

### Risk 3: Variable Resolution Failures
**Severity:** MEDIUM
**Likelihood:** LOW

**Scenario:**
Users create templates with variables that don't exist or aren't available in certain contexts.

**Impact:**
- Emails sent with unreplaced tokens like `[invalidVariable]`
- User confusion about which variables are available

**Mitigation:**
1. **UI validation**
   - Only show valid variables in picker
   - Highlight unrecognized variables in editor
   - Warning message if unknown variable detected

2. **Backend validation**
   - EmailVariableResolver already handles missing variables gracefully
   - Returns empty string for undefined variables (see resolver line 47-62)

3. **Preview functionality**
   - Preview shows exactly what will be sent
   - Users can catch variable errors before sending

**Action Items:**
- [ ] Add frontend validation for variable syntax
- [ ] Test preview with missing/invalid variables
- [ ] Document all available variables in UI

**Status:** ✅ LOW RISK - Already handled by backend

---

### Risk 4: SendGrid Rate Limits
**Severity:** MEDIUM
**Likelihood:** MEDIUM

**Scenario:**
Large events with 1000+ vendors trigger email sending all at once when template is imported.

**Impact:**
- SendGrid rate limits exceeded
- Email deliveries delayed or failed
- Poor user experience

**Mitigation:**
1. **Current architecture already batches sends**
   - EmailSenderWorker runs every 5 minutes
   - Processes scheduled emails in batches
   - SendGrid handles queuing

2. **Monitor SendGrid usage**
   - Set up alerts for rate limit warnings
   - Review SendGrid plan limits

3. **Add throttling if needed**
   - Limit concurrent sends per organization
   - Stagger send times by seconds (not just scheduled_for)

**Action Items:**
- [ ] Review current SendGrid plan limits
- [ ] Monitor email send volumes in production
- [ ] Add throttling if approaching limits

**Status:** ✅ LOW RISK - Current architecture handles batching

---

### Risk 5: User Creates Invalid Trigger Combinations
**Severity:** MEDIUM
**Likelihood:** MEDIUM

**Scenario:**
User creates email with trigger "1 day before payment deadline" but event has no payment_deadline set.

**Impact:**
- Email never sends (scheduled_for is nil)
- User confusion about why email didn't send
- No error message to user

**Mitigation:**
1. **Backend validation already exists**
   - EmailScheduleCalculator returns nil for invalid triggers (see calculator line 47-112)
   - ScheduledEmail.scheduled_for will be nil
   - EmailSenderWorker skips emails with nil scheduled_for

2. **Frontend warnings**
   - Show warning icon if event is missing required date fields
   - Example: "This email won't send because no payment deadline is set for this event"
   - Validate trigger selection against event's available dates

3. **API feedback**
   - Return warning messages in scheduled email response
   - Show count of "emails that won't send" in event automation tab

**Action Items:**
- [ ] Add frontend validation for trigger types
- [ ] Show warnings in UI when event is missing required dates
- [ ] Add "troubleshooting" section in docs

**Recommendation:** Add validation warnings in UI before user saves template

**Status:** ⚠️ MEDIUM RISK - Needs frontend validation

---

### Risk 6: Template Cloning Creates Too Many Copies
**Severity:** LOW
**Likelihood:** MEDIUM

**Scenario:**
Users clone templates repeatedly, creating database bloat and confusion about which template to use.

**Impact:**
- Database growth
- User confusion with 20+ similar templates
- Performance degradation in template list

**Mitigation:**
1. **Add limits**
   - Max 25 custom templates per organization (soft limit in UI)
   - Database constraint if needed (check before insert)

2. **Archive/delete functionality**
   - Allow users to delete unused templates
   - Check constraint: can't delete template if events are using it

3. **Better naming prompts**
   - Force user to name cloned template
   - Show duplicate name warning

**Action Items:**
- [ ] Add frontend limit check (warn at 20, block at 25)
- [ ] Implement delete validation (can't delete if in use)
- [ ] Add "last used" date to template list

**Status:** ✅ LOW RISK - Easy to add limits

---

### Risk 7: Migration Path for Existing Users
**Severity:** LOW
**Likelihood:** LOW

**Scenario:**
Existing users are confused by new template system and don't understand how to customize.

**Impact:**
- Low adoption rate
- Support ticket increase
- User frustration

**Mitigation:**
1. **Launch communication**
   - In-app announcement about new feature
   - Email to all active users with tutorial video
   - "What's New" modal on first login after launch

2. **Onboarding flow**
   - First time visiting Mail tab, show quick tutorial
   - Highlight "Clone Default Template" button
   - Sample custom template included for inspiration

3. **Documentation**
   - Help docs with screenshots
   - Video tutorial (3-5 minutes)
   - FAQ section

**Action Items:**
- [ ] Create launch announcement draft
- [ ] Record tutorial video
- [ ] Write help documentation
- [ ] Design onboarding modal

**Status:** ✅ LOW RISK - Standard launch communication

---

## 8. Technical Considerations

### Frontend Technology Stack

**Recommended:**
- **UI Framework:** React (already in use)
- **Rich Text Editor:** Quill (simple, email-safe) OR TipTap (modern, extensible)
- **Drag-and-Drop:** react-beautiful-dnd OR @dnd-kit/core
- **Form Management:** React Hook Form (if not already using)
- **API Client:** Existing API client (axios/fetch wrapper)

**Why Quill:**
- Lightweight and simple
- Email-safe output (no weird formatting)
- Easy to add custom toolbar buttons for variables
- Used by many email platforms (Mailchimp, etc.)

**Why TipTap:**
- More modern and actively maintained
- Better extensibility for custom variable nodes
- Cleaner API
- Can render variables as "pills" instead of text

**Recommendation:** Start with Quill for MVP, migrate to TipTap if needed

---

### Backend Considerations

**No Schema Changes Required** ✅

The current database schema supports all planned features:
- JSONB `filter_criteria` allows arbitrary filtering logic
- `position` field handles ordering
- Template cloning service exists
- Variable resolution is flexible

**Potential Future Enhancements:**
- Add `archived_at` timestamp to EmailCampaignTemplate (soft delete)
- Add `last_used_at` timestamp for sorting
- Add `version` integer for template versioning
- Add `preview_image` URL for visual template library

---

### Performance Considerations

**Current Bottlenecks:**
1. **Template list query** - Should be fast (< 50 templates per org)
2. **Email item list** - Max 40 per template, no performance issue
3. **Preview rendering** - Requires event + registration data, may be slow for complex templates

**Optimizations:**
- Eager load associations in template list (`includes(:email_template_items)`)
- Cache preview renderings (15-minute cache per email)
- Paginate template list if > 50 templates

**Action Items:**
- [ ] Add database indexes if query performance degrades
- [ ] Monitor API response times after launch
- [ ] Add caching layer if preview is slow

---

## 9. Testing Strategy

### Backend Testing (Already Exists)

Existing test coverage for:
- ✅ Model validations (EmailCampaignTemplate, EmailTemplateItem)
- ✅ Service classes (EmailScheduleCalculator, RecipientFilterService)
- ✅ API endpoints (controllers)
- ✅ Background workers

**Additional Tests Needed:**
- [ ] Template update rake task
- [ ] Edge cases for trigger validation
- [ ] Variable resolution with missing data

---

### Frontend Testing

**Unit Tests:**
- Component rendering (template list, email editor)
- Variable picker functionality
- Trigger dropdown logic
- Form validation

**Integration Tests:**
- Template cloning flow
- Email creation and editing
- Preview functionality
- API error handling

**End-to-End Tests:**
- Complete flow: Clone template → Add email → Edit content → Save → Create event → Verify scheduled emails
- Delete template flow
- Import template into event flow

**Manual Testing Checklist:**
- [ ] Create custom template from system default
- [ ] Add new email to template
- [ ] Edit subject and body with variables
- [ ] Preview email with real registration
- [ ] Delete email from template
- [ ] Delete custom template
- [ ] Import template into new event
- [ ] Import template into existing event (replace emails)
- [ ] Verify scheduled emails send at correct times

---

## 10. Launch Plan

### Pre-Launch (Week 7)

- [ ] Complete all frontend development
- [ ] Complete all testing (unit, integration, E2E)
- [ ] Update default template in production (rake task)
- [ ] Verify staging environment matches production
- [ ] Record tutorial video
- [ ] Write help documentation
- [ ] Prepare launch announcement

---

### Launch (Week 8)

**Soft Launch (Internal):**
- [ ] Enable for internal organization only
- [ ] Test with real event creation
- [ ] Gather feedback from team
- [ ] Fix critical bugs

**Beta Launch (Select Customers):**
- [ ] Enable for 5-10 active customers
- [ ] Provide personalized onboarding
- [ ] Monitor usage and errors
- [ ] Gather feedback via survey

**Full Launch:**
- [ ] Enable for all users
- [ ] Send launch announcement email
- [ ] Show in-app "What's New" modal
- [ ] Monitor error logs and support tickets
- [ ] Post in any community channels

---

### Post-Launch (Week 9+)

- [ ] Monitor adoption metrics (% of orgs creating custom templates)
- [ ] Collect user feedback (NPS, surveys)
- [ ] Prioritize Phase 5 features based on feedback
- [ ] Address bugs and UX issues
- [ ] Plan iteration roadmap

---

## 11. Success Criteria

### Launch Success (Week 8)

- [ ] Zero critical bugs reported in first week
- [ ] < 2% error rate on API endpoints
- [ ] All existing scheduled emails continue to send correctly
- [ ] At least 50% of beta users create custom template

### 30-Day Success (Week 12)

- [ ] 80% of active organizations create at least 1 custom template
- [ ] 50% reduction in email customization support tickets
- [ ] Average time to create template < 15 minutes
- [ ] User satisfaction score > 4.0/5.0

### 90-Day Success (Week 20)

- [ ] 90%+ of new events use custom templates (not default)
- [ ] Average 2+ custom templates per organization
- [ ] Feature rated in top 3 most valuable by users
- [ ] Zero data loss incidents

---

## 12. Open Questions & Decisions Needed

### Product Decisions

1. **Template Limit:** What's the max custom templates per organization?
   - Recommendation: Soft limit at 25, warn at 20

2. **Rich Text Editor:** Which editor should we use?
   - Recommendation: Quill for MVP, evaluate TipTap later

3. **Drag-and-Drop:** Required for MVP or defer to Phase 5?
   - Recommendation: Defer to Phase 5, use up/down buttons in MVP

4. **Template Versioning:** Should we track template history?
   - Recommendation: Not in MVP, add in Phase 5 if requested

5. **Default Template Changes:** Confirm 6-email sequence is correct
   - Pending: Product owner to approve final structure

### Technical Decisions

1. **Backward Compatibility:** How long should we support old template structure?
   - Recommendation: Indefinitely (ScheduledEmail records are independent)

2. **Migration Strategy:** Soft delete vs. hard delete for position 7 email?
   - Recommendation: Soft delete (`enabled_by_default: false`)

3. **Error Handling:** How should we handle invalid trigger combinations?
   - Recommendation: Show warning in UI, don't block save

4. **Caching:** Do we need to cache preview renderings?
   - Recommendation: Monitor performance first, add caching if needed

---

## 13. Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 0: Template Update | Week 1 | Updated default template (6 emails) |
| Phase 1: Template Library | Weeks 2-3 | Template list, clone functionality |
| Phase 2: Sequence Editor | Weeks 3-4 | Email list view, add/delete emails |
| Phase 3: Email Editor | Weeks 4-6 | Subject/body editor, variable picker, preview |
| Phase 4: Event Integration | Weeks 6-7 | Template picker in event flow |
| Phase 5: Rich Text & Polish | Week 8+ | Rich text editor, drag-and-drop |

**Total Timeline:** 8 weeks (MVP) + 2-4 weeks (polish)

---

## 14. Things to Keep in Mind

### For Product Owner

1. **Email Copy Deadline:** Need final copy for 6-email sequence by end of Week 1
2. **User Communication:** Plan launch announcement and tutorial content
3. **Beta User Selection:** Identify 5-10 engaged customers for beta testing
4. **Success Metrics:** Define how we'll measure adoption and satisfaction

### For Technical Lead

1. **Code Review Bandwidth:** Plan for daily reviews during Weeks 2-6
2. **Infrastructure:** Verify SendGrid limits and monitoring
3. **Database Backups:** Ensure backup strategy before template updates
4. **Performance Monitoring:** Set up alerts for API response times

### For Engineering Team

1. **API Documentation:** Ensure all endpoints are documented (already done)
2. **Test Coverage:** Maintain >80% coverage for new frontend code
3. **Error Handling:** Add comprehensive error messages and logging
4. **Mobile Responsive:** Ensure all screens work on tablet/mobile

### For Everyone

1. **User Confusion Risk:** This is a power user feature - expect learning curve
2. **Support Tickets:** Plan for increase in template-related questions
3. **Iteration Mindset:** MVP is intentionally simple - we'll add features based on feedback
4. **Data Integrity:** Existing emails MUST continue working - test thoroughly

---

## 15. Next Steps

### Immediate (This Week)

- [ ] Product owner provides final email copy for 6-email template
- [ ] Technical lead reviews this project plan
- [ ] Team discusses and approves implementation phases
- [ ] Assign frontend engineer to project
- [ ] Schedule kickoff meeting

### Week 1

- [ ] Update seed file with new email content
- [ ] Update rake task with new email content
- [ ] Test template update in staging
- [ ] Run template update in production
- [ ] Verify existing events are unaffected

### Week 2

- [ ] Begin Phase 1 development (Template Library)
- [ ] Set up feature flag for gradual rollout
- [ ] Create project tracking board (Jira, Linear, etc.)

---

## Appendix A: API Endpoint Reference

### Template Management Endpoints

```
GET    /api/v1/presents/organizations/:org_id/email_campaign_templates
POST   /api/v1/presents/organizations/:org_id/email_campaign_templates
GET    /api/v1/presents/organizations/:org_id/email_campaign_templates/:id
PATCH  /api/v1/presents/organizations/:org_id/email_campaign_templates/:id
DELETE /api/v1/presents/organizations/:org_id/email_campaign_templates/:id
POST   /api/v1/presents/organizations/:org_id/email_campaign_templates/:id/clone
```

### Email Item Endpoints

```
GET    /api/v1/presents/email_campaign_templates/:template_id/email_template_items
POST   /api/v1/presents/email_campaign_templates/:template_id/email_template_items
GET    /api/v1/presents/email_template_items/:id
PATCH  /api/v1/presents/email_template_items/:id
DELETE /api/v1/presents/email_template_items/:id
POST   /api/v1/presents/email_template_items/reorder
```

### Scheduled Email Endpoints

```
GET    /api/v1/presents/events/:event_id/scheduled_emails
GET    /api/v1/presents/events/:event_id/scheduled_emails/:id
PATCH  /api/v1/presents/events/:event_id/scheduled_emails/:id
DELETE /api/v1/presents/events/:event_id/scheduled_emails/:id
GET    /api/v1/presents/events/:event_id/scheduled_emails/:id/preview
POST   /api/v1/presents/events/:event_id/scheduled_emails/:id/send_now
POST   /api/v1/presents/events/:event_id/scheduled_emails/:id/pause
POST   /api/v1/presents/events/:event_id/scheduled_emails/:id/resume
```

---

## Appendix B: Database Schema Reference

### EmailCampaignTemplate

```ruby
create_table "email_campaign_templates" do |t|
  t.string "template_type", null: false  # "system" or "user"
  t.bigint "organization_id"             # NULL for system templates
  t.string "name", null: false
  t.text "description"
  t.boolean "is_default", default: false
  t.integer "email_count", default: 0    # Counter cache
  t.integer "events_count", default: 0   # Counter cache
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end
```

### EmailTemplateItem

```ruby
create_table "email_template_items" do |t|
  t.bigint "email_campaign_template_id", null: false
  t.string "name", null: false
  t.text "description"
  t.string "category"                   # Grouping: event_announcements, payment_reminders, etc.
  t.integer "position"                  # 1-40 (enforced by check constraint)
  t.string "subject_template", null: false
  t.text "body_template", null: false
  t.string "trigger_type", null: false
  t.integer "trigger_value"
  t.time "trigger_time"
  t.jsonb "filter_criteria"
  t.boolean "enabled_by_default", default: true
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end
```

### ScheduledEmail

```ruby
create_table "scheduled_emails" do |t|
  t.bigint "event_id", null: false
  t.bigint "email_campaign_template_id"  # Optional reference
  t.bigint "email_template_item_id"      # Optional reference
  t.string "name", null: false
  t.string "subject_template"
  t.text "body_template"
  t.string "trigger_type"
  t.integer "trigger_value"
  t.time "trigger_time"
  t.datetime "scheduled_for"              # Computed send time (UTC)
  t.jsonb "filter_criteria"
  t.string "status", default: "scheduled" # scheduled, sent, failed, cancelled
  t.datetime "sent_at"
  t.integer "recipient_count"
  t.text "error_message"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end
```

---

## Appendix C: File Locations

| Component | File Path |
|-----------|-----------|
| Models | [app/models/email_campaign_template.rb](app/models/email_campaign_template.rb) |
| | [app/models/email_template_item.rb](app/models/email_template_item.rb) |
| | [app/models/scheduled_email.rb](app/models/scheduled_email.rb) |
| Controllers | [app/controllers/api/v1/presents/email_campaign_templates_controller.rb](app/controllers/api/v1/presents/email_campaign_templates_controller.rb) |
| | [app/controllers/api/v1/presents/email_template_items_controller.rb](app/controllers/api/v1/presents/email_template_items_controller.rb) |
| | [app/controllers/api/v1/presents/scheduled_emails_controller.rb](app/controllers/api/v1/presents/scheduled_emails_controller.rb) |
| Services | [app/services/email_schedule_calculator.rb](app/services/email_schedule_calculator.rb) |
| | [app/services/email_variable_resolver.rb](app/services/email_variable_resolver.rb) |
| | [app/services/recipient_filter_service.rb](app/services/recipient_filter_service.rb) |
| | [app/services/email_campaign_template_cloner.rb](app/services/email_campaign_template_cloner.rb) |
| | [app/services/email_sender_service.rb](app/services/email_sender_service.rb) |
| Workers | [app/workers/email_sender_worker.rb](app/workers/email_sender_worker.rb) |
| | [app/workers/email_delivery_processor_job.rb](app/workers/email_delivery_processor_job.rb) |
| Seeds | [db/seeds/email_campaign_templates.rb](db/seeds/email_campaign_templates.rb) |
| Rake Task | [lib/tasks/update_default_email_template.rake](lib/tasks/update_default_email_template.rake) |

---

**Document Owner:** Product Team
**Last Updated:** January 25, 2026
**Next Review:** After Phase 0 completion
