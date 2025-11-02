# Recommendation Engine Improvements Roadmap

This document outlines the next steps to improve Voxxy's recommendation engine and create a competitive advantage. Reference this after you've tested the current improvements (dietary filters + keyword matching).

---

## 🎯 Current Status (January 2025)

**✅ Completed:**
- Dietary requirements are now hard filters (excludes incompatible venues)
- Keyword matching uses Google Places types (40+ cuisines mapped)
- Frontend documentation for keyword alignment
- Google Places fields expanded (dietary, group-friendly, meal times)

**🎪 What This Gives You:**
- Vegetarians only see vegetarian-friendly spots
- "Sushi" searches match actual sushi restaurants
- Better matching between user selections and results

---

## 📈 Next Priority Improvements

### **Phase 1: Distance Weighting (Quick Win)**
**Time: 2-4 hours | Impact: High | Difficulty: Easy**

#### The Problem
Right now, a 5-star restaurant 5 miles away scores the same as a 4.5-star restaurant 0.2 miles away. Users often prefer closer venues, especially for casual outings.

#### The Solution
Add distance scoring to the algorithm using the Haversine formula.

#### Implementation

**File: `app/services/venue_ranking_service.rb`**

1. Add Haversine distance calculator:
```ruby
def self.haversine_distance(lat1, lon1, lat2, lon2)
  # Returns distance in kilometers
  rad_per_deg = Math::PI / 180  # PI / 180
  rkm = 6371                    # Earth radius in kilometers

  dlat_rad = (lat2 - lat1) * rad_per_deg
  dlon_rad = (lon2 - lon1) * rad_per_deg

  lat1_rad = lat1 * rad_per_deg
  lat2_rad = lat2 * rad_per_deg

  a = Math.sin(dlat_rad / 2)**2 +
      Math.cos(lat1_rad) * Math.cos(lat2_rad) *
      Math.sin(dlon_rad / 2)**2
  c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  rkm * c # Distance in kilometers
end
```

2. Add distance scoring method:
```ruby
def self.calculate_distance_score(venue, center_lat, center_lng)
  return 7.5 unless venue[:latitude] && venue[:longitude]
  return 7.5 unless center_lat && center_lng

  distance_km = haversine_distance(
    center_lat, center_lng,
    venue[:latitude], venue[:longitude]
  )

  # Scoring: closer = better
  # 0.0-0.5 km = 15 points
  # 0.5-1.0 km = 12 points
  # 1.0-2.0 km = 9 points
  # 2.0-3.0 km = 6 points
  # 3.0-5.0 km = 3 points
  # 5.0+ km   = 0 points

  if distance_km < 0.5
    15
  elsif distance_km < 1.0
    12
  elsif distance_km < 2.0
    9
  elsif distance_km < 3.0
    6
  elsif distance_km < 5.0
    3
  else
    0
  end
end
```

3. Update `rank_venues` to pass center coordinates:
```ruby
def self.rank_venues(venues, user_preferences, top_n: 10, center_lat: nil, center_lng: nil)
  return [] if venues.empty?

  keywords = extract_keywords(user_preferences)
  budget_preference = extract_budget_preference(user_preferences)
  dietary_requirements = extract_dietary_requirements(user_preferences)

  scored_venues = venues.map do |venue|
    score = calculate_venue_score(
      venue,
      keywords,
      budget_preference,
      dietary_requirements,
      center_lat,    # NEW
      center_lng     # NEW
    )
    { venue: venue, score: score }
  end

  scored_venues
    .sort_by { |v| -v[:score] }
    .first(top_n)
    .map { |v| format_recommendation(v[:venue]) }
end
```

