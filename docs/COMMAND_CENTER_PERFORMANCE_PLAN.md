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

| Component | Current Load Time | Target Load Time |
|-----------|------------------|------------------|
| Invites Tab | 8-12s | 1-2s |
| Home Dashboard | 5-8s | 0.5-1s |
| Applicants Tab | 6-10s | 1-2s |
| Mail Tab | 4-6s | 1-2s |
| API Requests per Load | 15-20 requests | 1-2 requests |

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

#### Incremental Adoption
1. ✅ Invites Tab (POC from Phase 1)
2. [ ] Applicants Tab
3. [ ] Mail Tab
4. [ ] Home Dashboard
5. [ ] Bulletins Tab

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
- [ ] Backend: Compound endpoint created
- [ ] Backend: Integration tests added
- [ ] Frontend: React Query installed
- [ ] Frontend: InvitesTab refactored (POC)
- [ ] Performance: Before/after metrics documented

---

_This is a living document. Update as we progress through each phase._
