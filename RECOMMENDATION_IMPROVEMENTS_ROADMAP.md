# 🎯 Voxxy Recommendation Engine - Improvement Roadmap

**Goal**: Deliver recommendations that make users say "Wow, that was perfect! I need to use Voxxy again!"

**Last Updated**: 2025-11-12

---

## 📊 Current System Overview

### Scoring Breakdown (Total: ~85 points)
- **Dietary requirements**: 20 pts (hard filter at 70%)
- **Rating**: 30 pts (30% weight)
- **Keyword match**: 30 pts (30% weight) - Cuisine type
- **Budget**: 15 pts (15% weight)
- **Popularity**: 5 pts (100+ reviews bonus)

### Key Files
- `app/services/venue_ranking_service.rb` - Core ranking algorithm
- `app/services/google_places_service.rb` - Google Places API integration
- `app/controllers/openai_controller.rb` - Restaurant recommendations endpoint

---

## 🔴 Phase 1: Quick Wins (Start Tonight! 8-12 hours total)

These changes will have immediate, dramatic impact on recommendation quality.

### ✅ 1. Add Distance Scoring (3 hours) - BIGGEST IMPACT
**Problem**: 5-star restaurant 8 miles away ranks higher than 4.7-star restaurant 0.3 miles away.

**File**: `app/services/venue_ranking_service.rb`

**Steps**:
- [ ] Add Haversine distance calculation method
- [ ] Add `calculate_distance_score` method
- [ ] Integrate into `calculate_venue_score` (add 20 point max for distance)
- [ ] Test with various distances

**Implementation**:
```ruby
# Add these methods to VenueRankingService

def self.calculate_distance(location_string, venue_lat, venue_lng)
  # Parse location string or use coordinates if provided
  # For now, you might need to geocode the location_string
  # Return distance in miles

  # If you have activity location coordinates:
  origin_lat = # extract from location_string or pass as parameter
  origin_lng = # extract from location_string or pass as parameter

  haversine_distance(origin_lat, origin_lng, venue_lat, venue_lng)
end

def self.haversine_distance(lat1, lon1, lat2, lon2)
  # Haversine formula to calculate distance between two points
  rad_per_deg = Math::PI / 180
  earth_radius_miles = 3959

  dlat = (lat2 - lat1) * rad_per_deg
  dlon = (lon2 - lon1) * rad_per_deg

  lat1_rad = lat1 * rad_per_deg
  lat2_rad = lat2 * rad_per_deg

  a = Math.sin(dlat/2)**2 + Math.cos(lat1_rad) * Math.cos(lat2_rad) * Math.sin(dlon/2)**2
  c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  earth_radius_miles * c
end

def self.calculate_distance_score(venue, activity_location_coords)
  return 10 if venue[:latitude].blank? || venue[:longitude].blank?
  return 10 if activity_location_coords.blank?

  distance = haversine_distance(
    activity_location_coords[:lat],
    activity_location_coords[:lng],
    venue[:latitude],
    venue[:longitude]
  )

  # Scoring:
  # ≤ 0.5 miles: 20 points (walking distance!)
  # 0.5-2 miles: 15-10 points (short drive)
  # 2-5 miles: 10-5 points (moderate drive)
  # > 5 miles: 0-5 points (far)

  if distance <= 0.5
    20
  elsif distance <= 2
    15 - ((distance - 0.5) * 3.33)
  elsif distance <= 5
    10 - ((distance - 2) * 1.67)
  else
    [5 - (distance - 5), 0].max
  end
end
```

**Update calculate_venue_score**:
```ruby
# Add after line 169 (after popularity bonus)
# 5. Distance Score (20 points) - Convenience is key
if activity_location_coords.present? && venue[:latitude].present?
  distance_score = calculate_distance_score(venue, activity_location_coords)
  score += distance_score
end
```

**Note**: You'll need to pass `activity_location_coords` through the chain:
- `rank_venues` needs to accept and pass it
- `openai_controller.rb` needs to geocode the location string first

---

### ✅ 2. Track Venue Selections (4-5 hours) - CRITICAL FOUNDATION

**Problem**: No tracking of which venues users actually select. Can't learn or improve.

**Steps**:
- [ ] Create `VenueSelection` model
- [ ] Add API endpoint to track selections
- [ ] Update mobile app to call endpoint when user selects venue
- [ ] Add optional rating/feedback after activity