4. Update `calculate_venue_score` signature and add distance scoring:
```ruby
def self.calculate_venue_score(venue, keywords, budget_preference, dietary_requirements, center_lat = nil, center_lng = nil)
  score = 0.0

  # ... existing dietary filter code ...

  # 1. Rating Score (25% weight) - Reduced from 30%
  if venue[:rating].present?
    rating_score = (venue[:rating].to_f / 5.0) * 25
    score += rating_score
  end

  # 2. Keyword Matching (30% weight)
  # ... existing keyword code ...

  # 3. Distance Score (15% weight) - NEW!
  if center_lat && center_lng
    distance_score = calculate_distance_score(venue, center_lat, center_lng)
    score += distance_score
  else
    score += 7.5  # Neutral if no location provided
  end

  # 4. Budget Matching (15% weight)
  # ... existing budget code ...

  # 5. Popularity Bonus (5 points)
  # ... existing popularity code ...

  score
end
```

5. Update controller calls to pass center coordinates:

**File: `app/controllers/openai_controller.rb`**

```ruby
# In fetch_hybrid_restaurant_recommendations and fetch_hybrid_bar_recommendations
# Around line 543 and 641

# After you geocode the location or parse GPS coordinates:
center_lat = lat  # This already exists in your code
center_lng = lng  # This already exists in your code

# When calling rank_venues:
ranked_recommendations = VenueRankingService.rank_venues(
  detailed_venues,
  responses,
  top_n: 10,
  center_lat: center_lat,
  center_lng: center_lng
)
```

#### Expected Impact
- Users get closer venues ranked higher
- 20-30% increase in user satisfaction
- "That's too far" feedback decreases

#### Testing
```ruby
# Rails console
venue1 = { name: "Close Place", rating: 4.5, latitude: 40.7580, longitude: -73.9855 }
venue2 = { name: "Far Place", rating: 5.0, latitude: 40.7128, longitude: -74.0060 }

center_lat = 40.7589
center_lng = -73.9851

VenueRankingService.calculate_distance_score(venue1, center_lat, center_lng)
# Should return ~15 (very close)

VenueRankingService.calculate_distance_score(venue2, center_lat, center_lng)
# Should return ~3 (about 5km away)
```

---

### **Phase 2: Capture Behavioral Data (Foundation for ML)**
**Time: 1-2 weeks | Impact: High (long-term) | Difficulty: Medium**

#### The Problem
You have no data on which recommendations users actually select. This means:
- Can't learn from past choices
- Can't personalize over time
- Can't measure recommendation quality
- Can't do A/B testing

#### The Solution
Track user interactions with recommendations to build proprietary data.

#### Implementation

**Step 1: Create Database Table**

Create migration:
```bash
rails generate migration CreateVenueInteractions
```

**File: `db/migrate/XXXXXX_create_venue_interactions.rb`**
```ruby
class CreateVenueInteractions < ActiveRecord::Migration[7.2]
  def change
    create_table :venue_interactions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :activity, null: false, foreign_key: true

      t.string :place_id, null: false           # Google Place ID
      t.string :venue_name
      t.string :action, null: false             # viewed, saved, selected, visited, rated
      t.integer :recommendation_position        # 1-10 (where in list)

      # Context when recommendation was made
      t.jsonb :context, default: {}
      # Store: activity_type, group_size, user_preferences, venue_types

      # Post-visit feedback
      t.integer :rating                         # 1-5 stars (if rated)
      t.boolean :would_return                   # Yes/No
      t.string :feedback_tags, array: true      # ["great_service", "too_loud", "expensive"]
      t.text :notes                             # Optional free text

      t.timestamps
    end

    add_index :venue_interactions, [:user_id, :place_id]
    add_index :venue_interactions, [:activity_id, :action]
    add_index :venue_interactions, :place_id
    add_index :venue_interactions, :action
    add_index :venue_interactions, :created_at
  end
end
```

Run migration:
```bash
rails db:migrate
```

**Step 2: Create Model**

