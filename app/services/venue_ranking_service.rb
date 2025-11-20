class VenueRankingService
  # Map user-friendly cuisine keywords to Google Places types
  # This ensures frontend keywords align with backend matching
  CUISINE_TYPE_MAPPING = {
    # Asian Cuisines
    "chinese" => [ "chinese_restaurant", "asian_restaurant" ],
    "japanese" => [ "japanese_restaurant", "sushi_restaurant", "ramen_restaurant" ],
    "sushi" => [ "sushi_restaurant", "japanese_restaurant" ],
    "ramen" => [ "ramen_restaurant", "japanese_restaurant" ],
    "thai" => [ "thai_restaurant", "asian_restaurant" ],
    "indian" => [ "indian_restaurant", "asian_restaurant" ],
    "korean" => [ "korean_restaurant", "asian_restaurant" ],
    "vietnamese" => [ "vietnamese_restaurant", "asian_restaurant" ],
    "asian" => [ "asian_restaurant", "chinese_restaurant", "japanese_restaurant", "thai_restaurant" ],
    "indonesian" => [ "indonesian_restaurant", "asian_restaurant" ],

    # European Cuisines
    "italian" => [ "italian_restaurant", "pizza_restaurant" ],
    "pizza" => [ "pizza_restaurant", "italian_restaurant" ],
    "french" => [ "french_restaurant" ],
    "spanish" => [ "spanish_restaurant" ],
    "greek" => [ "greek_restaurant" ],
    "turkish" => [ "turkish_restaurant" ],

    # Middle Eastern & Mediterranean
    "mediterranean" => [ "mediterranean_restaurant", "greek_restaurant", "lebanese_restaurant" ],
    "middle eastern" => [ "middle_eastern_restaurant", "lebanese_restaurant", "turkish_restaurant" ],
    "lebanese" => [ "lebanese_restaurant", "middle_eastern_restaurant" ],

    # American & Western
    "american" => [ "american_restaurant", "diner", "hamburger_restaurant" ],
    "burger" => [ "hamburger_restaurant", "american_restaurant", "bar_and_grill" ],
    "hamburger" => [ "hamburger_restaurant", "american_restaurant" ],
    "bbq" => [ "barbecue_restaurant" ],
    "barbecue" => [ "barbecue_restaurant" ],
    "steakhouse" => [ "steak_house" ],
    "steak" => [ "steak_house" ],
    "diner" => [ "diner", "american_restaurant" ],

    # Latin American
    "mexican" => [ "mexican_restaurant" ],
    "brazilian" => [ "brazilian_restaurant" ],

    # African
    "african" => [ "african_restaurant" ],

    # Seafood & Specialty
    "seafood" => [ "seafood_restaurant" ],
    "sandwich" => [ "sandwich_shop", "deli" ],
    "deli" => [ "deli", "sandwich_shop" ],

    # Meal Types
    "breakfast" => [ "breakfast_restaurant", "diner", "bagel_shop", "brunch_restaurant" ],
    "brunch" => [ "brunch_restaurant", "breakfast_restaurant" ],
    "fast food" => [ "fast_food_restaurant", "hamburger_restaurant" ],
    "fine dining" => [ "fine_dining_restaurant" ],

    # Desserts & Bakery
    "bakery" => [ "bakery", "dessert_restaurant" ],
    "dessert" => [ "dessert_restaurant", "ice_cream_shop", "bakery" ],
    "ice cream" => [ "ice_cream_shop" ],

    # Dietary
    "vegetarian" => [ "vegetarian_restaurant", "vegan_restaurant" ],
    "vegan" => [ "vegan_restaurant" ]
  }.freeze

  # Map bar-related keywords to Google Places types
  BAR_TYPE_MAPPING = {
    "bar" => [ "bar", "bar_and_grill", "pub" ],
    "cocktail" => [ "bar", "wine_bar" ],
    "cocktails" => [ "bar", "wine_bar" ],
    "wine" => [ "wine_bar", "bar" ],
    "wine bar" => [ "wine_bar" ],
    "beer" => [ "bar", "pub", "bar_and_grill" ],
    "pub" => [ "pub", "bar" ],
    "sports bar" => [ "bar_and_grill", "bar" ],
    "bar and grill" => [ "bar_and_grill" ],
    "coffee" => [ "coffee_shop", "cafe" ],
    "cafe" => [ "cafe", "coffee_shop" ]
  }.freeze

  # Ambiance keywords that don't map to specific Google types
  # These will be matched against venue names and descriptions
  BAR_AMBIANCE_KEYWORDS = {
    "speakeasy" => [ "speakeasy", "hidden", "secret", "cocktail" ],
    "dive bar" => [ "dive", "casual", "no-frills" ],
    "tiki" => [ "tiki", "tropical", "rum", "polynesian" ],
    "karaoke" => [ "karaoke", "sing", "singing" ],
    "live music" => [ "live music", "jazz", "blues", "band", "music" ],
    "jazz" => [ "jazz", "live music", "jazz club" ],
    "sports bar" => [ "sports", "game", "games", "tv", "screens" ],
    "nightclub" => [ "club", "nightclub", "dance", "dancing", "dj" ],
    "lounge" => [ "lounge", "cocktail lounge" ]
  }.freeze

  # Venue types to EXCLUDE from restaurant recommendations (unless explicitly requested)
  # These are not appropriate for meal recommendations (breakfast/lunch/dinner)
  NON_MEAL_VENUE_TYPES = [
    "coffee_shop",
    "cafe",
    "ice_cream_shop",
    "bakery",
    "dessert_shop",
    "dessert_restaurant",
    "convenience_store",
    "gas_station",
    "liquor_store",
    "supermarket",
    "grocery_store"
  ].freeze

  # Meal type keywords to detect what meal the user wants
  MEAL_TYPE_KEYWORDS = {
    "breakfast" => [ "breakfast", "morning", "brunch" ],
    "lunch" => [ "lunch", "midday", "afternoon" ],
    "dinner" => [ "dinner", "evening", "supper", "night" ]
  }.freeze

  # Rank venues based on user preferences, ratings, and keyword matching
  # Returns top N venues sorted by relevance score
  #
  # @param venues [Array] Array of venue hashes from Google Places
  # @param user_preferences [String] User's preference notes (cuisines, atmospheres, budget, etc.)
  # @param dietary_requirements_string [String, nil] HARD dietary requirements (vegetarian, vegan, etc.) - separate from preferences
  # @param top_n [Integer] Number of top venues to return
  def self.rank_venues(venues, user_preferences, dietary_requirements_string: nil, top_n: 10)
    return [] if venues.empty?

    # Extract keywords from user preferences
    keywords = extract_keywords(user_preferences)
    budget_preference = extract_budget_preference(user_preferences)

    # PRIORITY 1: Use explicit dietary_requirements field if provided (from frontend)
    # PRIORITY 2: Fall back to extracting from user_preferences (legacy/guest mode)
    dietary_requirements = if dietary_requirements_string.present?
      extract_dietary_requirements(dietary_requirements_string)
    else
      extract_dietary_requirements(user_preferences)
    end

    # DEBUG: Log dietary requirements
    Rails.logger.info "[DIETARY FILTER] Dietary requirements string: #{dietary_requirements_string || 'None'}"
    Rails.logger.info "[DIETARY FILTER] Extracted requirements: #{dietary_requirements.join(', ')}" if dietary_requirements.any?

    meal_type = extract_meal_type(user_preferences)

    # Filter out inappropriate venue types for meal recommendations
    # Allow dessert/coffee venues ONLY if user explicitly requested them
    explicitly_requested_types = []
    explicitly_requested_types += [ "coffee_shop", "cafe" ] if keywords.include?("coffee") || keywords.include?("cafe")
    explicitly_requested_types += [ "ice_cream_shop", "dessert_restaurant", "bakery" ] if keywords.include?("dessert") || keywords.include?("ice cream") || keywords.include?("bakery")

    filtered_venues = venues.reject do |venue|
      venue_types = venue[:types] || []

      # Check if venue is a non-meal type (coffee shop, ice cream, etc.)
      has_non_meal_type = (venue_types & NON_MEAL_VENUE_TYPES).any?

      if has_non_meal_type
        # Allow it if user explicitly requested this type (e.g., "dessert" or "coffee")
        explicitly_allowed = (venue_types & explicitly_requested_types).any?

        # Exclude if NOT explicitly requested
        !explicitly_allowed
      else
        # Keep all proper restaurants
        false
      end
    end

    Rails.logger.info "[VENUE FILTERING] Original: #{venues.size}, After non-meal filter: #{filtered_venues.size}"

    # Filter out permanently closed venues (and temporarily closed)
    filtered_venues = filtered_venues.reject do |venue|
      venue[:business_status] == "CLOSED_PERMANENTLY" ||
      venue[:business_status] == "CLOSED_TEMPORARILY"
    end

    Rails.logger.info "[VENUE FILTERING] After closed filter: #{filtered_venues.size}"

    # Filter by meal service times (uses Google Places data)
    if meal_type == "dinner"
      filtered_venues = filtered_venues.select { |v| v[:serves_dinner] != false }
    elsif meal_type == "lunch"
      filtered_venues = filtered_venues.select { |v| v[:serves_lunch] != false }
    elsif meal_type == "breakfast"
      filtered_venues = filtered_venues.select { |v| v[:serves_breakfast] != false }
    end

    Rails.logger.info "[VENUE FILTERING] After meal-time filter: #{filtered_venues.size}, Meal type: #{meal_type}, Keywords: #{keywords.join(', ')}"

    # HARD FILTER: Exclude meat-focused venues for vegetarian/vegan requirements
    if dietary_requirements.any? { |r| r == "vegetarian" || r == "vegan" }
      filtered_venues = filtered_venues.reject do |venue|
        venue_name = venue[:name].downcase
        venue_types = venue[:types]&.map(&:downcase) || []

        # Comprehensive meat keyword list
        # Exclude if name contains meat keywords AND doesn't contain veggie alternatives
        is_meat_focused = (venue_name.match?(/chicken|brisket|steak|bbq|butcher|burger|meat|wings|ribs|pork|bacon|ham|sausage|lamb|duck|turkey|carnivore|charcuterie|steakhouse/) &&
                          !venue_name.match?(/veggie|vegan|plant|impossible|beyond/))

        # Exclude specific meat-focused venue types
        has_meat_type = (venue_types & [ "steakhouse", "barbecue_restaurant", "butcher_shop" ]).any?

        if is_meat_focused || has_meat_type
          Rails.logger.info "[DIETARY FILTER] Excluding meat venue: #{venue[:name]} (types: #{venue_types.join(', ')})"
        end

        is_meat_focused || has_meat_type
      end

      Rails.logger.info "[DIETARY FILTER] After vegetarian/vegan filter: #{filtered_venues.size} venues"
    end

    # Score each venue
    scored_venues = filtered_venues.map do |venue|
      score = calculate_venue_score(venue, keywords, budget_preference, dietary_requirements)
      { venue: venue, score: score }
    end

    # Sort by score (highest first) and return top N
    scored_venues
      .sort_by { |v| -v[:score] }
      .first(top_n)
      .map { |v| format_recommendation(v[:venue]) }
  end

  private

  def self.calculate_venue_score(venue, keywords, budget_preference, dietary_requirements)
    score = 0.0

    # 0. CRITICAL: Dietary Requirements Filter (MUST PASS)
    # If dietary requirements exist, venue MUST be compatible (70%+ match)
    # Otherwise, exclude it entirely from recommendations
    if dietary_requirements.any?
      dietary_score = check_dietary_compatibility(venue, dietary_requirements)

      # Hard filter: If dietary compatibility is below 70%, exclude this venue
      if dietary_score < 0.7
        return -999  # This ensures venue won't be recommended
      end

      # If compatible, give a bonus
      score += 20
    else
      score += 10  # Neutral if no dietary requirements
    end

    # 1. Rating Score (30% weight) - Higher ratings get more points
    if venue[:rating].present?
      rating_score = (venue[:rating].to_f / 5.0) * 30
      score += rating_score
    end

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

    # 3. Budget Matching (15% weight) - Match price level to budget preference
    if budget_preference.present? && venue[:price_level].present?
      budget_score = budget_matches?(venue[:price_level], budget_preference)
      score += budget_score
    else
      score += 7.5  # Neutral if no budget specified
    end

    # 4. Popularity Bonus - More reviews = more reliable
    if venue[:user_ratings_total].present? && venue[:user_ratings_total] > 100
      score += 5
    end

    score
  end

  def self.build_venue_search_text(venue)
    [
      venue[:name],
      venue[:types]&.join(" "),
      venue[:address]
    ].compact.join(" ").downcase
  end

  def self.calculate_keyword_match_score(venue, user_keywords)
    venue_types = venue[:types] || []
    venue_name = venue[:name]&.downcase || ""

    matches = 0
    total_keywords = user_keywords.size

    user_keywords.each do |keyword|
      keyword_lower = keyword.downcase

      # First, try to match against Google Places types using our mapping
      expected_types = CUISINE_TYPE_MAPPING[keyword_lower] || BAR_TYPE_MAPPING[keyword_lower]

      if expected_types && (venue_types & expected_types).any?
        # Direct type match - highest confidence
        matches += 1
      elsif BAR_AMBIANCE_KEYWORDS[keyword_lower]
        # Check ambiance keywords in venue name
        ambiance_terms = BAR_AMBIANCE_KEYWORDS[keyword_lower]
        if ambiance_terms.any? { |term| venue_name.include?(term) }
          matches += 1
        end
      else
        # Fallback: check if keyword appears in venue name or types (legacy behavior)
        venue_text = build_venue_search_text(venue)
        if venue_text.include?(keyword_lower)
          matches += 0.5  # Partial credit for text match
        end
      end
    end

    return 0 if total_keywords == 0
    (matches.to_f / total_keywords) * 30
  end

  def self.extract_keywords(preferences)
    return [] if preferences.blank?

    text = preferences.to_s.downcase
    found_keywords = []

    # Check all cuisine keywords from our mapping
    CUISINE_TYPE_MAPPING.keys.each do |keyword|
      found_keywords << keyword if text.include?(keyword)
    end

    # Check all bar keywords from our mapping
    BAR_TYPE_MAPPING.keys.each do |keyword|
      found_keywords << keyword if text.include?(keyword)
    end

    # Check all ambiance keywords
    BAR_AMBIANCE_KEYWORDS.keys.each do |keyword|
      found_keywords << keyword if text.include?(keyword)
    end

    # Additional atmosphere keywords (not tied to specific types)
    atmosphere = [
      "romantic", "casual", "upscale", "trendy", "cozy", "lively", "quiet",
      "rooftop", "outdoor", "patio", "waterfront", "views"
    ]
    atmosphere.each do |keyword|
      found_keywords << keyword if text.include?(keyword)
    end

    # Check for specific food items that indicate cuisine
    found_keywords << "mexican" if text.match?(/taco|burrito|quesadilla/) && !found_keywords.include?("mexican")
    found_keywords << "italian" if text.match?(/pasta|risotto|tiramisu/) && !found_keywords.include?("italian")
    found_keywords << "japanese" if text.match?(/sushi|ramen|tempura/) && !found_keywords.include?("japanese")
    found_keywords << "chinese" if text.match?(/dim sum|dumpling/) && !found_keywords.include?("chinese")

    found_keywords.uniq
  end

  def self.extract_budget_preference(preferences)
    return nil if preferences.blank?

    text = preferences.to_s.downcase

    return "$$$$" if text.match?(/upscale|high.?end|expensive|fancy|fine.?dining|splurge/)
    return "$$$" if text.match?(/moderate|mid.?range|reasonable/)
    return "$$" if text.match?(/budget|cheap|affordable|inexpensive|casual/)
    return "$" if text.match?(/very.?cheap|dirt.?cheap|under.\d+/)

    nil  # No budget preference specified
  end

  def self.extract_dietary_requirements(preferences)
    return [] if preferences.blank?

    text = preferences.to_s.downcase
    requirements = []

    requirements << "vegan" if text.match?(/vegan/)
    requirements << "vegetarian" if text.match?(/vegetarian/)
    requirements << "gluten-free" if text.match?(/gluten.?free|celiac/)
    requirements << "kosher" if text.match?(/kosher/)
    requirements << "halal" if text.match?(/halal/)
    requirements << "dairy-free" if text.match?(/dairy.?free|lactose/)
    requirements << "nut-free" if text.match?(/nut.?free|nut allerg/)
    requirements << "shellfish-free" if text.match?(/no.?shellfish|shellfish allerg/)

    requirements.uniq
  end

  def self.extract_meal_type(preferences)
    return nil if preferences.blank?

    text = preferences.to_s.downcase

    # Check for each meal type
    MEAL_TYPE_KEYWORDS.each do |meal_type, keywords|
      return meal_type if keywords.any? { |keyword| text.include?(keyword) }
    end

    nil  # No specific meal type mentioned
  end

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

  def self.check_dietary_compatibility(venue, dietary_requirements)
    # Check venue types and Google Places dietary fields for compatibility
    venue_types = venue[:types]&.map(&:downcase) || []
    venue_name = venue[:name].downcase

    Rails.logger.info "[DIETARY CHECK] Checking #{venue[:name]} for: #{dietary_requirements.join(', ')}"

    compatible_count = 0
    dietary_requirements.each do |requirement|
      case requirement
      when "vegan"
        # Check Google Places field first (most reliable), then types, then name
        if venue[:serves_vegan_food] == true ||
           venue_types.include?("vegan_restaurant") ||
           venue_name.include?("vegan")
          compatible_count += 1
          Rails.logger.info "[DIETARY CHECK]   ✓ Vegan: PASS"
        else
          Rails.logger.info "[DIETARY CHECK]   ✗ Vegan: FAIL (serves_vegan=#{venue[:serves_vegan_food]}, types=#{venue_types.join(', ')})"
        end
      when "vegetarian"
        # Check Google Places field first (most reliable)
        if venue[:serves_vegetarian_food] == true || venue[:serves_vegan_food] == true
          compatible_count += 1
          Rails.logger.info "[DIETARY CHECK]   ✓ Vegetarian: PASS (Google Places field)"
        # Check venue types
        elsif venue_types.include?("vegetarian_restaurant") || venue_types.include?("vegan_restaurant")
          compatible_count += 1
          Rails.logger.info "[DIETARY CHECK]   ✓ Vegetarian: PASS (venue type)"
        # Check venue name
        elsif venue_name.match?(/vegetarian|vegan|plant.?based|veggie/)
          compatible_count += 1
          Rails.logger.info "[DIETARY CHECK]   ✓ Vegetarian: PASS (name match)"
        # If venue has meat-related keywords, fail (using same comprehensive list as hard filter)
        elsif venue_name.match?(/chicken|brisket|steak|bbq|burger|wings|ribs|pork|bacon|ham|sausage|lamb|duck|turkey|carnivore|charcuterie|steakhouse/) &&
              !venue_name.match?(/veggie|impossible|beyond/)
          # Explicitly NOT vegetarian
          compatible_count += 0
          Rails.logger.info "[DIETARY CHECK]   ✗ Vegetarian: FAIL (meat-focused name)"
        else
          # Unknown - give partial credit instead of failing completely
          compatible_count += 0.3
          Rails.logger.info "[DIETARY CHECK]   ~ Vegetarian: PARTIAL (no data, serves_veg=#{venue[:serves_vegetarian_food]})"
        end
      when "gluten-free"
        # Google Places doesn't have a gluten-free field, check name
        if venue_name.match?(/gluten.?free|celiac/)
          compatible_count += 1
        else
          # Give partial credit - many restaurants have gluten-free options
          compatible_count += 0.5
        end
      when "halal"
        # Check name and types
        if venue_name.include?("halal") || venue_types.any? { |t| t.include?("halal") }
          compatible_count += 1
        end
      when "kosher"
        # Check name and types
        if venue_name.include?("kosher") || venue_types.any? { |t| t.include?("kosher") }
          compatible_count += 1
        end
      end
    end

    return 1.0 if dietary_requirements.empty?

    compatibility_score = compatible_count.to_f / dietary_requirements.size
    Rails.logger.info "[DIETARY CHECK] Final score: #{compatibility_score.round(2)} (#{compatible_count}/#{dietary_requirements.size})"

    compatibility_score
  end

  def self.format_recommendation(venue)
    {
      name: venue[:name],
      address: venue[:address] || "Address not available",
      hours: venue[:hours] || "Hours not available",
      website: venue[:website],
      price_range: venue[:price_level] || "$",
      rating: venue[:rating],
      user_ratings_total: venue[:user_ratings_total],
      description: generate_description(venue),
      reason: generate_reason_tags(venue),
      latitude: venue[:latitude],
      longitude: venue[:longitude]
    }
  end

  def self.generate_description(venue)
    # Generate a brief description based on venue types and rating
    types = venue[:types] || []
    cuisine_types = types.select { |t| ![ "point_of_interest", "establishment", "food" ].include?(t) }
      .map { |t| t.gsub("_", " ").titleize }
      .first(2)

    if cuisine_types.any?
      description = cuisine_types.join(" & ")
      description += " - Highly rated" if venue[:rating].to_f >= 4.5
      description
    else
      venue[:rating].to_f >= 4.5 ? "Highly rated establishment" : "Local favorite"
    end
  end

  def self.generate_reason_tags(venue)
    tags = []

    # Add rating tag
    rating = venue[:rating].to_f
    tags << "Highly Rated" if rating >= 4.5
    tags << "Well Reviewed" if rating >= 4.0 && rating < 4.5

    # Add price tag
    case venue[:price_level]
    when "$$$$"
      tags << "Upscale"
    when "$$$"
      tags << "Moderate"
    when "$$"
      tags << "Budget-Friendly"
    when "$"
      tags << "Very Affordable"
    end

    # Add popularity tag
    if venue[:user_ratings_total].to_i > 500
      tags << "Popular"
    elsif venue[:user_ratings_total].to_i > 100
      tags << "Well-Known"
    end

    # Add cuisine/type tags from venue types (up to 2)
    types = venue[:types] || []
    cuisine_types = types.select { |t| ![ "point_of_interest", "establishment", "food" ].include?(t) }
      .map { |t| t.gsub("_", " ").titleize }
      .first(2)
    tags.concat(cuisine_types)

    tags.first(6).join(", ")
  end
end