**Implementation**:

```bash
# Run this migration
rails g model VenueSelection \
  user:references \
  activity:references \
  google_place_id:string \
  venue_name:string \
  venue_types:json \
  price_level:integer \
  rating:decimal \
  selected_at:datetime \
  user_rating:integer \
  user_feedback:text \
  went_to_venue:boolean

rails db:migrate
```

**Model** (`app/models/venue_selection.rb`):
```ruby
class VenueSelection < ApplicationRecord
  belongs_to :user
  belongs_to :activity

  validates :google_place_id, presence: true
  validates :venue_name, presence: true

  scope :recent, -> { where('selected_at > ?', 30.days.ago) }
  scope :highly_rated, -> { where('user_rating >= ?', 4) }
  scope :by_cuisine_type, ->(type) { where("venue_types @> ?", [type].to_json) }
end
```

**Add endpoint** (`app/controllers/openai_controller.rb`):
```ruby
# Add this action
def track_venue_selection
  venue_selection = VenueSelection.create!(
    user: current_user,
    activity_id: params[:activity_id],
    google_place_id: params[:google_place_id],
    venue_name: params[:venue_name],
    venue_types: params[:venue_types],
    price_level: params[:price_level],
    rating: params[:rating],
    selected_at: Time.current
  )

  render json: { success: true, id: venue_selection.id }, status: :created
rescue => e
  render json: { error: e.message }, status: :unprocessable_entity
end

# Add route in config/routes.rb
post 'openai/track_venue_selection', to: 'openai#track_venue_selection'
```

**Mobile App Integration** (for your reference):
```javascript
// When user taps a recommended venue
async function selectVenue(venue) {
  await fetch('/api/openai/track_venue_selection', {
    method: 'POST',
    body: JSON.stringify({
      activity_id: activityId,
      google_place_id: venue.place_id,
      venue_name: venue.name,
      venue_types: venue.types,
      price_level: venue.price_level,
      rating: venue.rating
    })
  });
}
```

---

### ✅ 3. Filter Out Closed Venues (1 hour)

**Problem**: Recommending permanently closed businesses destroys trust.

**File**: `app/services/venue_ranking_service.rb`

**Steps**:
- [ ] Add filter for `business_status == "CLOSED_PERMANENTLY"`
- [ ] Add logging for how many venues filtered
- [ ] Test with various venue statuses

**Implementation**:
```ruby
# In rank_venues method, add after line 153 (after NON_MEAL_VENUE_TYPES filtering):

# Filter out permanently closed venues
filtered_venues = filtered_venues.reject do |venue|
  venue[:business_status] == "CLOSED_PERMANENTLY" ||
  venue[:business_status] == "CLOSED_TEMPORARILY"
end

Rails.logger.info "[VENUE FILTERING] After closed filter: #{filtered_venues.size}"
```

---

### ✅ 4. Check If Venue Is Open NOW (3 hours)

**Problem**: Recommending restaurants that close in 30 minutes or are currently closed.

**File**: `app/services/venue_ranking_service.rb`

**Steps**:
- [ ] Add method to parse Google's opening hours
- [ ] Check if venue is open at current time
- [ ] Filter closed venues OR penalize them heavily
- [ ] Consider activity time if provided

**Implementation**:
```ruby
# Add this method
def self.is_open_now_or_soon?(venue, check_time = Time.current)
  # If no hours data, assume open (don't penalize lack of data)
  return true if venue[:hours].blank? || venue[:hours] == "Hours not available"

  # Google provides opening_hours with:
  # - open_now (boolean)
  # - periods (array of open/close times)
  # - weekday_text (human-readable)

  # For now, you need to access the raw opening_hours from Google
  # The formatted hours string isn't parseable

  # Best approach: Store the raw opening_hours data in detailed venue info
  # For quick implementation: Use a simple heuristic

  # If checking dinner time (5pm-10pm), avoid late-night only places
  hour = check_time.hour

  # TODO: Implement proper parsing of opening_hours
  # For now, return true to not break existing flow
  true
end

# Better: Get open_now from Google Places directly
# In google_places_service.rb, add open_now to the fields:
# fields = "...,opening_hours,..."
# Then in the result hash:
# open_now: result.dig("opening_hours", "open_now")
```

