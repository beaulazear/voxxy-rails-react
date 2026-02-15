# Command Center Performance & Reliability Plan

**Created**: February 15, 2026
**Status**: In Progress
**Branch**: `feature/command-center-performance-optimization`

---

## 🎯 Goals

1. **Eliminate N+1 query performance bottlenecks** in Command Center
2. **Fix timezone handling** for email scheduling and event display
3. **Resolve data reliability bugs** (category dropdown, email history)
4. **Implement React Query** for better data fetching and caching
5. **Add comprehensive testing** (integration + E2E)

---

## 📊 Current Performance Metrics (Baseline)

**Note**: Actual measurements from production (Feb 15, 2026):
- **Mail Tab** and **Home Dashboard** are the SLOWEST screens (highest priority)
- **Invites Tab** is relatively fast after recent optimizations

| Component | Current Load Time | Target Load Time | Priority |
|-----------|------------------|------------------|----------|
| Mail Tab | 8-15s | 1-2s | **HIGH** 🔴 |
| Home Dashboard | 8-12s | 0.5-1s | **HIGH** 🔴 |
| Applicants Tab | 6-10s | 1-2s | MEDIUM 🟡 |
| Invites Tab | 2-4s (fast) | 1-2s | LOW 🟢 |
| API Requests per Load | 15-20 requests | 1-2 requests | N/A |

---

## 🔍 Root Cause Analysis

### Critical Performance Issues

**1. N+1 Query Waterfall (CRITICAL)**
- **Location**: InvitesTab.tsx:105-142, ApplicantsTab.tsx:84-98, HomeDashboard.tsx:82-90
- **Problem**: Sequential fetching of vendor applications, then looping through each to fetch submissions
- **Impact**: With 10 vendor applications = 11+ HTTP requests executed serially
- **Code Pattern**:
```typescript
const vendorApps = await vendorApplicationsApi.getByEvent(eventSlug);
for (const app of vendorApps) {
  const submissions = await vendorApplicationsApi.getSubmissions(app.id); // SERIAL LOOP!
}
```

**2. Backend Inefficient Queries**
- **Location**: event_invitations_controller.rb:382-396
- **Problem**: `calculate_invitation_delivery_stats` runs 6 separate COUNT queries
- **Impact**: Invitation list endpoint 3-5x slower than necessary

**3. No Caching Strategy**
- **Problem**: Every tab switch refetches all data
- **Impact**: Unnecessary API load, perceived slowness

### Data Reliability Bugs

**Bug #1: Category Dropdown Not Working (Invites Tab)**
- **Root Cause**: Categories extracted from current event's vendor applications, but new categories can be added during registration updates
- **Impact**: Dropdown shows inconsistent state when category changed to new value

**Bug #2: Email History Not Loading (Invites Tab)**
- **Root Cause**: Frontend tries to fetch email history by registration_id OR invitation_id, but API service not properly wired for invitation endpoint
- **Impact**: Contacts who were invited but didn't apply have no email history displayed

**Bug #3: UTC/Timezone Display Issues**
- **Root Cause**: Email scheduled times calculated and displayed in UTC, but events use local times
- **Impact**: Producer sees "9 AM" but email sends at 9 AM UTC (potentially 4 AM local)

---

## 🛠️ Implementation Phases

### **PHASE 1: ELIMINATE N+1 QUERIES** ⏳ Week 1 (CURRENT)

#### Backend Work
- [ ] Create new compound endpoint: `GET /api/v1/presents/events/:slug/command_center`
- [ ] Return ALL data in single response:
  - Event details
  - Vendor applications (with submissions eager-loaded via `.includes()`)
  - Invitations (with vendor contacts)
  - Scheduled emails
  - Bulletins
  - Dashboard stats (calculated once)
- [ ] Keep old endpoints for backward compatibility
- [ ] Add integration tests for new endpoint

#### Frontend Work
- [ ] Install `@tanstack/react-query`
- [ ] Set up QueryClientProvider in App.tsx
- [ ] Refactor InvitesTab to use new compound endpoint (POC)
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Measure before/after performance

**Expected Outcome:**
- Invites Tab: 8-12s → 1-2s
- API requests: 15+ → 1-2

**Data Safety:**
- ✅ Read-only changes (no data mutations)
- ✅ No database backup needed

---

### **PHASE 2: TIMEZONE FIXES** ⏳ Week 1 (Concurrent with Phase 1)

#### Backend Work
- [ ] Wrap email schedule calculations in `Time.use_zone(organization.timezone)`
- [ ] Add fallback: `organization.timezone || 'America/New_York'`
- [ ] Update ScheduledEmailsController to return timezone-aware dates

#### Frontend Work
- [ ] Use Luxon (already installed) to convert UTC → org timezone
- [ ] Display format: "Mar 15, 2026 at 9:00 AM EST"
- [ ] Public forms: Show date only (hide time to avoid confusion)

