# Content Moderation System Implementation

## Overview
Complete content moderation system implemented for Voxxy Rails API to support iOS App Store compliance requirements.

## Database Changes

### New Tables Created

1. **reports** - Stores all user reports
   - Polymorphic association (can report comments, users, activities)
   - Tracks reporter, reason, status, resolution
   - Includes review timestamps and moderator actions

2. **moderation_actions** - Audit log of all moderation activities
   - Records warnings, suspensions, bans
   - Links to moderator who took action
   - Tracks expiration for temporary actions

3. **User table additions**
   - `status` - active/suspended/banned
   - `suspended_until` - Timestamp for suspension end
   - `suspension_reason` - Why user was suspended
   - `banned_at` - Permanent ban timestamp
   - `ban_reason` - Why user was banned
   - `warnings_count` - Number of warnings received
   - `reports_count` - Number of reports filed against user

## API Endpoints

### Public Endpoints

#### POST /reports
Create a new report for content moderation
```json
{
  "report": {
    "reportable_type": "Comment",
    "reportable_id": 123,
    "reason": "harassment",
    "description": "Optional details",
    "activity_id": 456
  }
}
```

### Admin Endpoints

#### GET /reports
List all reports with filtering options
- Query params: `status`, `overdue`, `page`

#### PATCH /reports/:id/review
Mark report as under review

#### PATCH /reports/:id/resolve
Resolve report with action
```json
{
  "resolution_action": "user_warned",
  "resolution_notes": "First offense warning issued"
}
```

#### PATCH /reports/:id/dismiss
Dismiss report as invalid

#### GET /reports/stats
Get moderation statistics dashboard

#### POST /admin/users/:id/suspend
Suspend a user
```json
{
  "duration": 7,
  "reason": "Repeated violations"
}
```

#### POST /admin/users/:id/ban
Permanently ban a user

## Models

### Report Model
- Handles all content reporting
- Automatic admin notifications on creation
- Tracks 24-hour SLA for review
- Resolution actions trigger user moderation

### ModerationAction Model
- Audit trail for all moderation activities
- Links reports to actions taken
- Tracks temporary vs permanent actions

### User Model Enhancements
Added moderation methods:
- `suspend!(duration, reason, moderator)`
- `unsuspend!(moderator)`
- `ban!(reason, moderator)`
- `unban!(moderator)`
- `can_login?` - Checks if user can access system
- `check_suspension_expiry` - Auto-lifts expired suspensions

## Email Notifications

### ReportNotificationService
- Sends immediate email to all admins when report filed
- Includes direct link to review report
- Highlights overdue reports

### UserModerationEmailService
- Warning emails with violation details
- Suspension notifications with end date
- Ban notifications with appeal instructions

## Security Features

1. **Duplicate Report Prevention**
   - Users can only report same content once
   - Unique index prevents spam reporting

2. **Admin Authorization**
   - All moderation actions require admin role
   - Audit trail of who took what action

3. **Rate Limiting Ready**
   - Reports controller can integrate with Rack::Attack
   - Prevent report spam attacks

## Operational Requirements

### 24-Hour Response SLA
- Reports have `overdue?` method
- Dashboard highlights overdue reports
- Email notifications flag urgent items

### Monitoring Recommendations
1. Set up alerts for reports older than 20 hours
2. Daily digest of moderation metrics
3. Weekly report of user violations

## Testing the System

### Create Test Report (Rails Console)
```ruby
user = User.first
comment = Comment.first
report = Report.create!(
  reporter: user,
  reportable: comment,
  reason: 'harassment',
  description: 'Test report'
)
```

### Test User Suspension
```ruby
user = User.find(123)
admin = User.find_by(admin: true)
user.suspend!(7.days, "Test suspension", admin)
```

### Check Moderation Status
```ruby
user.suspended? # => true/false
user.can_login? # => true/false
Report.overdue.count # => Number of overdue reports
```

## Frontend Integration

The mobile app sends reports to `/reports` endpoint with:
```javascript
{
  "report": {
    "reportable_type": "comment",
    "reportable_id": commentId,
    "reason": selectedReason,
    "reporter_id": currentUserId,
    "activity_id": activityId
  }
}
```

## Compliance Checklist

✅ **Database ready** - All tables and indexes created
✅ **API endpoints** - Report creation and management
✅ **Email notifications** - Admins notified immediately
✅ **User suspension/ban** - Full user management system
✅ **Audit trail** - All actions logged with timestamps
✅ **24-hour tracking** - Overdue reports flagged
✅ **Appeal process** - Email contact for appeals

## Next Steps

1. **Create SendGrid Email Templates**
   - Report notification template
   - Warning email template
   - Suspension notification template
   - Ban notification template

2. **Admin Dashboard UI**
   - Build web interface for report review
   - Bulk moderation actions
   - User history view

3. **Automated Content Filtering**
   - Implement AI content analysis
   - Auto-flag suspicious content
   - Pattern recognition for repeat offenders

4. **Analytics Dashboard**
   - Report trends over time
   - User violation patterns
   - Response time metrics

## Deployment Checklist

- [ ] Run migrations: `rails db:migrate`
- [ ] Set admin users: `User.find_by(email: 'admin@voxxyai.com').update(admin: true)`
- [ ] Configure email settings in production
- [ ] Test report creation from mobile app
- [ ] Verify email notifications working
- [ ] Set up 24-hour review process
- [ ] Train moderation team on new tools

## Support Contact

For questions about this implementation:
- Check Rails logs: `tail -f log/development.log`
- Test endpoints: Use Postman or curl
- Email alerts: Check SendGrid dashboard

This system provides complete content moderation compliance for App Store requirements.