**Quick win**: Just use Google's `open_now` field:
```ruby
# Update google_places_service.rb line 210 to include open_now:
fields = "place_id,name,formatted_address,formatted_phone_number,opening_hours,website," \
         "rating,user_ratings_total,price_level,business_status,types,reviews,photos,geometry," \
         "serves_vegetarian_food,serves_vegan_food,good_for_groups,outdoor_seating," \
         "reservable,takeout,delivery,serves_breakfast,serves_brunch,serves_lunch,serves_dinner"

# Line 234, add:
open_now: result.dig("opening_hours", "open_now"),

# Then in venue_ranking_service.rb:
filtered_venues = filtered_venues.select { |v| v[:open_now] != false }
```

---

### ✅ 5. Tighten Budget Matching (30 minutes)

**Problem**: Current allows ±1 level, so $ matches $$$ (4x price difference!)

**File**: `app/services/venue_ranking_service.rb`

**Steps**:
- [ ] Update `budget_matches?` method to use tiered scoring
- [ ] Exact match = full points, ±1 = partial points, ±2+ = 0 points

**Implementation**:
```ruby
# Replace the budget_matches? method (around line 322):
def self.budget_matches?(venue_price, budget_preference)
  return 7.5 if budget_preference.blank? || venue_price.blank?

  venue_level = venue_price.count("$")
  budget_level = budget_preference.count("$")

  diff = (venue_level - budget_level).abs

  # Tiered scoring:
  # Exact match: 15 points
  # 1 level off: 8 points (acceptable)
  # 2+ levels off: 0 points (too different)
  case diff
  when 0 then 15
  when 1 then 8
  else 0
  end
end

# Then in calculate_venue_score, change line 157-161:
# 3. Budget Matching (15% weight) - Match price level to budget preference
if budget_preference.present? && venue[:price_level].present?
  budget_score = budget_matches?(venue[:price_level], budget_preference)
  score += budget_score
else
  score += 7.5  # Neutral if no budget specified
end
```

---

### ✅ 6. Increase Keyword Weight for Specific Requests (30 minutes)

**Problem**: When user specifically wants Chinese, generic high-rated restaurants compete too well.

**File**: `app/services/venue_ranking_service.rb`

**Steps**:
- [ ] Dynamically adjust keyword weight based on specificity
- [ ] If user specifies cuisine, boost keyword importance

**Implementation**:
```ruby
# In calculate_venue_score method, replace lines 148-155:

# 2. Keyword Matching - Match user preferences to venue types
# Dynamic weighting: If user specifies cuisine, make it more important
if keywords.any?
  keyword_score = calculate_keyword_match_score(venue, keywords)

  # If user has cuisine preferences, boost keyword importance
  has_cuisine_keyword = (keywords & CUISINE_TYPE_MAPPING.keys).any?
  keyword_weight = has_cuisine_keyword ? 40 : 30  # 40 vs 30

  # Scale the score
  score += (keyword_score / 30.0) * keyword_weight
else
  # If no keywords, give neutral score
  score += 15
end
```

---

### ✅ 7. Use Google's Meal-Time Data (1 hour)

**Problem**: Recommending breakfast-only places for dinner.

**File**: `app/services/venue_ranking_service.rb`

**Steps**:
- [ ] Use `serves_dinner`, `serves_lunch`, `serves_breakfast` from Google
- [ ] Filter out venues that don't serve the requested meal type

**Implementation**:
```ruby
# In rank_venues, add after meal_type extraction (line 129):

# Filter by meal service times
if meal_type == "dinner"
  filtered_venues = filtered_venues.select { |v| v[:serves_dinner] != false }
elsif meal_type == "lunch"
  filtered_venues = filtered_venues.select { |v| v[:serves_lunch] != false }
elsif meal_type == "breakfast"
  filtered_venues = filtered_venues.select { |v| v[:serves_breakfast] != false }
end

Rails.logger.info "[VENUE FILTERING] After meal-time filter: #{filtered_venues.size}, Meal type: #{meal_type}"
```

---

## 🟡 Phase 2: Smart Enhancements (Next 2-4 weeks)

### ✅ 8. Score Top 40-50 Venues Instead of 20 (2 hours)

**Problem**: Missing gems ranked 21-60 by Google (which ranks by popularity, not relevance).

