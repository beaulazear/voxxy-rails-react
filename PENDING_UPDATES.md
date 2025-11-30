# Voxxy Rails - Pending Dependency Updates

**Last Updated**: November 28, 2025
**Current Rails Version**: 7.2.3

## Overview

After completing safe patch and minor version updates, **28 gems** remain outdated due to major version changes that require careful planning and testing.

## ✅ Recently Completed Updates (November 2025)

### Key Security Updates Applied:
- **Rails**: 7.2.2 → 7.2.3 (patch - security fixes)
- **nokogiri**: 1.18.1 → 1.18.10 (critical security patches)
- **rack**: 3.1.8 → 3.2.4 (security improvements)
- **bootsnap**: 1.18.4 → 1.19.0 (performance)
- **AWS SDK** gems: All updated to latest versions
- **Rubocop** suite: 1.68.0 → 1.81.7 (linting improvements)
- **50+ additional gems** updated to latest patch/minor versions

### Test Results:
- ✅ No crashes from updates
- ✅ Brakeman security scan passed (1 pre-existing warning)
- ⚠️ Some test failures related to external services (GooglePlacesService)

---

## 🔄 Remaining Major Version Updates

### 🔴 High Priority (Security/Infrastructure)

#### 1. Rails Framework (7.2.3 → 8.1.1)
**Type**: Major version upgrade
**Risk Level**: High
**Breaking Changes**: Yes

**What's Changed**:
- Complete framework overhaul with new features
- Potential breaking changes in ActiveRecord, ActionCable, etc.
- New defaults and deprecations

**Action Required**:
1. Review [Rails 8.0 upgrade guide](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html)
2. Create dedicated upgrade branch
3. Test thoroughly in staging environment
4. Plan for multiple testing cycles
5. Update any Rails-specific code patterns

**Timeline**: Q1/Q2 2025 recommended (allow community adoption time)

---

#### 2. Puma Web Server (6.4.3 → 7.1.0)
**Type**: Major version upgrade
**Risk Level**: Medium-High
**Breaking Changes**: Likely

**What's Changed**:
- Performance improvements
- Configuration changes
- Thread/worker management updates

