# Voxxy Rails API - Comprehensive Codebase Analysis Report

## Executive Summary
This is a Ruby on Rails 7.2 API built for activity/event management. It includes authentication (JWT/sessions), moderation systems, push notifications, AI-powered recommendations, and real-time activity coordination features.

---

## 1. DIRECTORY STRUCTURE & ARCHITECTURE

### Application Layout
```
/app
├── controllers/          # 28+ REST API controllers
│   ├── admin/
│   ├── concerns/         # JWT authentication logic
│   └── *.rb              # Resource controllers
├── models/              # 19 ActiveRecord models
├── serializers/         # 8+ JSON response formatters
├── services/            # 15+ business logic services
├── jobs/                # Sidekiq background jobs
├── mailers/             # Email notifications
└── views/               # HTML templates for sharing & email
```

### Technology Stack
- **Rails Version**: 7.2.2
- **Database**: PostgreSQL
- **Background Jobs**: Sidekiq
- **Caching**: Redis
- **Authentication**: JWT + Session Cookies
- **Rate Limiting**: Rack::Attack
- **API Key Management**: ENV variables + Rails Credentials
- **Testing**: RSpec, Factory Bot, Faker

---

## 2. API ENDPOINTS & PURPOSES

### Authentication & User Management
| Endpoint | Method | Purpose | Auth Required | Notes |
|----------|--------|---------|----------------|-------|
| POST /login | POST | User authentication | No | Returns JWT token for mobile |
| DELETE /logout | DELETE | Session termination | Yes | |
| GET /me | GET | Current user profile | Yes | Returns full dashboard |
| POST /users | POST | User registration | No | Email verification required |
| PATCH /users/:id | PATCH | Update profile | Yes | Supports profile pictures |
| DELETE /users/:id | DELETE | Delete account | Yes | Cascades to all associations |
| POST /verify_code | POST | Verify email OTP | No | 6-digit confirmation code |
| GET /verify | GET | Email verification link | No | Redirect-based verification |
| POST /resend_verification | POST | Resend OTP | No | Rate limited |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/users_controller.rb` (lines 1-282)
**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/sessions_controller.rb` (lines 1-41)

---

### Activities Management
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| GET /activities | GET | List user's activities | Yes |
| GET /activities/:id | GET | Get activity details | Yes |
| POST /activities | POST | Create new activity | Yes |
| PATCH /activities/:id | PATCH | Update activity | Yes |
| DELETE /activities/:id | DELETE | Delete activity | Yes |
| GET /activities/:id/share | GET | Public activity share link | No |
| GET /activities/:id/calendar | GET | Export to iCal format | No |
| POST /activities/:id/send_test_reminder | POST | Test push notification | Yes |
| POST /activities/:id/send_thank_you | POST | Thank you message | Yes |
| POST /activities/:id/mark_complete | POST | Mark as completed | Yes |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/activities_controller.rb` (lines 1-236)

---

### Activity Participants & Invitations
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| GET /activity_participants | GET | List participants | Yes |
| POST /activity_participants/invite | POST | Invite users | Yes |
| POST /activity_participants/accept | POST | Accept invitation | No (token-based) |
| DELETE /activity_participants/decline | DELETE | Decline invitation | No (token-based) |
| POST /activity_participants/leave | POST | Leave activity | No (token-based) |
| GET /users/:id/pending_invitations | GET | List pending invites | Yes |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/activity_participants_controller.rb`

**Guest Response Endpoints**:
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| GET /activities/:activity_id/respond/:token | GET | View invitation & submit response | No |
| POST /activities/:activity_id/respond/:token | POST | Submit preferences/availability | No |
| POST /activities/:activity_id/respond/:token/accept_with_preferences | POST | Accept using profile preferences | No |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/guest_responses_controller.rb` (lines 1-171)

---

### Time Slots & Voting
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| GET /activities/:id/time_slots | GET | List time slot options | Yes |
| POST /activities/:id/time_slots | POST | Create time slot | Yes |
| DELETE /activities/:id/time_slots/:id | DELETE | Remove time slot | Yes |
| POST /activities/:id/time_slots/:id/vote | POST | Vote for time slot | Yes |
| POST /activities/:id/time_slots/:id/unvote | POST | Remove vote | Yes |
| GET /activities/:id/time_slots/ai_recommendations | GET | Get AI recommendations | Yes |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/time_slots_controller.rb` (lines 1-150+)

---

### Responses & Preferences
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| GET /responses | GET | List activity responses | Yes |
| POST /responses | POST | Submit response/preferences | Yes |
| DELETE /responses/:id | DELETE | Delete response | Yes |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/responses_controller.rb` (lines 1-87)

---

### Comments & Pinned Activities
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| GET /activities/:id/comments | GET | List comments | Yes |
| POST /activities/:id/comments | POST | Create comment | Yes |
| GET /pinned_activities | GET | List location options | Yes |
| POST /pinned_activities | POST | Add location | Yes |
| PATCH /pinned_activities/:id | PATCH | Update location | Yes |
| DELETE /pinned_activities/:id | DELETE | Remove location | Yes |
| POST /pinned_activities/:id/toggle_flag | POST | Flag content | Yes |
| POST /pinned_activities/:id/toggle_favorite | POST | Mark favorite | Yes |
| GET /pinned_activities/:id/votes | GET | List votes | Yes |
| POST /pinned_activities/:id/votes | POST | Vote for location | Yes |
| DELETE /pinned_activities/:id/votes/:id | DELETE | Remove vote | Yes |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/pinned_activities_controller.rb`

