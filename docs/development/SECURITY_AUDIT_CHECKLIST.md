# Voxxy Rails API - Security Audit Checklist

**Audit Date:** November 21, 2025
**Auditor:** Claude Code Security Analysis
**Rails Version:** 7.2.2
**Brakeman Version:** 7.1.0

---

## Critical Issues

### 1. Mass Assignment Vulnerability - Role Escalation
- [x] **Fixed** (2025-11-21)
- [ ] **Tested**
- [ ] **Deployed**

**File:** `app/controllers/users_controller.rb:259-263`
**Severity:** CRITICAL

**Current Code:**
```ruby
if Rails.env.development? || current_user.admin?
  permitted << :role
end
```

**Issue:** The `role` parameter check uses `current_user` which may be nil during registration. In development mode, ANY user can set their role to `admin`.

**Recommendation:**
- Never allow role to be set via user_params during registration
- Create a separate admin-only endpoint for role management
- Remove the development mode bypass entirely

---

### 2. Sensitive Data Exposure - Confirmation Code
- [x] **Fixed** (2025-11-21)
- [ ] **Tested**
- [ ] **Deployed**

**File:** `app/serializers/user_serializer.rb:15`
**Severity:** CRITICAL

**Current Code:**
```ruby
def self.full(user)
  basic(user).merge(
    ...
    confirmation_code: user.confirmation_code,
    ...
  )
end
```

**Issue:** Email verification confirmation code is exposed in API responses, allowing attackers to verify accounts without email access.

**Recommendation:** Remove `confirmation_code` from the serializer completely.

---

### 3. Insecure Direct Object Reference (IDOR) - Vote Deletion
- [x] **Fixed** (2025-11-21)
- [ ] **Tested**
- [ ] **Deployed**

**File:** `app/controllers/votes_controller.rb:21-35`
**Severity:** HIGH

**Current Code:**
```ruby
def destroy
  vote = Vote.find_by(id: params[:id])
  if vote&.destroy
    # ...
  end
end
```

**Issue:** Any authenticated user can delete ANY vote by ID - no ownership check.

**Recommendation:**
```ruby
def destroy
  vote = current_user.votes.find_by(id: params[:id])
  # ...
end
```

---

### 4. Missing Authorization - PinnedActivities Create
- [x] **Fixed** (2025-11-21)
- [ ] **Tested**
- [ ] **Deployed**

**File:** `app/controllers/pinned_activities_controller.rb:4-16`
**Severity:** HIGH

**Current Code:**
```ruby
def create
  activity = Activity.find(params[:activity_id])
  pinned_activity = activity.pinned_activities.build(pinned_activity_params)
```

**Issue:** Any authenticated user can create pinned activities on ANY activity.

**Recommendation:** Verify user is owner or participant:
```ruby
def create
  activity = current_user.activities.find_by(id: params[:activity_id]) ||
             Activity.joins(:participants).where(id: params[:activity_id], participants: { id: current_user.id }).first

  return render json: { error: "Not authorized" }, status: :forbidden unless activity
  # ...
end
```

---

### 5. Missing Authorization - PinnedActivities Destroy
- [x] **Fixed** (2025-11-21)
- [ ] **Tested**
- [ ] **Deployed**

**File:** `app/controllers/pinned_activities_controller.rb:31-46`
**Severity:** HIGH

**Current Code:**
```ruby
def destroy
  activity = Activity.find_by(id: params[:activity_id])
  # No authorization check
  pinned_activity.destroy
```

**Issue:** Any authenticated user can delete pinned activities from any activity.

**Recommendation:** Add ownership verification before deletion.

---

## Medium Severity Issues

### 6. URL Parameter Injection in Redirect
- [ ] **Fixed**
- [ ] **Tested**
- [ ] **Deployed**

**File:** `app/controllers/users_controller.rb:188`
**Severity:** MEDIUM

**Current Code:**
```ruby
redirect_to "#{frontend_host}#/signup?invited_email=#{invited_email}&activity_id=#{activity_id}"
```

**Issue:** User-controlled parameters interpolated without URL encoding - potential XSS vector.