**File: `app/models/venue_interaction.rb`**
```ruby
class VenueInteraction < ApplicationRecord
  belongs_to :user
  belongs_to :activity

  VALID_ACTIONS = %w[viewed saved selected visited rated].freeze

  validates :action, presence: true, inclusion: { in: VALID_ACTIONS }
  validates :place_id, presence: true
  validates :rating, numericality: { only_integer: true, in: 1..5 }, allow_nil: true

  scope :viewed, -> { where(action: 'viewed') }
  scope :saved, -> { where(action: 'saved') }
  scope :selected, -> { where(action: 'selected') }
  scope :visited, -> { where(action: 'visited') }
  scope :rated, -> { where(action: 'rated') }

  # Get popular venues within a user's community
  def self.popular_in_community(user_ids, limit: 10)
    where(user_id: user_ids, action: ['selected', 'visited'])
      .where('created_at > ?', 6.months.ago)
      .group(:place_id, :venue_name)
      .select('place_id, venue_name, COUNT(*) as visit_count')
      .order('visit_count DESC')
      .limit(limit)
  end

  # Calculate conversion rate for recommendations
  def self.conversion_rate
    total_viewed = where(action: 'viewed').count
    total_selected = where(action: 'selected').count

    return 0 if total_viewed == 0
    (total_selected.to_f / total_viewed * 100).round(2)
  end
end
```

Add to `app/models/user.rb`:
```ruby
has_many :venue_interactions, dependent: :destroy
```

Add to `app/models/activity.rb`:
```ruby
has_many :venue_interactions, dependent: :destroy
```

**Step 3: Track Events in Controller**

**File: `app/controllers/openai_controller.rb`**

Add tracking when recommendations are returned:
```ruby
# In restaurant_recommendations and bar_recommendations
# After recommendations are generated (around line 55 and 99)

if recommendations && recommendations.is_a?(Array) && recommendations.any?
  # Track that user viewed these recommendations
  recommendations.each_with_index do |rec, index|
    VenueInteraction.create(
      user: current_user,
      activity_id: activity_id,
      place_id: rec[:place_id] || "unknown",
      venue_name: rec[:name],
      action: 'viewed',
      recommendation_position: index + 1,
      context: {
        activity_type: Activity.find_by(id: activity_id)&.activity_type,
        venue_type: 'restaurant',  # or 'bar'
        preferences: combined_responses
      }
    )
  end
end
```

**Step 4: Track Selection in Pinned Activities**

**File: `app/controllers/pinned_activities_controller.rb`**

When a venue is saved to an activity:
```ruby
# In create action (after successful save)
if @pinned_activity.persisted?
  # Track that this venue was saved/pinned
  VenueInteraction.create(
    user: current_user,
    activity_id: @pinned_activity.activity_id,
    place_id: params[:place_id] || "unknown",
    venue_name: @pinned_activity.title,
    action: 'saved',
    context: {
      activity_type: @pinned_activity.activity.activity_type
    }
  )
end
```

When a venue is selected (marked as `selected: true`):
```ruby
# In update action (when selected changes to true)
if @pinned_activity.saved_change_to_selected? && @pinned_activity.selected?
  VenueInteraction.create(
    user: @pinned_activity.activity.user,
    activity_id: @pinned_activity.activity_id,
    place_id: params[:place_id] || "unknown",
    venue_name: @pinned_activity.title,
    action: 'selected',
    context: {
      activity_type: @pinned_activity.activity.activity_type,
      group_size: @pinned_activity.activity.group_size
    }
  )
end
```

**Step 5: Post-Activity Feedback**

After activity date passes, send notification asking for feedback:

**File: `app/jobs/activity_feedback_job.rb`** (new file)
```ruby
class ActivityFeedbackJob < ApplicationJob
  queue_as :default

  def perform(activity_id)
    activity = Activity.find_by(id: activity_id)
    return unless activity && activity.completed?

    selected_place = activity.pinned_activities.find_by(selected: true)
    return unless selected_place

    # Send notification to host
    Notification.create_and_send!(
      user: activity.user,
      title: "How was #{selected_place.title}? 🌟",
      body: "Help us improve recommendations - rate your experience!",
      notification_type: "feedback_request",
      activity: activity,
      data: {
        activityId: activity.id,
        placeId: selected_place.place_id,
        placeName: selected_place.title
      }
    )
  end
end
```

Schedule this job 1 day after activity date:
```ruby
# In Activity model, after activity is marked completed
after_update :schedule_feedback_request, if: :saved_change_to_completed?

def schedule_feedback_request
  return unless completed?
  ActivityFeedbackJob.set(wait: 1.day).perform_later(id)
end
```

