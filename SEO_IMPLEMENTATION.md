# SEO Implementation Guide

**Date**: January 16, 2026
**Purpose**: Hide staging URL (voxxyai.com) from search engines while boosting production URLs (heyvoxxy.com, voxxypresents.com)

---

## 🎯 Problem We Solved

**Challenge**: Our legal company name is "Voxxy AI Inc" but our staging URL is `voxxyai.com`. We wanted:
- ✅ Hide `voxxyai.com` from all search engines (but keep it functional for staging)
- ✅ Boost `heyvoxxy.com` and `voxxypresents.com` in search results
- ✅ Ensure searches for "voxxy", "voxxyai", "hey voxxy", "voxxy presents" all show our production URLs

**Solution**: Triple-layer SEO blocking for staging + comprehensive SEO optimization for production

---

## 📁 Files Changed/Added

### New Files
- `app/controllers/robots_controller.rb` - Dynamic robots.txt based on domain
- `app/controllers/sitemap_controller.rb` - Auto-generated XML sitemap
- `app/views/sitemap/show.xml.erb` - Sitemap template
- `SEO_IMPLEMENTATION.md` - This documentation

### Modified Files
- `app/views/layouts/application.html.erb` - Added SEO meta tags
- `app/helpers/application_helper.rb` - Added SEO helper methods
- `app/controllers/application_controller.rb` - Added X-Robots-Tag header
- `client/public/index.html` - Enhanced meta tags + JSON-LD structured data
- `config/routes.rb` - Added routes for robots.txt and sitemap.xml

---

## 🛡️ Part 1: Blocking Staging from Search Engines

### Implementation (Triple-Layer Protection)

#### Layer 1: Dynamic robots.txt
**File**: `app/controllers/robots_controller.rb`

```ruby
# voxxyai.com returns:
User-agent: *
Disallow: /

# heyvoxxy.com returns:
User-agent: *
Allow: /
Sitemap: https://heyvoxxy.com/sitemap.xml
```

**How it works**: Search engines first check robots.txt. Staging domains get blocked, production domains get indexed + sitemap link.

#### Layer 2: Noindex Meta Tags
**File**: `app/views/layouts/application.html.erb:11-14`

```erb
<% if request.host == "voxxyai.com" || request.host == "www.voxxyai.com" %>
  <meta name="robots" content="noindex, nofollow">
<% end %>
```

**How it works**: Even if robots.txt is ignored, HTML meta tags tell crawlers not to index.

#### Layer 3: X-Robots-Tag HTTP Header
**File**: `app/controllers/application_controller.rb:39-44`

```ruby
def set_robots_header
  if request.host == "voxxyai.com" || request.host == "www.voxxyai.com"
    response.headers["X-Robots-Tag"] = "noindex, nofollow"
  end
end
```

**How it works**: Most reliable - header sent with every response before HTML is parsed. Works for all content types (HTML, JSON, PDFs, etc.).

---

## 🚀 Part 2: Boosting Production SEO

### 1. Comprehensive Meta Tags

**File**: `client/public/index.html:10-32`

Added:
- **Optimized title**: "Voxxy - AI-Powered Group Planning & Event Coordination | Voxxy AI"
- **Keywords**: voxxy, voxxy ai, voxxyai, hey voxxy, heyvoxxy, voxxy presents, voxxypresents
- **Description**: Clear, keyword-rich description of our product
- **Canonical URL**: Prevents duplicate content penalties
- **Open Graph tags**: Rich previews on Facebook/LinkedIn
- **Twitter Cards**: Rich previews on Twitter/X

**Why this matters**: These keywords explicitly tell Google "if someone searches for voxxyai, show heyvoxxy.com"

### 2. JSON-LD Structured Data

**File**: `client/public/index.html:52-101`

Added three structured data blocks:

#### Organization Schema
```json
{
  "@type": "Organization",
  "name": "Voxxy AI Inc",
  "alternateName": ["Voxxy", "VoxxyAI", "Hey Voxxy", "HeyVoxxy"],
  "url": "https://heyvoxxy.com"
}
```

**Why this matters**: Explicitly tells Google "VoxxyAI", "Voxxy", and "Hey Voxxy" are all the same brand.

