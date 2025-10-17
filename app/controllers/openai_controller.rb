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

  # Ensure API keys are configured
  before_action :ensure_api_keys_configured

  # Cache configuration
  CACHE_DURATION = Rails.env.production? ? 2.hours : 1.hour
  RATE_LIMIT_DURATION = Rails.env.production? ? 1.hour : 30.minutes
  MAX_CACHE_SIZE = 1000 # Maximum number of cached recommendations

  def restaurant_recommendations
    user_responses     = params[:responses]
    activity_location  = params[:activity_location]
    date_notes         = params[:date_notes]
    activity_id        = params[:activity_id]
    radius             = params[:radius]&.to_f || 0.5

    # Validate required parameters
    if activity_location.blank?
      render json: { error: "Missing required parameter: activity_location" }, status: :unprocessable_entity and return
    end

    # Validate radius
    if radius < 0.5 || radius > 50
      render json: { error: "Invalid radius. Must be between 0.5 and 50 miles" }, status: :unprocessable_entity and return
    end

    # Build complete input by combining explicit responses + profile preferences
    combined_responses = build_combined_responses(activity_id, user_responses)

    # If no responses at all (explicit or from profiles), return error
    if combined_responses.blank?
      render json: { error: "No preferences available. Please submit responses or add profile preferences." }, status: :unprocessable_entity and return
    end

    user_id  = current_user.id
    cache_key = "user_#{user_id}_" \
                "activity_#{activity_id}_" \
                "#{generate_cache_key(combined_responses, activity_location, date_notes, 'restaurant')}"

    recommendations = Rails.cache.fetch(cache_key, expires_in: CACHE_DURATION) do
      # Use hybrid approach by default
      fetch_hybrid_restaurant_recommendations(combined_responses, activity_location, date_notes, radius)
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
    radius             = params[:radius]&.to_f || 0.5

    # Validate required parameters
    if activity_location.blank?
      render json: { error: "Missing required parameter: activity_location" }, status: :unprocessable_entity and return
    end

    # Validate radius
    if radius < 0.5 || radius > 50
      render json: { error: "Invalid radius. Must be between 0.5 and 50 miles" }, status: :unprocessable_entity and return
    end

    # Build complete input by combining explicit responses + profile preferences
    combined_responses = build_combined_responses(activity_id, user_responses)

    # If no responses at all (explicit or from profiles), return error
    if combined_responses.blank?
      render json: { error: "No preferences available. Please submit responses or add profile preferences." }, status: :unprocessable_entity and return
    end

    user_id  = current_user.id
    cache_key = "user_#{user_id}_" \
                "activity_#{activity_id}_" \
                "#{generate_cache_key(combined_responses, activity_location, date_notes, 'bar')}"

    recommendations = Rails.cache.fetch(cache_key, expires_in: CACHE_DURATION) do
      # Use hybrid approach by default
      fetch_hybrid_bar_recommendations(combined_responses, activity_location, date_notes, radius)
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

    # Build complete input by combining explicit responses + profile preferences
    combined_responses = build_combined_responses(activity_id, user_responses)

    # If no responses at all (explicit or from profiles), return error
    if combined_responses.blank?
      render json: { error: "No preferences available. Please submit responses or add profile preferences." }, status: :unprocessable_entity and return
    end

    user_id  = current_user.id
    cache_key = "user_#{user_id}_" \
                "activity_#{activity_id}_" \
                "#{generate_cache_key(combined_responses, activity_location, date_notes, 'game')}"

    recommendations = Rails.cache.fetch(cache_key, expires_in: CACHE_DURATION) do
      fetch_game_recommendations_from_openai(combined_responses, activity_location, date_notes)
    end

    if recommendations.present?
      render json: { recommendations: recommendations }, status: :ok
    else
      render json: { error: "Failed to generate game recommendations" }, status: :unprocessable_entity
    end
  end

  def try_voxxy_recommendations
    session_token = request.headers["X-Session-Token"] || params[:session_token]

    # Validate session token format
    if session_token.blank? || !valid_session_token?(session_token)
      return render json: { error: "Invalid or missing session token" }, status: :unauthorized
    end

    # Include session token in cache keys to prevent collisions
    rate_key  = "try_voxxy_rate:#{session_token}"
    cache_key = "try_voxxy_cache:#{session_token}:#{generate_request_hash(params)}"

    begin
      # Use atomic operations to prevent race conditions
      cached_recommendations = Rails.cache.read(cache_key)

      if cached_recommendations.present?
        return render json: { recommendations: cached_recommendations }, status: :ok
      end

      # Check rate limiting with atomic operation
      rate_limit_time = Rails.cache.read(rate_key)

      if rate_limit_time && Time.current < rate_limit_time
        minutes_left = ((rate_limit_time - Time.current) / 60.0).ceil

        # Try to return last cached result for this session
        last_cache_key = "try_voxxy_last:#{session_token}"
        last_recommendations = Rails.cache.read(last_cache_key)

        if last_recommendations.present?
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

      Rails.cache.write(rate_key, Time.current + RATE_LIMIT_DURATION, expires_in: RATE_LIMIT_DURATION)

      # Get and validate parameters
      user_responses    = params[:responses]
      activity_location = params[:activity_location]
      date_notes        = params[:date_notes]
      radius = params[:radius]&.to_f || 0.5

      if user_responses.blank? || activity_location.blank? || date_notes.blank?
        return render json: { error: "Missing required parameters: responses, activity_location, and date_notes" }, status: :unprocessable_entity
      end

      # Validate radius
      if radius < 0.5 || radius > 50
        return render json: { error: "Invalid radius. Must be between 0.5 and 50 miles" }, status: :unprocessable_entity
      end

      recs = fetch_hybrid_restaurant_recommendations(user_responses, activity_location, date_notes, radius)

      if recs && recs.is_a?(Array) && !recs.empty?

        # Cache with both specific and last-used keys
        Rails.cache.write(cache_key, recs, expires_in: CACHE_DURATION)
        Rails.cache.write("try_voxxy_last:#{session_token}", recs, expires_in: CACHE_DURATION)

        render json: { recommendations: recs }, status: :ok
      else
        # Clear rate limit on failure to allow retry
        Rails.cache.delete(rate_key)

        render json: {
          error: "Failed to generate recommendations. Please try again.",
          should_retry: true
        }, status: :unprocessable_entity
      end

    rescue JSON::ParserError => e
      Rails.cache.delete(rate_key) # Allow retry on JSON errors
      render json: {
        error: "Failed to process recommendations. Please try again.",
        should_retry: true
      }, status: :unprocessable_entity
    rescue => e
      Rails.logger.error("Exception in try_voxxy_recommendations: #{e.class.name}: #{e.message}") if Rails.env.development?

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

    render json: {
      recommendations: cached || [],
      has_cached: cached.present?
    }, status: :ok
  end

  private

  def build_combined_responses(activity_id, explicit_responses)
    return explicit_responses if activity_id.blank?

    begin
      activity = Activity.find(activity_id)
    rescue ActiveRecord::RecordNotFound
      # If activity not found, just use explicit responses
      return explicit_responses
    end

    # Get all participants (host + accepted participants)
    all_participants = [ activity.user ] + activity.participants.to_a

    # Build complete input
    all_inputs = []

    # Add explicit responses if present
    all_inputs << explicit_responses if explicit_responses.present?

    # If explicit responses were provided, we already have the latest data
    # So we don't need to check the database for those users
    if explicit_responses.present?
      # For users without explicit responses in this request, check DB responses and profile preferences
      all_participants.each do |participant|
        # For solo activities, if explicit response was provided, skip DB lookup
        next if activity.is_solo && explicit_responses.present?

        # Check if they have a response in the database
        db_response = activity.responses.find_by(user_id: participant.id)
        if db_response&.notes.present?
          all_inputs << db_response.notes
        else
          # No DB response, check profile preferences
          profile_input = build_profile_input(participant)
          all_inputs << profile_input if profile_input.present?
        end
      end
    else
      # No explicit responses provided, use DB responses and fall back to profiles
      all_participants.each do |participant|
        db_response = activity.responses.find_by(user_id: participant.id)
        if db_response&.notes.present?
          all_inputs << db_response.notes
        else
          # No DB response, check profile preferences
          profile_input = build_profile_input(participant)
          all_inputs << profile_input if profile_input.present?
        end
      end
    end

    # Return combined input
    return nil if all_inputs.empty?
    all_inputs.join("\n\n")
  end

  def build_profile_input(user)
    parts = []

    # Add favorite food if present
    parts << "Favorite food: #{user.favorite_food}" if user.favorite_food.present?

    # Add general preferences if present
    parts << "Preferences: #{user.preferences}" if user.preferences.present?

    # Return nil if no profile data
    return nil if parts.empty?

    # Format: "Name's profile: favorite_food, preferences"
    "#{user.name}'s profile: #{parts.join(', ')}"
  end

  def ensure_api_keys_configured
    begin
      ENV.fetch("OPENAI_API_KEY")
    rescue KeyError
      render json: {
        error: "Service temporarily unavailable. OpenAI API key not configured.",
        should_retry: false
      }, status: :service_unavailable
      return false
    end

    begin
      ENV.fetch("PLACES_KEY")
    rescue KeyError
      render json: {
        error: "Service temporarily unavailable. Google Places API key not configured.",
        should_retry: false
      }, status: :service_unavailable
      return false
    end

    true
  end

  def fetch_restaurant_recommendations_from_openai(responses, activity_location, date_notes, radius)
    # Check for API key
    api_key = ENV.fetch("OPENAI_API_KEY")
    if api_key.blank?
      Rails.logger.error("OPENAI_API_KEY environment variable is missing!") if Rails.env.development?
      return nil
    end

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

    rescue => e
      Rails.logger.error("Error initializing OpenAI client: #{e.message}") if Rails.env.development?
      return nil
    end

    prompt = <<~PROMPT
      You are an AI assistant that provides restaurant recommendations based on:
        • user dietary & other preferences
        • a central location (#{activity_location})
        • a date (#{date_notes})
        • and a VERY STRICT radius of ONLY #{radius} mile#{ radius == 1 ? "" : "s" } (walking distance).

      The user's preferences (exactly as they typed them) are:
      #{notes_text}

      IMPORTANT:
      1. **PRIORITIZE dietary preferences** (e.g., allergies, vegan, gluten-free) above all else.#{'  '}
        If they say "Vegan please!" or "No shellfish," those conditions must drive your picks.
      2. If MULTIPLE cuisines are listed (e.g., "Italian, Japanese, Mexican"), provide VARIETY across ALL mentioned cuisines - don't just pick 5 from one cuisine type.
      3. Next, honor budget constraints ("Prefer upscale," etc.).
      4. Then consider ambiance ("Rooftop," "Cozy," etc.)—but only after dietary & budget are satisfied.
      5. **CRITICAL**: Only include restaurants located *within #{radius} mile#{ radius == 1 ? "" : "s" }* (roughly #{(radius * 10).round} minute walk) of "#{activity_location}".#{'  '}
        This is WALKING DISTANCE ONLY. Do NOT list any restaurant that is more than #{radius} mile#{ radius == 1 ? "" : "s" } away.
      6. Keep the tone warm and human — avoid calling people "users" or referencing individual budgets.
      7. Avoid large chains or obvious tourist spots—seek out hole-in-the-wall or buzz-worthy places.

      Return exactly **5** restaurants that match these criteria. Output must be valid JSON (no extra commentary, no markdown fences) in this structure:

      {
        "restaurants": [
          {
            "name":        "Restaurant Name",
            "price_range": "$ - $$$$",
            "description": "Short description (cuisine + atmosphere).",
            "reason":      "Provide 3-6 keyword tags (comma-separated) that capture why this matches their preferences. Include dietary matches (e.g., 'Vegan', 'Gluten-Free'), budget level (e.g., 'Budget-Friendly', 'Upscale'), atmosphere (e.g., 'Trendy', 'Romantic', 'Casual'), cuisine type (e.g., 'Italian', 'Mexican'), and any special features (e.g., 'Rooftop', 'Live Music', 'Late Night'). Format as: 'Vegan, Budget-Friendly, Trendy, Italian'",
            "hours":       "Hours of operation (e.g., Mon-Fri: 9 AM - 10 PM, Sat-Sun: 8 AM - 11 PM)",
            "website":     "Valid website link or null if unknown",
            "address":     "Full address or 'Not available'"
          }
        ]
      }
    PROMPT

    begin
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

      if raw_json.blank?
        Rails.logger.error("OpenAI returned empty content") if Rails.env.development?
        return nil
      end

      begin
        parsed = JSON.parse(raw_json)
        recommendations = parsed.fetch("restaurants", [])
        recommendations
      rescue JSON::ParserError => e
        Rails.logger.error("JSON Parse Error: #{e.message}") if Rails.env.development?
        nil
      end

    rescue => e
      Rails.logger.error("OpenAI API Error: #{e.class.name}: #{e.message}") if Rails.env.development?
      nil
    end
  end

  def fetch_bar_recommendations_from_openai(responses, activity_location, date_notes, radius)
    client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY"))

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
        • and a VERY STRICT radius of ONLY #{radius} mile#{ radius == 1 ? "" : "s" } (walking distance).

      The user's preferences (exactly as they typed them) are:
      #{notes_text}

      IMPORTANT:
      1. **PRIORITIZE drink preferences** (e.g., cocktails, beer, wine, non-alcoholic options) above all else.#{'  '}
        If they say "craft cocktails only" or "need non-alcoholic options," those must drive your picks.
      2. Next, honor budget constraints ("budget-friendly," "prefer upscale," etc.).
      3. Then consider atmosphere preferences ("dive bar," "rooftop," "live music," "quiet conversation," etc.).
      4. Consider timing - for late night activities, prioritize bars with later hours.
      5. **CRITICAL**: Only include bars/lounges located *within #{radius} mile#{ radius == 1 ? "" : "s" }* (roughly #{(radius * 10).round} minute walk) of "#{activity_location}".#{'  '}
        This is WALKING DISTANCE ONLY. Do NOT list any establishment that is more than #{radius} mile#{ radius == 1 ? "" : "s" } away.
      6. Keep the tone warm and human — avoid calling people "users" or referencing individual budgets.
      7. Avoid large chains or obvious tourist spots—seek out local gems, craft cocktail lounges, or unique nightlife spots.

      Return exactly **5** bars/lounges that match these criteria. Output must be valid JSON (no extra commentary, no markdown fences) in this structure:

      {
        "restaurants": [
          {
            "name":        "Bar/Lounge Name",
            "price_range": "$ - $$$$",
            "description": "Short description (drink specialties + atmosphere).",
            "reason":      "Provide 3-6 keyword tags (comma-separated) that capture why this matches their preferences. Include drink specialties (e.g., 'Craft Cocktails', 'Wine Bar', 'Beer Selection'), budget level (e.g., 'Budget-Friendly', 'Upscale'), atmosphere (e.g., 'Dive Bar', 'Rooftop', 'Speakeasy', 'Live Music'), and any special features (e.g., 'Happy Hour', 'Late Night', 'Patio'). Format as: 'Craft Cocktails, Upscale, Rooftop, Late Night'",
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
    client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY"))

    notes_text = if responses.is_a?(Array)
      responses
        .map { |r| r.is_a?(Hash) ? r["notes"].to_s.strip : r.to_s.strip }
        .reject(&:empty?)
        .join("\n\n")
    else
      responses.to_s.strip
    end


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
            "reason": "3-6 keyword tags (comma-separated) like: '2-4 Players, Strategy, Easy to Learn, Family-Friendly'",
            "hours": "30-45 minutes",
            "website": "https://boardgamegeek.com/boardgame/example or null",
            "address": "2-4 players"
          }
        ]
      }

      CRITICAL: Use "restaurants" as the JSON key, NOT "games".
    PROMPT


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

      parsed = JSON.parse(raw_json)
      recommendations = parsed.fetch("restaurants", [])
      recommendations
    rescue JSON::ParserError => e
      Rails.logger.error("Game recommendations - JSON Parse Error: #{e.message}") if Rails.env.development?
      nil
    rescue => e
      Rails.logger.error("Game recommendations - OpenAI API Error: #{e.message}") if Rails.env.development?
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
    # Extract cuisine preferences from user responses
    cuisine_keywords = extract_cuisine_keywords(responses)

    # Determine smart radius based on location type
    smart_radius = determine_smart_radius(activity_location, radius)

    # Step 1: Get real venues from Google Places
    radius_meters = smart_radius * 1609  # Convert miles to meters

    Rails.logger.info "[RECOMMENDATIONS] Location: #{activity_location}, Smart Radius: #{smart_radius} miles (#{radius_meters}m)"

    # Don't filter by cuisine in Google Places - let OpenAI handle ALL preferences
    # This ensures we get diverse results that match ALL selected cuisines
    venues = GooglePlacesService.nearby_search(activity_location, "restaurant", radius_meters, 3.5, nil)

    Rails.logger.info "[RECOMMENDATIONS] Google Places returned #{venues.size} venues"

    if venues.empty?
      Rails.logger.warn "[RECOMMENDATIONS] No venues from Google Places - falling back to OpenAI only"
      return fetch_restaurant_recommendations_from_openai(responses, activity_location, date_notes, radius)
    end

    # Step 2: Get additional details for top venues using PARALLEL requests
    # Increase to 30 venues to ensure diversity for multi-cuisine preferences
    top_venues = venues.first(30)

    Rails.logger.info "[RECOMMENDATIONS] Fetching details for #{top_venues.size} venues in parallel..."
    start_time = Time.current

    # Create a thread pool with 10 concurrent threads (safe limit for external API calls)
    executor = Concurrent::FixedThreadPool.new(10)

    # Create a promise for each venue detail fetch
    promises = top_venues.map do |venue|
      Concurrent::Promise.execute(executor: executor) do
        begin
          GooglePlacesService.get_detailed_venue_info(venue[:place_id])
        rescue => e
          Rails.logger.error "[RECOMMENDATIONS] Error fetching details for #{venue[:name]}: #{e.message}" if Rails.env.development?
          nil
        end
      end
    end

    # Wait for all promises to complete and build detailed venues array
    detailed_venues = promises.map.with_index do |promise, idx|
      venue = top_venues[idx]
      details = promise.value  # This blocks until the promise completes

      if details
        {
          name: details[:name],
          address: details[:address],  # This will always be formatted_address from details API
          rating: details[:rating],
          price_level: GooglePlacesService.convert_price_level_to_string(details[:price_level]),
          website: details[:website],
          hours: details[:hours],
          types: details[:types],
          user_ratings_total: details[:user_ratings_total]
        }
      else
        # Fallback: Use basic venue data if details API fails
        {
          name: venue[:name],
          address: venue[:address] || "Address not available",
          rating: venue[:rating],
          price_level: GooglePlacesService.convert_price_level_to_string(venue[:price_level]),
          website: nil,
          hours: "Hours not available",
          types: venue[:types],
          user_ratings_total: venue[:user_ratings_total]
        }
      end
    end

    # Shutdown the executor
    executor.shutdown
    executor.wait_for_termination(30)  # Wait up to 30 seconds for any remaining tasks

    elapsed_time = (Time.current - start_time).round(2)
    Rails.logger.info "[RECOMMENDATIONS] Fetched #{detailed_venues.size} venue details in #{elapsed_time}s (parallel)"

    # Step 3: Send to OpenAI for personalization and ranking
    personalized_recommendations = personalize_venues_with_openai(detailed_venues, responses, activity_location, date_notes)

    if personalized_recommendations.nil? || personalized_recommendations.empty?
      return fetch_restaurant_recommendations_from_openai(responses, activity_location, date_notes, radius)
    end

    personalized_recommendations
  end

  def fetch_hybrid_bar_recommendations(responses, activity_location, date_notes, radius)
    # Extract bar/drink preferences from user responses
    bar_keywords = extract_bar_keywords(responses)

    # Determine smart radius based on location type
    smart_radius = determine_smart_radius(activity_location, radius)

    # Step 1: Get real venues from Google Places
    radius_meters = smart_radius * 1609  # Convert miles to meters

    Rails.logger.info "[RECOMMENDATIONS] Location: #{activity_location}, Smart Radius: #{smart_radius} miles (#{radius_meters}m)"

    # Don't filter by specific bar type - let OpenAI handle ALL preferences
    venues = GooglePlacesService.nearby_search(activity_location, "bar", radius_meters, 3.5, nil)

    Rails.logger.info "[RECOMMENDATIONS] Google Places returned #{venues.size} venues"

    if venues.empty?
      Rails.logger.warn "[RECOMMENDATIONS] No venues from Google Places - falling back to OpenAI only"
      return fetch_bar_recommendations_from_openai(responses, activity_location, date_notes, radius)
    end

    # Step 2: Get additional details for top venues using PARALLEL requests
    # Increase to 30 venues to ensure diversity
    top_venues = venues.first(30)

    Rails.logger.info "[RECOMMENDATIONS] Fetching details for #{top_venues.size} bar venues in parallel..."
    start_time = Time.current

    # Create a thread pool with 10 concurrent threads (safe limit for external API calls)
    executor = Concurrent::FixedThreadPool.new(10)

    # Create a promise for each venue detail fetch
    promises = top_venues.map do |venue|
      Concurrent::Promise.execute(executor: executor) do
        begin
          GooglePlacesService.get_detailed_venue_info(venue[:place_id])
        rescue => e
          Rails.logger.error "[RECOMMENDATIONS] Error fetching bar details for #{venue[:name]}: #{e.message}" if Rails.env.development?
          nil
        end
      end
    end

    # Wait for all promises to complete and build detailed venues array
    detailed_venues = promises.map.with_index do |promise, idx|
      venue = top_venues[idx]
      details = promise.value  # This blocks until the promise completes

      if details
        {
          name: details[:name],
          address: details[:address],  # This will always be formatted_address from details API
          rating: details[:rating],
          price_level: GooglePlacesService.convert_price_level_to_string(details[:price_level]),
          website: details[:website],
          hours: details[:hours],
          types: details[:types],
          user_ratings_total: details[:user_ratings_total]
        }
      else
        # Fallback: Use basic venue data if details API fails
        {
          name: venue[:name],
          address: venue[:address] || "Address not available",
          rating: venue[:rating],
          price_level: GooglePlacesService.convert_price_level_to_string(venue[:price_level]),
          website: nil,
          hours: "Hours not available",
          types: venue[:types],
          user_ratings_total: venue[:user_ratings_total]
        }
      end
    end

    # Shutdown the executor
    executor.shutdown
    executor.wait_for_termination(30)  # Wait up to 30 seconds for any remaining tasks

    elapsed_time = (Time.current - start_time).round(2)
    Rails.logger.info "[RECOMMENDATIONS] Fetched #{detailed_venues.size} bar venue details in #{elapsed_time}s (parallel)"

    # Step 3: Send to OpenAI for personalization and ranking
    personalized_recommendations = personalize_bars_with_openai(detailed_venues, responses, activity_location, date_notes)

    if personalized_recommendations.nil? || personalized_recommendations.empty?
      return fetch_bar_recommendations_from_openai(responses, activity_location, date_notes, radius)
    end

    personalized_recommendations
  end

  def personalize_venues_with_openai(venues, responses, activity_location, date_notes)
    api_key = ENV.fetch("OPENAI_API_KEY")
    if api_key.blank?
      Rails.logger.error("OPENAI_API_KEY environment variable is missing!") if Rails.env.development?
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
      2. IMPORTANT: If multiple cuisines are mentioned (e.g., "French, American, Thai"), ensure your 5 selections include variety across ALL mentioned cuisines, not just one
      3. Rank them by how well they match ALL stated preferences
      4. Generate keyword tags that explain the match

      CRITICAL REQUIREMENTS:
      - You MUST only select from the restaurants listed above
      - Use the EXACT names and addresses as provided
      - If user selected multiple cuisines, provide variety (don't pick 5 of the same cuisine)
      - Prioritize dietary restrictions/preferences first
      - Consider ALL cuisine preferences equally (not just the first one mentioned)
      - Consider price preferences second
      - Factor in ratings and review counts
      - Generate concise keyword tags that capture why each venue matches

      Return exactly 5 restaurants as valid JSON:

      {
        "restaurants": [
          {
            "name": "Exact Restaurant Name from list",
            "price_range": "$ - $$$$",
            "description": "Brief description of cuisine and atmosphere",
            "reason": "3-6 keyword tags (comma-separated) like: 'Vegan, Budget-Friendly, Trendy, Italian, Outdoor Seating'",
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
        Rails.logger.error("OpenAI returned empty content") if Rails.env.development?
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

      recommendations
    rescue JSON::ParserError => e
      Rails.logger.error("JSON Parse Error: #{e.message}") if Rails.env.development?
      nil
    rescue => e
      Rails.logger.error("OpenAI Personalization Error: #{e.message}") if Rails.env.development?
      nil
    end
  end

  def personalize_bars_with_openai(venues, responses, activity_location, date_notes)
    api_key = ENV.fetch("OPENAI_API_KEY")
    if api_key.blank?
      Rails.logger.error("OPENAI_API_KEY environment variable is missing!") if Rails.env.development?
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
      3. Generate keyword tags that explain the match

      IMPORTANT:
      - You MUST only select from the bars listed above
      - Use the EXACT names and addresses as provided
      - Prioritize drink preferences (cocktails, beer, wine, non-alcoholic) first
      - Consider atmosphere preferences (dive bar, rooftop, live music, quiet)
      - Factor in ratings and review counts
      - Consider timing - late night preferences need bars with later hours
      - Generate concise keyword tags that capture why each venue matches

      Return exactly 5 bars as valid JSON (use "restaurants" key for compatibility):

      {
        "restaurants": [
          {
            "name": "Exact Bar Name from list",
            "price_range": "$ - $$$$",
            "description": "Brief description of drink specialties and atmosphere",
            "reason": "3-6 keyword tags (comma-separated) like: 'Craft Cocktails, Upscale, Rooftop, Late Night'",
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
        Rails.logger.error("OpenAI returned empty content") if Rails.env.development?
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

      recommendations
    rescue JSON::ParserError => e
      Rails.logger.error("JSON Parse Error: #{e.message}") if Rails.env.development?
      nil
    rescue => e
      Rails.logger.error("OpenAI Bar Personalization Error: #{e.message}") if Rails.env.development?
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

    # Check if location is GPS coordinates (lat, lng format)
    # Format: "40.123456, -74.123456"
    if location.match?(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)
      # GPS coordinates: use 1 mile radius to account for edge-of-neighborhood locations
      return 1.0
    end

    # Named location (neighborhood/city): use tighter 0.5 mile radius
    # Named locations are already centered in dense areas
    0.5
  end
end