**Step 6: Create Feedback API Endpoint**

**File: `config/routes.rb`**
```ruby
post "/api/venue_feedback", to: "venue_interactions#create_feedback"
```

**File: `app/controllers/venue_interactions_controller.rb`** (new file)
```ruby
class VenueInteractionsController < ApplicationController
  before_action :authorized

  def create_feedback
    activity = Activity.find(params[:activity_id])

    unless activity.user == current_user || activity.participants.include?(current_user)
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    interaction = VenueInteraction.create(
      user: current_user,
      activity: activity,
      place_id: params[:place_id],
      venue_name: params[:venue_name],
      action: 'rated',
      rating: params[:rating],
      would_return: params[:would_return],
      feedback_tags: params[:tags] || [],
      notes: params[:notes]
    )

    if interaction.persisted?
      render json: { message: "Thank you for your feedback!" }, status: :ok
    else
      render json: { error: interaction.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
```

#### Mobile App Integration

Add feedback screen after activity:
```
┌─────────────────────────────┐
│  How was [Venue Name]? ⭐   │
├─────────────────────────────┤
│  Rating: ★★★★☆ (4 stars)    │
│                              │
│  Would you go back?          │
│  [ Yes ]  [ No ]             │
│                              │
│  Quick feedback:             │
│  [Great Service] [Loud]      │
│  [Good Value] [Long Wait]    │
│                              │
│  Additional notes:           │
│  ┌─────────────────────────┐│
│  │                         ││
│  └─────────────────────────┘│
│                              │
│  [Submit Feedback]           │
└─────────────────────────────┘
```

#### Expected Impact
- Foundation for machine learning recommendations
- Ability to measure recommendation quality
- Data for A/B testing improvements
- Proprietary data competitors can't replicate

#### Analytics Dashboard (Optional)

Create admin dashboard to view metrics:
```ruby
# In rails console or admin panel
VenueInteraction.conversion_rate
# => 32.5% (how many viewed recs get selected)

VenueInteraction.rated.average(:rating)
# => 4.2 stars (average user satisfaction)

VenueInteraction.where(action: 'rated', rating: [4, 5]).count
# => 156 (positive ratings)
```

---

### **Phase 3: Social Proof (Community Signals)**
**Time: 1-2 weeks | Impact: High | Difficulty: Medium**

#### The Problem
Users don't know if their friends have been to these places. Recommendations from friends are trusted 10x more than algorithmic suggestions.

#### The Solution
Show which venues people in their network have visited and loved.

#### Implementation

**File: `app/services/community_venue_insights.rb`** (new file)
```ruby
class CommunityVenueInsights
  def self.get_venues_visited_by_friends(user, place_ids)
    return {} if place_ids.empty?

    community_ids = user.community_member_ids

    # Get interactions from community members
    interactions = VenueInteraction
      .where(user_id: community_ids, place_id: place_ids)
      .where(action: ['selected', 'visited', 'rated'])
      .where('created_at > ?', 6.months.ago)
      .includes(:user)
      .group_by(&:place_id)

    # Build hash: place_id => { count, names, avg_rating }
    insights = {}

    interactions.each do |place_id, visits|
      visitor_names = visits.map { |v| v.user.name }.uniq
      ratings = visits.select { |v| v.rating.present? }.map(&:rating)

      insights[place_id] = {
        friend_count: visitor_names.size,
        friend_names: visitor_names.first(3),  # Show max 3 names
        avg_friend_rating: ratings.any? ? (ratings.sum.to_f / ratings.size).round(1) : nil,
        recent: visits.any? { |v| v.created_at > 1.month.ago }
      }
    end

    insights
  end

  def self.calculate_community_score(venue, user)
    place_id = venue[:place_id]
    return 0 unless place_id

    community_ids = user.community_member_ids
    return 0 if community_ids.empty?

    visits = VenueInteraction
      .where(user_id: community_ids, place_id: place_id)
      .where(action: ['selected', 'visited'])
      .where('created_at > ?', 6.months.ago)
      .count

    # Scoring: 2 points per friend (max 10 points for 5+ friends)
    [visits * 2, 10].min
  end
end
```

