# Launch Day Preparation Summary

**Event**: Pancake and Booze Art Show (San Francisco)
**Launch Date**: 2026-02-05 (Tomorrow)
**Email Volume**: ~3,000 invitation emails
**Current Status**: Critical bug identified and documented

---

## 🔴 Critical Issue: Portal Links in Emails

### Problem
Event portal links in emails are pointing to the wrong domain (`https://voxxy.io`) instead of the correct domain (`https://voxxy-presents-client-staging.onrender.com` or `https://voxxypresents.com`).

### Root Cause
`RegistrationEmailService` uses `ENV['FRONTEND_URL'] || "https://voxxy.io"` as a fallback instead of using the centralized `FrontendUrlHelper`.

### Affected Emails
- ❌ Vendor approval emails ("You're in")
- ❌ Payment confirmation emails
- ❌ Category change notifications
- ❌ Waitlist notifications
- ✅ Scheduled campaign emails (correct - use EmailVariableResolver)
- ✅ Event invitations (correct - use EventInvitation model)

### Fix Required
Replace hardcoded fallback URLs in `RegistrationEmailService` with `FrontendUrlHelper.presents_frontend_url`.

**Estimated Time**: 30 minutes
**Risk Level**: Low (simple find-replace in 4 locations)

---

## 🟡 Strategic Improvement: Hash-Based Portal URLs

### Current System
```
https://voxxypresents.com/portal/pancake-and-booze-sf
```
- Uses event slug in URL
- Limited by slug availability
- Event name exposed in URL

### Proposed System
```
https://voxxypresents.com/portal/7j9kX2mP5qL8nR4tY6wZ3vB1cD0fG
```
- Uses secure token (like invitation system already does)
- Unlimited scalability
- Enhanced privacy and security

### Recommendation
**For Tomorrow**: ❌ **Do NOT implement** (4-6 hours dev time = too risky)

**For Next Week**: ✅ **Implement after launch** (perfect timing - no real users yet)

---

## ✅ What's Working Correctly

1. **Command Center Portal Links**: Generating correct URLs with proper domain
2. **Event Invitation System**: Already uses token-based URLs (`invitation_token`)
3. **Email Template Variables**: `[dashboardLink]`, `[eventLink]`, `[bulletinLink]` all working
4. **Scheduled Campaign Emails**: Using `EmailVariableResolver` (correct pattern)
5. **Frontend Portal Page**: Ready to accept email parameter for pre-filling

---

## 📋 Launch Day Action Plan

### Immediate (Before Launch)
1. ✅ **[DONE]** Investigate portal link issues
2. ✅ **[DONE]** Document root causes
3. ✅ **[DONE]** Assess hash-based URL feasibility
4. ⏳ **[TODO]** Fix `RegistrationEmailService` (4 locations)
5. ⏳ **[TODO]** Test email generation with correct URLs
6. ⏳ **[TODO]** Send test emails to verify links work
7. ⏳ **[TODO]** Deploy to staging and test
8. ⏳ **[TODO]** Deploy to production

### Post-Launch Monitoring
- Monitor SendGrid delivery logs for 404 errors
- Track bounce rates on vendor emails
- Watch support tickets for broken link reports
- Check Sidekiq job queue for email failures

### Week After Launch
- Implement hash-based portal URLs (Phase 1 & 2)
- Maintain backward compatibility with slug-based URLs
- Monitor both URL types for 1 week
- Fully deprecate slug-based URLs if no issues

---

## 📁 Documentation Created

1. **[LAUNCH_DAY_LINK_ISSUES_REPORT.md](LAUNCH_DAY_LINK_ISSUES_REPORT.md)**
   - Comprehensive diagnostic report
   - Root cause analysis with line numbers
   - Testing checklist
   - Monitoring recommendations

2. **[HASH_BASED_PORTAL_URL_ASSESSMENT.md](HASH_BASED_PORTAL_URL_ASSESSMENT.md)**
   - Impact assessment (6-8 hour implementation)
   - Migration strategy (3 phases)
   - Cost-benefit analysis
   - Implementation checklist

3. **[diagnose_event_links.rb](../diagnose_event_links.rb)**
   - Diagnostic script to verify URL generation
   - Can be run anytime: `rails runner diagnose_event_links.rb`
   - Shows current environment config and URL outputs

---

## 🎯 Decision Required

**Question**: Do you want to fix just the critical bug for tomorrow's launch, or also implement hash-based URLs?

**Option A - Safe Launch** (Recommended ✅)
- Fix `RegistrationEmailService` only
- 30 minutes of work
- Low risk
- Launch on schedule tomorrow
- Implement hash-based URLs next week

**Option B - Full Implementation**
- Fix `RegistrationEmailService` + implement hash-based URLs
- 6-8 hours of work
- Medium risk (new code, testing needed)
- May delay launch
- Future-proofed system

---

## Next Steps

Waiting for your decision on:
1. Fix critical bug only (Option A)
2. Fix bug + implement hash-based URLs (Option B)

Once decided, I'll proceed with implementation and testing.

---

**Status**: ⏸️ Paused - Awaiting direction
**Branch**: `feature/launch-day-email-portal-links`
**Last Updated**: 2026-02-04