#### Website Schema
```json
{
  "@type": "WebSite",
  "name": "Voxxy",
  "alternateName": "VoxxyAI",
  "url": "https://heyvoxxy.com"
}
```

**Why this matters**: Associates the brand name "VoxxyAI" with the domain heyvoxxy.com

#### SoftwareApplication Schema
```json
{
  "@type": "SoftwareApplication",
  "name": "Voxxy",
  "applicationCategory": "LifestyleApplication"
}
```

**Why this matters**: Helps with app store and software-related searches.

### 3. Dynamic Sitemap Generator

**Files**:
- `app/controllers/sitemap_controller.rb`
- `app/views/sitemap/show.xml.erb`

**Access**: https://heyvoxxy.com/sitemap.xml

**Features**:
- Auto-generates XML sitemap with all public pages
- Blocks staging domains (returns 404)
- Includes priority and change frequency hints
- Referenced automatically in robots.txt

**Current pages in sitemap**:
- Homepage (priority 1.0)
- /about (priority 0.8)
- /contact (priority 0.7)
- /how-it-works (priority 0.8)
- /faq (priority 0.7)
- /community (priority 0.6)
- /privacy, /terms (priority 0.5)

### 4. SEO Helper Methods

**File**: `app/helpers/application_helper.rb:11-54`

Added helper methods for easy per-page SEO customization:

```ruby
# In any controller or view:
set_meta_tags(
  title: "#{@event.title} | Voxxy Events",
  description: @event.description,
  og_image: @event.image_url
)
```

**Available helpers**:
- `set_meta_tags()` - Set all meta tags at once
- `page_title()` - Generate consistent page titles
- `is_production_domain?` - Check if current domain is production
- `is_staging_domain?` - Check if current domain is staging

### 5. Rails Layout SEO Enhancement

**File**: `app/views/layouts/application.html.erb:15-38`

Added conditional SEO meta tags for server-rendered pages:
- Dynamic canonical URLs per page
- Open Graph tags with current page URL
- Twitter Card meta tags
- Keyword optimization
- Domain-based conditional rendering (staging vs production)

---

## 🧪 Testing Your Implementation

### After Deployment - Verify Everything Works

#### 1. Test robots.txt

```bash
# Staging should block
curl https://voxxyai.com/robots.txt
# Expected output:
# User-agent: *
# Disallow: /

# Production should allow + include sitemap
curl https://heyvoxxy.com/robots.txt
# Expected output:
# User-agent: *
# Allow: /
# Sitemap: https://heyvoxxy.com/sitemap.xml
```

#### 2. Test X-Robots-Tag Header

```bash
# Staging should include noindex header
curl -I https://voxxyai.com
# Look for: X-Robots-Tag: noindex, nofollow

# Production should NOT have this header
curl -I https://heyvoxxy.com
# Should NOT include X-Robots-Tag
```

#### 3. Test Sitemap

```bash
# Production should serve sitemap
curl https://heyvoxxy.com/sitemap.xml
# Should return valid XML sitemap

# Staging should block sitemap
curl https://voxxyai.com/sitemap.xml
# Should return 404 or "not available"
```

#### 4. Verify Meta Tags (Browser)

1. Visit https://heyvoxxy.com in browser
2. Right-click → "View Page Source"
3. Search for "VoxxyAI" - should appear in:
   - `<meta name="keywords">`
   - JSON-LD structured data
   - Page title
4. Verify `<meta name="robots" content="index, follow">` exists
5. Check for Open Graph tags: `<meta property="og:title">`, etc.

#### 5. Test Social Sharing Preview

Use these tools to verify Open Graph/Twitter Cards:
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/

Enter: https://heyvoxxy.com - should show rich preview with image, title, description.

#### 6. Google Rich Results Test

1. Go to: https://search.google.com/test/rich-results
2. Enter: https://heyvoxxy.com
3. Should detect Organization and Website structured data
4. No errors should appear

---

## 📊 Post-Deployment: Google Search Console Setup

### Essential: Submit Your Sitemap (Do This ASAP!)

#### Step 1: Add Production Properties