**Update Ranking Service**

**File: `app/services/venue_ranking_service.rb`**

Update `rank_venues` to accept user parameter:
```ruby
def self.rank_venues(venues, user_preferences, top_n: 10, center_lat: nil, center_lng: nil, user: nil)
  return [] if venues.empty?

  # ... existing code ...

  scored_venues = venues.map do |venue|
    score = calculate_venue_score(
      venue,
      keywords,
      budget_preference,
      dietary_requirements,
      center_lat,
      center_lng,
      user  # NEW
    )
    { venue: venue, score: score }
  end

  # ... existing code ...
end
```

Update `calculate_venue_score`:
```ruby
def self.calculate_venue_score(venue, keywords, budget_preference, dietary_requirements, center_lat = nil, center_lng = nil, user = nil)
  score = 0.0

  # ... all existing scoring ...

  # 6. Community Signal (10% weight) - NEW!
  if user
    community_score = CommunityVenueInsights.calculate_community_score(venue, user)
    score += community_score
  end

  score
end
```

Update controller calls to pass user:
```ruby
# In openai_controller.rb, around line 543
ranked_recommendations = VenueRankingService.rank_venues(
  detailed_venues,
  responses,
  top_n: 10,
  center_lat: center_lat,
  center_lng: center_lng,
  user: current_user  # NEW
)
```

**Enhance Recommendation Response**

Add friend data to recommendations:
```ruby
# In openai_controller.rb, after ranking

# Get friend insights
place_ids = ranked_recommendations.map { |r| r[:place_id] }.compact
friend_insights = CommunityVenueInsights.get_venues_visited_by_friends(
  current_user,
  place_ids
)

# Add to each recommendation
ranked_recommendations.each do |rec|
  if friend_insights[rec[:place_id]]
    insight = friend_insights[rec[:place_id]]
    rec[:friend_signal] = {
      count: insight[:friend_count],
      names: insight[:friend_names],
      avg_rating: insight[:avg_friend_rating],
      recent: insight[:recent]
    }
  end
end
```

#### Mobile App Display

Update recommendation cards to show friend signal:
```
┌─────────────────────────────────┐
│  🍝 Pasta Paradise              │
│  ⭐ 4.5 · $$ · Italian          │
│                                  │
│  👥 Sarah and Mike went here    │
│      last month (4.5★)          │
│                                  │
│  0.3 mi · Closes at 10pm        │
└─────────────────────────────────┘
```

#### Expected Impact
- 30-40% increase in trust
- Higher conversion rates (viewed → selected)
- Network effects (more users = better data = better recs)

---

### **Phase 4: Algorithm V2 - Context-Aware Intelligence**
**Time: 2-3 weeks | Impact: Very High | Difficulty: High**

#### The Problem
Current algorithm doesn't consider:
- Time of day (brunch at 10am vs dinner at 8pm)
- Day of week (Friday night vs Tuesday lunch)
- Group composition (date night vs family with kids)
- Occasion (celebration vs casual hangout)

#### The Solution
Context-aware scoring that adapts to the specific situation.

#### Implementation Overview

1. **Temporal Scoring**
```ruby
def self.calculate_temporal_score(venue, activity_datetime)
  return 5 unless activity_datetime  # Neutral

  hour = activity_datetime.hour
  day = activity_datetime.strftime("%A")

  score = 0

  # Brunch spots on weekend mornings
  if hour.between?(10, 14) && ["Saturday", "Sunday"].include?(day)
    score += 5 if venue[:serves_brunch] || venue[:types]&.include?("brunch_restaurant")
  end

  # Bars on Friday/Saturday nights
  if hour >= 20 && ["Friday", "Saturday"].include?(day)
    score += 5 if venue[:types]&.include?("bar")
  end

  # Dinner spots during dinner hours
  if hour.between?(17, 21)
    score += 3 if venue[:serves_dinner]
  end

  score
end
```