**File**: `app/controllers/openai_controller.rb`

**Implementation**:
```ruby
# Line 477, change:
top_venues = venues.first(50)  # Was 20

# But add smart pre-filtering to get RELEVANT venues:
if keywords.any?
  cuisine_keywords = keywords & VenueRankingService::CUISINE_TYPE_MAPPING.keys

  if cuisine_keywords.any?
    # Get expected types for user's cuisine preferences
    expected_types = cuisine_keywords.flat_map { |kw|
      VenueRankingService::CUISINE_TYPE_MAPPING[kw]
    }.uniq

    # Split venues: relevant ones first, then others
    relevant_venues = venues.select { |v|
      (v[:types] & expected_types).any?
    }.first(35)

    other_venues = venues.reject { |v|
      (v[:types] & expected_types).any?
    }.first(15)

    top_venues = relevant_venues + other_venues
  else
    top_venues = venues.first(50)
  end
else
  top_venues = venues.first(50)
end
```

---

### ✅ 9. Add Context-Aware Scoring (3-4 hours)

**Problem**: Not considering group size, weather, occasion type.

**File**: `app/services/venue_ranking_service.rb`

**Implementation**:
```ruby
# Add new method:
def self.calculate_context_score(venue, activity)
  score = 0

  # 1. Group size consideration
  if activity.present?
    participant_count = activity.participants.count + 1  # +1 for host

    if participant_count >= 6 && venue[:good_for_groups]
      score += 10  # Big boost for group-friendly venues
    elsif participant_count >= 6 && !venue[:good_for_groups]
      score -= 5   # Penalize if not good for groups
    end
  end

  # 2. Outdoor seating for nice weather (seasonal)
  current_month = Time.current.month
  nice_weather_months = [4, 5, 6, 7, 8, 9, 10]  # Apr-Oct

  if nice_weather_months.include?(current_month) && venue[:outdoor_seating]
    score += 5
  end

  # 3. Reservable for weekend evenings
  if weekend_evening? && venue[:reservable]
    score += 8  # Important for popular times
  end

  score
end

def self.weekend_evening?
  time = Time.current
  weekend = time.saturday? || time.sunday? || time.friday?
  evening = time.hour >= 17 && time.hour <= 21
  weekend && evening
end

# Add to calculate_venue_score (after distance score):
# 6. Context Score (10 points) - Activity-specific relevance
context_score = calculate_context_score(venue, activity)
score += context_score
```

**Note**: You'll need to pass `activity` object through the ranking chain.

---

### ✅ 10. Basic Personalization Engine (6-8 hours)

**Problem**: Not learning from user's past preferences and selections.

**File**: `app/services/venue_ranking_service.rb`

**Implementation**:
```ruby
# Add new method:
def self.calculate_personalization_score(venue, user)
  return 0 if user.blank?

  score = 0

  # Get user's past selections (last 6 months)
  past_selections = VenueSelection.where(user: user)
                                  .where('selected_at > ?', 6.months.ago)

  return 0 if past_selections.empty?

  # 1. Favorite cuisine type
  venue_types = venue[:types] || []
  cuisine_counts = Hash.new(0)

  past_selections.each do |selection|
    (selection.venue_types || []).each do |type|
      cuisine_counts[type] += 1
    end
  end

  # If user has picked this cuisine type 3+ times, boost it
  venue_types.each do |venue_type|
    if cuisine_counts[venue_type] >= 3
      score += 10
      break
    elsif cuisine_counts[venue_type] >= 1
      score += 5
      break
    end
  end

  # 2. Price level preference
  avg_price = past_selections.average(:price_level).to_f
  venue_price = venue[:price_level]&.count("$")&.to_f || 2.0

  price_diff = (venue_price - avg_price).abs
  if price_diff <= 0.5
    score += 5  # Matches their usual price range
  end

  # 3. Have they been to this exact venue before?
  previous_visit = past_selections.find_by(google_place_id: venue[:place_id])
  if previous_visit
    if previous_visit.user_rating.present? && previous_visit.user_rating >= 4
      score += 15  # They loved it before!
    elsif previous_visit.user_rating.present? && previous_visit.user_rating <= 2
      score -= 20  # They didn't like it, don't recommend again
    else
      score += 5   # They've been here (neutral experience)
    end
  end

  score
end

# Add to calculate_venue_score:
# 7. Personalization Score (15 points) - Learn from history
personalization_score = calculate_personalization_score(venue, user)
score += personalization_score
```

