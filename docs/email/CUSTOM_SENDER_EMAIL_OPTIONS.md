# Custom Sender Email Options for Event Producers

## Executive Summary

**Request:** Event producer wants emails to come from their email address (e.g., `brooklynheartsclub@gmail.com`) instead of `team@voxxypresents.com` to ensure vendor recognition and avoid spam filtering.

**Core Issue:** Vendors have 14-year relationships with producers. Emails from unfamiliar senders may be ignored or marked as spam.

**Timeline:** Needed by next week for February event launch.

**Scope:** Initially one producer, but likely all producers will want this feature.

---

## Option 1: Custom "From Name" Only (Quickest Solution)

### What Changes
- **From:** "Brooklyn Hearts Club <team@voxxypresents.com>"
- **Reply-To:** brooklynheartsclub@gmail.com
- Email address stays the same, but display name shows producer's business name

### How It Appears in Inbox
```
From: Brooklyn Hearts Club <team@voxxypresents.com>
Reply-To: brooklynheartsclub@gmail.com
```

Most email clients prominently display "Brooklyn Hearts Club" - the email address is secondary and often not noticed unless specifically looked for.

### Technical Implementation

**Database Changes:**
- Add `sender_name` (string) to `organizations` table
- Add `sender_reply_email` (string) to `organizations` table

**Code Changes:**
- Update `BaseEmailService` to use organization's sender name if present
- Update all email service classes to set Reply-To header
- Fallback to "Voxxy Presents" if not configured

**Estimated Time:** 2-4 hours
- 30 min: Database migration
- 1-2 hours: Update email services
- 1 hour: Testing

### Pros
- ✅ Fastest to implement
- ✅ No external configuration needed
- ✅ Replies go directly to producer
- ✅ No DNS changes required
- ✅ Works with any email address (including Gmail)
- ✅ Zero risk of deliverability issues

### Cons
- ❌ Email address still shows `@voxxypresents.com`
- ❌ Tech-savvy users might notice the domain mismatch
- ❌ Doesn't fully solve "recognition" problem if vendors look at email address

### Risk Assessment
**Low Risk** - This is standard email practice and won't affect deliverability.

---

## Option 2: Domain Authentication (Full Custom Sender)

### What Changes
- **From:** "Brooklyn Hearts Club <events@brooklynheartsclub.com>"
- Emails actually come from the producer's domain
- Full sender authentication with DKIM/SPF

### How It Appears in Inbox
```
From: Brooklyn Hearts Club <events@brooklynheartsclub.com>
```

Completely branded to the producer's domain.

### Technical Implementation

#### Phase 1: SendGrid Domain Authentication
1. Producer must own a domain (not Gmail - e.g., `brooklynheartsclub.com`)
2. Add domain to SendGrid as "Authenticated Domain"
3. SendGrid provides DNS records (CNAME, TXT)
4. Producer adds DNS records to their domain registrar
5. SendGrid verifies (can take 24-48 hours)

#### Phase 2: Database Schema
**Add to `organizations` table:**
```ruby
sender_email          # e.g., "events@brooklynheartsclub.com"
sender_name           # e.g., "Brooklyn Hearts Club"
sender_domain         # e.g., "brooklynheartsclub.com"
sender_verified       # boolean - has SendGrid verified this domain?
sender_verified_at    # timestamp
```

#### Phase 3: Code Changes
**Update Email Services:**
- `BaseEmailService` - Check organization's `sender_email` and `sender_verified`
- All email services (`RegistrationEmailService`, `EmailSenderService`, etc.)
- Fallback to `team@voxxypresents.com` if not configured or not verified
- Add validation to prevent sending from unverified domains

**New Admin Functionality:**
- UI to configure sender email per organization
- SendGrid API integration to add/verify domains
- Status checking (pending verification, verified, failed)
- Documentation/instructions for DNS setup

**Estimated Time:** 16-24 hours development + DNS verification time
- 2 hours: Database migration and models
- 4-6 hours: SendGrid API integration
- 4-6 hours: Update all email services
- 2-4 hours: Admin UI (basic)
- 2-4 hours: Validation and error handling
- 2-4 hours: Testing and documentation

**DNS Verification Time:** 24-48 hours after DNS records are added

### Pros
- ✅ Fully branded sender email
- ✅ Maximum vendor recognition
- ✅ Professional appearance
- ✅ Complete email ownership by producer
- ✅ Solves the core problem completely
- ✅ Scalable solution for all producers