**Expected Outcome:**
- Email schedules display in correct local time
- No more "Why did my email send at 4 AM?" confusion

**Data Safety:**
- ⚠️ Changes date/time calculations
- ⚠️ Requires database backup before deployment
- ⚠️ Test thoroughly with various timezones

---

### **PHASE 3: REACT QUERY ROLLOUT** 📅 Week 2

#### Incremental Adoption (Prioritized by Actual Performance)
1. ✅ Invites Tab (POC from Phase 1) - **Baseline: 2-4s (already fast)**
2. [ ] **Mail Tab** - 🔴 **HIGH PRIORITY** (Slowest: 8-15s)
3. [ ] **Home Dashboard** - 🔴 **HIGH PRIORITY** (Slowest: 8-12s)
4. [ ] Applicants Tab - 🟡 MEDIUM (6-10s)
5. [ ] Bulletins Tab - 🟢 LOW (if needed)

#### Benefits
- **Caching**: Tab switches become instant (no refetch)
- **Background refresh**: Data stays fresh automatically
- **Optimistic updates**: UI responds immediately
- **Request deduplication**: Multiple components share data efficiently

**Expected Outcome:**
- Tab switching: 3-5s → <0.1s (instant from cache)
- Fresh data without manual refresh

**Data Safety:**
- ✅ Read-only changes initially
- ⚠️ Optimistic updates need careful testing

---

### **PHASE 4: DATA RELIABILITY BUGS** 📅 Week 2-3

#### Bug Fix #1: Category Dropdown
- [ ] **Backend**: Create `GET /api/v1/presents/organizations/:id/vendor_categories`
- [ ] Returns ALL categories used across organization's events
- [ ] **Frontend**: Populate dropdown from org-wide categories

#### Bug Fix #2: Email History
- [ ] **Backend**: Verify invitation email history endpoint works
- [ ] **Frontend**: Update `emailDeliveriesApi` to support invitation endpoint
- [ ] Test with both applied and non-applied invitations

#### Bug Fix #3: Timezone Display
- [ ] Fixed in Phase 2

**Data Safety:**
- ✅ Category endpoint is read-only
- ✅ Email history endpoint is read-only

---

### **PHASE 5: VALIDATION & ERROR HANDLING** 📅 Week 3

#### Frontend Improvements
- [ ] Add Zod schemas for all forms
- [ ] Error boundaries for each tab
- [ ] Replace `alert()` with toast notifications (use Sonner - already installed)
- [ ] Loading skeletons for all tabs
- [ ] Request cancellation on tab switch

#### Backend Improvements
- [ ] Stricter model validations (Registration, VendorApplication)
- [ ] Consistent error format: `{ error: "message", field: "email", code: "invalid_format" }`

**Expected Outcome:**
- Better user experience during errors
- Fewer silent failures

**Data Safety:**
- ⚠️ Stricter validations may reject previously-accepted data
- ⚠️ Test with real-world data scenarios

---

### **PHASE 6: TESTING STRATEGY** 📅 Week 4

#### Integration Tests (Backend - RSpec)
- [ ] `spec/requests/api/v1/presents/command_center_spec.rb`
- [ ] Test compound endpoint data structure
- [ ] Test filtering, pagination, authorization
- [ ] Test timezone conversions

#### E2E Tests (Frontend - Playwright)
**Critical Flows:**
1. [ ] Load Command Center → All tabs load without errors
2. [ ] Approve applicant → Status updates, email sent, moves to Invites tab
3. [ ] Toggle payment status → Updates, triggers email notification
4. [ ] Schedule email → Appears in Mail tab, sends at correct time
5. [ ] Filter invites → Only matching results shown

#### Performance Benchmarks
- [ ] Document load times for each tab (before/after)
- [ ] Set up performance monitoring

**Data Safety:**
- ✅ Tests run against test database
- ⚠️ E2E tests may create test data (clean up after)

---

## 🔧 Third-Party Tools & Recommendations

### Currently Using (Keep)
- ✅ **SendGrid** - Email delivery (working well)
- ✅ **Luxon** - Timezone handling (already installed)
- ✅ **Mixpanel** - Analytics (already installed)

### Recommended Additions (Optional)
1. **Sentry** - Error monitoring ($0-$26/month)
   - Track frontend errors, backend exceptions
   - See which errors users actually hit

2. **PostHog** - Session replay ($0-$20/month)
   - Watch recordings of users struggling with slow loads
   - Free up to 1M events/month

3. **Playwright** - E2E testing (Free, OSS)
   - Faster than Cypress, better DX
   - Multi-browser testing

### NOT Recommended (Yet)
- ❌ State management library (Zustand/Redux) - React Query cache is sufficient
- ❌ Email provider change - SendGrid is working fine
- ❌ Resend - Consider only if SendGrid deliverability drops