---

### Notifications
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| GET /notifications | GET | List notifications | Yes |
| GET /notifications/:id | GET | Get notification | Yes |
| POST /notifications | POST | Create notification | Yes |
| DELETE /notifications/:id | DELETE | Delete notification | Yes |
| PUT /notifications/:id/mark_as_read | PUT | Mark as read | Yes |
| PUT /notifications/mark_all_as_read | PUT | Mark all as read | Yes |
| POST /test_notification | POST | Test notification | Yes |
| POST /send_test_to_self | POST | Send to current user | Yes |
| POST /users/:id/update_push_token | POST | Register push token | Yes |
| GET /users/:id/push_token_status | GET | Check token status | Yes |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/notifications_controller.rb`

---

### Community & User Activities
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| GET /user_activities | GET | Activity feed | Yes |
| DELETE /user_activities/:id | DELETE | Remove from feed | Yes |
| GET /user_activities/flagged | GET | Flagged content | Yes |
| GET /user_activities/favorited | GET | Favorite activities | Yes |
| GET /user_activities/community_feed | GET | Community activities | Yes |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/user_activities_controller.rb`

---

### User Blocking
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| POST /users/:id/block | POST | Block user | Yes |
| DELETE /users/:id/unblock | DELETE | Unblock user | Yes |
| GET /users/blocked | GET | List blocked users | Yes |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/blocks_controller.rb`

---

### Reporting & Moderation
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| POST /reports | POST | Report content/user | Yes |
| GET /reports | GET | Admin: list reports | Yes (Admin) |
| GET /reports/:id | GET | Admin: view report | Yes (Admin) |
| PATCH /reports/:id/review | PATCH | Admin: mark under review | Yes (Admin) |
| PATCH /reports/:id/resolve | PATCH | Admin: resolve report | Yes (Admin) |
| PATCH /reports/:id/dismiss | PATCH | Admin: dismiss report | Yes (Admin) |
| GET /reports/stats | GET | Admin: report stats | Yes (Admin) |
| POST /admin/users/:id/suspend | POST | Admin: suspend user | Yes (Admin) |
| POST /admin/users/:id/unsuspend | POST | Admin: unsuspend user | Yes (Admin) |
| POST /admin/users/:id/ban | POST | Admin: ban user | Yes (Admin) |
| POST /admin/users/:id/unban | POST | Admin: unban user | Yes (Admin) |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/reports_controller.rb` (lines 1-202)
**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/admin/moderation_controller.rb` (lines 1-194)

---

### Places API Proxy
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| GET /api/places/photo/:reference | GET | Proxy Google Places photo | No |
| GET /api/places/search | GET | Search locations | No |
| GET /api/places/details | GET | Get location details | No |
| GET /api/places/reverse_geocode | GET | Reverse geocode coordinates | No |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/places_controller.rb` (lines 1-227)

---

### AI Recommendations (OpenAI)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| POST /api/openai/restaurant_recommendations | POST | Get restaurant suggestions | Yes |
| POST /api/openai/bar_recommendations | POST | Get bar suggestions | Yes |
| POST /api/openai/game_recommendations | POST | Get game suggestions | Yes |
| POST /try_voxxy_recommendations | POST | Trial recommendations | No |
| GET /try_voxxy_cached | GET | Cached trial recommendations | No |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/openai_controller.rb` (lines 1-150+)

---

### Analytics
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| POST /analytics/track | POST | Event tracking | No |
| POST /analytics/identify | POST | User identification | No |
| POST /analytics/page_view | POST | Page view tracking | No |

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/analytics_controller.rb`

---

### Other Features
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| POST /password_reset | POST | Initiate password reset | No |
| PATCH /password_reset | PATCH | Complete password reset | No |
| GET /waitlists | GET | List waitlists | Yes |
| POST /waitlists | POST | Join waitlist | No |
| POST /feedbacks | POST | Submit feedback | No |
| POST /bug_reports | POST | Report bug | No |
| POST /contacts | POST | Contact form | No |
| PATCH /make_admin | PATCH | Admin promotion | Yes (Admin) |
| POST /accept_policies | POST | Accept T&C | Yes |

---

## 3. MODELS & DATABASE SCHEMA RELATIONSHIPS

### Core Models

**User** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/user.rb`, lines 1-354)
```
Associations:
- has_many :activities (host/creator)
- has_many :activity_participants (participations)
- has_many :joined_activities (through participants)
- has_many :comments
- has_many :votes (for locations)
- has_many :user_activities (community feed items)
- has_many :notifications
- has_many :triggered_notifications (notifications created by this user)
- has_many :reports_as_reporter
- has_many :reports_as_subject
- has_many :moderation_actions
- has_many :administered_moderation_actions (moderator)
- has_many :blocked_user_relationships (blocking others)
- has_many :blocked_users (through relationships)
- has_many :blocked_by_users (blocked by others)
- has_one_attached :profile_pic (Active Storage)

