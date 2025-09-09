# Recommendation System Improvements - Fixing Closed/Outdated Venues

## Problem Statement
The current recommendation system using OpenAI GPT-3.5-turbo is returning closed or outdated restaurant/bar recommendations because:
- OpenAI's training data has a cutoff date and lacks real-time business information
- No validation against actual Google Places data before presenting to users
- No mechanism to verify if businesses are currently operational

## Current System Architecture
1. User inputs preferences → OpenAI generates 5 recommendations
2. Google Places enriches with photos/reviews (but doesn't validate operational status)
3. Recommendations shown to users (potentially including closed venues)

## Proposed Solutions

### Solution 1: Real-Time Validation (Recommended)
**Pre-filter recommendations through Google Places API:**
```ruby
# After OpenAI generates recommendations, validate each one:
def validate_recommendations(recommendations)
  validated = []
  recommendations.each do |rec|
    place_data = GooglePlacesService.find_and_validate(rec[:name], rec[:address])
    if place_data[:business_status] == "OPERATIONAL"
      validated << rec.merge(place_data)
    end
  end
  validated
end
```

**Implementation:**
- Request 8-10 recommendations from OpenAI
- Validate business_status via Google Places
- Filter down to 5 operational venues
- Check fields: `business_status`, `opening_hours`, `permanently_closed`

### Solution 2: Hybrid Approach - Google Places First
**Reverse the current flow:**
1. Query Google Places Nearby Search API first
2. Filter by: operational status, ratings, price level, distance
3. Send validated list to OpenAI for personalization
4. OpenAI ranks and provides personalized descriptions

```ruby
# Example implementation
def google_first_recommendations(location, preferences)
  # Step 1: Get operational venues from Google
  venues = GooglePlacesService.nearby_search(
    location: location,
    type: 'restaurant',
    status: 'OPERATIONAL',
    min_rating: 3.5
  )
  
  # Step 2: Send to OpenAI for personalization
  openai_response = personalize_venues(venues, preferences)
  
  return openai_response
end
```

### Solution 3: Enhanced Prompt Engineering
**Update OpenAI prompts to include:**
```
IMPORTANT REQUIREMENTS:
1. Only recommend restaurants that are currently operating and popular in 2024
2. Avoid any establishments that may have closed during or after COVID-19
3. Prioritize newer establishments (opened within the last 3 years) or recently renovated venues
4. Focus on currently buzzing places with recent positive reviews
5. Do not recommend establishments that were popular pre-2020 unless you're certain they're still thriving
```

### Solution 4: Business Hours Verification
```ruby
def verify_open_at_time(place_id, planned_datetime)
  details = GooglePlacesService.get_place_details(
    place_id, 
    ['opening_hours', 'business_status', 'current_opening_hours']
  )
  
  return false if details[:business_status] == "CLOSED_PERMANENTLY"
  return false if details[:business_status] == "CLOSED_TEMPORARILY"
  
  # Check if open at planned time
  if details[:current_opening_hours]
    return is_open_at?(details[:current_opening_hours], planned_datetime)
  end
  
  true # Assume open if hours unavailable
end
```

### Solution 5: User Feedback Loop
**Add to the UI:**
- "Report Closed" button on each recommendation
- Track failed recommendations in database
- Build blacklist of closed venues

**Database schema:**
```ruby
class ClosedVenueReport < ApplicationRecord
  belongs_to :user
  belongs_to :pinned_activity, optional: true
  
  validates :venue_name, presence: true
  validates :venue_address, presence: true
  
  # Auto-blacklist after 3 reports
  after_create :check_blacklist_threshold
end
```

### Solution 6: Quality Scoring System
```ruby
def calculate_quality_score(recommendation, google_data)
  score = 0
  
  # Operational status (highest weight)
  score += 30 if google_data[:business_status] == "OPERATIONAL"
  
  # Recent reviews indicate active business
  if google_data[:reviews].present?
    recent_reviews = google_data[:reviews].select { |r| 
      r[:time] > 3.months.ago.to_i 
    }
    score += 20 if recent_reviews.count >= 3
  end
  
  # High ratings with sufficient volume
  if google_data[:rating].present? && google_data[:user_ratings_total].present?
    score += 15 if google_data[:rating] >= 4.0
    score += 10 if google_data[:user_ratings_total] >= 100
  end
  
  # Has recent photos
  if google_data[:photos].present?
    score += 5
  end
  
  # Currently open (if checking)
  score += 20 if currently_open?(google_data)
  
  score
end

# Only return recommendations with score > 50
```

### Solution 7: Caching Strategy Update
```ruby
# Current: 1-hour cache for all recommendations
# Proposed: Intelligent caching

def cache_duration_for(recommendation, validation_result)
  if validation_result[:business_status] == "CLOSED_PERMANENTLY"
    return 0 # Don't cache closed businesses
  elsif validation_result[:quality_score] < 50
    return 15.minutes # Short cache for low-quality
  elsif validation_result[:recently_updated]
    return 30.minutes # Medium cache for recently updated
  else
    return 1.hour # Normal cache for stable, operational venues
  end
end
```

## Implementation Plan

### Phase 1: Quick Fixes (1-2 days)
1. **Update OpenAI Prompts**
   - Add temporal context and COVID considerations
   - Request currently popular venues
   - File: `/app/controllers/openai_controller.rb`

2. **Add Basic Validation**
   - Check business_status from Google Places
   - Filter out CLOSED_PERMANENTLY venues
   - File: `/app/services/google_places_service.rb`

### Phase 2: Validation System (3-5 days)
3. **Implement Full Validation Pipeline**
   - Request 8-10 recommendations from OpenAI
   - Validate all through Google Places
   - Return best 5 operational venues
   
4. **Add Business Hours Checking**
   - Verify open at requested date/time
   - Show hours prominently in UI

### Phase 3: Feedback System (1 week)
5. **User Reporting**
   - Add "Report Closed" button
   - Create ClosedVenueReport model
   - Build blacklist system

6. **Quality Scoring**
   - Implement comprehensive scoring
   - Sort by quality score
   - Show confidence indicators

### Phase 4: Advanced Features (2 weeks)
7. **Hybrid Google-First Option**
   - Create alternative endpoint
   - A/B test against current system
   
8. **Machine Learning Integration**
   - Track successful recommendations
   - Learn from user behavior
   - Improve over time

## Testing Strategy

### Manual Testing
```ruby
# Test script to verify improvements
test_locations = [
  "Brooklyn, NY",
  "Manhattan, NY", 
  "Los Angeles, CA"
]

test_preferences = [
  "Vegan restaurants",
  "Late night bars",
  "Brunch spots"
]

test_locations.each do |location|
  test_preferences.each do |pref|
    recs = fetch_recommendations(location, pref)
    recs.each do |rec|
      validation = validate_venue(rec)
      puts "#{rec[:name]}: #{validation[:status]} (Score: #{validation[:score]})"
    end
  end
end
```

### Automated Testing
- Add RSpec tests for validation logic
- Mock Google Places API responses
- Test edge cases (all venues closed, API failures)

## Monitoring & Metrics

### Key Metrics to Track
1. **Closed Venue Rate**: % of recommendations that are closed
2. **Validation Success Rate**: % passing Google Places validation  
3. **User Reports**: Number of "closed" reports per day
4. **Cache Hit Rate**: % of requests served from cache
5. **API Costs**: OpenAI + Google Places API usage

### Logging Updates
```ruby
Rails.logger.info "[REC_VALIDATION] Venue: #{name}, Status: #{status}, Score: #{score}"
Rails.logger.warn "[REC_FAILED] Venue: #{name}, Reason: #{reason}"
Rails.logger.error "[REC_CLOSED] User reported closed: #{name}"
```

## Cost Considerations

### Current Costs
- OpenAI: ~$0.002 per recommendation set (5 venues)
- Google Places: ~$0.017 per validation (Find Place + Details)

### Proposed Costs
- OpenAI: ~$0.003 per set (8-10 venues)
- Google Places: ~$0.027 per set (8 validations)
- Total: ~$0.03 per recommendation request

### Cost Optimization
1. Cache validation results separately (24-hour cache for operational status)
2. Build local database of known venues
3. Batch Google Places requests
4. Consider monthly Google Maps Platform credits

## Migration Strategy

### Database Migrations Needed
```ruby
# Add validation fields to pinned_activities
class AddValidationToPinnedActivities < ActiveRecord::Migration[7.0]
  def change
    add_column :pinned_activities, :google_place_id, :string
    add_column :pinned_activities, :business_status, :string
    add_column :pinned_activities, :last_validated_at, :datetime
    add_column :pinned_activities, :quality_score, :integer
    add_column :pinned_activities, :validation_data, :jsonb
    
    add_index :pinned_activities, :google_place_id
    add_index :pinned_activities, :business_status
  end
end

# Create closed venues tracking
class CreateClosedVenueReports < ActiveRecord::Migration[7.0]
  def change
    create_table :closed_venue_reports do |t|
      t.string :venue_name, null: false
      t.string :venue_address
      t.string :google_place_id
      t.references :user, foreign_key: true
      t.references :pinned_activity, foreign_key: true
      t.string :status, default: 'pending'
      t.text :notes
      
      t.timestamps
    end
    
    add_index :closed_venue_reports, [:venue_name, :venue_address]
  end
end
```

## Alternative Approaches

### Option A: Use Yelp API Instead/Additionally
- Pros: Real-time business info, recent reviews
- Cons: Additional API costs, different data format

### Option B: Build Curated Database
- Pros: Full control, no API costs for lookups
- Cons: Maintenance burden, limited coverage

### Option C: Crowd-source Validation
- Pros: Real user feedback, low cost
- Cons: Slow to build, requires user incentives

## Success Criteria

### Short Term (1 month)
- Reduce closed venue recommendations by 80%
- Achieve 95% operational status accuracy
- Implement user reporting system

### Medium Term (3 months)  
- Build database of 1000+ validated venues
- Reduce API costs by 30% through smart caching
- Achieve <5% user-reported closure rate

### Long Term (6 months)
- Machine learning model for venue prediction
- Predictive closure detection
- Fully automated quality assurance

## Questions to Consider

1. Should we show confidence scores to users?
2. How should we handle venues with unknown status?
3. Should we A/B test GPT-4 vs GPT-3.5-turbo?
4. What's our budget for API costs?
5. Should we build a fallback recommendation system?

## Next Steps

1. Review this document with the team
2. Prioritize solutions based on impact vs effort
3. Create tickets for Phase 1 implementation
4. Set up monitoring for baseline metrics
5. Begin implementation with quick wins

---

*Document created: [Current Date]*
*Last updated: [Current Date]*
*Author: Claude + [Your Name]*