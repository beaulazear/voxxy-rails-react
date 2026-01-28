# Voxxy Rails Documentation

Current documentation for the Voxxy Rails API and Voxxy Presents event platform.

**Last Updated:** January 27, 2026

---

## 📧 Email Systems

The email system is the core of Voxxy Presents' automation capabilities. Start with the master reference for quick access to all emails.

### Quick Start
- **[email/VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md](email/VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md)** ⭐ **START HERE**
  - Complete catalog of all 21 emails with file locations
  - Email styling guide and variables reference
  - Quick edit cheatsheet and testing instructions

### Recent Updates (Jan 27, 2026)
- **[email/INVITATION_REMINDER_ROUTING_SYSTEM.md](email/INVITATION_REMINDER_ROUTING_SYSTEM.md)** 🆕 **NEW**
  - Category-based email routing for correct recipient targeting
  - InvitationReminderService vs EmailSenderService architecture
  - Recipients modal feature (clickable recipient counts in UI)
  - Pre-production verification checklist
  - Debug and troubleshooting guides

### Comprehensive Guides
- **[email/EMAIL_DOCS_INDEX.md](email/EMAIL_DOCS_INDEX.md)** - Navigation hub for all email documentation
- **[email/EMAIL_AUTOMATION_SYSTEM_GUIDE.md](email/EMAIL_AUTOMATION_SYSTEM_GUIDE.md)** - Deep dive into automated email system (2,086 lines)
- **[email/EMAIL_SYSTEM_FIXES_JANUARY_17_2026.md](email/EMAIL_SYSTEM_FIXES_JANUARY_17_2026.md)** - Recent critical fixes and improvements

### Integration & Setup
- **[email/SENDGRID_WEBHOOK_SETUP.md](email/SENDGRID_WEBHOOK_SETUP.md)** - SendGrid webhook configuration for delivery tracking
- **[email/EMAIL_NOTIFICATION_SYSTEM.md](email/EMAIL_NOTIFICATION_SYSTEM.md)** - User-triggered notification flow
- **[email/INVITATION_QUICK_REFERENCE.md](email/INVITATION_QUICK_REFERENCE.md)** - Event invitation API endpoints

### Testing
- **[email/EMAIL_TESTING_SYSTEM.md](email/EMAIL_TESTING_SYSTEM.md)** - Testing guide with preview functionality
- **[email/EMAIL_NOTIFICATION_TESTING.md](email/EMAIL_NOTIFICATION_TESTING.md)** - Step-by-step testing procedures
- **[email/EMAIL_FILTERING_TEST_GUIDE.md](email/EMAIL_FILTERING_TEST_GUIDE.md)** - Recipient filtering tests

### Additional Email Docs
- **[email/EMAIL_PREVIEW_FEATURE.md](email/EMAIL_PREVIEW_FEATURE.md)** - Email preview functionality
- **[email/EMAIL_TEMPLATE_MIGRATION_GUIDE.md](email/EMAIL_TEMPLATE_MIGRATION_GUIDE.md)** - Template migration guide
- **[email/EMAIL_UPDATES_JANUARY_2026.md](email/EMAIL_UPDATES_JANUARY_2026.md)** - January updates summary
- **[email/EMAIL_RECIPIENT_FILTERING_FIX.md](email/EMAIL_RECIPIENT_FILTERING_FIX.md)** - Filtering system fixes
- **[email/EMAIL_TESTING_REACT_INTEGRATION.md](email/EMAIL_TESTING_REACT_INTEGRATION.md)** - React integration testing

---

## 🚀 Deployment & Infrastructure

### Production Deployment
- **[deployment/RENDER_DEPLOYMENT.md](deployment/RENDER_DEPLOYMENT.md)** ⭐ **PRODUCTION GUIDE**
  - Complete deployment guide for production and staging on Render.com
  - Current production: `hey-voxxy` (main branch) + `heyvoxxy-sidekiq` worker
  - Current staging: `voxxy-reails-react` (staging branch) + `voxxy-sidekiq` worker
  - Environment variables, monitoring, troubleshooting

### Background Jobs & Redis
- **[deployment/SIDEKIQ_QUICKSTART.md](deployment/SIDEKIQ_QUICKSTART.md)** - Quick reference for Sidekiq status
  - Operational status for both environments ✅
  - Verification steps and troubleshooting

- **[deployment/REDIS_SIDEKIQ_SETUP.md](deployment/REDIS_SIDEKIQ_SETUP.md)** - Comprehensive Redis & Sidekiq guide
  - What Redis and Sidekiq are and how they work together
  - Local development setup
  - Production setup on Render
  - Testing, monitoring, debugging, performance optimization

- **[deployment/redis_monitoring.md](deployment/redis_monitoring.md)** - Redis monitoring commands and best practices

---

## ⚙️ Features & APIs

### Vendor Management
- **[features/CSV_UPLOAD_IMPLEMENTATION_GUIDE.md](features/CSV_UPLOAD_IMPLEMENTATION_GUIDE.md)** - CSV bulk upload feature (40KB)
  - Bulk vendor contact uploads
  - CSV parsing and validation
  - Error handling and user feedback

