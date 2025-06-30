require "openai"
require "net/http"
require "uri"

class OpenaiController < ApplicationController
  skip_before_action :authorized, only: [
    :restaurant_recommendations,
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
                "#{generate_cache_key(user_responses, activity_location, date_notes)}"

    recommendations = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
      fetch_recommendations_from_openai(user_responses, activity_location, date_notes, radius)
    end

    if recommendations.present?
      render json: { recommendations: recommendations }, status: :ok
    else
      render json: { error: "Failed to generate recommendations" }, status: :unprocessable_entity
    end
  end

  def try_voxxy_recommendations
    session_token = request.headers["X-Session-Token"] || params[:session_token]

    if session_token.blank?
      return render json: { error: "Missing session token" }, status: :unauthorized
    end

    rate_key  = "try_voxxy_rate:#{session_token}"
    cache_key = "try_voxxy_last:#{session_token}"

    if Rails.cache.exist?(rate_key)
      if (last = Rails.cache.read(cache_key))
        return render json: { recommendations: last }, status: :ok
      else
        minutes_left = ((Rails.cache.read(rate_key) - Time.current) / 60.0).ceil
        return render json: { error: "Rate limit exceeded. Try again in #{minutes_left} minute(s)." }, status: :too_many_requests
      end
    end

    Rails.cache.write(rate_key, Time.current + 1.hour, expires_in: 1.hour)

    user_responses    = params[:responses]
    activity_location = params[:activity_location]
    date_notes        = params[:date_notes]
    radius = 10

    if user_responses.blank? || activity_location.blank? || date_notes.blank?
      return render json: { error: "Missing required parameters" }, status: :unprocessable_entity
    end

    recs = fetch_recommendations_from_openai(user_responses, activity_location, date_notes, radius)

    if recs
      Rails.cache.write(cache_key, recs, expires_in: 1.hour)
      render json: { recommendations: recs }, status: :ok
    else
      render json: { error: "Failed to generate recommendations" }, status: :unprocessable_entity
    end
  end

  def try_voxxy_cached
    session_token = request.headers["X-Session-Token"] || params[:session_token]

    if session_token.blank?
      return render json: { error: "Missing session token" }, status: :unauthorized
    end

    cache_key = "try_voxxy_last:#{session_token}"
    if (cached = Rails.cache.read(cache_key))
      render json: { recommendations: cached }, status: :ok
    else
      render json: { recommendations: [] }, status: :ok
    end
  end

  private

  def fetch_recommendations_from_openai(responses, activity_location, date_notes, radius)
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
      parsed         = JSON.parse(raw_json)
      recommendations = parsed.fetch("restaurants", [])
      enrich_recommendations(recommendations)
    rescue JSON::ParserError
      nil
    end
  end

  def enrich_recommendations(recommendations)
    recommendations.map { |rec| enrich_recommendation(rec) }
  end

  def enrich_recommendation(rec)
    query = CGI.escape("#{rec['name']} #{rec['address']}")
    find_place_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=#{query}&inputtype=textquery&fields=place_id&key=#{ENV['PLACES_KEY']}"

    begin
      find_place_response = Net::HTTP.get_response(URI(find_place_url))
      find_place_data = JSON.parse(find_place_response.body)

      if find_place_data["candidates"] && find_place_data["candidates"].any?
        place_id = find_place_data["candidates"].first["place_id"]

        details_url = "https://maps.googleapis.com/maps/api/place/details/json?place_id=#{place_id}&fields=photos,reviews&key=#{ENV['PLACES_KEY']}"
        details_response = Net::HTTP.get_response(URI(details_url))
        details_data = JSON.parse(details_response.body)

        if details_data["result"]
          rec["photos"] = details_data["result"]["photos"] || []
          rec["reviews"] = details_data["result"]["reviews"] || []
        end
      end
    rescue StandardError => e
      Rails.logger.error "Error enriching recommendation #{rec['name']}: #{e.message}"
    end

    rec
  end

  def generate_cache_key(user_responses, activity_location, date_notes)
    hash_input = "#{user_responses}-#{activity_location}-#{date_notes}"
    "recommendations_#{Digest::SHA256.hexdigest(hash_input)}"
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
end