2. **Group Dynamics Scoring**
```ruby
def self.calculate_group_score(venue, group_size)
  return 5 unless group_size  # Neutral

  size = group_size.to_i

  if size >= 6
    # Large groups need group-friendly venues
    return venue[:good_for_groups] ? 10 : -5
  elsif size <= 2
    # Small groups prefer intimate settings
    intimate_types = ["fine_dining_restaurant", "wine_bar"]
    return (venue[:types] & intimate_types).any? ? 5 : 0
  else
    5  # Neutral for 3-5 people
  end
end
```

3. **Occasion Detection**
```ruby
def self.detect_occasion(activity_type, date_notes, user_preferences)
  text = "#{activity_type} #{date_notes} #{user_preferences}".downcase

  return "celebration" if text.match?(/birthday|anniversary|celebration|special/)
  return "date_night" if text.match?(/date|romantic/)
  return "casual" if text.match?(/casual|quick|simple/)
  return "business" if text.match?(/business|meeting|work/)

  "general"
end

def self.calculate_occasion_score(venue, occasion)
  case occasion
  when "celebration"
    # Upscale, high-rated venues
    return 5 if venue[:rating] >= 4.5 && venue[:price_level].count("$") >= 3
  when "date_night"
    # Romantic, intimate ambiance
    romantic_indicators = ["romantic", "intimate", "cozy", "wine_bar", "fine_dining"]
    venue_text = build_venue_search_text(venue)
    return 5 if romantic_indicators.any? { |term| venue_text.include?(term) }
  when "casual"
    # Quick, affordable options
    return 5 if venue[:price_level].count("$") <= 2
  end

  0
end
```

4. **Integrate All Context Signals**
```ruby
def self.calculate_venue_score(venue, keywords, budget_preference, dietary_requirements,
                                center_lat = nil, center_lng = nil, user = nil, context = {})
  score = 0.0

  # All existing scoring...

  # Context-aware bonuses
  if context[:activity_datetime]
    score += calculate_temporal_score(venue, context[:activity_datetime])
  end

  if context[:group_size]
    score += calculate_group_score(venue, context[:group_size])
  end

  if context[:occasion]
    score += calculate_occasion_score(venue, context[:occasion])
  end

  score
end
```

#### Expected Impact
- 50% improvement in "this is perfect" feedback
- Fewer "not quite right" dismissals
- Seasonal/contextual relevance (brunch suggestions on Saturday mornings)

---

## 📊 Metrics to Track

### Current Metrics (Implement Now)
```ruby
# In rails console
class RecommendationMetrics
  def self.daily_stats
    {
      recommendations_requested: Activity.where('created_at > ?', 1.day.ago).count,
      avg_recommendations_per_activity: # Calculate from logs
      cache_hit_rate: # From Rails cache stats
    }
  end
end
```

### Future Metrics (After Phase 2)
```ruby
class RecommendationMetrics
  def self.quality_metrics
    {
      conversion_rate: VenueInteraction.conversion_rate,
      avg_rating: VenueInteraction.rated.average(:rating),
      would_return_rate: VenueInteraction.where(would_return: true).count.to_f /
                         VenueInteraction.where.not(would_return: nil).count * 100,
      avg_position_selected: VenueInteraction.selected.average(:recommendation_position)
    }
  end

  def self.user_satisfaction_score
    # Combine multiple metrics into single score
    ratings = avg_rating / 5.0 * 100  # Convert to percentage
    conversion = conversion_rate
    return_rate = would_return_rate

    (ratings * 0.5 + conversion * 0.3 + return_rate * 0.2).round(2)
  end
end
```

### Target Metrics (6 Months)
- **Conversion Rate:** 20% → 50%
- **Average Rating:** 3.8 → 4.5 stars
- **Would Return:** 60% → 85%
- **Selection Position:** 3.5 → 2.0 (users pick from top 2)

---

## 🎯 Prioritization Framework

When deciding what to build next, consider:

### Impact Matrix