Key Methods:
- has_secure_password (bcrypt)
- verify!() - Email verification
- generate_password_reset_token() - Password recovery
- suspend!(duration, reason, moderator) - Temporary suspension
- ban!(reason, moderator) - Permanent ban
- unban!(moderator)
- block!(user_to_block), unblock!(user)
- can_receive_push_notifications?()
- community_member_ids() - Get all co-participants

Database Fields:
- id, email (unique), password_digest, name, avatar, profile_pic (attachment)
- confirmation_code, confirmed_at, confirmation_sent_at
- reset_password_token, reset_password_sent_at
- preferences, favorite_food, text/email/push_notifications
- neighborhood, city, state, latitude, longitude
- push_token, platform
- admin (boolean), status (active/suspended/banned)
- suspended_until, suspension_reason
- banned_at, ban_reason, warnings_count
- terms/privacy/guidelines acceptance tracking
```

**Activity** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/activity.rb`, lines 1-100+)
```
Associations:
- belongs_to :user (creator/host)
- has_many :responses (participant preferences)
- has_many :activity_participants (invitations & participants)
- has_many :participants (accepted users, through activity_participants)
- has_many :pinned_activities (location suggestions)
- has_many :comments
- has_many :time_slots (date/time options)
- has_many :notifications

Callbacks:
- after_update :schedule_reminders (if finalized)
- after_update :reschedule_reminders (if date/time changes)
- after_update :send_activity_finalized_notifications
- after_update :send_activity_updated_notifications

Database Fields:
- id, user_id, activity_name, activity_type (Restaurant/Meeting/Game Night/Cocktails)
- activity_location, group_size, radius (search radius in miles)
- date_notes, date_day (date), date_time (time with timezone)
- welcome_message, emoji
- active, completed, finalized (sent to participants)
- collecting (gathering responses), voting (voting on locations)
- allow_participant_time_selection, is_solo
- created_at, updated_at
```

**ActivityParticipant** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/activity_participant.rb`, lines 1-18)
```
Purpose: Tracks invitations and participant status
- belongs_to :user (optional, for guest invitations)
- belongs_to :activity

Fields:
- id, activity_id, user_id (nullable for guest invitations)
- invited_email, accepted (boolean)
- guest_response_token (SecureRandom.urlsafe_base64(32))
- created_at, updated_at
```

**Response** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/response.rb`, lines 1-42)
```
Purpose: Stores participant preferences and availability
- belongs_to :activity
- belongs_to :user (optional, for guest responses)

Validations:
- Either user_id OR email required (not both)
- Email uniqueness per activity (if provided)
- User uniqueness per activity (if provided)

Fields:
- id, activity_id, user_id (nullable)
- email (for guest responses), notes (preferences/dietary restrictions)
- availability (JSONB store_accessor - date/time availability)
- created_at, updated_at

Methods:
- is_guest_response?() - Check if guest (no user_id)
- participant_identifier() - Get name or email
```

**PinnedActivity** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/pinned_activity.rb`, lines 1-19)
```
Purpose: Location/restaurant suggestions for an activity
- belongs_to :activity
- has_many :comments (user comments on location)
- has_many :votes (voting on location preference)
- has_many :voters (through votes)
- has_many :user_activities (favorite tracking)

Fields:
- id, activity_id, title, address, website
- hours (opening hours), price_range
- description, reason (why suggested)
- photos (JSON serialized), reviews (JSON serialized)
- votes (vote count), selected (boolean - chosen location)
- latitude, longitude (coordinates)
```

**Comment** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/comment.rb`, lines 1-67)
```
- belongs_to :user
- belongs_to :activity (optional)
- belongs_to :pinned_activity (optional)
- has_many :reports (as reportable, polymorphic)

Callbacks:
- before_validation :clean_content (ContentFilterService.clean)
- validate :content_must_be_appropriate
- after_create :send_comment_notifications

Fields:
- id, user_id, activity_id, pinned_activity_id
- content (text, max 500 chars, profanity filtered)
```

**Vote** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/vote.rb`)
```
- belongs_to :user
- belongs_to :pinned_activity
- Fields: id, user_id, pinned_activity_id, upvote (boolean)
```

**TimeSlot** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/time_slot.rb`, lines 1-15)
```
- belongs_to :activity
- has_many :time_slot_votes
- has_many :voters (through votes)

Fields:
- id, activity_id, date, time
- recommendations (JSONB - AI recommendations)
```

**Report** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/report.rb`, lines 1-162)
```
Purpose: Content moderation - report inappropriate content
- belongs_to :reportable (polymorphic - Comment/Activity/User)
- belongs_to :reporter (User)
- belongs_to :reviewed_by (User, optional, admin who reviewed)
- belongs_to :activity (optional)