- **[features/ROLE_BASED_AUTHENTICATION_GUIDE.md](features/ROLE_BASED_AUTHENTICATION_GUIDE.md)** - Role-based access control
  - User roles and permissions (consumer, producer, vendor, admin)
  - Authorization patterns and implementation

### Platform Features
- **[features/USER_PREFERENCES_API.md](features/USER_PREFERENCES_API.md)** - User preferences and settings API
- **[features/SEO_IMPLEMENTATION.md](features/SEO_IMPLEMENTATION.md)** - SEO implementation and best practices

---

## 🧪 Development & Testing

### Testing Guides
- **[development/TESTING.md](development/TESTING.md)** - General testing guidelines and best practices
- **[development/CONSOLE_TESTING_GUIDE.md](development/CONSOLE_TESTING_GUIDE.md)** - Rails console testing workflows
  - Manual testing procedures
  - Console commands for debugging and data verification

### Development Tools
- **[development/ADMIN_EMAIL_TESTING_PROPOSAL.md](development/ADMIN_EMAIL_TESTING_PROPOSAL.md)** - Admin email testing interface

### Security
- **[development/SECURITY_AUDIT_CHECKLIST.md](development/SECURITY_AUDIT_CHECKLIST.md)** - Security best practices
  - Authentication and authorization
  - Data protection and API security
  - Common vulnerabilities to avoid

---

## 📦 Archived Documentation

Historical documentation (migration guides, implementation plans, completed feature analyses) has been moved to **[archive/](archive/)**.

---

## 📊 Quick Reference

### Production Services
- **Web:** [hey-voxxy.onrender.com](https://hey-voxxy.onrender.com)
- **Sidekiq Worker:** `heyvoxxy-sidekiq` (background jobs)
- **Database:** `VoxxyDB` (PostgreSQL)
- **Redis:** `beau-redis`

### Staging Services
- **Web:** `voxxy-reails-react`
- **Sidekiq Worker:** `voxxy-sidekiq` (background jobs)
- **Database:** `beaulazear` (PostgreSQL)
- **Redis:** `beau-redis` (shared with production)

### External Services
- **Email:** SendGrid (via `VoxxyKeyAPI`)
- **Storage:** AWS S3 (Active Storage)
- **Domains:** heyvoxxy.com (production), voxxyai.com

---

## 📁 Documentation Structure

```
docs/
├── README.md (this file)          # Documentation index
│
├── email/                         # Email system documentation (14 files)
│   ├── VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md ⭐
│   ├── EMAIL_DOCS_INDEX.md
│   ├── EMAIL_AUTOMATION_SYSTEM_GUIDE.md
│   └── ... (11 more email docs)
│
├── deployment/                    # Deployment and infrastructure (4 files)
│   ├── RENDER_DEPLOYMENT.md ⭐
│   ├── SIDEKIQ_QUICKSTART.md
│   ├── REDIS_SIDEKIQ_SETUP.md
│   └── redis_monitoring.md
│
├── features/                      # Feature guides (4 files)
│   ├── CSV_UPLOAD_IMPLEMENTATION_GUIDE.md
│   ├── ROLE_BASED_AUTHENTICATION_GUIDE.md
│   ├── USER_PREFERENCES_API.md
│   └── SEO_IMPLEMENTATION.md
│
├── development/                   # Testing and development (4 files)
│   ├── TESTING.md
│   ├── CONSOLE_TESTING_GUIDE.md
│   ├── SECURITY_AUDIT_CHECKLIST.md
│   └── ADMIN_EMAIL_TESTING_PROPOSAL.md
│
└── archive/                       # Historical documentation (16+ files)
    └── ... (migration guides, old implementations)
```

---

## 🆘 Need Help?

### I need to...
- **Edit an email** → Start with [email/VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md](email/VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md)
- **Deploy to production** → See [deployment/RENDER_DEPLOYMENT.md](deployment/RENDER_DEPLOYMENT.md)
- **Test the email system** → Check [email/EMAIL_TESTING_SYSTEM.md](email/EMAIL_TESTING_SYSTEM.md)
- **Add a new feature** → Review relevant docs in [features/](features/)
- **Debug Sidekiq jobs** → See [deployment/SIDEKIQ_QUICKSTART.md](deployment/SIDEKIQ_QUICKSTART.md)
- **Understand authentication** → Read [features/ROLE_BASED_AUTHENTICATION_GUIDE.md](features/ROLE_BASED_AUTHENTICATION_GUIDE.md)

---

## 🔧 Common Tasks

### Check Email System Status
```bash
# Rails console
rails console
> require 'sidekiq/api'
> Sidekiq::Queue.new('email_delivery').size
```

### Send Test Email
```bash
# Rails console
event = Event.last
registration = event.registrations.first
RegistrationEmailService.send_confirmation(registration)
```

### Monitor Background Jobs
```bash
# Check Sidekiq dashboard
open https://hey-voxxy.onrender.com/sidekiq

# Or in Rails console
require 'sidekiq/api'
Sidekiq::Stats.new.processed  # Total processed
Sidekiq::Stats.new.failed     # Total failed
```

---

**Questions or feedback on documentation?**
- Update this index and related docs as needed
- Report issues to team@voxxyai.com

**Last Updated:** January 18, 2026
**Status:** ✅ Reorganized - All docs now in organized folders