### Cons
- ❌ Requires producer to own a domain (no Gmail/Yahoo/etc.)
- ❌ Requires DNS access and technical coordination
- ❌ DNS propagation can take 24-48 hours
- ❌ More complex to implement
- ❌ Ongoing maintenance if producers change domains
- ❌ Risk of deliverability issues if DNS not configured correctly

### Risk Assessment
**Medium Risk** - DNS misconfiguration can cause emails to fail or go to spam. Requires careful validation and monitoring.

### What Producer Needs
1. **Own a domain** (e.g., `brooklynheartsclub.com`) - NOT Gmail
2. **DNS access** - ability to add CNAME and TXT records
3. **Technical contact** - someone who can handle DNS updates (can be their webmaster)
4. **Email address on that domain** - e.g., `info@brooklynheartsclub.com` or `events@brooklynheartsclub.com`

---

## Option 3: White-Glove Test + UI Later (Recommended Approach)

### Implementation Strategy

#### Immediate (This Week)
**Manual Setup for Brooklyn Hearts Club:**
1. Get their domain name and desired sender email
2. Manually authenticate domain in SendGrid dashboard
3. Provide them DNS records to add
4. Hardcode their organization in email services as a temporary override
5. Verify and test before February event

**Code Changes:**
```ruby
# Temporary override in BaseEmailService
def sender_email
  # Hardcode for Organization ID = X (Brooklyn Hearts Club)
  return "events@brooklynheartsclub.com" if organization.id == BROOKLYN_HEARTS_CLUB_ORG_ID
  "team@voxxypresents.com"
end
```