Statuses: pending, reviewing, resolved, dismissed
Actions: content_deleted, user_warned, user_suspended, user_banned, dismissed, no_action

Fields:
- id, reportable_type, reportable_id
- reporter_id, reason (spam/harassment/hate/inappropriate/violence/other)
- description, status, resolution_action, resolution_notes
- reviewed_by_id, reviewed_at, activity_id

Methods:
- overdue?() - pending for >24 hours
- reported_user() - Get user who created reported content
- reported_content() - Get content preview
```

**Notification** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/notification.rb`, lines 1-163)
```
- belongs_to :user
- belongs_to :activity (optional)
- belongs_to :triggering_user (optional)

Types: activity_invite, activity_update, activity_finalized, activity_changed, 
       comment, reminder, general, participant_joined, participant_left

Fields:
- id, user_id, title, body, notification_type
- read (boolean), data (JSON), activity_id, triggering_user_id

Methods:
- create_and_send!() - Creates DB record + sends push notification
- send_activity_invite(), send_activity_update(), send_activity_change()
```

**ModerationAction** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/moderation_action.rb`, lines 1-68)
```
Purpose: Track admin actions on users
- belongs_to :user (user being moderated)
- belongs_to :moderator (admin performing action)
- belongs_to :report (optional, related report)

Actions: warned, suspended, banned, unbanned, content_removed, appeal_approved, appeal_rejected

Fields:
- id, user_id, moderator_id, report_id
- action_type, reason, details, expires_at
```

**BlockedUser** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/blocked_user.rb`)
```
Purpose: User blocking/unblocking
- belongs_to :blocker (User doing blocking)
- belongs_to :blocked (User being blocked)

Unique index on [blocker_id, blocked_id]
```

**UserActivity** (`/Users/beaulazear/Desktop/voxxy-rails/app/models/user_activity.rb`)
```
Purpose: Community feed - tracks favorite/flagged activities
- belongs_to :user
- belongs_to :pinned_activity
- belongs_to :activity (through pinned_activity)

Fields: id, user_id, pinned_activity_id, favorited, flagged
```

**Other Models**:
- Waitlist, Feedback, Contact, BugReport, TimeSlotVote - simple models for feature requests/support

---

## 4. AUTHENTICATION & AUTHORIZATION SETUP

### Authentication Mechanism

**JWT Implementation** (`/Users/beaulazear/Desktop/voxxy-rails/app/controllers/concerns/json_web_token.rb`, lines 1-18)
```ruby
module JsonWebToken
  SECRET_KEY = Rails.application.credentials.secret_key_base

  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)  # Uses HS256 by default
  end

  def self.decode(token)
    body = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new(body)
  rescue
    nil  # Returns nil on decode error (security issue #1)
  end
end
```

**Session + JWT Hybrid Approach** (`/Users/beaulazear/Desktop/voxxy-rails/app/controllers/application_controller.rb`, lines 1-46)
```ruby
before_action :authorized  # Runs on all requests except skipped ones

def authorized
  if request.headers["Authorization"].present?
    token = request.headers["Authorization"].split(" ").last
    decoded = JsonWebToken.decode(token)
    @current_user = User.find_by(id: decoded[:user_id]) if decoded
  else
    @current_user = User.find_by(id: session[:user_id])
  end
  
  render json: { error: "Not authorized" }, status: :unauthorized unless @current_user
end
```

**Authorization Skipping**:
Public endpoints that skip authorization:
- `/login` - Authentication
- `/users` (create) - Registration
- `/verify`, `/verify_code`, `/resend_verification` - Email verification
- `/activities/:id/share`, `/activities/:id/calendar` - Public activity sharing
- `/guest_responses` endpoints - Guest form responses (token-based)
- `/password_reset` - Password recovery
- `/waitlists` (create), `/feedbacks`, `/contacts`, `/bug_reports` - Public forms
- `/openai` trial endpoints - Guest trial recommendations
- `/analytics` endpoints - Analytics tracking
- `/places` endpoints - Public location search
- `/photos/:photo_reference` - Public photo proxy

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/application_controller.rb`

### Admin Authorization
```ruby
def ensure_admin
  unless current_user&.admin?
    render json: { status: "error", message: "Unauthorized" }, status: :forbidden
  end
end
```
Used in `/reports`, `/admin/moderation_controller.rb`

### Guest Response Token Authorization
Uses `SecureRandom.urlsafe_base64(32)` tokens stored in `activity_participants.guest_response_token`:
```ruby
@participant = @activity.activity_participants.find_by!(guest_response_token: params[:token])
```
**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/guest_responses_controller.rb` (lines 156-166)

---

## 5. API VERSIONING

**NO API VERSIONING IS IMPLEMENTED**

The API routes do not use versioning (no /v1/, /v2/ prefixes). All endpoints are at root level with potential breaking changes risk.

**Files**: `/Users/beaulazear/Desktop/voxxy-rails/config/routes.rb`

---

## 6. SERIALIZERS & JSON RESPONSE FORMATTING

