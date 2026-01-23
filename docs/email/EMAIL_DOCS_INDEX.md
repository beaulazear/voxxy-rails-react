# 📧 Email Documentation Index

**Last Updated:** January 23, 2026

This index helps you navigate the email system documentation for Voxxy Presents.

---

## 🎯 Start Here

### **NEW: Master Reference for All Emails**
📄 **[VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md](./VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md)**
- **Purpose:** Complete catalog of ALL 21 Voxxy Presents emails
- **Best for:** Developers who need to edit ANY email in the system
- **Contains:**
  - Complete list of every email with file locations and line numbers
  - Email styling guide
  - Variable system reference
  - Quick edit cheatsheet
  - Testing instructions

---

## 📚 Detailed Documentation

### 1. Webhook Processing Fix (January 23, 2026)
📄 **[WEBHOOK_PROCESSING_FIX_JAN_23_2026.md](./WEBHOOK_PROCESSING_FIX_JAN_23_2026.md)** ⭐ **NEW**
- **Last Updated:** January 23, 2026
- **Purpose:** Critical fix for invitation email delivery tracking
- **Best for:** Understanding why invitation bounces weren't tracked and how it was fixed
- **Contains:**
  - Root cause analysis (SMTP vs SendGrid Web API)
  - Solution: Create EmailDelivery records before sending
  - 3-tier webhook lookup strategy
  - Schema changes (event_invitation_id column)
  - Testing and verification steps
  - Impact: 95% → 100% tracking coverage

📄 **[WEBHOOK_VERIFICATION_CHECKLIST.md](./WEBHOOK_VERIFICATION_CHECKLIST.md)**
- **Last Updated:** January 23, 2026
- **Purpose:** Step-by-step verification checklist for webhook integration
- **Best for:** Verifying webhook setup and troubleshooting
- **Contains:**
  - Webhook configuration verification
  - Job processing checks
  - Queue health monitoring (updated for :email_delivery queue)
  - Test invitation sending guide
  - Daily and weekly monitoring checks

📄 **[WEBHOOK_TRACKING_COMPLETE_FLOW.md](./WEBHOOK_TRACKING_COMPLETE_FLOW.md)**
- **Purpose:** Complete flow documentation for email delivery tracking
- **Best for:** Understanding the end-to-end webhook flow
- **Contains:**
  - SendGrid webhook event flow
  - EmailDeliveryProcessorJob logic
  - Database updates and status tracking

### 2. Email System Fixes (January 17, 2026)
📄 **[EMAIL_SYSTEM_FIXES_JANUARY_17_2026.md](./EMAIL_SYSTEM_FIXES_JANUARY_17_2026.md)**
- **Last Updated:** January 17, 2026
- **Purpose:** Critical fixes and improvements to email system
- **Best for:** Understanding recent changes, timezone fixes, template migration
- **Contains:**
  - Template structure migration (16 → 7 emails)
  - Timezone fix (UTC → Eastern time)
  - Payment deadline calculator fix
  - Admin email preview improvements
  - Migration steps for existing events
  - Testing and monitoring recommendations

### 3. Email Automation System (Scheduled Emails)
📄 **[EMAIL_AUTOMATION_SYSTEM_GUIDE.md](./EMAIL_AUTOMATION_SYSTEM_GUIDE.md)** (2,086 lines)
- **Last Updated:** January 17, 2026
- **Purpose:** Deep dive into the automated scheduled email system
- **Best for:** Understanding the architecture, database schema, and workflow
- **Contains:**
  - Complete architecture overview
  - Database schema documentation
  - Backend component reference (models, services, controllers, workers)
  - Frontend component reference (React/TypeScript)
  - Default 7-email template breakdown
  - Key workflows and recent changes
  - Developer reference and debugging tips

### 4. Email Notification System (User Confirmation)
📄 **[EMAIL_NOTIFICATION_SYSTEM.md](./EMAIL_NOTIFICATION_SYSTEM.md)** (472 lines)
- **Last Updated:** January 8, 2026
- **Purpose:** Documents the user confirmation flow for bulk/sensitive emails
- **Best for:** Understanding which emails require user confirmation before sending
- **Contains:**
  - Email service layer overview
  - Automatic vs. confirmation-required emails
  - API endpoint documentation
  - Frontend confirmation dialog implementation
  - Testing workflows