---

## 📅 Timeline

| Week | Phase | Focus | Deliverables |
|------|-------|-------|--------------|
| **Week 1** | 1 & 2 | N+1 queries + Timezone | Compound endpoint, React Query POC, timezone fixes |
| **Week 2** | 3 & 4 | React Query rollout + Bug fixes | All tabs using React Query, bugs resolved |
| **Week 3** | 5 | Validation + Error handling | Better UX, stricter validations |
| **Week 4** | 6 | Testing | Integration tests, E2E tests, performance benchmarks |

---

## 🚀 Deployment Strategy

### Pre-Deployment Checklist (CRITICAL)
- [ ] **Database backup**: Run data export script for production database
- [ ] **Test in local environment**: Verify all changes work with real data scenarios
- [ ] **Test in staging** (if available): Full smoke test
- [ ] **Performance benchmarks**: Document before/after metrics
- [ ] **Rollback plan**: Keep backup for 7 days post-deployment

### Deployment Order
1. **Backend first**: Deploy compound endpoint (backward compatible, safe)
2. **Frontend second**: Deploy React Query changes (uses new + old endpoints)
3. **Cleanup later**: Remove old endpoints after 2 weeks if stable

### Post-Deployment Monitoring
- [ ] Monitor error rates (Sentry or logs)
- [ ] Check Command Center load times
- [ ] Watch for user reports of issues
- [ ] Verify email schedules sending at correct times

---

## 📊 Success Metrics

### Performance (Measurable)
- [ ] Invites Tab load time < 2s
- [ ] Home Dashboard load time < 1s
- [ ] Tab switch time < 0.5s
- [ ] API requests per load < 3

### Reliability (Qualitative)
- [ ] Category dropdown shows all categories
- [ ] Email history loads for all contacts
- [ ] Email schedules display in correct timezone
- [ ] No "Why didn't this work?" user reports for 2 weeks

### Developer Experience
- [ ] Easier to add new Command Center features
- [ ] Faster local development (React Query dev tools)
- [ ] Fewer bugs reported

---

## 📝 Notes & Decisions

### Key Decisions Made
1. **Start with React Query** (not Zustand) - Simpler, sufficient for caching needs
2. **Backward compatible endpoints** - Avoid breaking changes, easier rollback
3. **Incremental rollout** - Test one tab at a time, reduce risk
4. **Database backups required** - For any phase that changes date/time calculations or validations

### Open Questions
- [ ] Deployment cadence: Weekly releases or batch?
- [ ] Error monitoring: Add Sentry?
- [ ] Testing environment: Staging available or test in production?
- [ ] Default timezone: EST or browser timezone when org.timezone is null?

### Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Timezone changes break email schedules | Medium | High | Database backup, test with multiple timezones, gradual rollout |
| Compound endpoint too slow with large datasets | Low | Medium | Add pagination, limit eager loading depth |
| React Query cache stale data | Low | Low | Configure appropriate stale times, add manual refresh |
| Breaking backward compatibility | Low | High | Keep old endpoints, test both paths |

---

## 🔗 Related Documentation

- [Email Automation System Guide](./EMAIL_AUTOMATION_SYSTEM_GUIDE.md)
- [Voxxy Presents Email Master Reference](./VOXXY_PRESENTS_EMAIL_MASTER_REFERENCE.md)
- [Render Deployment Guide](./deployment/RENDER_DEPLOYMENT.md)
- [Testing Guidelines](./testing/TESTING_GUIDELINES.md) (to be created)

---

## 🤝 Team & Responsibilities

- **Courtney**: QA testing, deployment, production monitoring
- **Claude**: Backend API development, frontend refactoring, documentation
- **Together**: Performance benchmarking, rollout decisions, issue triage

---

## 📈 Progress Tracking

**Last Updated**: February 15, 2026

**Current Phase**: Phase 1 - Eliminate N+1 Queries
**Current Branch**: `feature/command-center-performance-optimization`

### Phase 1 Progress
- [x] Backend: Compound endpoint created ✅ (Feb 15, 2026)
- [x] Frontend: React Query installed ✅ (Feb 15, 2026)
- [x] Frontend: InvitesTab refactored (POC) ✅ (Feb 15, 2026)
- [x] Documentation: Performance testing guide created ✅ (Feb 15, 2026)
- [x] Branches pushed to GitHub ✅ (Feb 15, 2026)
- [ ] Backend: Integration tests added (NEXT)
- [ ] Performance: Actual before/after metrics measured (awaiting user testing)

**Key Finding**: Mail Tab and Home Dashboard are the slowest screens (8-15s), not Invites Tab (2-4s). After Phase 1 validation, prioritize optimizing Mail Tab and Home Dashboard next.

---