**Recommendation:**
```ruby
redirect_to "#{frontend_host}#/signup?invited_email=#{CGI.escape(invited_email.to_s)}&activity_id=#{CGI.escape(activity_id.to_s)}"
```

---

### 7. Session Configuration - SameSite None
- [ ] **Reviewed**
- [ ] **Risk Accepted** OR **Mitigated**

**File:** `config/application.rb:11`
**Severity:** MEDIUM

**Current Code:**
```ruby
config.session_store :cookie_store, key: "_session_id", same_site: :none, secure: Rails.env.production?
```

**Issue:** `same_site: :none` weakens CSRF protection. Required for CORS but increases attack surface.

**Recommendation:**
- Ensure all state-changing operations validate CSRF tokens
- Consider using JWT-only authentication for cross-origin requests
- Document this as an accepted risk if necessary for business requirements

---

### 8. Missing Authorization - Comments on Any Activity
- [ ] **Fixed**
- [ ] **Tested**
- [ ] **Deployed**

**File:** `app/controllers/comments_controller.rb:4-18`
**Severity:** MEDIUM

**Current Code:**
```ruby
def create
  activity = Activity.find_by(id: params[:activity_id])
  # No authorization check
  comment = Comment.new(comment_params)
```

**Issue:** Any authenticated user can comment on any activity, even ones they're not part of.

**Recommendation:** Verify user is owner or participant before allowing comments.

---

### 9. Weak Password Reset Token Entropy
- [ ] **Fixed**
- [ ] **Tested**
- [ ] **Deployed**

**File:** `app/models/user.rb:64-67`
**Severity:** MEDIUM

**Current Code:**
```ruby
def generate_password_reset_token
  self.reset_password_token = SecureRandom.hex(10)  # 80 bits
```

**Recommendation:** Increase to 256 bits:
```ruby
self.reset_password_token = SecureRandom.urlsafe_base64(32)
```

---

### 10. Admin Rate Limit Bypass
- [ ] **Reviewed**
- [ ] **Risk Accepted** OR **Mitigated**

**File:** `config/initializers/rack_attack.rb:18-19, 28-29`
**Severity:** MEDIUM

**Current Code:**
```ruby
next if admin_user?(req)  # Skip rate limiting for admins
```

**Issue:** Compromised admin accounts bypass all rate limiting.

**Recommendation:** Keep rate limits for admins with higher thresholds (e.g., 10x normal limits).

---

### 11. JWT Algorithm Not Specified
- [ ] **Fixed**
- [ ] **Tested**
- [ ] **Deployed**

**File:** `app/controllers/concerns/json_web_token.rb:12-17`
**Severity:** MEDIUM

**Current Code:**
```ruby
def self.decode(token)
  body = JWT.decode(token, SECRET_KEY)[0]
  HashWithIndifferentAccess.new(body)
rescue
  nil
end
```

**Issue:**
1. No algorithm specified (potential algorithm confusion attack)
2. Bare `rescue` catches all exceptions

**Recommendation:**
```ruby
def self.decode(token)
  body = JWT.decode(token, SECRET_KEY, true, { algorithm: 'HS256' })[0]
  HashWithIndifferentAccess.new(body)
rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError
  nil
end
```

---

### 12. Accept/Decline Endpoints Without Token Validation
- [ ] **Fixed**
- [ ] **Tested**
- [ ] **Deployed**

**File:** `app/controllers/activity_participants_controller.rb:57-133`
**Severity:** MEDIUM

**Current Code:**
```ruby
skip_before_action :authorized, only: [ :accept, :decline ]

def accept
  invited_email = params[:email]&.strip&.downcase
  activity_id = params[:activity_id]
  participant = ActivityParticipant.find_by(invited_email: invited_email, activity_id: activity_id)
```

**Issue:** Anyone who knows an email and activity ID can accept/decline invitations.

**Recommendation:** Require `guest_response_token` validation like `GuestResponsesController`:
```ruby
def accept
  participant = ActivityParticipant.find_by!(
    guest_response_token: params[:token],
    activity_id: params[:activity_id]
  )
  # ...
end
```

---

## Low Severity Issues

### 13. Debug Logging in Production
- [ ] **Fixed**
- [ ] **Tested**
- [ ] **Deployed**

**File:** `app/controllers/sessions_controller.rb:5`
**Severity:** LOW

