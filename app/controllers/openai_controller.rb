require "openai"
require "net/http"
require "uri"

class OpenaiController < ApplicationController
  skip_before_action :authorized, only: [
    :restaurant_recommendations,
    :bar_recommendations,
    :game_recommendations,
    :try_voxxy_recommendations,
    :try_voxxy_cached
  ]

  def restaurant_recommendations
    user_responses     = params[:responses]
    activity_location  = params[:activity_location]
    date_notes         = params[:date_notes]
    activity_id        = params[:activity_id]
    radius             = params[:radius]

    if user_responses.blank?
      render json: { error: "No responses provided" }, status: :unprocessable_entity and return
    end

    user_id  = current_user.id
    cache_key = "user_#{user_id}_" \
                "activity_#{activity_id}_" \
                "#{generate_cache_key(user_responses, activity_location, date_notes, 'restaurant')}"

    recommendations = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
      # Use hybrid approach by default
      fetch_hybrid_restaurant_recommendations(user_responses, activity_location, date_notes, radius)
    end

    if recommendations.present?
      render json: { recommendations: recommendations }, status: :ok
    else
      render json: { error: "Failed to generate recommendations" }, status: :unprocessable_entity
    end
  end

  def bar_recommendations
    user_responses     = params[:responses]
    activity_location  = params[:activity_location]
    date_notes         = params[:date_notes]
    activity_id        = params[:activity_id]
    radius             = params[:radius]

    if user_responses.blank?
      render json: { error: "No responses provided" }, status: :unprocessable_entity and return
    end

    user_id  = current_user.id
    cache_key = "user_#{user_id}_" \
                "activity_#{activity_id}_" \
                "#{generate_cache_key(user_responses, activity_location, date_notes, 'bar')}"

    recommendations = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
      # Use hybrid approach by default
      fetch_hybrid_bar_recommendations(user_responses, activity_location, date_notes, radius)
    end

    if recommendations.present?
      render json: { recommendations: recommendations }, status: :ok
    else
      render json: { error: "Failed to generate recommendations" }, status: :unprocessable_entity
    end
  end

  def game_recommendations
    user_responses     = params[:responses]
    activity_location  = params[:activity_location]
    date_notes         = params[:date_notes]
    activity_id        = params[:activity_id]

    if user_responses.blank?
      render json: { error: "No responses provided" }, status: :unprocessable_entity and return
    end

    user_id  = current_user.id
    cache_key = "user_#{user_id}_" \
                "activity_#{activity_id}_" \
                "#{generate_cache_key(user_responses, activity_location, date_notes, 'game')}"

    recommendations = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
      fetch_game_recommendations_from_openai(user_responses, activity_location, date_notes)
    end

    if recommendations.present?
      render json: { recommendations: recommendations }, status: :ok
    else
      render json: { error: "Failed to generate game recommendations" }, status: :unprocessable_entity
    end
  end

  def try_voxxy_recommendations
    Rails.logger.info("🔍 try_voxxy_recommendations called")

    session_token = request.headers["X-Session-Token"] || params[:session_token]
    Rails.logger.info("📝 Session token: #{session_token}")

    # Validate session token format
    if session_token.blank? || !valid_session_token?(session_token)
      Rails.logger.warn("❌ Invalid or missing session token")
      return render json: { error: "Invalid or missing session token" }, status: :unauthorized
    end

    # Include session token in cache keys to prevent collisions
    rate_key  = "try_voxxy_rate:#{session_token}"
    cache_key = "try_voxxy_cache:#{session_token}:#{generate_request_hash(params)}"
    Rails.logger.info("🔑 Cache keys - rate: #{rate_key}, cache: #{cache_key}")

    begin
      # Use atomic operations to prevent race conditions
      cached_recommendations = Rails.cache.read(cache_key)

      if cached_recommendations.present?
        Rails.logger.info("✅ Found cached recommendations, returning #{cached_recommendations.length} items")
        return render json: { recommendations: cached_recommendations }, status: :ok
      end

      # Check rate limiting with atomic operation
      rate_limit_time = Rails.cache.read(rate_key)

      if rate_limit_time && Time.current < rate_limit_time
        minutes_left = ((rate_limit_time - Time.current) / 60.0).ceil
        Rails.logger.info("🚫 Rate limited, #{minutes_left} minutes left")

        # Try to return last cached result for this session
        last_cache_key = "try_voxxy_last:#{session_token}"
        last_recommendations = Rails.cache.read(last_cache_key)

        if last_recommendations.present?
          Rails.logger.info("📦 Returning previous recommendations while rate limited")
          return render json: {
            recommendations: last_recommendations,
            rate_limited: true,
            retry_after: minutes_left * 60
          }, status: :ok
        else
          return render json: {
            error: "Rate limit exceeded. Try again in #{minutes_left} minute(s).",
            retry_after: minutes_left * 60
          }, status: :too_many_requests
        end
      end

      Rails.logger.info("⏳ Setting rate limit for 1 hour")
      Rails.cache.write(rate_key, Time.current + 1.hour, expires_in: 1.hour)

      # Log incoming parameters
      user_responses    = params[:responses]
      activity_location = params[:activity_location]
      date_notes        = params[:date_notes]
      radius = 10

      Rails.logger.info("📋 Parameters:")
      Rails.logger.info("  - responses: #{user_responses&.truncate(100)}")
      Rails.logger.info("  - activity_location: #{activity_location}")
      Rails.logger.info("  - date_notes: #{date_notes}")
      Rails.logger.info("  - radius: #{radius}")

      if user_responses.blank? || activity_location.blank? || date_notes.blank?
        Rails.logger.warn("❌ Missing required parameters")
        return render json: { error: "Missing required parameters" }, status: :unprocessable_entity
      end

      Rails.logger.info("🤖 Using hybrid approach (Google Places + OpenAI)...")
      recs = fetch_hybrid_restaurant_recommendations(user_responses, activity_location, date_notes, radius)

      if recs && recs.is_a?(Array) && !recs.empty?
        Rails.logger.info("✅ Got #{recs.length} recommendations from OpenAI")

        # Cache with both specific and last-used keys
        Rails.cache.write(cache_key, recs, expires_in: 1.hour)
        Rails.cache.write("try_voxxy_last:#{session_token}", recs, expires_in: 1.hour)

        render json: { recommendations: recs }, status: :ok
      else
        Rails.logger.error("❌ OpenAI returned invalid recommendations: #{recs.inspect}")

        # Clear rate limit on failure to allow retry
        Rails.cache.delete(rate_key)

        render json: {
          error: "Failed to generate recommendations. Please try again.",
          should_retry: true
        }, status: :unprocessable_entity
      end

    rescue JSON::ParserError => e
      Rails.logger.error("💥 JSON Parse Error in try_voxxy: #{e.message}")
      Rails.cache.delete(rate_key) # Allow retry on JSON errors
      render json: {
        error: "Failed to process recommendations. Please try again.",
        should_retry: true
      }, status: :unprocessable_entity
    rescue => e
      Rails.logger.error("💥 Exception in try_voxxy_recommendations: #{e.class.name}: #{e.message}")
      Rails.logger.error("📍 Backtrace: #{e.backtrace.first(5).join("\n")}")

      # Don't clear rate limit for unexpected errors
      render json: {
        error: "An unexpected error occurred. Please try again later.",
        should_retry: false
      }, status: :internal_server_error
    end
  end

  def try_voxxy_cached
    session_token = request.headers["X-Session-Token"] || params[:session_token]

    if session_token.blank? || !valid_session_token?(session_token)
      return render json: { error: "Invalid or missing session token" }, status: :unauthorized
    end

    cache_key = "try_voxxy_last:#{session_token}"
    cached = Rails.cache.read(cache_key)

    Rails.logger.info("📦 try_voxxy_cached - token: #{session_token.first(10)}..., found: #{cached.present?}")

    render json: {
      recommendations: cached || [],
      has_cached: cached.present?
    }, status: :ok
  end

  private

  def fetch_restaurant_recommendations_from_openai(responses, activity_location, date_notes, radius)
    Rails.logger.info("🤖 Starting OpenAI API call...")

    # Check for API key
    api_key = ENV["OPENAI_API_KEY"]
    if api_key.blank?
      Rails.logger.error("❌ OPENAI_API_KEY environment variable is missing!")
      return nil
    end
    Rails.logger.info("✅ OpenAI API key present (#{api_key.length} chars)")

    begin
      client = OpenAI::Client.new(access_token: api_key)

      notes_text = if responses.is_a?(Array)
        responses
          .map { |r| r.is_a?(Hash) ? r["notes"].to_s.strip : r.to_s.strip }
          .reject(&:empty?)
          .join("\n\n")
      else
        responses.to_s.strip
      end

      Rails.logger.info("📝 Processed notes_text: #{notes_text.truncate(200)}")
    rescue => e
      Rails.logger.error("💥 Error initializing OpenAI client: #{e.message}")
      return nil
    end

    prompt = <<~PROMPT
      You are an AI assistant that provides restaurant recommendations based on:
        • user dietary & other preferences
        • a central location (#{activity_location})
        • a date (#{date_notes})
        • and a strict radius of #{radius} mile#{ radius == 1 ? "" : "s" }.

      The user's preferences (exactly as they typed them) are:
      #{notes_text}

      IMPORTANT:
      1. **PRIORITIZE dietary preferences** (e.g., allergies, vegan, gluten-free) above all else.#{'  '}
        If they say "Vegan please!" or "No shellfish," those conditions must drive your picks.
      2. Next, honor budget constraints ("Prefer upscale," etc.).
      3. Then consider ambiance ("Rooftop," "Cozy," etc.)—but only after dietary & budget are satisfied.
      4. Only include restaurants located *within* #{radius} mile#{ radius == 1 ? "" : "s" } of "#{activity_location}".#{'  '}
        Do NOT list any restaurant that you know (or strongly suspect) is outside that boundary.
      5. Keep the tone warm and human — avoid calling people "users" or referencing individual budgets.
      6. Avoid large chains or obvious tourist spots—seek out hole-in-the-wall or buzz-worthy places.

      Return exactly **5** restaurants that match these criteria. Output must be valid JSON (no extra commentary, no markdown fences) in this structure:

      {
        "restaurants": [
          {
            "name":        "Restaurant Name",
            "price_range": "$ - $$$$",
            "description": "Short description (cuisine + atmosphere).",
            "reason":      "Provide a comprehensive explanation covering: (1) How this restaurant specifically addresses their dietary needs/restrictions mentioned in their preferences, (2) Why this choice aligns with their stated budget or ambiance preferences, (3) What makes this restaurant special or unique compared to more obvious choices, (4) How it fits perfectly within the #{radius}-mile radius of #{activity_location}, and (5) What specific dishes, features, or qualities make this an ideal match for their exact preferences. Be detailed and connect directly to what they wrote.",
            "hours":       "Hours of operation (e.g., Mon-Fri: 9 AM - 10 PM, Sat-Sun: 8 AM - 11 PM)",
            "website":     "Valid website link or null if unknown",
            "address":     "Full address or 'Not available'"
          }
        ]
      }
    PROMPT

    begin
      Rails.logger.info("🌐 Making OpenAI API request...")

      response = client.chat(
        parameters: {
          model:       "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an AI assistant that outputs strictly valid JSON." },
            { role: "user",   content: prompt }
          ],
          temperature: 0.0
        }
      )

      Rails.logger.info("📥 OpenAI API response received")
      raw_json = response.dig("choices", 0, "message", "content")

      if raw_json.blank?
        Rails.logger.error("❌ OpenAI returned empty content")
        return nil
      end

      Rails.logger.info("📄 Raw JSON response: #{raw_json.truncate(300)}")

      begin
        parsed = JSON.parse(raw_json)
        recommendations = parsed.fetch("restaurants", [])
        Rails.logger.info("✅ Successfully parsed #{recommendations.length} recommendations")
        recommendations
      rescue JSON::ParserError => e
        Rails.logger.error("❌ JSON Parse Error: #{e.message}")
        Rails.logger.error("📄 Raw JSON that failed to parse: #{raw_json}")
        nil
      end

    rescue => e
      Rails.logger.error("💥 OpenAI API Error: #{e.class.name}: #{e.message}")
      Rails.logger.error("📍 Backtrace: #{e.backtrace.first(3).join("\n")}")
      nil
    end
  end

  def fetch_bar_recommendations_from_openai(responses, activity_location, date_notes, radius)
    client = OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"])

    notes_text = if responses.is_a?(Array)
      responses
        .map { |r| r.is_a?(Hash) ? r["notes"].to_s.strip : r.to_s.strip }
        .reject(&:empty?)
        .join("\n\n")
    else
      responses.to_s.strip
    end

    prompt = <<~PROMPT
      You are an AI assistant that provides bar and nightlife recommendations based on:
        • user drink preferences & atmosphere needs
        • a central location (#{activity_location})
        • a date/time (#{date_notes})
        • and a strict radius of #{radius} mile#{ radius == 1 ? "" : "s" }.

      The user's preferences (exactly as they typed them) are:
      #{notes_text}

      IMPORTANT:
      1. **PRIORITIZE drink preferences** (e.g., cocktails, beer, wine, non-alcoholic options) above all else.#{'  '}
        If they say "craft cocktails only" or "need non-alcoholic options," those must drive your picks.
      2. Next, honor budget constraints ("budget-friendly," "prefer upscale," etc.).
      3. Then consider atmosphere preferences ("dive bar," "rooftop," "live music," "quiet conversation," etc.).
      4. Consider timing - for late night activities, prioritize bars with later hours.
      5. Only include bars/lounges located *within* #{radius} mile#{ radius == 1 ? "" : "s" } of "#{activity_location}".#{'  '}
        Do NOT list any establishment that you know (or strongly suspect) is outside that boundary.
      6. Keep the tone warm and human — avoid calling people "users" or referencing individual budgets.
      7. Avoid large chains or obvious tourist spots—seek out local gems, craft cocktail lounges, or unique nightlife spots.

      Return exactly **5** bars/lounges that match these criteria. Output must be valid JSON (no extra commentary, no markdown fences) in this structure:

      {
        "restaurants": [
          {
            "name":        "Bar/Lounge Name",
            "price_range": "$ - $$$$",
            "description": "Short description (drink specialties + atmosphere).",
            "reason":      "Provide a comprehensive explanation covering: (1) How this bar specifically addresses their drink preferences and special needs mentioned in their preferences, (2) Why this choice aligns with their stated budget or atmosphere preferences, (3) What makes this bar special or unique compared to more obvious choices, (4) How it fits perfectly within the #{radius}-mile radius of #{activity_location}, and (5) What specific drinks, features, happy hour deals, or atmosphere qualities make this an ideal match for their exact preferences. Be detailed and connect directly to what they wrote.",
            "hours":       "Hours of operation (e.g., Mon-Thu: 5 PM - 1 AM, Fri-Sat: 5 PM - 2 AM)",
            "website":     "Valid website link or null if unknown",
            "address":     "Full address or 'Not available'"
          }
        ]
      }
    PROMPT

    response = client.chat(
      parameters: {
        model:       "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI assistant that outputs strictly valid JSON." },
          { role: "user",   content: prompt }
        ],
        temperature: 0.0
      }
    )

    raw_json = response.dig("choices", 0, "message", "content")

    begin
      parsed = JSON.parse(raw_json)
      recommendations = parsed.fetch("restaurants", [])  # Keep same key for frontend compatibility
      # Remove the enrichment since it now happens in PinnedActivity creation
      recommendations
    rescue JSON::ParserError
      nil
    end
  end

  def fetch_game_recommendations_from_openai(responses, activity_location, date_notes)
    client = OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"])

    notes_text = if responses.is_a?(Array)
      responses
        .map { |r| r.is_a?(Hash) ? r["notes"].to_s.strip : r.to_s.strip }
        .reject(&:empty?)
        .join("\n\n")
    else
      responses.to_s.strip
    end

    Rails.logger.info("Game recommendations - notes_text length: #{notes_text.length}")
    Rails.logger.info("Game recommendations - activity_location: #{activity_location}")
    Rails.logger.info("Game recommendations - date_notes: #{date_notes}")

    prompt = <<~PROMPT
      You are an AI assistant that provides game recommendations for a game night based on:
        • user game preferences and group dynamics
        • activity location (#{activity_location})
        • timing/occasion (#{date_notes})

      The user's preferences are:
      #{notes_text}

      IMPORTANT:
      1. PRIORITIZE group size and player count mentioned in their preferences.
      2. Honor game type preferences (video games vs board games vs card games).
      3. Consider complexity level and experience preferences.
      4. Consider specific games they mentioned owning or wanting to play.
      5. Match the atmosphere and competitiveness level they described.
      6. Consider the session duration they prefer.
      7. Focus on popular, well-reviewed games that are widely available.
      8. For video games, consider the consoles/platforms they have available.
      9. For board/card games, prioritize games that are easy to learn but engaging.

      Return exactly 5 games that match these criteria. Output must be valid JSON with the key "restaurants" (for compatibility):

      {
        "restaurants": [
          {
            "name": "Game Title",
            "price_range": "Easy",
            "description": "Brief description of the game type and mechanics.",
            "reason": "Why this game matches their preferences, considering their player count, game types, complexity level, and specific preferences mentioned.",
            "hours": "30-45 minutes",
            "website": "https://boardgamegeek.com/boardgame/example or null",
            "address": "2-4 players"
          }
        ]
      }

      CRITICAL: Use "restaurants" as the JSON key, NOT "games".
    PROMPT

    Rails.logger.info("Game recommendations - Making OpenAI API call")

    begin
      response = client.chat(
        parameters: {
          model:       "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an AI assistant that outputs strictly valid JSON for game recommendations." },
            { role: "user",   content: prompt }
          ],
          temperature: 0.0,
          max_tokens: 2000  # Add token limit to prevent issues
        }
      )

      raw_json = response.dig("choices", 0, "message", "content")
      Rails.logger.info("Game recommendations - OpenAI response length: #{raw_json&.length}")
      Rails.logger.info("Game recommendations - Raw JSON: #{raw_json&.first(500)}...")

      parsed = JSON.parse(raw_json)
      recommendations = parsed.fetch("restaurants", [])
      Rails.logger.info("Game recommendations - Successfully parsed #{recommendations.length} recommendations")
      recommendations
    rescue JSON::ParserError => e
      Rails.logger.error("Game recommendations - JSON Parse Error: #{e.message}")
      Rails.logger.error("Game recommendations - Raw response: #{raw_json}")
      nil
    rescue => e
      Rails.logger.error("Game recommendations - OpenAI API Error: #{e.message}")
      nil
    end
  end

  def generate_cache_key(user_responses, activity_location, date_notes, type = "restaurant")
    hash_input = "#{type}-#{user_responses}-#{activity_location}-#{date_notes}"
    "recommendations_#{Digest::SHA256.hexdigest(hash_input)}"
  end

  def generate_request_hash(params)
    hash_input = "#{params[:responses]}-#{params[:activity_location]}-#{params[:date_notes]}"
    Digest::SHA256.hexdigest(hash_input)
  end

  def fetch_hybrid_restaurant_recommendations(responses, activity_location, date_notes, radius)
    Rails.logger.info("🔄 Starting hybrid recommendation approach...")

    # Extract cuisine preferences from user responses
    cuisine_keywords = extract_cuisine_keywords(responses)
    Rails.logger.info("🍽️ Extracted cuisine keywords: #{cuisine_keywords}")

    # Determine smart radius based on location type
    smart_radius = determine_smart_radius(activity_location, radius)
    Rails.logger.info("📍 Using smart radius: #{smart_radius} miles for #{activity_location}")

    # Step 1: Get real venues from Google Places
    radius_meters = smart_radius * 1609  # Convert miles to meters

    # Search with cuisine keyword if available
    search_keyword = cuisine_keywords.present? ? "#{cuisine_keywords.first} restaurant" : nil
    venues = GooglePlacesService.nearby_search(activity_location, "restaurant", radius_meters, 3.5, search_keyword)

    if venues.empty?
      Rails.logger.warn("⚠️ No venues found from Google Places, falling back to original approach")
      return fetch_restaurant_recommendations_from_openai(responses, activity_location, date_notes, radius)
    end

    Rails.logger.info("📍 Found #{venues.length} operational venues from Google Places")

    # Step 2: Get additional details for top venues (limit to avoid too many API calls)
    detailed_venues = venues.first(20).map do |venue|
      details = GooglePlacesService.get_detailed_venue_info(venue[:place_id])
      if details
        {
          name: details[:name],
          address: details[:address],
          rating: details[:rating],
          price_level: GooglePlacesService.convert_price_level_to_string(details[:price_level]),
          website: details[:website],
          hours: details[:hours],
          types: details[:types],
          user_ratings_total: details[:user_ratings_total]
        }
      else
        {
          name: venue[:name],
          address: venue[:address],
          rating: venue[:rating],
          price_level: GooglePlacesService.convert_price_level_to_string(venue[:price_level]),
          website: nil,
          hours: "Hours not available",
          types: venue[:types],
          user_ratings_total: venue[:user_ratings_total]
        }
      end
    end

    # Step 3: Send to OpenAI for personalization and ranking
    personalized_recommendations = personalize_venues_with_openai(detailed_venues, responses, activity_location, date_notes)

    if personalized_recommendations.nil? || personalized_recommendations.empty?
      Rails.logger.warn("⚠️ OpenAI personalization failed, falling back to original approach")
      return fetch_restaurant_recommendations_from_openai(responses, activity_location, date_notes, radius)
    end

    personalized_recommendations
  end

  def fetch_hybrid_bar_recommendations(responses, activity_location, date_notes, radius)
    Rails.logger.info("🔄 Starting hybrid bar recommendation approach...")

    # Extract bar/drink preferences from user responses
    bar_keywords = extract_bar_keywords(responses)
    Rails.logger.info("🍺 Extracted bar keywords: #{bar_keywords}")

    # Determine smart radius based on location type
    smart_radius = determine_smart_radius(activity_location, radius)
    Rails.logger.info("📍 Using smart radius: #{smart_radius} miles for #{activity_location}")

    # Step 1: Get real venues from Google Places
    radius_meters = smart_radius * 1609  # Convert miles to meters

    # Search with bar keyword if available
    search_keyword = bar_keywords.present? ? "#{bar_keywords.first} bar" : nil
    venues = GooglePlacesService.nearby_search(activity_location, "bar", radius_meters, 3.5, search_keyword)

    if venues.empty?
      Rails.logger.warn("⚠️ No bars found from Google Places, falling back to original approach")
      return fetch_bar_recommendations_from_openai(responses, activity_location, date_notes, radius)
    end

    Rails.logger.info("📍 Found #{venues.length} operational bars from Google Places")

    # Step 2: Get additional details for top venues
    detailed_venues = venues.first(20).map do |venue|
      details = GooglePlacesService.get_detailed_venue_info(venue[:place_id])
      if details
        {
          name: details[:name],
          address: details[:address],
          rating: details[:rating],
          price_level: GooglePlacesService.convert_price_level_to_string(details[:price_level]),
          website: details[:website],
          hours: details[:hours],
          types: details[:types],
          user_ratings_total: details[:user_ratings_total]
        }
      else
        {
          name: venue[:name],
          address: venue[:address],
          rating: venue[:rating],
          price_level: GooglePlacesService.convert_price_level_to_string(venue[:price_level]),
          website: nil,
          hours: "Hours not available",
          types: venue[:types],
          user_ratings_total: venue[:user_ratings_total]
        }
      end
    end

    # Step 3: Send to OpenAI for personalization and ranking
    personalized_recommendations = personalize_bars_with_openai(detailed_venues, responses, activity_location, date_notes)

    if personalized_recommendations.nil? || personalized_recommendations.empty?
      Rails.logger.warn("⚠️ OpenAI personalization failed, falling back to original approach")
      return fetch_bar_recommendations_from_openai(responses, activity_location, date_notes, radius)
    end

    personalized_recommendations
  end

  def personalize_venues_with_openai(venues, responses, activity_location, date_notes)
    Rails.logger.info("🤖 Personalizing #{venues.length} venues with OpenAI...")

    api_key = ENV["OPENAI_API_KEY"]
    if api_key.blank?
      Rails.logger.error("❌ OPENAI_API_KEY environment variable is missing!")
      return nil
    end

    client = OpenAI::Client.new(access_token: api_key)

    notes_text = if responses.is_a?(Array)
      responses
        .map { |r| r.is_a?(Hash) ? r["notes"].to_s.strip : r.to_s.strip }
        .reject(&:empty?)
        .join("\n\n")
    else
      responses.to_s.strip
    end

    # Format venue list for OpenAI
    venue_list = venues.map.with_index do |v, i|
      "#{i + 1}. #{v[:name]} (#{v[:price_level] || '$'}, Rating: #{v[:rating] || 'N/A'}/5 from #{v[:user_ratings_total] || 0} reviews) - #{v[:address]}"
    end.join("\n")

    prompt = <<~PROMPT
      You are an AI assistant that ranks and personalizes restaurant recommendations.

      The user's preferences are:
      #{notes_text}

      Planning details:
      - Location: #{activity_location}
      - Date/Time: #{date_notes}

      Here are REAL, OPERATIONAL restaurants from Google Places:
      #{venue_list}

      YOUR TASK:
      1. Select the 5 BEST restaurants from this list that match the user's preferences
      2. Rank them from best to worst match
      3. Write personalized descriptions explaining why each matches their needs

      IMPORTANT:
      - You MUST only select from the restaurants listed above
      - Use the EXACT names and addresses as provided
      - Prioritize dietary restrictions/preferences first
      - Consider price preferences second
      - Factor in ratings and review counts
      - Write warm, personalized reasons that directly reference their preferences

      Return exactly 5 restaurants as valid JSON:

      {
        "restaurants": [
          {
            "name": "Exact Restaurant Name from list",
            "price_range": "$ - $$$$",
            "description": "Brief description of cuisine and atmosphere",
            "reason": "Detailed explanation of why this specific restaurant matches their preferences, referencing their exact requirements and what makes this place special for them",
            "hours": "Copy hours from venue data or 'Hours not available'",
            "website": "Copy website from venue data or null",
            "address": "Exact address from list"
          }
        ]
      }
    PROMPT

    begin
      response = client.chat(
        parameters: {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an AI that ranks and personalizes restaurant recommendations. Output only valid JSON." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        }
      )

      raw_json = response.dig("choices", 0, "message", "content")

      if raw_json.blank?
        Rails.logger.error("❌ OpenAI returned empty content")
        return nil
      end

      parsed = JSON.parse(raw_json)
      recommendations = parsed.fetch("restaurants", [])

      # Enrich with actual venue data to ensure accuracy
      recommendations.map do |rec|
        venue = venues.find { |v| v[:name].downcase == rec["name"].downcase }
        if venue
          rec["hours"] = venue[:hours] || rec["hours"] || "Hours not available"
          rec["website"] = venue[:website] || rec["website"]
          rec["price_range"] = venue[:price_level] || rec["price_range"] || "$"
        end
        rec
      end

      Rails.logger.info("✅ Successfully personalized #{recommendations.length} recommendations")
      recommendations
    rescue JSON::ParserError => e
      Rails.logger.error("❌ JSON Parse Error: #{e.message}")
      nil
    rescue => e
      Rails.logger.error("💥 OpenAI Personalization Error: #{e.message}")
      nil
    end
  end

  def personalize_bars_with_openai(venues, responses, activity_location, date_notes)
    Rails.logger.info("🍺 Personalizing #{venues.length} bars with OpenAI...")

    api_key = ENV["OPENAI_API_KEY"]
    if api_key.blank?
      Rails.logger.error("❌ OPENAI_API_KEY environment variable is missing!")
      return nil
    end

    client = OpenAI::Client.new(access_token: api_key)

    notes_text = if responses.is_a?(Array)
      responses
        .map { |r| r.is_a?(Hash) ? r["notes"].to_s.strip : r.to_s.strip }
        .reject(&:empty?)
        .join("\n\n")
    else
      responses.to_s.strip
    end

    # Format venue list for OpenAI
    venue_list = venues.map.with_index do |v, i|
      "#{i + 1}. #{v[:name]} (#{v[:price_level] || '$'}, Rating: #{v[:rating] || 'N/A'}/5 from #{v[:user_ratings_total] || 0} reviews) - #{v[:address]}"
    end.join("\n")

    prompt = <<~PROMPT
      You are an AI assistant that ranks and personalizes bar/lounge recommendations.

      The user's preferences are:
      #{notes_text}

      Planning details:
      - Location: #{activity_location}
      - Date/Time: #{date_notes}

      Here are REAL, OPERATIONAL bars/lounges from Google Places:
      #{venue_list}

      YOUR TASK:
      1. Select the 5 BEST bars from this list that match the user's preferences
      2. Rank them from best to worst match
      3. Write personalized descriptions explaining why each matches their needs

      IMPORTANT:
      - You MUST only select from the bars listed above
      - Use the EXACT names and addresses as provided
      - Prioritize drink preferences (cocktails, beer, wine, non-alcoholic) first
      - Consider atmosphere preferences (dive bar, rooftop, live music, quiet)
      - Factor in ratings and review counts
      - Consider timing - late night preferences need bars with later hours
      - Write warm, personalized reasons that directly reference their preferences

      Return exactly 5 bars as valid JSON (use "restaurants" key for compatibility):

      {
        "restaurants": [
          {
            "name": "Exact Bar Name from list",
            "price_range": "$ - $$$$",
            "description": "Brief description of drink specialties and atmosphere",
            "reason": "Detailed explanation of why this specific bar matches their preferences, referencing their exact requirements, drink preferences, atmosphere needs, and what makes this place special for them",
            "hours": "Copy hours from venue data or 'Hours not available'",
            "website": "Copy website from venue data or null",
            "address": "Exact address from list"
          }
        ]
      }
    PROMPT

    begin
      response = client.chat(
        parameters: {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an AI that ranks and personalizes bar recommendations. Output only valid JSON." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        }
      )

      raw_json = response.dig("choices", 0, "message", "content")

      if raw_json.blank?
        Rails.logger.error("❌ OpenAI returned empty content")
        return nil
      end

      parsed = JSON.parse(raw_json)
      recommendations = parsed.fetch("restaurants", [])

      # Enrich with actual venue data to ensure accuracy
      recommendations.map do |rec|
        venue = venues.find { |v| v[:name].downcase == rec["name"].downcase }
        if venue
          rec["hours"] = venue[:hours] || rec["hours"] || "Hours not available"
          rec["website"] = venue[:website] || rec["website"]
          rec["price_range"] = venue[:price_level] || rec["price_range"] || "$"
        end
        rec
      end

      Rails.logger.info("✅ Successfully personalized #{recommendations.length} bar recommendations")
      recommendations
    rescue JSON::ParserError => e
      Rails.logger.error("❌ JSON Parse Error: #{e.message}")
      nil
    rescue => e
      Rails.logger.error("💥 OpenAI Bar Personalization Error: #{e.message}")
      nil
    end
  end

  def valid_session_token?(token)
    return false if token.blank?
    # Validate format: mobile-timestamp-random
    token.match?(/^mobile-\d+-[a-z0-9]+$/)
  end

  def format_recommendation(rec)
    {
      name: rec.name,
      description: rec.description,
      hours: rec.hours,
      reason: rec.reason,
      price_range: rec.price_range,
      address: rec.address,
      website: rec.website
    }
  end

  def extract_cuisine_keywords(responses)
    # Convert responses to text
    text = if responses.is_a?(Array)
      responses.map { |r| r.is_a?(Hash) ? r["notes"].to_s.downcase : r.to_s.downcase }.join(" ")
    else
      responses.to_s.downcase
    end

    # Common cuisine types to look for
    cuisines = [
      "mexican", "italian", "chinese", "japanese", "sushi", "thai", "indian", "korean", "vietnamese",
      "french", "spanish", "greek", "mediterranean", "middle eastern", "lebanese", "turkish",
      "american", "burger", "pizza", "bbq", "barbecue", "steakhouse", "seafood",
      "vegan", "vegetarian", "kosher", "halal", "gluten-free", "healthy",
      "ethiopian", "african", "caribbean", "cuban", "peruvian", "brazilian",
      "ramen", "tacos", "dim sum", "tapas", "brunch", "breakfast"
    ]

    # Find matching cuisines in the text
    found_cuisines = cuisines.select { |cuisine| text.include?(cuisine) }

    # Also check for specific food items that indicate cuisine
    if text.include?("taco") || text.include?("burrito") || text.include?("quesadilla")
      found_cuisines << "mexican" unless found_cuisines.include?("mexican")
    end
    if text.include?("pasta") || text.include?("risotto") || text.include?("tiramisu")
      found_cuisines << "italian" unless found_cuisines.include?("italian")
    end
    if text.include?("sushi") || text.include?("ramen") || text.include?("tempura")
      found_cuisines << "japanese" unless found_cuisines.include?("japanese")
    end

    found_cuisines.uniq
  end

  def extract_bar_keywords(responses)
    # Convert responses to text
    text = if responses.is_a?(Array)
      responses.map { |r| r.is_a?(Hash) ? r["notes"].to_s.downcase : r.to_s.downcase }.join(" ")
    else
      responses.to_s.downcase
    end

    # Bar/drink types to look for
    bar_types = [
      "cocktail", "craft cocktail", "whiskey", "wine", "beer", "craft beer", "brewery",
      "speakeasy", "dive bar", "sports bar", "rooftop", "lounge", "pub", "tiki",
      "karaoke", "live music", "jazz", "dance", "club", "nightclub"
    ]

    # Find matching bar types
    found_types = bar_types.select { |type| text.include?(type) }

    # Add specific modifiers
    if text.include?("margarita") || text.include?("tequila")
      found_types << "cocktail" unless found_types.include?("cocktail")
    end
    if text.include?("ipa") || text.include?("lager") || text.include?("stout")
      found_types << "craft beer" unless found_types.include?("craft beer")
    end

    found_types.uniq
  end

  def determine_smart_radius(location, provided_radius)
    # If radius was explicitly provided, use it
    return provided_radius if provided_radius.present?

    # Default to 3 miles for all urban areas (our primary market)
    # This is appropriate for dense cities where users expect nearby options
    3
  end
end