1. Go to https://search.google.com/search-console
2. Click "Add Property"
3. Add domain: `heyvoxxy.com`
4. Follow verification steps (DNS or HTML file)
5. Repeat for: `voxxypresents.com`

#### Step 2: Submit Sitemap

1. In Search Console, select `heyvoxxy.com` property
2. Go to "Sitemaps" in left sidebar
3. Enter: `https://heyvoxxy.com/sitemap.xml`
4. Click "Submit"
5. Status should change to "Success" within minutes

#### Step 3: Request Indexing

1. Go to "URL Inspection" tool
2. Enter: `https://heyvoxxy.com`
3. Click "Request Indexing"
4. Google will crawl within 24-48 hours

### Optional: Remove voxxyai.com from Google

If `voxxyai.com` is already indexed in Google:

1. Add `voxxyai.com` to Search Console (verify ownership)
2. Go to "Removals" → "Temporary Removals"
3. Click "New Request"
4. Enter: `https://voxxyai.com/`
5. Select "Remove this URL and temporarily remove all URLs that begin with it"
6. Submit request
7. Google will process within 1-2 days
8. Once Google sees your noindex tags, removal becomes permanent

---

## 📈 Expected Results & Timeline

### Immediate (Within 24 Hours)
- ✅ Staging URL (voxxyai.com) stops getting crawled
- ✅ robots.txt blocks new bot visits
- ✅ Social sharing shows rich previews

### Short Term (1-2 Weeks)
- ✅ Google indexes heyvoxxy.com with new meta tags
- ✅ Structured data appears in Google's Knowledge Graph
- ✅ Brand name searches start showing heyvoxxy.com

### Medium Term (2-4 Weeks)
- ✅ "VoxxyAI" searches show heyvoxxy.com instead of voxxyai.com
- ✅ voxxyai.com pages removed from search results (if using Search Console removal)
- ✅ Ranking improves for target keywords

### Long Term (1-3 Months)
- ✅ Strong association between "Voxxy AI" brand and heyvoxxy.com
- ✅ Higher click-through rates from rich snippets
- ✅ Better rankings for "group planning", "event coordination" keywords

### Monitoring Metrics

Check these in Google Search Console → "Performance":

1. **Impressions** for queries:
   - "voxxy"
   - "voxxyai"
   - "hey voxxy"
   - "voxxy presents"

2. **Click-through rate (CTR)**: Should improve with better titles/descriptions

3. **Average position**: Should improve over time for target keywords

4. **Pages indexed**: heyvoxxy.com pages should increase, voxxyai.com pages should decrease to 0

---

## 🚀 Future Improvements

### Phase 2: Advanced SEO Enhancements

#### 1. Blog/Content Marketing
**Priority**: HIGH
**Effort**: Medium
**Impact**: Very High

**Implementation**:
- Create `/blog` section on heyvoxxy.com
- Write SEO-optimized articles:
  - "How to Plan Group Events with Voxxy AI"
  - "Top 10 Tips for Coordinating Group Availability"
  - "AI-Powered Event Planning: The Future is Here"
- Each post naturally includes "Voxxy AI", "VoxxyAI", brand keywords
- Internal linking to product pages

**Why**: Content marketing is the #1 way to rank for competitive keywords. Blog posts rank faster than product pages.

**Files to create**:
```
app/models/blog_post.rb
app/controllers/blog_posts_controller.rb
app/views/blog_posts/
client/src/components/Blog/
```

#### 2. User Testimonials & Reviews
**Priority**: HIGH
**Effort**: Low
**Impact**: High

**Implementation**:
- Add testimonials section to homepage
- Include Review structured data (JSON-LD)
- Star ratings appear in Google search results