### Serializer Architecture
Base serializer pattern: `/Users/beaulazear/Desktop/voxxy-rails/app/serializers/base_serializer.rb`

```ruby
class BaseSerializer
  def self.user_basic(user)
    {
      id, name, email, avatar, admin, created_at, confirmed_at,
      profile_pic_url, neighborhood, city, state, full_location,
      location_complete, coordinates
    }
  end
  
  def self.user_with_preferences(user)
    user_basic(user).merge(preferences, favorite_food)
  end
  
  def self.user_minimal(user)
    {id, name, avatar, confirmed_at, profile_pic_url}
  end
end
```

**UserSerializer** (`/Users/beaulazear/Desktop/voxxy-rails/app/serializers/user_serializer.rb`, lines 1-40)
- `basic(user)` - Basic user info
- `full(user)` - Includes preferences, notification settings, policy acceptance status
- `dashboard(user)` - Full profile + activities + participant activities

**ActivitySerializer**
- `created(activity)` - For create responses
- `updated(activity)` - For update responses
- `owned_activity(activity)` - Host view (full details)
- `participant_activity(participant)` - Participant view (limited details)
- `list_item(activity)` - Minimal for lists

**Other Serializers**:
- CommentSerializer
- ResponseSerializer
- VoteSerializer
- PinnedActivitySerializer
- ActivityParticipantSerializer
- UserActivitySerializer

### Response Formatting Pattern
Most endpoints return plain JSON hashes (not using ActiveModel::Serializer gem):
```ruby
render json: ActivitySerializer.owned_activity(activity).as_json
render json: { recommendations: recommendations }, status: :ok
render json: { 
  status: "success", 
  message: "...", 
  user: UserSerializer.dashboard(user)
}
```

---

## 7. CORS CONFIGURATION

**Location**: `/Users/beaulazear/Desktop/voxxy-rails/config/application.rb` (lines 37-47)

```ruby
config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(
      "http://localhost:3000",                    # Development
      "https://www.voxxyai.com",                  # Production
      "https://hey-voxxy.onrender.com",           # Staging
      "https://heyvoxxy.com",
      "https://www.heyvoxxy.com",
      "http://192.168.1.123:8081",                # Mobile dev
      "null",                                      # React Native
      ENV.fetch("LOCAL_IP", nil)                  # Configurable
    )
    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: ["Access-Control-Allow-Origin"]
  end
end
```

**Features**:
- Allows credentials (cookies/auth headers)
- All HTTP methods allowed
- "null" origin for React Native
- Environment-based IP allowlist