**Key Insight:** This doc explains the architectural pattern where certain emails (payment confirmation, event updates, cancellation) require explicit user confirmation via the frontend before sending.

### 5. Email Notification Testing Guide
📄 **[EMAIL_NOTIFICATION_TESTING.md](./EMAIL_NOTIFICATION_TESTING.md)** (343 lines)
- **Last Updated:** January 8, 2026
- **Purpose:** Step-by-step testing guide for the email notification system
- **Best for:** QA, manual testing of email confirmation flows
- **Contains:**
  - Test scenarios with exact steps
  - Expected outcomes
  - API payload examples
  - Frontend behavior validation

### 6. SendGrid Webhook Setup
📄 **[SENDGRID_WEBHOOK_SETUP.md](./SENDGRID_WEBHOOK_SETUP.md)** (365 lines)
- **Last Updated:** January 2, 2026
- **Purpose:** Setup guide for SendGrid webhook integration
- **Best for:** DevOps, initial setup, troubleshooting delivery tracking
- **Contains:**
  - Production setup instructions
  - Development setup with ngrok
  - Webhook security (OAuth)
  - Monitoring and troubleshooting
  - Testing checklist
  - Webhook payload examples

---

## 🗺️ Documentation Map by Use Case

### Use Case: "I need to edit an email"
1. Start with **[VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md](./VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md)**
2. Find your email in the catalog (includes file + line numbers)
3. Follow the "How to Edit Emails" section
4. Test using the "Testing Emails" section

### Use Case: "I need to understand the automated email system"
1. Read **[EMAIL_AUTOMATION_SYSTEM_GUIDE.md](./EMAIL_AUTOMATION_SYSTEM_GUIDE.md)**
2. Review the "Architecture" and "Key Workflows" sections
3. Check "Developer Reference" for common tasks
4. Reference **[VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md](./VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md)** for email details

### Use Case: "I need to add a new email to the system"
1. Decide if it's automated (time-based) or transactional (action-triggered)
2. If automated:
   - Read **[EMAIL_AUTOMATION_SYSTEM_GUIDE.md](./EMAIL_AUTOMATION_SYSTEM_GUIDE.md)** → "Developer Reference" → "Add a New Email to Template"
   - Edit `db/seeds/email_campaign_templates.rb`
3. If transactional:
   - Add method to `app/services/registration_email_service.rb` or create new service
   - Follow patterns in existing methods
4. Update **[VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md](./VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md)**

### Use Case: "Why isn't my email sending?"
1. Check **[EMAIL_AUTOMATION_SYSTEM_GUIDE.md](./EMAIL_AUTOMATION_SYSTEM_GUIDE.md)** → "Debugging Tips"
2. Verify SendGrid webhook setup: **[SENDGRID_WEBHOOK_SETUP.md](./SENDGRID_WEBHOOK_SETUP.md)**
3. Check if email requires user confirmation: **[EMAIL_NOTIFICATION_SYSTEM.md](./EMAIL_NOTIFICATION_SYSTEM.md)**
4. Run test from **[VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md](./VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md)** → "Testing Emails"

### Use Case: "I need to set up email delivery tracking"
1. Follow **[SENDGRID_WEBHOOK_SETUP.md](./SENDGRID_WEBHOOK_SETUP.md)**
2. Understand the system: **[EMAIL_AUTOMATION_SYSTEM_GUIDE.md](./EMAIL_AUTOMATION_SYSTEM_GUIDE.md)** → "Delivery Tracking"
3. Verify setup: **[WEBHOOK_VERIFICATION_CHECKLIST.md](./WEBHOOK_VERIFICATION_CHECKLIST.md)**

### Use Case: "Email bounces/drops aren't being tracked"
1. Check webhook fix: **[WEBHOOK_PROCESSING_FIX_JAN_23_2026.md](./WEBHOOK_PROCESSING_FIX_JAN_23_2026.md)**
2. Verify webhook configuration: **[WEBHOOK_VERIFICATION_CHECKLIST.md](./WEBHOOK_VERIFICATION_CHECKLIST.md)**
3. Check EmailDelivery records created before sending
4. Review Sidekiq logs for EmailDeliveryProcessorJob