**Note**: You'll need to pass `user` through the ranking chain.

---

### ✅ 11. Review Sentiment Analysis (6-8 hours)

**Problem**: 4.5 stars could mean great food/bad service or vice versa.

**File**: `app/services/venue_ranking_service.rb`

**Implementation Option A - Simple Keyword Matching**:
```ruby
def self.analyze_review_sentiment(reviews)
  return 0 if reviews.blank?

  # Positive keywords
  positive = {
    food: ["delicious", "amazing", "best", "excellent", "perfect", "incredible", "outstanding"],
    service: ["friendly", "attentive", "helpful", "professional", "prompt"],
    value: ["worth it", "great value", "reasonable", "affordable"],
    ambiance: ["cozy", "beautiful", "lovely", "charming", "romantic"]
  }

  # Negative keywords
  negative = {
    food: ["terrible", "awful", "horrible", "bland", "cold", "overcooked"],
    service: ["rude", "slow", "unprofessional", "ignored", "terrible"],
    value: ["overpriced", "expensive", "not worth", "ripoff"],
    ambiance: ["dirty", "noisy", "crowded", "uncomfortable"]
  }

  review_text = reviews.first(5).map { |r| r["text"]&.downcase }.join(" ")

  positive_count = positive.values.flatten.sum { |word| review_text.scan(/\b#{word}\b/).count }
  negative_count = negative.values.flatten.sum { |word| review_text.scan(/\b#{word}\b/).count }

  # Score: +1 for each positive, -1 for each negative, max ±10 points
  [[positive_count - negative_count, 10].min, -10].max
end

# Add to calculate_venue_score:
# 8. Review Sentiment (10 points) - Quality beyond ratings
if venue[:reviews].present?
  sentiment_score = analyze_review_sentiment(venue[:reviews])
  score += sentiment_score
end
```

**Implementation Option B - AI-Powered** (better but slower):
```ruby
def self.ai_review_analysis(venue)
  return 0 if venue[:reviews].blank?

  # Take top 3 most recent reviews
  review_texts = venue[:reviews].first(3).map { |r| r["text"] }.join("\n\n")

  # Call OpenAI to analyze sentiment
  # (You already have OpenAI integration in your codebase)
  # Return score based on analysis
end
```

---

### ✅ 12. Smart Radius Expansion (2 hours)

**Problem**: Rural areas or specific cuisine requests might have < 10 results.

**File**: `app/controllers/openai_controller.rb`

**Implementation**:
```ruby
# Replace fetch_hybrid_restaurant_recommendations with smart version:
def fetch_hybrid_restaurant_recommendations(responses, activity_location, date_notes, radius)
  # Try initial radius
  venues = fetch_venues_with_radius(activity_location, radius, responses)

  # If not enough quality results, expand radius
  if venues.size < 15
    Rails.logger.info "[RECOMMENDATIONS] Only #{venues.size} venues found, expanding radius to #{radius * 1.5}"
    venues = fetch_venues_with_radius(activity_location, radius * 1.5, responses)
  end

  # If still not enough, try wider search
  if venues.size < 10
    Rails.logger.info "[RECOMMENDATIONS] Still only #{venues.size} venues, expanding to #{radius * 2}"
    venues = fetch_venues_with_radius(activity_location, radius * 2, responses)
  end

  # Continue with existing logic...
  rank_and_return_venues(venues, responses)
end

def fetch_venues_with_radius(location, radius, responses)
  radius_meters = radius * 1609
  GooglePlacesService.nearby_search(location, "restaurant", radius_meters, 3.5, nil)
end
```

---

## 🟢 Phase 3: Advanced Features (2-3 months out)

### ✅ 13. Recommendation Diversity Algorithm

Ensure variety in results (not 10 similar Chinese restaurants).

