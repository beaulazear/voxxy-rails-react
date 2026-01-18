# Voxxy Platform API 🧠✨

**Voxxy** is a unified Rails API powering two complementary products: **Voxxy Mobile** (social planning) and **Voxxy Presents** (event management & vendor coordination).

[![Rails](https://img.shields.io/badge/Rails-7.2.2-red)](https://rubyonrails.org/)
[![Ruby](https://img.shields.io/badge/Ruby-3.x-red)](https://www.ruby-lang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)](https://www.postgresql.org/)

---

## 🎯 Platform Overview

This Rails API serves as the backend for two distinct but integrated products:

### 🎉 Voxxy Presents (Primary Focus)
**Event management and vendor coordination platform for venues and markets**

- Create and manage events with vendor applications
- Automated email campaigns (40+ templates)
- Vendor CRM and invitation system
- Application review and approval workflows
- Budget tracking and vendor management
- SendGrid email automation with delivery tracking

**Frontend:** React 18 + TypeScript web application
**Users:** Producers (venue owners), Vendors, Admins

### 📱 Voxxy Mobile (In Development)
**Social planning app for coordinating group activities**

- Create shared boards for group plans
- Collect availability and confirm details
- AI-powered planning suggestions
- Real-time notifications

**Frontend:** React Native mobile application
**Users:** Consumers (general users)

### 🔗 Shared Infrastructure
- Unified authentication (JWT + session-based)
- Role-based access control (consumer, producer, vendor, admin)
- User management and moderation
- Push notifications (Expo)
- Email verification system
- PostgreSQL database with JSONB support
- Redis caching and background jobs (Sidekiq)

---

## 🚀 Getting Started

### Prerequisites

- Ruby 3.x
- Rails 7.2.2
- PostgreSQL 14+
- Redis (for Sidekiq)
- SendGrid account (for emails)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/voxxy-rails.git
cd voxxy-rails
```

### 2. Install Dependencies

```bash
bundle install
```

### 3. Database Setup

```bash
# Create databases
rails db:create

# Run migrations
rails db:migrate

# Seed with sample data (optional)
rails db:seed
```

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://localhost/voxxy_rails_development

# Email (SendGrid)
VoxxyKeyAPI=your_sendgrid_api_key
SENDER_EMAIL=team@voxxyai.com

# External APIs
OPENAI_API_KEY=your_openai_key
PLACES_KEY=your_google_places_key
MIXPANEL_TOKEN=your_mixpanel_token

# Redis
REDIS_URL=redis://localhost:6379/0

# Frontend URLs
FRONTEND_URL=http://localhost:5173
PRESENTS_FRONTEND_URL=https://voxxypresents.com

# AWS S3 (for file uploads in production)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

### 5. Start the Server

```bash
# Start Rails server
rails s

# In a separate terminal, start Sidekiq (for background jobs)
bundle exec sidekiq

# In a separate terminal, start Redis (if not running)
redis-server
```

API will be available at `http://localhost:3000`

---

## 📁 Project Structure

```
voxxy-rails/
├── app/
│   ├── controllers/
│   │   ├── api/v1/
│   │   │   ├── mobile/          # Voxxy Mobile endpoints
│   │   │   ├── presents/        # Voxxy Presents endpoints
│   │   │   └── shared/          # Shared endpoints (auth, users)
│   │   └── concerns/            # Shared controller logic
│   ├── models/
│   │   ├── activity.rb          # Mobile: Group planning
│   │   ├── event.rb             # Presents: Events
│   │   ├── organization.rb      # Presents: Venues/Organizations
│   │   ├── registration.rb      # Presents: Vendor applications
│   │   ├── scheduled_email.rb   # Presents: Email automation
│   │   └── user.rb              # Shared: Authentication
│   ├── services/                # Business logic
│   │   ├── email_sender_service.rb
│   │   ├── registration_email_service.rb
│   │   ├── google_places_service.rb
│   │   └── push_notification_service.rb
│   ├── workers/                 # Sidekiq background jobs
│   │   └── email_sender_worker.rb
│   └── mailers/                 # Email templates
├── config/
│   ├── routes.rb                # API endpoints
│   └── initializers/
│       ├── cors.rb              # CORS configuration
│       └── rack_attack.rb       # Rate limiting
├── db/
│   ├── migrate/                 # Database migrations
│   ├── seeds/                   # Seed data
│   └── schema.rb                # Current schema
├── docs/                        # Documentation
│   ├── email/                   # Email system docs
│   ├── deployment/              # Deployment guides
│   ├── features/                # Feature documentation
│   └── README.md                # Documentation index
├── spec/                        # RSpec tests
└── test/                        # Minitest tests
```

---

## 🔧 Technology Stack

### Backend Framework
- **Rails 7.2.2** - API-only mode with session support
- **Ruby 3.x** - Modern Ruby features
- **PostgreSQL 14+** - Primary database with JSONB support
- **Redis** - Caching, rate limiting, background jobs

### Authentication & Security
- **JWT** - 24-hour token expiration
- **BCrypt** - Password hashing
- **Rack::Attack** - Rate limiting (300 req/hour per IP)
- **CORS** - Configured for web and mobile clients

### Background Jobs
- **Sidekiq** - Background job processing
- **Sidekiq-Cron** - Recurring jobs (email sending every 5 min)

### External Services
- **SendGrid** - Transactional and automated emails
- **OpenAI API** - AI-powered recommendations
- **Google Places API** - Venue search and details
- **Mixpanel** - Analytics tracking
- **AWS S3** - File storage (ActiveStorage)
- **Expo Push Notifications** - Mobile push notifications

### Testing
- **RSpec** - Main testing framework (33 specs)
- **FactoryBot** - Test data generation
- **Faker** - Realistic fake data
- **WebMock** - HTTP request stubbing

---

## 🎨 Voxxy Presents Features (Primary)

### Event Management
- Create events with custom vendor applications
- Set application deadlines and payment deadlines
- Manage event capacity and registrations
- Track vendor submissions and approvals
- Budget tracking with line items

### Email Automation System
- **40+ email templates** with variable interpolation
- **Trigger-based scheduling** (days before/after event, deadlines)
- **Recipient filtering** by status, category, payment status
- **SendGrid integration** with delivery tracking and webhooks
- **Soft bounce retry** with exponential backoff
- **Real-time delivery status** updates

### Vendor Management
- **Vendor CRM** with contact management
- **Invitation system** with unique tokens
- **Application forms** with custom categories
- **Status workflow** (pending → approved/rejected/waitlist)
- **Payment tracking** (planned)

### API Structure (Presents)
```
POST   /api/v1/presents/organizations              # Create organization
GET    /api/v1/presents/events                     # List public events
POST   /api/v1/presents/events                     # Create event
PATCH  /api/v1/presents/events/:slug               # Update event
GET    /api/v1/presents/events/:slug/registrations # Get applications
PATCH  /api/v1/presents/registrations/:id          # Approve/reject
POST   /api/v1/presents/events/:slug/invitations/batch  # Send invitations
GET    /api/v1/presents/events/:slug/scheduled_emails   # Email automation
```

---

## 📱 Voxxy Mobile Features (In Development)

### Social Planning
- Create activities with date/time/location options
- Invite participants via email or app
- Collect availability with time slot voting
- AI-powered venue recommendations
- Real-time push notifications

### API Structure (Mobile)
```
POST   /api/v1/mobile/activities                   # Create activity
GET    /api/v1/mobile/activities/:id               # Get activity
POST   /api/v1/mobile/activities/:id/participants  # Invite participants
POST   /api/v1/mobile/time_slots                   # Add time options
POST   /api/v1/mobile/votes                        # Vote on times
```

---

## 🔐 Authentication

### JWT Authentication
```ruby
# Login
POST /api/v1/shared/login
Body: { email: "user@example.com", password: "password" }
Response: { token: "jwt_token", user_id: 123 }

# Use token in subsequent requests
Authorization: Bearer <jwt_token>
```

### User Roles
- **`consumer`** - Mobile app users (social planning)
- **`producer`** (venue_owner) - Event organizers (Presents)
- **`vendor`** - Service providers (Presents)
- **`admin`** - Platform administrators (both products)

### Product Context
Users can access:
- `mobile` - Voxxy Mobile only
- `presents` - Voxxy Presents only
- `both` - Both products

---

## 🧪 Testing

### Run All Tests
```bash
# RSpec (recommended)
bundle exec rspec

# Minitest (legacy)
bundle exec rails test
```

### Run Specific Tests
```bash
# Model tests
bundle exec rspec spec/models

# Controller tests
bundle exec rspec spec/controllers

# Integration tests
bundle exec rspec spec/integration

# Single file
bundle exec rspec spec/models/user_spec.rb
```

### Test Coverage
- 33 RSpec specs covering core functionality
- Models: User, Event, Registration, Email system
- Services: Email sending, push notifications, Google Places
- Integration: Authentication, event workflows

---

## 🚀 Deployment

### Production Environment
- **Platform:** Render.com
- **Web Service:** `hey-voxxy` (main branch)
- **Worker:** `heyvoxxy-sidekiq` (Sidekiq background jobs)
- **Database:** PostgreSQL on Render
- **Redis:** Shared Redis instance
- **Domains:** heyvoxxy.com, voxxyai.com

### Staging Environment
- **Web Service:** `voxxy-reails-react` (staging branch)
- **Worker:** `voxxy-sidekiq`
- **Database:** Separate PostgreSQL instance

See [docs/deployment/RENDER_DEPLOYMENT.md](docs/deployment/RENDER_DEPLOYMENT.md) for complete deployment guide.

---

## 📚 Documentation

### Quick Links
- **[Documentation Index](docs/README.md)** - Complete documentation overview
- **[Email System Guide](docs/email/EMAIL_AUTOMATION_SYSTEM_GUIDE.md)** - Email automation deep dive
- **[Deployment Guide](docs/deployment/RENDER_DEPLOYMENT.md)** - Production deployment
- **[API Reference](docs/features/)** - Feature-specific docs
- **[Testing Guide](docs/development/TESTING.md)** - Testing best practices

### Documentation Structure
```
docs/
├── email/              # Email system documentation (14 docs)
├── deployment/         # Deployment and infrastructure (4 docs)
├── features/           # Feature guides (CSV, auth, invitations)
├── development/        # Testing, security, console guides
└── archive/            # Historical/migration docs
```

---

## 🔧 Development Commands

```bash
# Database
rails db:migrate              # Run pending migrations
rails db:seed                 # Seed database
rails db:reset                # Drop, create, migrate, seed

# Console
rails console                 # Interactive Rails console
rails c                       # Shorthand

# Background Jobs
bundle exec sidekiq           # Start Sidekiq worker
bundle exec sidekiq -C config/sidekiq.yml  # With config

# Code Quality
bundle exec rubocop           # Ruby linting
bundle exec brakeman          # Security scanner

# Testing
bundle exec rspec             # Run all tests
bundle exec rspec --format documentation  # Verbose output
```

---

## 🛠️ Common Tasks

### Send Test Email
```ruby
# Rails console
event = Event.last
registration = event.registrations.first
RegistrationEmailService.send_confirmation(registration)
```

### Generate Scheduled Emails
```ruby
# Rails console
event = Event.find_by(slug: 'my-event')
generator = ScheduledEmailGenerator.new(event)
emails = generator.generate
puts "Generated #{emails.count} emails"
```

### Check Background Jobs
```ruby
# Rails console
require 'sidekiq/api'

# Check queue size
Sidekiq::Queue.new('email_delivery').size

# Check scheduled jobs
Sidekiq::ScheduledSet.new.size

# Check failed jobs
Sidekiq::RetrySet.new.size
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Write tests** for new functionality
4. **Follow Rails conventions** and existing patterns
5. **Run tests** before committing (`bundle exec rspec`)
6. **Commit with clear messages** (`git commit -m 'Add amazing feature'`)
7. **Push to your branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### Code Style
- Follow [Ruby Style Guide](https://rubystyle.guide/)
- Use RuboCop for linting
- Write descriptive commit messages
- Document complex logic with comments

---

## 🐛 Troubleshooting

### Common Issues

**Database connection errors:**
```bash
# Check PostgreSQL is running
pg_isready

# Recreate database
rails db:drop db:create db:migrate
```

**Redis connection errors:**
```bash
# Check Redis is running
redis-cli ping

# Start Redis
redis-server
```

**Sidekiq not processing jobs:**
```bash
# Check Sidekiq process
ps aux | grep sidekiq

# Restart Sidekiq
bundle exec sidekiq -C config/sidekiq.yml
```

**Email not sending:**
```bash
# Check SendGrid API key is set
echo $VoxxyKeyAPI

# Check Sidekiq email worker
rails console
> Sidekiq::Queue.new('email_delivery').size
```

---

## 📄 License

This project is proprietary and confidential.
© 2024-2026 Voxxy. All rights reserved.

---

## 📬 Contact

Questions, feedback, or support?

- **Email:** team@voxxyai.com
- **Documentation:** See [docs/README.md](docs/README.md)
- **Issues:** Report bugs or request features via GitHub Issues

---

**Built with ❤️ by the Voxxy team**

Last updated: January 2026