**Example structured data**:
```json
{
  "@type": "Product",
  "name": "Voxxy",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

**Why**: Star ratings in search results increase CTR by 30%+

#### 3. FAQ Schema for Rich Snippets
**Priority**: MEDIUM
**Effort**: Low
**Impact**: Medium

**Implementation**:
Add FAQ structured data to FAQ page:

```json
{
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is Voxxy?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Voxxy is an AI-powered group planning tool..."
    }
  }]
}
```

**Why**: Appears as expandable FAQ in Google search results (huge visibility boost)

**File to modify**: `client/src/components/FAQ.js`

#### 4. Video Content & VideoObject Schema
**Priority**: MEDIUM
**Effort**: High
**Impact**: High

**Implementation**:
- Create product demo video (2-3 minutes)
- Upload to YouTube with optimized title: "Voxxy AI - Group Planning Made Simple"
- Embed on homepage
- Add VideoObject structured data

**Why**: Videos appear in Google Video search and regular search results. YouTube is the #2 search engine.

#### 5. Local SEO (If Applicable)
**Priority**: LOW (unless you have physical location)
**Effort**: Low
**Impact**: Medium

**Implementation**:
- Add LocalBusiness schema if you have an office
- Create Google Business Profile
- Include address, hours, phone number

**Why**: Appears in "near me" searches and Google Maps

#### 6. International SEO (Multi-language)
**Priority**: LOW (unless expanding internationally)
**Effort**: High
**Impact**: Very High (for international markets)

**Implementation**:
- Add `hreflang` tags for different languages
- Create `/es/`, `/fr/` subdirectories for Spanish/French
- Translate meta tags and structured data

**Example**:
```html
<link rel="alternate" hreflang="en" href="https://heyvoxxy.com/" />
<link rel="alternate" hreflang="es" href="https://heyvoxxy.com/es/" />
```

#### 7. Advanced Analytics & Tracking
**Priority**: MEDIUM
**Effort**: Medium
**Impact**: Medium (better insights)

**Implementation**:
- Add Google Analytics 4 (GA4) events for:
  - Search queries that led to site
  - Time on page per keyword
  - Conversion tracking from organic search
- Set up Google Tag Manager for easier tracking
- Create custom dashboards for SEO metrics

**Why**: Data-driven SEO decisions are more effective

#### 8. Page Speed Optimization
**Priority**: HIGH
**Effort**: Medium
**Impact**: High

**Current issues to check**:
- Image optimization (compress voxxy-share-default.png)
- Code splitting for React app
- Enable gzip/brotli compression
- Lazy load images below fold
- Preload critical assets
- Use CDN for static assets

**Tools to test**:
- Google PageSpeed Insights: https://pagespeed.web.dev/
- GTmetrix: https://gtmetrix.com/

**Why**: Page speed is a ranking factor. Faster sites rank higher.

#### 9. Schema Markup for Events
**Priority**: MEDIUM (for voxxypresents.com)
**Effort**: Medium
**Impact**: High

**Implementation**:
Add Event structured data for each event:

```json
{
  "@type": "Event",
  "name": "Event Name",
  "startDate": "2026-02-15T19:00",
  "location": {
    "@type": "Place",
    "name": "Venue Name",
    "address": "123 Main St"
  },
  "offers": {
    "@type": "Offer",
    "price": "25",
    "priceCurrency": "USD"
  }
}
```

**Why**: Events appear in Google's event search and calendar integrations

**File to modify**: Event show pages in voxxypresents.com

#### 10. Breadcrumb Schema
**Priority**: LOW
**Effort**: Low
**Impact**: Low-Medium

**Implementation**:
Add breadcrumb navigation + schema:

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [{
    "@type": "ListItem",
    "position": 1,
    "name": "Home",
    "item": "https://heyvoxxy.com"
  }, {
    "@type": "ListItem",
    "position": 2,
    "name": "Events",
    "item": "https://heyvoxxy.com/events"
  }]
}
```

**Why**: Shows breadcrumb trail in search results, improves UX

#### 11. Link Building Strategy
**Priority**: HIGH
**Effort**: High (ongoing)
**Impact**: Very High

**Implementation**:
- Guest post on event planning blogs
- Get listed in:
  - ProductHunt
  - Capterra
  - G2
  - Software review sites
- Partner with complementary tools (calendar apps, event platforms)
- Get press coverage in tech blogs

**Why**: Backlinks are the #1 ranking factor. More quality links = higher rankings.

#### 12. Dynamic Sitemap for Activities/Events
**Priority**: MEDIUM
**Effort**: Low
**Impact**: Medium

**Implementation**:
Enhance `sitemap_controller.rb` to include public activities/events:

```ruby
# In generate_sitemap_urls method
Activity.where(public: true).find_each do |activity|
  urls << {
    loc: "#{@base_url}/activities/#{activity.id}",
    changefreq: "weekly",
    priority: 0.6,
    lastmod: activity.updated_at.to_date
  }
end
```

**Why**: More indexed pages = more opportunities to rank

**Caution**: Only include if activities/events are meant to be public

#### 13. Implement AMP (Accelerated Mobile Pages)
**Priority**: LOW
**Effort**: High
**Impact**: Low-Medium

**Implementation**:
- Create AMP versions of blog posts
- Add `<link rel="amphtml">` tags

**Why**: AMP pages load instantly on mobile, sometimes get preferential treatment in search

**Note**: Google has deprioritized AMP recently, so this is optional

#### 14. Voice Search Optimization
**Priority**: LOW
**Effort**: Medium
**Impact**: Low-Medium (growing)

**Implementation**:
- Add conversational keywords: "how do I plan a group event"
- Use question-based headers: "How Does Voxxy Help with Group Planning?"
- Add FAQ schema (see #3)

**Why**: Voice search is growing. "Hey Voxxy" is perfect for voice!

---

## 📋 Quick Reference Checklist

### Immediate Actions (Do These First)
- [ ] Deploy changes to staging
- [ ] Test robots.txt on staging (should block)
- [ ] Deploy to production
- [ ] Test robots.txt on production (should allow + sitemap)
- [ ] Verify meta tags in browser (view source)
- [ ] Test social sharing previews (Facebook/Twitter tools)
- [ ] Submit heyvoxxy.com to Google Search Console
- [ ] Submit sitemap to Google Search Console
- [ ] Request indexing for homepage
- [ ] Submit voxxypresents.com to Google Search Console

### Week 1
- [ ] Monitor Google Search Console for crawl errors
- [ ] Check that sitemap is processing successfully
- [ ] Add voxxyai.com to Search Console
- [ ] Request removal of voxxyai.com pages from Google

### Week 2-4
- [ ] Monitor search impressions for target keywords
- [ ] Check if heyvoxxy.com appears for "voxxyai" searches
- [ ] Verify voxxyai.com removal is processing
- [ ] Review performance reports in Search Console

### Month 2-3
- [ ] Plan Phase 2 improvements (prioritize based on this doc)
- [ ] Consider blog/content strategy
- [ ] Implement FAQ schema (quick win)
- [ ] Add customer testimonials + review schema

---

## 🔍 Troubleshooting

### Issue: Staging URL still appears in Google after 2 weeks

**Solution**:
1. Verify all 3 blocking layers are working (robots.txt, meta tags, X-Robots-Tag)
2. Check Google Search Console for crawl status
3. Use URL Removal tool in Search Console
4. Check if external sites are linking to voxxyai.com (use Google: `link:voxxyai.com`)
5. Contact those sites to update links to heyvoxxy.com

### Issue: heyvoxxy.com not ranking for "voxxyai"

**Solution**:
1. Wait longer (can take 4-6 weeks for Google to update)
2. Verify structured data is valid (use Rich Results Test)
3. Add more content mentioning "Voxxy AI" naturally
4. Create About page clearly stating "Voxxy AI Inc."
5. Get backlinks from other sites using anchor text "Voxxy AI"

### Issue: Sitemap not being processed

**Solution**:
1. Test sitemap directly: `curl https://heyvoxxy.com/sitemap.xml`
2. Verify XML is valid (use validator)
3. Check robots.txt includes sitemap URL
4. Resubmit sitemap in Search Console
5. Check for crawl errors in Search Console

### Issue: Meta tags not showing in search results

**Solution**:
1. Google may take 2-4 weeks to update cached pages
2. Request re-indexing in Search Console
3. Verify meta tags are in `<head>` section
4. Check for duplicate meta tags (shouldn't have multiple `<title>` tags)
5. Ensure meta descriptions are 150-160 characters (not truncated)

### Issue: Open Graph images not loading

**Solution**:
1. Verify image exists: https://heyvoxxy.com/voxxy-share-default.png
2. Check image is at least 1200x630px (Facebook recommendation)
3. Image must be publicly accessible (no auth required)
4. Use absolute URLs (not relative)
5. Clear Facebook cache: https://developers.facebook.com/tools/debug/

---

## 📚 Additional Resources

### SEO Tools (Free)
- **Google Search Console**: https://search.google.com/search-console
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **PageSpeed Insights**: https://pagespeed.web.dev/
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **Schema Markup Validator**: https://validator.schema.org/

### SEO Learning Resources
- **Google SEO Starter Guide**: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- **Moz Beginner's Guide to SEO**: https://moz.com/beginners-guide-to-seo
- **Schema.org Documentation**: https://schema.org/docs/full.html
- **Google Search Central Blog**: https://developers.google.com/search/blog

### Competitor Analysis Tools
- **Ahrefs** (paid): Backlink analysis, keyword research
- **SEMrush** (paid): Comprehensive SEO toolkit
- **Ubersuggest** (freemium): Keyword ideas, competitor analysis

---

## 🤝 Contributing to SEO

### For Developers

When creating new pages/features:

1. **Use SEO helpers** in controllers:
```ruby
def show
  @event = Event.find(params[:id])
  set_meta_tags(
    title: "#{@event.title} | Voxxy Events",
    description: @event.description.truncate(160),
    og_image: @event.image_url
  )
end
```

2. **Add new pages to sitemap**:
Edit `app/controllers/sitemap_controller.rb` → `generate_sitemap_urls` method

3. **Use semantic HTML**:
- `<article>` for blog posts
- `<nav>` for navigation
- `<header>`, `<main>`, `<footer>` for structure
- Heading hierarchy: h1 → h2 → h3 (don't skip levels)

4. **Optimize images**:
- Use descriptive file names: `voxxy-event-planning.jpg` (not `IMG_1234.jpg`)
- Add `alt` text to all images
- Compress images before uploading

### For Content Writers

When writing copy:

1. **Include target keywords naturally**:
   - Primary: "Voxxy", "group planning", "event coordination"
   - Secondary: "Voxxy AI", "VoxxyAI", "Hey Voxxy"
   - Long-tail: "how to coordinate group availability", "ai event planning tool"

2. **Write for humans first, search engines second**:
   - Natural, conversational tone
   - Answer user questions
   - Provide value

3. **Optimal content length**:
   - Homepage: 300-500 words
   - Product pages: 500-800 words
   - Blog posts: 1500-2500 words (long-form ranks better)

4. **Include calls-to-action (CTAs)**:
   - "Try Voxxy Free"
   - "Start Planning Your Event"
   - Clear next steps for users

---

## 📞 Support & Questions

**Questions about this implementation?**
- Check the troubleshooting section above
- Review Google Search Console for specific errors
- Reference the code comments in the modified files

**Need to extend SEO for new features?**
- Use the helper methods in `application_helper.rb`
- Follow the patterns in existing controllers
- Add new pages to the sitemap generator

**Seeing unexpected behavior?**
- Check the browser console for errors
- Use "View Source" to verify meta tags are rendering
- Test with the validation tools listed in Resources section

---

## 📊 Success Metrics

Track these KPIs to measure SEO success:

### Primary Metrics
- **Organic Traffic**: Google Analytics → Acquisition → Organic Search
- **Keyword Rankings**: Google Search Console → Performance → Queries
- **Indexed Pages**: Google Search Console → Coverage → Valid

### Secondary Metrics
- **Click-Through Rate (CTR)**: Search Console → Average CTR
- **Average Position**: Search Console → Position for target keywords
- **Backlinks**: Search Console → Links → Top linking sites
- **Core Web Vitals**: Search Console → Experience → Core Web Vitals

### Target Goals (3 Months)
- [ ] heyvoxxy.com ranks #1 for "voxxy"
- [ ] heyvoxxy.com ranks in top 3 for "voxxyai"
- [ ] heyvoxxy.com ranks in top 10 for "group planning tool"
- [ ] voxxyai.com shows 0 pages indexed in Google
- [ ] Organic traffic increases 200%+ from baseline
- [ ] All structured data showing in Rich Results Test

---

**Version**: 1.0
**Last Updated**: January 16, 2026
**Maintained By**: Engineering Team

**Changelog**:
- 2026-01-16: Initial implementation - staging blocking + production SEO boost
