# Domain Migration to heyvoxxy.com - Implementation Complete

## Summary
Updated the application to use dynamic URLs based on environment variables instead of hardcoding domains. This makes it easy to switch between voxxyai.com and heyvoxxy.com by simply changing the `PRIMARY_DOMAIN` environment variable.

## Key Decision Made
- **Email sender remains**: `team@voxxyai.com` (unchanged as requested)

## Changes Implemented

### 1. Backend Services - Dynamic URL Configuration
Created a centralized method `app_base_url` in `BaseEmailService` that all email services now use:

```ruby
def self.app_base_url
  if Rails.env.production?
    primary_domain = ENV.fetch("PRIMARY_DOMAIN", "voxxyai.com")
    "https://#{primary_domain}"
  else
    "http://localhost:3000"
  end
end
```

### 2. Updated Email Services
All email services now use the dynamic `app_base_url` method instead of hardcoded URLs:
- ✅ `app/services/activity_acceptance_email_service.rb`
- ✅ `app/services/activity_acceptance_and_response_email_service.rb`
- ✅ `app/services/activity_response_email_service.rb`
- ✅ `app/services/password_reset_service.rb`
- ✅ `app/services/invite_user_service.rb` (2 locations)

### 3. Application Controller
Updated `frontend_host` method to use PRIMARY_DOMAIN:
- ✅ `app/controllers/application_controller.rb`

### 4. Share Page Template
- ✅ Created helper method in `app/helpers/application_helper.rb`
- ✅ Updated `app/views/layouts/share.html.erb` to use dynamic URLs

### 5. Frontend Redirection Logic
- ✅ Created `RedirectToHeyVoxxy` component for non-admin users on voxxyai.com
- ✅ Updated `App.js` to handle domain-specific routing

## Environment Variables Required

### For heyvoxxy.com Production:
```bash
PRIMARY_DOMAIN=heyvoxxy.com
REACT_APP_API_URL=https://heyvoxxy.com
```

### For voxxyai.com Production:
```bash
PRIMARY_DOMAIN=voxxyai.com
REACT_APP_API_URL=https://voxxyai.com
```

## How It Works Now

1. **Backend**: All URLs are generated dynamically based on `PRIMARY_DOMAIN`
2. **Frontend**: Uses `REACT_APP_API_URL` for API calls
3. **Email Links**: Automatically point to the correct domain
4. **Admin Access**: Admin users can access voxxyai.com
5. **User Redirect**: Non-admin users on voxxyai.com redirect to heyvoxxy.com

## Testing Checklist

Before deploying, test these flows:

- [ ] Set `PRIMARY_DOMAIN=heyvoxxy.com` in production environment
- [ ] User registration emails have heyvoxxy.com links
- [ ] Password reset emails work with heyvoxxy.com
- [ ] Activity invitations use heyvoxxy.com URLs
- [ ] Guest response links work properly
- [ ] Share page links navigate to heyvoxxy.com
- [ ] Admin users can still access voxxyai.com
- [ ] Non-admin users redirect from voxxyai.com to heyvoxxy.com

## Deployment Steps

1. Deploy code to production
2. Set environment variable: `PRIMARY_DOMAIN=heyvoxxy.com`
3. Restart the application
4. Test all email flows
5. Verify redirects work correctly

## Rollback Plan

If issues arise, simply change `PRIMARY_DOMAIN` back to `voxxyai.com` and restart the application. No code changes needed.

## Notes
- Email sender addresses remain `team@voxxyai.com` as requested
- Frontend contact emails in Terms and Privacy pages remain `team@voxxyai.com`
- CORS and Cable configurations already support both domains