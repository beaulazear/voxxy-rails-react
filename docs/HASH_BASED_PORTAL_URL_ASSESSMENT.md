# Hash-Based Portal URL Assessment

**Date**: 2026-02-04
**Proposed Change**: Switch from slug-based to hash/token-based portal URLs
**Timing**: Pre-launch (no real users, ideal time to make breaking changes)

## Current System

### Portal URL Structure (Slug-Based)
```
https://voxxypresents.com/portal/{event-slug}
Example: https://voxxypresents.com/portal/pancake-and-booze-sf
```

**Authentication Flow:**
1. User visits `/portal/{event-slug}`
2. Frontend prompts for email address (optional `?email=` parameter pre-fills)
3. User submits email → Backend verifies email exists in registrations
4. Backend issues JWT session token (24-hour expiry)
5. Frontend stores token and makes authenticated requests

**Current Implementation:**
- **Backend Route**: `GET /api/v1/presents/portals/:event_slug` (line 347 in [config/routes.rb](../config/routes.rb#L347))
- **Backend Controller**: [EventPortalsController#show_by_slug](../app/controllers/api/v1/presents/event_portals_controller.rb#L43-L63)
- **Frontend Route**: `/portal/:eventSlug` (line in [App.tsx](../../voxxy-presents-client/src/App.tsx))
- **Frontend Component**: [VendorEventPortalPage.tsx](../../voxxy-presents-client/src/pages/VendorEventPortalPage.tsx#L29)

## Proposed System

### Portal URL Structure (Hash-Based)
```
https://voxxypresents.com/portal/{secure-token}
Example: https://voxxypresents.com/portal/7j9kX2mP5qL8nR4tY6wZ3vB1cD0fG
```

**Benefits:**
1. **URL Uniqueness**: Never run out of URLs (32-byte tokens = 2^256 combinations)
2. **Privacy**: Event names not exposed in URL
3. **Security**: Tokens are unguessable, adding another layer of protection
4. **Portability**: URLs remain valid even if event slug changes

**Authentication Flow (Option A - Token-Only):**
1. User visits `/portal/{secure-token}` (from email link)
2. Backend validates token → Returns event info + auto-authenticates user
3. No email prompt needed (seamless experience)

**Authentication Flow (Option B - Token + Email Verification):**
1. User visits `/portal/{secure-token}` (from email link)
2. Backend validates token → Returns event info
3. User enters email to verify identity (still required for security)
4. Backend issues JWT session token

## Impact Assessment

### 🔴 High Impact Changes Required

#### Backend Changes

1. **Add `access_token` column to `event_portals` table**
   ```ruby
   # Migration
   add_column :event_portals, :access_token, :string, null: false
   add_index :event_portals, :access_token, unique: true
   ```

2. **Update EventPortal model**
   - Add callback to generate secure token on creation
   - Add `find_by_token` method
   - Keep slug-based methods for backward compatibility during transition

3. **Add new controller action**
   ```ruby
   # New route: GET /api/v1/presents/portals/token/:access_token
   def show_by_token
     portal = EventPortal.find_by!(access_token: params[:access_token])
     # ... authentication logic
   end
   ```

4. **Update EmailVariableResolver** ([app/services/email_variable_resolver.rb:168-176](../app/services/email_variable_resolver.rb#L168-L176))
   - Change `[dashboardLink]` to use token-based URL
   ```ruby
   def dashboard_link
     return "" unless registration
     event_portal = event.event_portal
     return "" unless event_portal

     "#{base_url}/portal/#{event_portal.access_token}"
   end
   ```

5. **Update RegistrationEmailService** (multiple locations)
   - Lines 334-335: Approval email
   - Lines 564-565: Payment confirmation
   - Lines 646-647: Category change notification

#### Frontend Changes

1. **Update App.tsx routing**
   ```tsx
   // Add new route
   <Route path="/portal/:portalToken" element={<VendorEventPortalPage />} />

   // Keep old route for backward compatibility (optional)
   <Route path="/portal/slug/:eventSlug" element={<VendorEventPortalPage />} />
   ```

2. **Update VendorEventPortalPage.tsx**
   - Accept either `portalToken` or `eventSlug` param
   - Add new API call: `fetchPortalByToken(token)`
   - Update `verifyPortalAccess` to use token

3. **Update eventPortalService.ts**
   - Add `fetchPortalByToken(token)` method
   - Update types to handle token-based access

### 🟡 Medium Impact Changes

1. **Database Migration** - Need to backfill tokens for existing event_portals
2. **API Versioning** - Consider keeping both endpoints during transition
3. **Testing** - Update all tests that reference portal URLs
4. **Documentation** - Update API docs and system documentation

### 🟢 Low Impact / No Change Required

1. **Command Center** - Already generates correct URLs (just needs to use new token field)
2. **EventInvitation** - Already uses token-based system (`invitation_token`)
3. **JWT Session System** - No changes needed (still used for authentication)
4. **SendGrid Integration** - No changes needed

## Migration Strategy

### Phase 1: Add Token Support (Backward Compatible)
**Time Estimate**: 2-3 hours

1. Create migration to add `access_token` to `event_portals`
2. Backfill existing portals with tokens
3. Add new backend route `GET /portals/token/:access_token`
4. Keep existing slug-based route working
5. Update email templates to use token-based URLs

**Test**: Old links still work, new links work too

### Phase 2: Update Frontend (Backward Compatible)
**Time Estimate**: 1-2 hours

1. Update frontend routes to accept `portalToken` OR `eventSlug`
2. Add token-based API calls
3. Frontend automatically detects which type of URL it received

**Test**: Both URL formats work in frontend

### Phase 3: Deprecate Slug-Based URLs (Optional)
**Time Estimate**: 1 hour

1. Add deprecation warnings to slug-based endpoints
2. Monitor usage for X days
3. Remove slug-based routes after confirmed migration

**Test**: Only token-based URLs work

## Recommendation

### For Launch Tomorrow (Quick Fix)
**Recommended**: ❌ **Do NOT implement hash-based URLs now**

**Reasoning:**
- 4-6 hours of development time before launch = HIGH RISK
- Frontend + Backend changes = multiple failure points
- Testing required across both repos
- Unknown edge cases could emerge

**Instead**: Fix the immediate bug (RegistrationEmailService URLs) and launch successfully.

### For Post-Launch (Strategic Improvement)
**Recommended**: ✅ **Implement hash-based URLs in Phase 1 & 2**

**Timing**: Week after launch (Feb 11-12)

**Reasoning:**
- Low user count = easy to migrate
- Proper testing time available
- Can monitor both URL types during transition
- Future-proofs the system

## Implementation Checklist

If you decide to implement post-launch:

### Backend
- [ ] Create migration: `add_column :event_portals, :access_token, :string`
- [ ] Add unique index on `access_token`
- [ ] Add token generation callback to `EventPortal` model
- [ ] Backfill existing portals with tokens
- [ ] Add `EventPortalsController#show_by_token` action
- [ ] Update routes to include token-based endpoint
- [ ] Update `EmailVariableResolver#dashboard_link` to use tokens
- [ ] Update `RegistrationEmailService` (4 locations)
- [ ] Write RSpec tests for token-based access

### Frontend
- [ ] Update `App.tsx` routing to accept `portalToken` param
- [ ] Update `VendorEventPortalPage` to handle token param
- [ ] Add `fetchPortalByToken` to `eventPortalService.ts`
- [ ] Update TypeScript types for portal access
- [ ] Write tests for token-based portal access
- [ ] Test error handling (invalid token, expired token, etc.)

### Testing
- [ ] Test token generation on new event creation
- [ ] Test portal access with token URL
- [ ] Test email links with token URLs
- [ ] Test backward compatibility with slug URLs (if keeping)
- [ ] Load test with 3,000+ portal access attempts
- [ ] Test token uniqueness constraints

### Deployment
- [ ] Run migration on staging
- [ ] Verify all existing portals have tokens
- [ ] Test staging with both URL types
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Monitor error logs for 24 hours
- [ ] Send test emails with new URLs

## Cost-Benefit Analysis

| Aspect | Slug-Based (Current) | Token-Based (Proposed) |
|--------|---------------------|------------------------|
| **URL Length** | Short, readable | Longer, cryptic |
| **Uniqueness** | Limited by event names | Virtually unlimited |
| **Security** | Low (guessable) | High (unguessable) |
| **Privacy** | Event name exposed | Event name hidden |
| **User Experience** | Recognizable URL | Requires email link |
| **SEO** | Not applicable (auth required) | Not applicable |
| **Development Time** | 0 (already built) | 4-6 hours |
| **Risk** | None (proven) | Medium (new code) |
| **Future Scalability** | May hit slug conflicts | Infinite scale |

## Decision Matrix

| Scenario | Recommended Action | Rationale |
|----------|-------------------|-----------|
| **Launch is tomorrow** | 🔴 **Do NOT implement** | Too risky, not enough testing time |
| **Launch in 1 week** | 🟡 **Consider if critical** | Enough time for proper testing |
| **Post-launch (Week 1)** | 🟢 **Implement (Phase 1 & 2)** | Low user count, strategic improvement |
| **High-scale event (10k+ vendors)** | 🟢 **Critical requirement** | Slug conflicts become real risk |

## Conclusion

**For Tomorrow's Launch**: Fix the `RegistrationEmailService` bug only. Do not implement hash-based URLs.

**For Next Week**: Implement hash-based URLs as a strategic improvement while user base is still small.

**Estimated Total Time**: 6-8 hours (Backend: 3-4h, Frontend: 2-3h, Testing: 1h)

**Risk Level Post-Launch**: Low (backward compatibility maintained, easy rollback)

---

**Report Generated**: 2026-02-04
**Related Documents**:
- [LAUNCH_DAY_LINK_ISSUES_REPORT.md](LAUNCH_DAY_LINK_ISSUES_REPORT.md)
- [VENDOR_EVENT_PORTAL_PROJECT_OVERVIEW.md](../VENDOR_EVENT_PORTAL_PROJECT_OVERVIEW.md)
