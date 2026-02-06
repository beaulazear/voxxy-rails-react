# Monitoring & Alerting Setup Guide

## Quick Setup Checklist (for today's launch)

### 1. Sentry Configuration (15 minutes)

**Already Done:**
- ✅ Sentry gems installed
- ✅ Initializer configured with DSN
- ✅ Test events sent successfully

**To Do in Sentry Dashboard:**

1. **Create Alert Rules** (https://sentry.io/organizations/your-org/alerts/rules/)

   **High Priority Alerts (email immediately):**
   - **New Issue Alert**: Any new error type appears
     - Condition: "A new issue is created"
     - Action: Email to your-email@example.com

   - **High Error Volume**: Spike in errors
     - Condition: "Issue count is more than 10 in 1 hour"
     - Action: Email + Slack (if configured)

   - **Failed Background Jobs**: Payment sync, email delivery issues
     - Condition: "The event's message contains 'failure.job'"
     - Action: Email immediately

   **Medium Priority Alerts (daily digest):**
   - **Slow Requests**: Performance degradation
     - Condition: "The event's message contains 'Slow request detected'"
     - Fingerprint: Groups by controller/action

   - **404 Errors**: Broken links
     - Condition: "The event's message contains '404 Not Found'"
     - Action: Daily summary email

2. **Set Up Email Integration**
   - Go to Settings → Integrations → Email
   - Add your email for alerts
   - Set notification preferences

3. **Configure Environments**
   - Tag issues by environment (production vs staging)
   - Set up separate projects if needed

### 2. Render Monitoring (5 minutes)

**Health Check Endpoint:**
- URL: `https://www.voxxyai.com/health`
- Returns: Database, Redis, and Sidekiq status
- Configure in Render dashboard:
  1. Go to your service → Settings → Health & Alerts
  2. Set Health Check Path: `/health`
  3. Enable email notifications for:
     - Deploy failures
     - Service crashes
     - Health check failures

**Render will automatically email you when:**
- Health check fails (service down)
- Deploy fails
- Service crashes/restarts

### 3. Environment Variables (Add to Render)

**Required:**
```bash
SENTRY_DSN=https://8ad986421baae2d740b4a34c3e46b005@o4510790092914688.ingest.us.sentry.io/4510790103400448
```

**Already Set (verify these exist):**
- `REDIS_URL` - For Rack::Attack rate limiting
- `DATABASE_URL` - For database health checks
- All your SendGrid, AWS, etc. credentials

## What You're Now Monitoring

### 🔒 Security
- **Blocked Malicious Requests**: Sentry alert when suspicious IPs are blocked
- **Rate Limit Violations**: Track when users exceed limits (potential abuse)
- **Failed Login Attempts**: Rack::Attack throttles brute force attempts

### 🚨 Errors
- **All Exceptions**: Automatically captured by Sentry with full context
- **Background Job Failures**: Email delivery, payment sync failures
- **Database Errors**: Connection issues, query failures
- **API Errors**: Third-party service failures (SendGrid, Eventbrite)

### 📊 Performance
- **Slow Requests**: Alerts on requests > 3 seconds
- **Database Latency**: Tracked in health check
- **Redis Performance**: Monitored for cache issues
- **Sidekiq Queue Depth**: Alerts if jobs pile up

### 🔗 Availability
- **404 Errors**: Potential broken links or deleted events
- **Service Health**: Database, Redis, Sidekiq status
- **Uptime**: Render monitors via health check endpoint

## How to Use This During Launch

### Before Launch:
1. ✅ Check Sentry dashboard - should see test events
2. ✅ Verify health endpoint: `curl https://www.voxxyai.com/health`
3. ✅ Set up Sentry alert rules (see above)
4. ✅ Add your email to Sentry notifications
5. ✅ Enable Render health checks and email alerts

### During Launch:
1. **Keep Sentry open** in a browser tab
2. **Monitor for new issues** - Sentry will group similar errors
3. **Check health endpoint** periodically: `https://www.voxxyai.com/health`
4. **Watch for email alerts** from Sentry or Render

### After Launch:
1. **Review Sentry Issues** - Sort by "First Seen" to catch new problems
2. **Check Performance** - Look for slow request patterns
3. **Monitor 404s** - Fix any broken links users are hitting
4. **Review Background Jobs** - Ensure emails and payment syncs succeed

## Quick Debugging

### "How do I know if something is wrong?"

**Sentry Dashboard:**
- Red badge = new errors
- Click issue → See full stack trace, user context, request data

**Health Endpoint:**
```bash
curl https://www.voxxyai.com/health
```

**Good Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T...",
  "services": {
    "database": {"status": "ok", "latency_ms": 2.5},
    "redis": {"status": "ok", "latency_ms": 1.2},
    "sidekiq": {"status": "ok", "enqueued": 0, "failed": 0}
  }
}
```

**Bad Response (service down):**
```json
{
  "status": "degraded",
  "services": {
    "database": {"status": "error", "error": "connection refused"}
  }
}
```

### "I got a Sentry alert, what do I do?"

1. **Click the alert link** → Opens Sentry issue page
2. **Read the error message** - Usually tells you what broke
3. **Check "Breadcrumbs"** - Shows what happened before the error
4. **Look at "Additional Data"** - Request params, user info, etc.
5. **Fix the issue** in code
6. **Mark as Resolved** in Sentry after deploying fix

### Common Alerts You Might See

**"404 Not Found"**
- User tried to access deleted event or wrong URL
- Check path in Sentry → Fix broken link or add redirect

**"Slow request detected"**
- Database query taking too long
- Check db_runtime in Sentry → Optimize query or add index

**"Rate limit exceeded"**
- User/IP hitting API too fast
- Usually not a problem (Rack::Attack is protecting you)
- If legitimate user, consider increasing their limit

**"failure.job: PaymentSyncWorker"**
- Eventbrite API issue or network problem
- Check Sidekiq dashboard at `/sidekiq` for details
- Job will auto-retry, monitor if it keeps failing

## Advanced: Slack Integration (Optional)

If you want real-time Slack alerts:

1. Go to Sentry → Settings → Integrations → Slack
2. Connect your Slack workspace
3. Create `#voxxy-alerts` channel
4. Configure alert rules to post to Slack
5. Get instant notifications for critical issues

## Support

**Sentry Docs:** https://docs.sentry.io/platforms/ruby/rails/
**Render Docs:** https://render.com/docs/health-checks
**Questions:** Check logs in Render dashboard or Sentry breadcrumbs

---

**Summary:** You now have comprehensive monitoring that will:
- Email you when errors occur
- Alert on security threats
- Track performance issues
- Monitor service health
- Help you fix problems quickly

The system is "set and forget" - it'll alert you automatically when something needs attention.