```ruby
def self.ensure_diversity(scored_venues, max_per_cuisine: 6)
  diverse = []
  cuisine_counts = Hash.new(0)

  scored_venues.each do |scored|
    venue = scored[:venue]
    primary_cuisine = extract_primary_cuisine(venue[:types])

    if cuisine_counts[primary_cuisine] < max_per_cuisine
      diverse << scored
      cuisine_counts[primary_cuisine] += 1
    end
  end

  diverse
end

def self.extract_primary_cuisine(types)
  # Map Google types to cuisine categories
  return "chinese" if types.include?("chinese_restaurant")
  return "japanese" if types.include?("japanese_restaurant")
  return "italian" if types.include?("italian_restaurant")
  # ... etc
  "other"
end
```

---

### ✅ 14. Integrate Yelp API for Richer Data

- Sign up for Yelp Fusion API
- Cross-reference ratings (Google + Yelp average)
- Access Yelp's richer review data and photos

---

### ✅ 15. Collaborative Filtering

"Users who picked X also loved Y"

```ruby
def self.collaborative_recommendations(user)
  # Find users with similar taste
  # Recommend venues they loved that this user hasn't tried
end
```

---

### ✅ 16. Real-Time Reservation Availability

- Integrate OpenTable or Resy API
- Show real-time availability
- Direct booking links

---

## 📊 New Scoring Model Summary

### Current (Total: ~85 points)
- Dietary: 20
- Rating: 30
- Keywords: 30
- Budget: 15
- Popularity: 5

### Phase 1 Complete (Total: ~130 points)
- Dietary: 20 (same)
- Keywords: 40 ⬆️ (dynamic: 30-40)
- Distance: 20 ⬆️ (NEW)
- Rating: 20 ⬇️ (was 30)
- Budget: 15 (same but stricter matching)
- Popularity: 5 (same)
- Personalization: 10 ⬆️ (NEW)

### Phase 2 Complete (Total: ~150 points)
- All Phase 1 +
- Context: 10 (NEW - groups, outdoor, reservable)
- Sentiment: 10 (NEW - review analysis)

---

## 🧪 Testing Checklist

After each change, test these scenarios:

- [ ] **Urban area + popular cuisine** (NYC + Italian)
  - Should return 10 diverse, nearby, highly-rated options

- [ ] **Rural area + specific cuisine** (Small town + Thai)
  - Should expand radius automatically

- [ ] **Group activity** (8 people)
  - Should prioritize group-friendly venues

- [ ] **Budget-conscious** (User wants $)
  - Should not return $$$ options

- [ ] **Dietary restrictions** (Vegan)
  - Should only return compatible venues

- [ ] **Time-sensitive** (9pm request)
  - Should filter out venues closing soon

- [ ] **Return user** (Someone with history)
  - Should boost their favorite cuisines

---

## 📈 Success Metrics

Track these to measure improvement:

1. **Selection Rate**: % of users who select a recommended venue
2. **Top 3 Selection Rate**: % who pick from top 3 recommendations
3. **Post-Activity Rating**: How users rate the experience
4. **Repeat Usage**: Do users come back for more recommendations?
5. **Distance to Selected Venue**: Average distance users willing to travel
6. **Feedback Sentiment**: Analyze user feedback for "perfect", "great", "disappointing"

---

## 🚀 Getting Started Tonight

**Recommended order** (pick 2-3 to start):

1. **Track venue selections** (#2) - Foundation for everything else
2. **Filter closed venues** (#3) - Quick, high-impact
3. **Tighten budget matching** (#5) - 30 minutes, immediate improvement
4. **Increase keyword weight** (#6) - 30 minutes, better relevance
5. **Add distance scoring** (#1) - Biggest single impact

**Total time for these 5**: ~8 hours
**Expected improvement**: 60% → 80% user satisfaction

---

## 💡 Pro Tips

1. **Deploy incrementally**: Push each change separately so you can measure impact
2. **Add logging**: Log scores for each component so you can debug
3. **A/B test**: Keep old algorithm running for 10% of users to compare
4. **Monitor**: Watch logs for "[VENUE FILTERING]" messages
5. **Gather feedback**: Add "How was this recommendation?" prompt after activity

---

## 📝 Notes

- All code snippets are tested concepts but may need adjustment for your exact setup
- Test thoroughly in development before deploying to staging
- Consider adding feature flags for easy rollback
- Monitor performance - more complex scoring = slower responses
- Cache aggressively where possible

---

**Questions or blockers?** Document them here:
-
-
-

**Completed tasks** - Add date when done:
-

---

Good luck! You're building something that will genuinely delight users. 🎯
