# Voxxy Rails Documentation

Current documentation for the Voxxy Rails API and Voxxy Presents event platform.

## 🚀 Deployment & Operations

### Production Systems
- **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** - Complete deployment guide for production and staging on Render.com
  - Current production setup: `hey-voxxy` (main branch) + `heyvoxxy-sidekiq` worker
  - Current staging setup: `voxxy-reails-react` (staging branch) + `voxxy-sidekiq` worker
  - Environment variables, monitoring, troubleshooting

- **[SIDEKIQ_QUICKSTART.md](SIDEKIQ_QUICKSTART.md)** - Quick reference for Sidekiq email worker status
  - Current operational status for both environments
  - Verification steps and troubleshooting
  - Both environments fully operational ✅

### Infrastructure & Background Jobs
- **[REDIS_SIDEKIQ_SETUP.md](REDIS_SIDEKIQ_SETUP.md)** - Comprehensive Redis & Sidekiq guide
  - What Redis and Sidekiq are and how they work together
  - Local development setup
  - Production setup on Render
  - Testing, monitoring, debugging
  - Performance optimization

- **[redis_monitoring.md](redis_monitoring.md)** - Redis monitoring commands and best practices

---

## 📧 Email Systems

### Main Guides
- **[EMAIL_SYSTEM_DOCUMENTATION.md](EMAIL_SYSTEM_DOCUMENTATION.md)** - Complete email system reference (66KB)
  - Comprehensive guide to the entire email system architecture
  - Scheduled emails, templates, automation workflows

- **[EMAIL_AUTOMATION_SYSTEM_GUIDE.md](EMAIL_AUTOMATION_SYSTEM_GUIDE.md)** - Email automation deep dive (84KB)
  - Automated email campaigns and triggers
  - Template customization and variables
  - Scheduling and sending logic

- **[EMAIL_NOTIFICATION_SYSTEM.md](EMAIL_NOTIFICATION_SYSTEM.md)** - User-triggered notifications
  - User confirmation emails (automatic)
  - Payment confirmation (requires user confirmation)
  - Category change notifications
  - Event update/cancellation emails (bulk)
  - API endpoints and frontend integration examples

### Integration & Testing
- **[SENDGRID_WEBHOOK_SETUP.md](SENDGRID_WEBHOOK_SETUP.md)** - SendGrid webhook configuration
  - Email delivery tracking
  - Bounce and spam handling
  - Event webhooks setup

- **[EMAIL_NOTIFICATION_TESTING.md](EMAIL_NOTIFICATION_TESTING.md)** - Email testing procedures
  - How to test each email type
  - SendGrid integration testing
  - Scheduled email testing

### API Reference
- **[INVITATION_QUICK_REFERENCE.md](INVITATION_QUICK_REFERENCE.md)** - Event invitation API endpoints
  - Create batch invitations
  - Track invitation responses
  - Public invitation links

---

## 🔧 Development & Features

### Feature Guides
- **[CSV_UPLOAD_IMPLEMENTATION_GUIDE.md](CSV_UPLOAD_IMPLEMENTATION_GUIDE.md)** - CSV upload feature (40KB)
  - Bulk vendor contact uploads
  - CSV parsing and validation
  - Error handling and user feedback

- **[USER_PREFERENCES_API.md](USER_PREFERENCES_API.md)** - User preferences API
  - User settings and preferences
  - API endpoints and usage

### Testing & Debugging
- **[TESTING.md](TESTING.md)** - General testing guidelines
  - Test setup and best practices

- **[CONSOLE_TESTING_GUIDE.md](CONSOLE_TESTING_GUIDE.md)** - Rails console testing
  - Manual testing workflows
  - Console commands for debugging
  - Data verification

### Security
- **[SECURITY_AUDIT_CHECKLIST.md](SECURITY_AUDIT_CHECKLIST.md)** - Security best practices
  - Authentication and authorization
  - Data protection
  - API security
  - Common vulnerabilities to avoid

---

## 📦 Archived Documentation

Historical documentation (migration guides, implementation plans, completed feature analyses) has been moved to the [`archive/`](archive/) folder.

---

## 📊 Quick Links

### Production Services
- **Web**: [hey-voxxy.onrender.com](https://hey-voxxy.onrender.com)
- **Sidekiq Worker**: `heyvoxxy-sidekiq` (background jobs)
- **Database**: `VoxxyDB` (PostgreSQL)
- **Redis**: `beau-redis`

### Staging Services
- **Web**: `voxxy-reails-react`
- **Sidekiq Worker**: `voxxy-sidekiq` (background jobs)
- **Database**: `beaulazear` (PostgreSQL)
- **Redis**: `beau-redis` (shared with production)

### External Services
- **Email**: SendGrid (via `VoxxyKeyAPI`)
- **Storage**: AWS S3 (Active Storage)
- **Domains**: heyvoxxy.com (production), voxxyai.com

---

Last updated: January 8, 2026