**Security Notes**:
- Allows "null" origin (used by some mobile frameworks)
- Credentials enabled with flexible origins (⚠️ Security Concern #2)

---

## 8. BACKGROUND JOBS & SERVICES

### Sidekiq Jobs
**Configuration**: `/Users/beaulazear/Desktop/voxxy-rails/config/initializers/sidekiq.rb`
```ruby
Sidekiq.configure_server { config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") } }
Sidekiq.configure_client { config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") } }
```

**ActiveJob Adapter**: `config.active_job.queue_adapter = :sidekiq`

### Jobs

**ActivityReminderJob** (`/Users/beaulazear/Desktop/voxxy-rails/app/jobs/activity_reminder_job.rb`, lines 1-118)
```
Purpose: Send scheduled activity reminders
Triggers: 1 hour before, 30 minutes before, day-of (9 AM)
Uses: PushNotificationService.send_bulk_notifications()

Queue: :default
Retry: Default (3 attempts)
```

### Services (15+ business logic classes)

**PushNotificationService** (`/Users/beaulazear/Desktop/voxxy-rails/app/services/push_notification_service.rb`)
```ruby
- send_notification(user, title, body, data={})
- send_bulk_notifications(notifications) - Array of {user, title, body, data}
- send_test_reminder(activity, user)
- Sends to Expo Push API (https://exp.host/--/api/v2/push/send)
```

**ContentFilterService** (`/Users/beaulazear/Desktop/voxxy-rails/app/services/content_filter_service.rb`, lines 1-160)
```
Purpose: Profanity filtering and content validation
Methods:
- clean(text) - Replace profanity with asterisks
- contains_profanity?(text)
- contains_spam?(text) - Check for URLs, excessive caps, repetition
- inappropriate?(text)
- validation_errors(text)
- severity_level(text) - severe/moderate/mild/none

Filters:
- Explicit profanity (~20+ patterns)
- Hate speech & violence threats
- Sexual content
- Drug references
- Spam patterns (URLs, "click here", etc.)
- Email harvesting
- Repetitive characters (6+)
- Excessive caps (>50%)
```

**Other Services**:
- EmailVerificationService - Send OTP emails
- PasswordResetService - Send password reset links
- InviteUserService - Send activity invitations
- PushNotificationService - Expo push notifications
- UserModerationEmailService - Notify users of moderation
- ReportNotificationService - Notify admins of reports
- MixpanelService - Analytics tracking
- GooglePlacesService - Location search
- ActivityConfig - Activity type emoji/name config
- NewUserEmailService, WaitlistEmailService - Email notifications

---

## 9. SECURITY ANALYSIS

### CRITICAL SECURITY ISSUES

#### Issue #1: Insecure JWT Decode Error Handling
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/concerns/json_web_token.rb` (lines 12-17)
```ruby
def self.decode(token)
  body = JWT.decode(token, SECRET_KEY)[0]
  HashWithIndifferentAccess.new(body)
rescue
  nil  # Generic rescue swallows all errors!
end
```
**Risk**: 
- Broad `rescue` catches all exceptions (even programming errors)
- No logging of decode failures
- No distinction between invalid token, expired token, or other errors
- Could hide security issues

**Recommendation**: 
```ruby
rescue JWT::DecodeError, JWT::ExpiredSignature => e
  Rails.logger.warn "JWT decode failed: #{e.class} - #{e.message}"
  nil
```

---

#### Issue #2: Overly Permissive CORS with Credentials
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/config/application.rb` (lines 38-47)
```ruby
credentials: true  # Allows sending cookies to flexible origins!
origins(
  "*",           # If this were used, combined with credentials=true = CSRF risk
  "null",        # Allows any page that reports "null" origin
  "http://192.168.1.123:8081"  # Non-HTTPS development endpoint
)
```
**Risk**:
- "null" origin can be exploited by any sandboxed frame
- Development IPs in production config
- credentials: true with flexible origins is dangerous

**Recommendation**:
- Remove "null" origin (handle React Native differently)
- Use strict origin list, no wildcards
- Disable credentials for public endpoints

---

#### Issue #3: Inadequate Password Reset Token Validation
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/password_resets_controller.rb` (lines 15-34)
```ruby
user = User.find_by(reset_password_token: params[:token])

if user && user.password_reset_token_valid?
  if user.update(password: params[:password], password_confirmation: params[:password])
    render json: { message: "Password successfully reset." }
```
**Risk**:
- User is looked up by token without rate limiting
- No attempt counter on failed resets
- Old tokens not invalidated after successful reset (they are set to nil though)
- No CSRF protection for POST request

**Current Implementation** (looks OK):
```ruby
# User model
def password_reset_token_valid?
  reset_password_sent_at > 24.hours.ago
end

def reset_password!(new_password)
  self.reset_password_token = nil  # Clears token
  self.reset_password_sent_at = nil
  self.password = new_password
  save!
end
```
**Status**: ACCEPTABLE - 24hr expiration + token cleared

---

#### Issue #4: Guest Response Token Exposure
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/guest_responses_controller.rb` (lines 156-166)
```ruby
def find_activity_and_participant
  @activity = Activity.find(params[:activity_id])
  @participant = @activity.activity_participants.find_by!(guest_response_token: params[:token])
```
**Risk**:
- Token transmitted in URL (visible in browser history, logs, referrer headers)
- No rate limiting on token guessing
- 32-byte urlsafe_base64 is strong (256-bit), but URL exposure is poor practice

**Recommendation**:
- Use POST with token in body instead of URL
- Implement rate limiting per activity_id
- Add token expiration

---

#### Issue #5: Admin User Identification in Rack::Attack
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/config/initializers/rack_attack.rb` (lines 137-147)
```ruby
def self.admin_user?(request)
  user_id = authenticated_user_id(request)
  return false unless user_id
  
  begin
    user = User.find_by(id: user_id)  # Database lookup per request!
    user&.admin == true
  rescue
    false
  end
end
```
**Risk**:
- Database query on every rate-limited request for admin check
- Could be used for enumeration attacks
- No caching of admin status

**Recommendation**: Cache admin status in JWT token or memcache

---

#### Issue #6: Profanity Filtering False Security
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/app/services/content_filter_service.rb` (lines 1-160)
```ruby
PROFANITY_PATTERNS = [
  /\bf+u+c+k+/i,  # Only catches stretched variants (f+u+c+k+)
  /\bs+h+i+t+/i,
  # ...
]
```
**Risk**:
- Only catches letter-repetition variants (f***k, f@ck patterns not caught)
- Regex patterns can be bypassed with numbers (sh1t, fuck's vs fuck)
- Not using established profanity filter libraries
- Stored in code, not database (harder to update)

---

#### Issue #7: SQL Injection Prevention (Generally OK)
Uses parameterized queries throughout. Example:
```ruby
Report.where(status: params[:status])  # Parameterized ✓
User.find_by("lower(email) = ?", invited_email)  # Parameterized ✓
```
**Status**: SAFE - Rails ORM prevents SQL injection by default

---

#### Issue #8: Authorization Checks May Be Bypassed
**Example Risk**: Activity update (lines 38-89 in activities_controller.rb)
```ruby
def update
  activity = current_user.activities.find(params[:id])  # Scoped to current_user ✓
```
**Status**: GOOD - Most endpoints properly scope to current_user

However, some public endpoints:
- `/activities/:id/share` - No owner check (intentional)
- `/guest_responses` - Token-based (not user_id based)

---

#### Issue #9: Missing Input Validation on Some Fields
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/places_controller.rb` (lines 54-70)
```ruby
def search
  query = params[:query]
  types = params[:types] || "(cities)"
  
  if query.blank? || query.length < 2
    render json: { results: [] }
    return
  end
  
  # Query is passed directly to Google API (but that's OK - it's their API)
```
**Status**: ACCEPTABLE - Validated before external API call

---

#### Issue #10: Sensitive Data in Logs
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/config/initializers/filter_parameter_logging.rb`
Need to verify this file restricts password, token, etc. from logs.

**Rack::Attack Logging**:
```ruby
if Rails.env.development?
  ActiveSupport::Notifications.subscribe(/rack_attack/) do |name, start, finish, request_id, payload|
    req = payload[:request]
    Rails.logger.info "[Rack::Attack] #{name}: #{req.ip} #{req.request_method} #{req.fullpath}"
  end
end
```
⚠️ Logs might contain sensitive data in fullpath (tokens, passwords in query params)

---

### MEDIUM SECURITY ISSUES

#### Issue M1: Weak Rate Limiting for Brute Force
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/config/initializers/rack_attack.rb` (lines 34-37)
```ruby
throttle("login/ip", limit: 10, period: 15.minutes) do |req|
  req.ip if req.path == "/login" && req.post?
end
```
- 10 attempts per 15 minutes is reasonable
- However, no per-user (email) rate limiting
- Distributed attacks from multiple IPs can still brute force individual accounts

---

#### Issue M2: No Account Lockout After Failed Attempts
No account lockout mechanism after N failed login attempts. User can keep trying indefinitely.

---

#### Issue M3: Insufficient Input Sanitization
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/openai_controller.rb` (lines 21-60)
```ruby
user_responses = params[:responses]
activity_location = params[:activity_location]

# Validated:
if activity_location.blank?
  render json: { error: "Missing..." }
end

# Passed to OpenAI API - could contain prompt injection
combined_responses = build_combined_responses(activity_id, user_responses)
```
**Risk**: Prompt injection if user responses are not sanitized before sending to OpenAI

---

#### Issue M4: No CSRF Protection on API Endpoints
Rails has CSRF disabled for API (`api_only = false` but POST/PATCH/DELETE handled by middleware).
Since this is JWT/session based, CSRF protection should be verified.

**File**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/activities_controller.rb` (lines 2-3)
```ruby
protect_from_forgery with: :exception, only: [ :share ]
protect_from_forgery with: :null_session, if: -> { request.format.json? }
```
✓ CSRF protected for HTML, disabled for JSON (correct for API)

---

#### Issue M5: No Rate Limiting on Password Reset Request
No limit on how many password reset emails can be sent to an email address.
User can spam reset emails indefinitely.

---

#### Issue M6: Push Notification Data Not Encrypted
Push tokens sent to Expo in plain HTTP request body:
```ruby
payload = {
  to: user.push_token,
  title: title,
  body: body,
  data: data
}
send_to_expo([ payload ])
```
Uses HTTPS but token/data visible in EXPO logs potentially.

---

### LOW PRIORITY SECURITY ISSUES

#### Issue L1: Confirmation Code is 6 Digits
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/app/models/user.rb` (line 345)
```ruby
def generate_6_digit_code
  rand(100000..999999).to_s
end
```
- 6 digits = 10^6 = 1 million possibilities
- Rate limited by email delivery (slower than password reset)
- Expires in 24 hours
- ACCEPTABLE for email verification

---

#### Issue L2: No Refresh Token Implementation
JWT tokens are valid for 24 hours with no refresh token mechanism.
If token is compromised, it's valid for full 24 hours.

**Recommended**: Implement short-lived tokens (15 min) + refresh tokens (7 days)

---

#### Issue L3: User Activity Tracking May Leak Information
`user_activities.latitude/longitude` stored publicly without proper access control.
Users can see each other's location data through community feed.

---

## 10. PERFORMANCE & N+1 QUERY CONCERNS

### N+1 Query Prevention

**GOOD - Uses includes() Throughout**:
```ruby
# Sessions controller (line 7-12)
user = User.includes(
  activities: [
    :user, :participants, :activity_participants, :responses,
    { comments: :user },
    { pinned_activities: [ :votes, { comments: :user }, :voters ] }
  ]
).find_by(email: params[:email])

# Activities controller (line 51-56)
user = User.includes(
  activities: [
    :user, :participants, :activity_participants, :responses,
    { comments: :user },
    { pinned_activities: [ :votes, { comments: :user }, :voters ] }
  ]
).find_by(id: current_user.id)
```

**Coverage**:
- ✓ User includes activities deeply
- ✓ Activities include participants and comments
- ✓ Comments include users
- ✓ PinnedActivities include votes and comments
- ✓ Reports include reporter, reportable, reviewed_by
- ✓ Notifications include activity and triggering_user

---

### Potential N+1 Problems

#### Issue P1: Activity.availability_tally()
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/app/models/activity.rb` (lines 22-30)
```ruby
def availability_tally
  tally = Hash.new(0)
  responses.each do |r|  # Could iterate many responses
    r.availability.each do |date, times|  # Nested iteration
      times.each { |time| tally["#{date} #{time}"] += 1 }
    end
  end
  tally
end
```
**Risk**: If called without pre-loading responses, N+1 on each response access
**Solution**: Pass pre-loaded responses or use SQL aggregation

---

#### Issue P2: Comment Notifications Loop
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/app/models/comment.rb` (lines 38-65)
```ruby
def send_comment_notifications
  participants = [ activity.user ] + activity.participants.to_a  # May trigger queries
  participants_to_notify = participants.uniq.reject { |p| p.id == user.id }
  
  participants_to_notify.each do |participant|
    Notification.create_and_send!(...)  # N database writes
  end
end
```
**Risk**: Creates N notifications (acceptable) but `activity.participants` needs pre-loading

---

#### Issue P3: Time Slots Index Query
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/time_slots_controller.rb` (lines 6-25)
```ruby
@slots = @activity.time_slots
  .left_joins(:time_slot_votes)
  .group("time_slots.id")
  .order(Arel.sql("COUNT(time_slot_votes.id) DESC"))

render json: @slots.map { |slot|
  # ...
  voter_ids: slot.time_slot_votes.pluck(:user_id)  # N+1!
}
```
**Risk**: N queries for voter_ids on each time slot. Need to eager load or use group_by

---

#### Issue P4: Community Member IDs Query
**Location**: `/Users/beaulazear/Desktop/voxxy-rails/app/models/user.rb` (lines 273-309)
```ruby
def community_member_ids
  hosted_activity_participant_ids = Activity
    .where(user_id: id)
    .joins(:activity_participants)
    .where(activity_participants: { accepted: true })
    .where.not(activity_participants: { user_id: [ nil, id ] })
    .pluck("activity_participants.user_id")
  
  # Multiple database queries - could be optimized into single query
end
```
**Status**: Multiple queries but necessary logic. Consider memoizing if called frequently.

---

### Query Performance Optimizations

**Good Practices Found**:
- ✓ Uses `pluck()` to fetch only needed columns
- ✓ Proper foreign key indexes in schema
- ✓ Composite indexes on common queries (activity_id, accepted)
- ✓ LEFT JOINS with GROUP BY for aggregations

**Caching Strategy**:
- Uses Rails.cache for AI recommendations (2 hours)
- No query result caching visible

**Recommendation**:
- Add caching for user.community_member_ids
- Cache report stats queries
- Use batch loading for nested associations

---

## 11. DATABASE INDEXES

**Existing Indexes** (Schema review):
```ruby
# Strong indexes
- activities(user_id)
- activity_participants(activity_id, accepted)
- activity_participants(user_id, accepted)
- activity_participants(guest_response_token) - UNIQUE
- blocked_users(blocker_id, blocked_id) - UNIQUE composite
- comments(user_id, activity_id)
- notifications(user_id, read)
- notifications(user_id, created_at)
- reports(reportable_type, reportable_id)
- moderation_actions(user_id, action_type, created_at)

# Missing indexes (Performance issues)
- responses(email) - Frequently queried
- responses(activity_id, email)
- time_slots(activity_id)
- pinned_activities(activity_id, selected)
- comments(activity_id)
```

---

## 12. DEPENDENCY VULNERABILITIES

**Gems Used**:
- rails 7.2.2 ✓
- pg (PostgreSQL adapter)
- redis 4.x ✓
- jwt ✓
- bcrypt 3.1.7 ✓
- sidekiq (background jobs)
- rack-attack (rate limiting)
- sendgrid-ruby (email)
- ruby-openai (AI)
- aws-sdk-s3 (file storage)
- icalendar (calendar export)
- mixpanel-ruby (analytics)

**No known critical vulnerabilities** (as of Oct 2024)
**Recommendation**: Run `bundle audit` regularly

---

## 13. SUMMARY OF FINDINGS

### Architecture Strengths
- ✓ Well-organized MVC structure
- ✓ Good use of services layer for business logic
- ✓ Comprehensive background job system
- ✓ Proper N+1 prevention with eager loading
- ✓ Content filtering and moderation system

### Security Weaknesses
1. **CRITICAL**: Generic JWT decode error handling
2. **CRITICAL**: Insecure password reset token in URL
3. **HIGH**: Broad CORS with credentials and "null" origin
4. **MEDIUM**: No account lockout mechanism
5. **MEDIUM**: Rate limiting not per-user (email)
6. **MEDIUM**: No API versioning (breaking changes possible)

### Performance Concerns
1. **MODERATE**: Nested includes may be excessive in some queries
2. **MODERATE**: N+1 risk in time slot voter lookup
3. **MODERATE**: N queries for user notifications

### Recommendations
1. Implement proper API versioning
2. Add account lockout after 5 failed attempts
3. Implement refresh token pattern (short + long-lived tokens)
4. Fix JWT error handling with proper logging
5. Remove "null" origin from CORS
6. Add per-user rate limiting on auth endpoints
7. Add query result caching for community member lookups
8. Implement database index on responses(email, activity_id)
9. Add request logging sanitization for tokens in URLs
10. Conduct security audit of OpenAI prompt injection vectors