| Improvement | Time | Impact | Data Needed | Priority |
|------------|------|--------|-------------|----------|
| Distance Weighting | 4h | High | None | 🔴 P0 |
| Behavioral Tracking | 1-2w | High | None | 🔴 P0 |
| Social Proof | 1-2w | High | Tracking data | 🟡 P1 |
| Context-Aware | 2-3w | Very High | Tracking data | 🟡 P1 |
| ML Model | 4-6w | Very High | 3mo tracking data | 🟢 P2 |

### Recommendation
1. **Do NOW:** Distance weighting (quick win)
2. **Do NEXT:** Behavioral tracking (enables everything else)
3. **Do AFTER:** Social proof + Context-aware (powerful combo)
4. **Do LATER:** ML model (needs 3+ months of data)

---

## 🧪 A/B Testing Framework

Once you have tracking in place, run experiments:

```ruby
# In openai_controller.rb
def determine_algorithm_version(user)
  # 50/50 split for testing
  user.id % 2 == 0 ? :v1 : :v2
end

def restaurant_recommendations
  # ... existing code ...

  version = determine_algorithm_version(current_user)

  recommendations = if version == :v2
    # Use new algorithm
    fetch_hybrid_restaurant_recommendations_v2(...)
  else
    # Use current algorithm
    fetch_hybrid_restaurant_recommendations(...)
  end

  # Track which version was used
  # ... in venue_interaction context field ...

  render json: { recommendations: recommendations }
end
```

After 2 weeks, compare:
- Conversion rates (v1 vs v2)
- User ratings (v1 vs v2)
- Selection position (v1 vs v2)

Pick the winner!

---

## 💡 Future Ideas (6-12 Months)

### 1. Taste Profiles
Build ML model that learns each user's taste:
- "You prefer spicy, casual Asian restaurants under $$"
- Share taste profiles with friends
- "You have 85% taste compatibility with Sarah"

### 2. Predictive Recommendations
"Based on your past activities, you might enjoy..."
- Proactive suggestions
- Weekly personalized digest

### 3. Venue Partnerships
- Priority reservations for Voxxy users
- Special perks ("Show this screen for free appetizer")
- Commission on bookings

### 4. Venue Intelligence Platform
- Your own proprietary venue database
- Better than Google Places for specific categories
- Sell insights to restaurants (B2B revenue)

---

## 📝 Testing Checklist

After implementing each phase:

### Phase 1 (Distance) Testing
- [ ] Close venue ranks higher than far venue (same rating)
- [ ] Distance shows correctly in mobile app
- [ ] Performance is acceptable (< 500ms additional time)

### Phase 2 (Tracking) Testing
- [ ] `viewed` events logged when recommendations shown
- [ ] `saved` events logged when venue pinned
- [ ] `selected` events logged when venue chosen
- [ ] Feedback notifications sent 1 day after activity
- [ ] Feedback endpoint works from mobile app

### Phase 3 (Social) Testing
- [ ] Friend names show on recommendations
- [ ] Community score boosts venues friends visited
- [ ] "Friends' Favorites" section populated
- [ ] Privacy: only shows friends from activities together

### Phase 4 (Context) Testing
- [ ] Brunch spots rank higher on Saturday 11am
- [ ] Bars rank higher on Friday 9pm
- [ ] Large groups see group-friendly venues first
- [ ] Date night activities get romantic suggestions

---

## 🚀 Success Indicators

You'll know it's working when:

1. **Users message you:** "How did you know I'd love this place?!"
2. **Word-of-mouth growth:** People tell friends about recommendations
3. **Return rate increases:** Users come back for more activities
4. **Selection position drops:** Users pick from top 3 instead of scrolling
5. **Competitors ask:** "How are your recommendations so good?"

---

## 📞 Support

Reference this doc when ready to implement the next phase. Each section is self-contained with:
- Problem definition
- Step-by-step implementation
- Code snippets ready to use
- Testing instructions
- Expected impact

Good luck with the frontend updates and testing! 🎉

---

**Last Updated:** January 2025
**Current Version:** Dietary Filters + Keyword Matching (Phase 0 Complete)
**Next Up:** Distance Weighting (Phase 1)