**Current Code:**
```ruby
puts "Request Origin: #{request.headers['Origin']}"
```

**Recommendation:** Remove or use proper logging:
```ruby
Rails.logger.debug "Request Origin: #{request.headers['Origin']}" if Rails.env.development?
```

---

### 14. User Agent Blocking Configuration
- [ ] **Reviewed**
- [ ] **Risk Accepted** OR **Adjusted**

**File:** `config/initializers/rack_attack.rb:89`
**Severity:** LOW

**Current Code:**
```ruby
req.user_agent&.match?(/curl|wget|scanner|bot/i)
```

**Issue:** May block legitimate API testing or CI/CD integrations using curl.

**Recommendation:** Consider removing `curl` from blocklist or adding IP whitelist for known services.

---

### 15. Missing Content Security Policy
- [ ] **Implemented**
- [ ] **Tested**
- [ ] **Deployed**

**File:** `config/initializers/content_security_policy.rb`
**Severity:** LOW

**Issue:** CSP is commented out. Share pages render HTML and would benefit from CSP.

**Recommendation:** Enable CSP for HTML responses:
```ruby
Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.script_src  :self
    policy.style_src   :self, :unsafe_inline
    # Add other directives as needed
  end
end
```

---

## Security Strengths (No Action Required)

These items are implemented correctly:

- [x] Rate Limiting with Rack::Attack
- [x] bcrypt password hashing via `has_secure_password`
- [x] Sensitive parameter filtering in logs
- [x] Email verification for new accounts
- [x] User moderation system (suspend/ban)
- [x] User blocking functionality
- [x] Guest response token system
- [x] Explicit CORS allowed origins
- [x] No SQL injection via string interpolation

---

## Remediation Priority

### Immediate (This Week)
1. [x] Issue #2 - Remove confirmation_code from serializer (DONE 2025-11-21)
2. [x] Issue #3 - Fix VotesController IDOR (DONE 2025-11-21)
3. [x] Issue #4 - Add authorization to PinnedActivities create (DONE 2025-11-21)
4. [x] Issue #5 - Add authorization to PinnedActivities destroy (DONE 2025-11-21)

### Short-term (Next 2 Weeks)
5. [x] Issue #1 - Fix mass assignment for role parameter (DONE 2025-11-21)
6. [ ] Issue #12 - Add token validation to accept/decline
7. [ ] Issue #8 - Fix Comments authorization
8. [ ] Issue #11 - Specify JWT algorithm

### Medium-term (Next Month)
9. [ ] Issue #6 - URL encode redirect parameters
10. [ ] Issue #9 - Increase password reset token entropy
11. [ ] Issue #13 - Remove debug logging
12. [ ] Issue #15 - Enable CSP for HTML responses

### Review & Document
13. [ ] Issue #7 - Review SameSite cookie configuration
14. [ ] Issue #10 - Review admin rate limit bypass
15. [ ] Issue #14 - Review user agent blocking

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Security Review | | | |
| Product Owner | | | |

---

## Notes

_Add any implementation notes, decisions, or follow-up items here:_

### 2025-11-21 - Initial Security Fixes (Critical Issues)

**Fixed by:** Claude Code Security Analysis

**Changes Made:**
1. `app/serializers/user_serializer.rb` - Removed `confirmation_code` from `full()` method
2. `app/controllers/votes_controller.rb` - Changed `Vote.find_by(id:)` to `current_user.votes.find_by(id:)`
3. `app/controllers/pinned_activities_controller.rb` - Added `set_activity` and `authorize_activity_access` before_actions
4. `app/controllers/users_controller.rb` - Removed `role` from permitted params entirely

**Frontend Impact:**
- Check frontend for `user.confirmation_code` usage - should be removed if present
- Verification flow should rely on user entering code from email, not API response

**Testing Notes:**
- Rails app loads successfully
- Security fixes verified via Rails runner
- Pre-existing test suite has 160+ failures (not caused by our changes)
- Test suite has bugs: references `confirmation_token` but model uses `confirmation_code`

**Remaining Work:**
- Medium severity issues (6-12) still pending
- Low severity issues (13-15) still pending
- Consider fixing test suite bugs separately