## 🧹 PHASE 7: CLEANUP - DEPRECATE OLD ENDPOINTS (FUTURE)

**Timeline**: After 2-4 weeks of stable production use
**Risk Level**: Medium (requires careful coordination)

### Overview
Once the Command Center compound endpoint is proven stable in production and all frontend components are migrated to React Query, we can deprecate the old individual endpoints to reduce codebase complexity and maintenance burden.

### Pre-Cleanup Checklist
- [ ] Compound endpoint has been in production for 2+ weeks
- [ ] No reported issues with Command Center performance
- [ ] All frontend tabs (Invites, Applicants, Mail, Home, Bulletins) migrated to React Query
- [ ] Performance benchmarks confirm improvement
- [ ] All edge cases tested (large datasets, slow networks, errors)
- [ ] Mobile app (if applicable) updated to use new endpoint

### Endpoints to Deprecate

#### ⚠️ HIGH RISK - Used by Command Center (can remove after migration)
1. `GET /api/v1/presents/events/:event_slug/vendor_applications` - Replaced by compound endpoint
2. `GET /api/v1/presents/vendor_applications/:id/submissions` - Replaced by compound endpoint
3. `GET /api/v1/presents/events/:event_slug/invitations` - Replaced by compound endpoint
4. `GET /api/v1/presents/events/:event_slug/scheduled_emails` - Replaced by compound endpoint
5. `GET /api/v1/presents/events/:event_slug/bulletins` - Replaced by compound endpoint

#### ⚠️ MEDIUM RISK - May be used elsewhere (audit first)
6. Individual invitation delivery stats queries - Replaced by optimized GROUP BY in compound endpoint

### Deprecation Strategy (Staged Approach)

#### Stage 1: Add Deprecation Warnings (Week 1)
```ruby
# Add to each deprecated controller action
def index
  Rails.logger.warn("DEPRECATED: This endpoint is deprecated. Use GET /events/:slug/command_center instead.")
  # ... existing logic
end
```

- Monitor logs for 1 week to identify any unexpected usage
- Check if any external integrations, mobile apps, or forgotten frontend components are still using old endpoints

#### Stage 2: Add Deprecation Headers (Week 2)
```ruby
# Add to response headers
response.headers['X-Deprecation-Warning'] = 'This endpoint will be removed on YYYY-MM-DD. Use /command_center instead.'
response.headers['X-Sunset'] = '2026-04-01' # Example sunset date
```

- Alerts frontend developers if they accidentally use old endpoints
- Standard HTTP deprecation pattern

#### Stage 3: Feature Flag Old Endpoints (Week 3)
```ruby
# config/initializers/feature_flags.rb
COMMAND_CENTER_OLD_ENDPOINTS_ENABLED = ENV.fetch('COMMAND_CENTER_OLD_ENDPOINTS', 'true') == 'true'

# In controller
def index
  unless COMMAND_CENTER_OLD_ENDPOINTS_ENABLED
    return render json: {
      error: "This endpoint has been deprecated. Please use GET /events/:slug/command_center"
    }, status: 410 # 410 Gone
  end
  # ... existing logic
end
```

- Allows quick rollback if issues arise
- Can disable in staging to test impact

#### Stage 4: Remove Endpoints (Week 4+)
Only after confirming:
- Zero usage of old endpoints in logs (2+ weeks of monitoring)
- All frontend code audited and confirmed migrated
- QA testing passed on staging with endpoints disabled
- Rollback plan documented

**Files to Modify:**
1. `config/routes.rb` - Remove deprecated routes
2. Controllers - Delete deprecated actions
3. Tests - Remove tests for deprecated endpoints (or mark as archived)

### Rollback Plan
If issues are discovered after removal:
1. **Immediate**: Re-enable feature flag (`COMMAND_CENTER_OLD_ENDPOINTS=true`)
2. **Within 1 hour**: Restore routes and controller actions from git history
3. **Within 1 day**: Deploy fix to production
4. **Post-mortem**: Document what was missed, update audit process

### Code Cleanup Benefits
- **Reduced complexity**: ~500 lines of controller code removed
- **Faster tests**: Fewer endpoints to test
- **Clearer API**: Single source of truth for Command Center data
- **Easier maintenance**: One endpoint to optimize instead of six

### Monitoring After Cleanup
- Watch error rates for 410 Gone responses (indicates missed usage)
- Monitor Command Center load times (should remain stable)
- Track API response times (compound endpoint should handle all load)

### Documentation Updates After Cleanup
- [ ] Update API documentation to remove deprecated endpoints
- [ ] Update COMMAND_CENTER_PERFORMANCE_PLAN.md with cleanup completion date
- [ ] Add "Lessons Learned" section for future deprecations
- [ ] Archive old endpoint tests for reference

---

_This is a living document. Update as we progress through each phase._