**Estimated Time:** 4-6 hours
- 1 hour: SendGrid domain setup
- 2-3 hours: Code changes for override
- 1-2 hours: Testing
- DNS verification: 24-48 hours (producer's side)

#### Short-term (Next Sprint)
- Add database fields for sender configuration
- Remove hardcoded override
- Create basic admin interface for sender email management

#### Long-term (Roadmap)
- Full self-service UI for producers to configure sender emails
- Automated SendGrid domain verification via API
- Visual DNS setup wizard with copy-paste instructions
- Email delivery monitoring per sender domain
- Sender reputation tracking

### Pros
- ✅ Gets producer what they need immediately
- ✅ Validates the use case before full build
- ✅ Spreads development effort over time
- ✅ Lower immediate risk
- ✅ Learn from first implementation

### Cons
- ❌ Technical debt (hardcoded override)
- ❌ Not scalable until database/UI built
- ❌ Requires manual work for each new producer initially

---

## Option 4: Reply-To Only (Backup Plan)

### What Changes
- **From:** "Voxxy Presents <team@voxxypresents.com>"
- **Reply-To:** brooklynheartsclub@gmail.com

Email appears to come from Voxxy, but replies go to producer.

### Technical Implementation
**Estimated Time:** 1-2 hours
- Add `reply_to_email` field to organizations
- Update email services to set Reply-To header

### Pros
- ✅ Extremely fast to implement
- ✅ Works with any email (including Gmail)
- ✅ Ensures producer gets replies
- ✅ Zero configuration needed

### Cons
- ❌ Doesn't solve the recognition problem
- ❌ Sender still shows "Voxxy Presents"
- ❌ Doesn't address the core concern

### Use Case
This is a fallback if producer doesn't have a domain or if DNS setup fails before launch.

---

## Comparison Matrix

| Feature | Option 1: From Name | Option 2: Full Auth | Option 3: White Glove | Option 4: Reply-To |
|---------|-------------------|-------------------|---------------------|------------------|
| **Dev Time** | 2-4 hours | 16-24 hours | 4-6 hours initial | 1-2 hours |
| **DNS Required** | No | Yes | Yes | No |
| **Domain Needed** | No | Yes | Yes | No |
| **Sender Recognition** | Medium | High | High | Low |
| **Scalability** | High | High | Medium → High | High |
| **Risk** | Low | Medium | Low-Medium | Low |
| **Producer Effort** | None | Medium | Medium | None |
| **Solves Core Problem** | Partially | Fully | Fully | Minimally |

---

## Recommendations

### Immediate Action (This Week)
1. **Ask producer:** "If the email shows 'Brooklyn Hearts Club' as the sender name, but the email address is team@voxxypresents.com, would that work for you?"
   - If **YES** → Implement Option 1 immediately (2-4 hours)
   - If **NO** → Continue to step 2

2. **If they need full branding:**
   - Confirm they have a domain (not Gmail)
   - Get domain name and DNS access contact
   - Implement Option 3 (White-Glove) - 4-6 hours dev + 24-48 hours DNS

### Long-term Strategy
- Build Option 2 (Full Domain Authentication) as a product feature
- Create self-service UI for producers
- Make it a premium feature or standard for all

### Fallback Position
- If domain setup fails or takes too long: Option 1 (From Name) or Option 4 (Reply-To)
- Both can be implemented in hours, not days

---

## Technical Considerations

### SendGrid Limitations
- **Verified Sender Identities:** Max 100 per account (shouldn't be an issue)
- **Domain Authentication:** Unlimited, but requires DNS access
- **Shared IP Pool:** All senders share reputation - one bad actor affects all

### Security Concerns
- **Domain Spoofing:** Must verify domains to prevent misuse
- **Email Reputation:** Producer's domain reputation affects deliverability
- **DMARC/DKIM/SPF:** Must be properly configured or emails will bounce

### Deliverability Impact
- **Option 1:** No impact (uses existing authenticated domain)
- **Option 2/3:** Depends on producer's domain reputation and DNS configuration
- **Option 4:** No impact

### Database Schema Proposal (for Options 2/3)
```ruby
# Migration: add_sender_configuration_to_organizations
add_column :organizations, :sender_email, :string
add_column :organizations, :sender_name, :string
add_column :organizations, :sender_domain, :string
add_column :organizations, :sender_verified, :boolean, default: false
add_column :organizations, :sender_verified_at, :datetime
add_column :organizations, :reply_to_email, :string

add_index :organizations, :sender_domain, unique: true
add_index :organizations, :sender_verified
```

---

## Questions for Engineering Team

1. **Which option aligns with product vision?** One-off customization vs. scalable feature?

2. **SendGrid account limits:** How many organizations do we expect to need custom domains?

3. **Support burden:** Who handles DNS troubleshooting when producers have issues?

4. **Validation strategy:** How do we ensure producer domains don't harm our email reputation?

5. **Monitoring:** Do we need per-organization email analytics and deliverability tracking?

6. **Pricing impact:** Is this a premium feature or included for all?

---

## Next Steps

### Before Meeting with Producer
- [ ] Check if they have a domain (not Gmail)
- [ ] Ask if "From Name" customization is acceptable compromise
- [ ] Determine if they have DNS access or a technical contact

### After Decision
- [ ] Choose implementation option
- [ ] Create technical task breakdown
- [ ] Assign developer and QA resources
- [ ] Set up SendGrid domain authentication (if Option 2/3)
- [ ] Schedule testing window
- [ ] Prepare producer communication/documentation

---

## Additional Resources

### SendGrid Documentation
- [Domain Authentication Guide](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
- [Sender Identity Verification](https://docs.sendgrid.com/ui/sending-email/sender-verification)
- [DNS Configuration](https://docs.sendgrid.com/ui/account-and-settings/dns-records)

### Relevant Code Files
- `/app/services/base_email_service.rb` - Base email sending logic
- `/app/services/registration_email_service.rb` - Vendor emails
- `/app/services/email_sender_service.rb` - Scheduled campaign emails
- `/app/models/organization.rb` - Organization model
- `/config/environments/production.rb` - SendGrid SMTP config

### Testing Checklist
- [ ] Test with authenticated domain
- [ ] Test fallback to default sender
- [ ] Test all 17 email types
- [ ] Test Reply-To functionality
- [ ] Verify SPF/DKIM/DMARC records
- [ ] Check spam score with mail-tester.com
- [ ] Test with multiple email clients (Gmail, Outlook, Apple Mail)

---

## Risk Mitigation

### If DNS Setup Fails
- Fallback to Option 1 (From Name) immediately
- Producer still gets branded sender name
- Replies still go to them via Reply-To

### If Emails Go to Spam
- Check DNS records with MXToolbox
- Verify DMARC alignment
- Test sender reputation
- Warm up new domain gradually

### If Timeline Slips
- Option 1 can be implemented in hours as emergency solution
- Producer gets partial branding immediately
- Full solution can roll out later

---

**Document Version:** 1.0
**Date:** 2026-01-22
**Author:** Technical Planning
**Status:** Pending Engineering Review