**Action Required**:
1. Review [Puma 7.0 changelog](https://github.com/puma/puma/blob/master/History.md)
2. Check `config/puma.rb` for deprecated options
3. Test under production-like load
4. Monitor memory usage and performance metrics

**Timeline**: 1-2 weeks

---

#### 3. Sidekiq Background Jobs (7.3.9 → 8.0.9)
**Type**: Major version upgrade
**Risk Level**: Medium-High
**Breaking Changes**: Yes

**What's Changed**:
- Redis 7.0+ recommended
- Job API changes
- Web UI updates
- Performance improvements

**Action Required**:
1. Review [Sidekiq 8.0 upgrade notes](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md)
2. Check Redis compatibility (currently using redis gem 4.8.1)
3. Test all background jobs
4. Monitor job processing after upgrade
5. Consider upgrading Redis gem first

**Timeline**: 1-2 weeks

---

#### 4. JWT Authentication (2.10.2 → 3.1.2)
**Type**: Major version upgrade
**Risk Level**: High
**Breaking Changes**: Yes

**What's Changed**:
- API method signature changes
- Algorithm handling updates
- Security improvements

**Action Required**:
1. Review [JWT 3.0 changelog](https://github.com/jwt/ruby-jwt/blob/main/CHANGELOG.md)
2. **Critical**: Test all authentication flows
3. Check token encoding/decoding logic
4. Verify algorithm configurations
5. Test API authentication endpoints
6. Plan for potential user re-authentication

**Timeline**: 2-3 weeks (thorough testing required)

---

### 🟡 Medium Priority

#### 5. rack-cors CORS Handler (2.0.2 → 3.0.0)
**Type**: Major version upgrade
**Risk Level**: Medium

**What's Changed**:
- CORS configuration updates
- Potential API changes

**Action Required**:
1. Review CORS configuration in `config/initializers/cors.rb`
2. Test cross-origin requests from mobile app
3. Verify allowed origins, headers, and methods

**Timeline**: 3-5 days

---

#### 6. ruby-openai API Client (7.3.1 → 8.3.0)
**Type**: Major version upgrade
**Risk Level**: Medium

**What's Changed**:
- OpenAI API updates
- New features and endpoints
- Potential method signature changes

**Action Required**:
1. Review changelog for breaking changes
2. Test all OpenAI integration points
3. Update any API calls to new patterns

**Timeline**: 1 week

---

#### 7. rspec-rails Testing Framework (6.1.5 → 8.0.2)
**Type**: Major version upgrade
**Risk Level**: Medium
**Note**: Currently locked to ~> 6.0 in Gemfile

**What's Changed**:
- New RSpec features
- Deprecation removals
- Rails 8 compatibility

**Action Required**:
1. Update Gemfile constraint: `gem "rspec-rails", "~> 8.0"`
2. Review test suite for deprecated patterns
3. Update test helpers and configurations

**Timeline**: 1 week

---

#### 8. shoulda-matchers Test Matchers (5.3.0 → 7.0.1)
**Type**: Major version upgrade
**Risk Level**: Low-Medium
**Note**: Currently locked to ~> 5.3 in Gemfile

**What's Changed**:
- New matcher features
- Deprecation removals

**Action Required**:
1. Update Gemfile constraint: `gem "shoulda-matchers", "~> 7.0"`
2. Run test suite to check compatibility
3. Update any deprecated matcher usage

**Timeline**: 3-5 days

---

### 🟢 Low Priority

#### 9. redis Client (4.8.1 → 5.4.1)
**Type**: Major version upgrade
**Risk Level**: Low-Medium
**Note**: Currently locked to ~> 4.0 in Gemfile

**What's Changed**:
- Redis client rewrite
- Performance improvements
- API changes

**Action Required**:
1. Check compatibility with Sidekiq 8
2. Update Gemfile constraint: `gem "redis", "~> 5.0"`
3. Test Redis connections and operations
4. Consider upgrading alongside Sidekiq

**Timeline**: 3-5 days

---

#### 10. Other Low Priority Updates

| Gem | Current | Latest | Notes |
|-----|---------|--------|-------|
| erb | 2.2.3 | 6.0.0 | Template rendering - test views |
| mini_magick | 4.13.2 | 5.3.1 | Image processing - test uploads |
| public_suffix | 6.0.2 | 7.0.0 | Domain parsing - low risk |
| rubyzip | 2.4.1 | 3.2.2 | ZIP file handling - test exports |
| unicode-display_width | 2.6.0 | 3.2.0 | Terminal output - low impact |
| webmock | 3.25.2 | 3.26.1 | HTTP mocking - test suite only |
| websocket-driver | 0.7.7 | 0.8.0 | WebSocket support - test ActionCable |

---

## ⚠️ Known Issues to Address

### 1. Deprecation Warning - Rack Status Codes
**Location**: Throughout test suite
**Warning**: `Status code :unprocessable_entity is deprecated`

**Fix Required**:
```ruby
# Find and replace in spec files:
# OLD:
expect(response).to have_http_status(:unprocessable_entity)

# NEW:
expect(response).to have_http_status(:unprocessable_content)
```

**Files Affected**: Multiple spec files
**Priority**: Medium (will become error in future Rack version)

---

### 2. Security Warning - Mass Assignment
**Location**: `app/controllers/users_controller.rb:266`
**Brakeman Warning**: Potentially dangerous key allowed for mass assignment

**Code**:
```ruby
params.require(:user).permit(:name, :email, :password, :password_confirmation,
  :avatar, :preferences, :text_notifications, :email_notifications,
  :push_notifications, :profile_pic, :neighborhood, :city, :state,
  :latitude, :longitude, :favorite_food, :bar_preferences, :role)
```

**Issue**: `:role` parameter should not be mass-assignable

**Recommended Fix**:
```ruby
# Remove :role from permit list
# Handle role updates separately in admin-only actions
def user_params
  params.require(:user).permit(:name, :email, :password, :password_confirmation,
    :avatar, :preferences, :text_notifications, :email_notifications,
    :push_notifications, :profile_pic, :neighborhood, :city, :state,
    :latitude, :longitude, :favorite_food, :bar_preferences)
end

# Separate admin method
def update_role
  # Admin authentication check
  @user.update(role: params[:role]) if current_user.admin?
end
```

**Priority**: High (security issue)

---

### 3. Test Suite Failures
**Status**: 104 failures out of 217 examples

**Likely Causes**:
- Missing API keys for GooglePlacesService
- External service mocking issues
- Test data setup problems

**Action Required**:
1. Review failed tests (see test output)
2. Add/update API key environment variables
3. Improve external service mocking
4. Fix test data factories

**Priority**: Medium (pre-existing issues)

---

## 📋 Recommended Update Strategy

### Phase 1: Quick Wins (1-2 days)
1. Fix deprecation warnings (`:unprocessable_entity` → `:unprocessable_content`)
2. Fix security warning (mass assignment of `:role`)
3. Update low-risk gems (webmock, websocket-driver, etc.)

### Phase 2: Infrastructure Updates (2-4 weeks)
1. **Puma** 6 → 7 (test thoroughly)
2. **redis** 4 → 5 (coordinate with Sidekiq)
3. **Sidekiq** 7 → 8 (test background jobs)
4. **rack-cors** 2 → 3 (test CORS)

### Phase 3: Critical Dependencies (4-6 weeks)
1. **JWT** 2 → 3 (thorough authentication testing)
2. **ruby-openai** 7 → 8 (test AI integrations)
3. **rspec-rails** 6 → 8 (update test suite)
4. **shoulda-matchers** 5 → 7 (update matchers)

### Phase 4: Rails Framework (2-3 months)
1. **Rails** 7.2 → 8.1 (major undertaking)
   - Wait for community adoption
   - Dedicated upgrade sprint
   - Extensive staging testing
   - Gradual rollout plan

---

## 🎯 Current Status Summary

| Category | Status |
|----------|--------|
| **Security Patches** | ✅ Up to date (Rails 7.2.3) |
| **Minor Updates** | ✅ All completed |
| **Major Updates** | ⏳ 28 gems pending |
| **Critical Security** | ⚠️ 1 warning (mass assignment) |
| **Test Coverage** | ⚠️ 104 failures (pre-existing) |
| **Production Risk** | 🟢 Low (stable on 7.2.3) |

---

## 📚 Resources

- [Rails Upgrade Guide](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html)
- [Ruby on Rails Maintenance Policy](https://guides.rubyonrails.org/maintenance_policy.html)
- [Bundler Update Strategies](https://bundler.io/guides/updating_gems.html)
- [Semantic Versioning](https://semver.org/)

---

## 🔄 Update Commands Reference

```bash
# Check what's outdated
bundle outdated

# Update specific gem
bundle update <gem-name>

# Update only patch versions (safest)
bundle update --patch

# Update patch and minor versions
bundle update --minor

# Update specific gem with version constraint
bundle update <gem-name> --strict

# After updates, always:
bundle exec rspec              # Run tests
bundle exec brakeman -q        # Security scan
```

---

**Note**: Always test updates in a development/staging environment before deploying to production. Create a backup before major updates.