### Use Case: "I need to test email functionality"
1. Quick tests: **[VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md](./VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md)** → "Testing Emails"
2. Detailed test scenarios: **[EMAIL_NOTIFICATION_TESTING.md](./EMAIL_NOTIFICATION_TESTING.md)**
3. System testing: **[EMAIL_AUTOMATION_SYSTEM_GUIDE.md](./EMAIL_AUTOMATION_SYSTEM_GUIDE.md)** → "Developer Reference"

---

## 📊 Documentation Status

| Document | Status | Last Updated | Purpose |
|----------|--------|--------------|---------|
| **WEBHOOK_PROCESSING_FIX_JAN_23_2026.md** | ✅ Current | Jan 23, 2026 | **Invitation tracking fix** |
| **WEBHOOK_VERIFICATION_CHECKLIST.md** | ✅ Current | Jan 23, 2026 | **Webhook verification steps** |
| **VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md** | ✅ Current | Jan 23, 2026 | **Master catalog of all emails** |
| EMAIL_SYSTEM_FIXES_JANUARY_17_2026.md | ✅ Current | Jan 17, 2026 | Template migration & timezone fixes |
| EMAIL_TESTING_SYSTEM.md | ✅ Current | Jan 17, 2026 | Testing guide with preview |
| EMAIL_AUTOMATION_SYSTEM_GUIDE.md | ✅ Current | Jan 17, 2026 | Automated email system deep dive |
| WEBHOOK_TRACKING_COMPLETE_FLOW.md | ✅ Current | Jan 18, 2026 | Complete webhook flow |
| EMAIL_NOTIFICATION_SYSTEM.md | ✅ Current | Jan 8, 2026 | User confirmation flow |
| EMAIL_NOTIFICATION_TESTING.md | ✅ Current | Jan 8, 2026 | Testing guide |
| SENDGRID_WEBHOOK_SETUP.md | ✅ Current | Jan 2, 2026 | SendGrid setup |

---

## 🎓 Quick Reference

### All Voxxy Presents Emails (21 Total)

#### Automated Scheduled Emails (7)
1. 1 Day Before Application Deadline
2. Application Deadline Day
3. 1 Day Before Payment Due
4. Payment Due Today
5. 1 Day Before Event
6. Day of Event
7. Day After Event - Thank You

#### Vendor Application Emails (4)
1. Application Confirmation
2. Application Approved
3. Application Rejected
4. Moved to Waitlist

#### Event Invitation Emails (1)
1. Vendor Invitation

#### Admin/Producer Notification Emails (5)
1. New Vendor Submission Notification
2. Payment Confirmed
3. Category Changed Notification
4. Event Details Changed (Bulk)
5. Event Canceled (Bulk)

**See [VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md](./VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md) for complete details on each email.**

---

## 🔗 Related Documentation

- **Voxxy Presents Context:** `CLAUDE_CONTEXT.md` (in client repo)
- **API Documentation:** (link to API docs if available)
- **Database Schema:** `db/schema.rb`

---

## 📝 Maintenance Notes

### When to Update These Docs

1. **VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md**
   - When adding/removing ANY email
   - When changing email styling
   - When adding new variables
   - When file locations change

2. **EMAIL_AUTOMATION_SYSTEM_GUIDE.md**
   - When changing automated email architecture
   - When modifying database schema
   - When adding new services/workers
   - After significant system refactors

3. **EMAIL_NOTIFICATION_SYSTEM.md**
   - When changing confirmation flow logic
   - When adding new emails that require confirmation
   - When API endpoints change

4. **SENDGRID_WEBHOOK_SETUP.md**
   - When webhook URL changes
   - When webhook event handling changes
   - When adding new SendGrid features

---

## 🚀 Getting Started Checklist

For new developers working on the email system:

- [ ] Read **VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md** (skim all sections)
- [ ] Understand the two email systems (automated vs. transactional)
- [ ] Set up local email testing (see Testing Emails section)
- [ ] Review the email styling guide
- [ ] Bookmark this index for quick reference
- [ ] Join #email-notifications Slack channel (if applicable)

---

**Questions or feedback on documentation?** Update this index and related docs as needed!

**Last Updated:** January 23, 2026
**Status:** ✅ Updated with webhook processing fix documentation
