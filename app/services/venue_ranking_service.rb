class VenueRankingService
  # Rank venues based on user preferences, ratings, and keyword matching
  # Returns top N venues sorted by relevance score
  def self.rank_venues(venues, user_preferences, top_n: 10)
    return [] if venues.empty?

    # Extract keywords from user preferences
    keywords = extract_keywords(user_preferences)
    budget_preference = extract_budget_preference(user_preferences)
    dietary_requirements = extract_dietary_requirements(user_preferences)

    # Score each venue
    scored_venues = venues.map do |venue|
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

    # 1. Rating Score (35% weight) - Higher ratings get more points
    if venue[:rating].present?
      rating_score = (venue[:rating].to_f / 5.0) * 35
      score += rating_score
    end

    # 2. Keyword Matching (35% weight) - Match user preferences to venue types/name
    venue_text = build_venue_search_text(venue)
    keyword_matches = keywords.count { |kw| venue_text.include?(kw.downcase) }
    if keywords.any?
      keyword_score = (keyword_matches.to_f / keywords.size) * 35
      score += keyword_score
    else
      # If no keywords, give neutral score
      score += 17.5
    end

    # 3. Budget Matching (15% weight) - Match price level to budget preference
    if budget_preference.present? && venue[:price_level].present?
      price_match = budget_matches?(venue[:price_level], budget_preference)
      score += (price_match ? 15 : 5)
    else
      score += 7.5  # Neutral if no budget specified
    end

    # 4. Dietary Requirements (15% weight) - Critical for allergies/restrictions
    if dietary_requirements.any?
      dietary_score = check_dietary_compatibility(venue, dietary_requirements)
      score += dietary_score * 15
    else
      score += 7.5  # Neutral if no dietary requirements
    end

    # 5. Popularity Bonus - More reviews = more reliable
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

  def self.extract_keywords(preferences)
    return [] if preferences.blank?

    text = preferences.to_s.downcase

    # Common cuisine types
    cuisines = [
      "mexican", "italian", "chinese", "japanese", "sushi", "thai", "indian", "korean", "vietnamese",
      "french", "spanish", "greek", "mediterranean", "middle eastern", "lebanese", "turkish",
      "american", "burger", "pizza", "bbq", "barbecue", "steakhouse", "seafood",
      "ethiopian", "african", "caribbean", "cuban", "peruvian", "brazilian",
      "ramen", "tacos", "dim sum", "tapas", "brunch", "breakfast"
    ]

    # Atmosphere keywords
    atmosphere = [
      "romantic", "casual", "upscale", "trendy", "cozy", "lively", "quiet",
      "rooftop", "outdoor", "patio", "waterfront", "views"
    ]

    # Bar-specific keywords
    bar_types = [
      "cocktail", "craft cocktail", "whiskey", "wine bar", "beer", "craft beer", "brewery",
      "speakeasy", "dive bar", "sports bar", "lounge", "pub", "tiki",
      "karaoke", "live music", "jazz", "dance", "club", "nightclub"
    ]

    all_keywords = cuisines + atmosphere + bar_types
    found_keywords = all_keywords.select { |keyword| text.include?(keyword) }

    # Check for specific food items that indicate cuisine
    found_keywords << "mexican" if text.match?(/taco|burrito|quesadilla/) && !found_keywords.include?("mexican")
    found_keywords << "italian" if text.match?(/pasta|risotto|tiramisu/) && !found_keywords.include?("italian")
    found_keywords << "japanese" if text.match?(/sushi|ramen|tempura/) && !found_keywords.include?("japanese")

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

  def self.budget_matches?(venue_price, budget_preference)
    # Extract dollar signs count
    venue_level = venue_price.count("$")
    budget_level = budget_preference.count("$")

    # Allow +/- 1 level flexibility
    (venue_level - budget_level).abs <= 1
  end

  def self.check_dietary_compatibility(venue, dietary_requirements)
    # Check venue types for dietary compatibility
    venue_types = venue[:types]&.map(&:downcase) || []
    venue_name = venue[:name].downcase

    compatible_count = 0
    dietary_requirements.each do |requirement|
      case requirement
      when "vegan", "vegetarian"
        # Check if venue is known for vegan/vegetarian options
        if venue_types.include?("vegetarian_restaurant") ||
           venue_types.include?("vegan_restaurant") ||
           venue_name.include?("vegan") ||
           venue_name.include?("vegetarian")
          compatible_count += 1
        end
      when "gluten-free"
        # Hard to detect from Google Places data, give neutral
        compatible_count += 0.5
      when "halal", "kosher"
        if venue_name.include?(requirement)
          compatible_count += 1
        end
      end
    end

    return 1.0 if dietary_requirements.empty?
    compatible_count.to_f / dietary_requirements.size
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
