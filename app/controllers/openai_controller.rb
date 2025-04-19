require "openai"
require "net/http"
require "uri"

class OpenaiController < ApplicationController
  skip_before_action :authorized, only: [
    :generate_haiku,
    :restaurant_recommendations,     # spelling fixed
    :check_cached_recommendations,   # spelling fixed
    :trending_recommendations,       # if you want this public too
    :try_voxxy_recommendations,
    :try_voxxy_cached
  ]

  def generate_haiku
    Rails.logger.debug "OPENAI_API_KEY: #{ENV['OPENAI_API_KEY']}"

    client = OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"])

    begin
      response = client.chat(
        parameters: {
          model: "gpt-4",
          messages: [
            { role: "user", content: params[:prompt] }
          ]
        }
      )
      render json: { haiku: response.dig("choices", 0, "message", "content") }
    rescue Faraday::TooManyRequestsError => e
      Rails.logger.error "Too many requests: #{e.message}"
      sleep(1)
      retry
    end
  end

  def restaurant_recommendations
    user_responses = params[:responses]
    activity_location = params[:activity_location]
    date_notes = params[:date_notes]

    if user_responses.blank?
      render json: { error: "No responses provided" }, status: :unprocessable_entity
      return
    end

    cache_key = generate_cache_key(user_responses, activity_location, date_notes)

    recommendations = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
      fetch_recommendations_from_openai(user_responses, activity_location, date_notes)
    end

    if recommendations.present?
      render json: { recommendations: recommendations }, status: :ok
    else
      render json: { error: "Failed to generate recommendations" }, status: :unprocessable_entity
    end
  end

  def check_cached_recommendations
    activity = Activity.find_by(id: params[:activity_id])
    return render json: { error: "Activity not found" }, status: :not_found unless activity

    cache_key = generate_cache_key(activity.responses.map(&:notes).join("\n\n"), activity.activity_location, activity.date_notes)
    recommendations = Rails.cache.read(cache_key)

    if recommendations.present?
      render json: { recommendations: recommendations }
    else
      render json: { recommendations: [] }, status: :ok
    end
  end

  def trending_recommendations
    activity_location = params[:activity_location]
    date_notes = params[:date_notes]

    if activity_location.blank? || date_notes.blank?
      render json: { error: "Missing required details" }, status: :unprocessable_entity
      return
    end

    cache_key = "trending_recommendations_#{Digest::SHA256.hexdigest("#{activity_location}-#{date_notes}")}"

    recommendations = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
      fetch_trending_recommendations_from_openai(activity_location, date_notes)
    end

    if recommendations.present?
      render json: { recommendations: recommendations }, status: :ok
    else
      render json: { error: "Failed to generate trending recommendations" }, status: :unprocessable_entity
    end
  end

  def try_voxxy_recommendations
    ip       = request.remote_ip
    rate_key = "try_voxxy_rate:#{ip}"
    cache_key = "try_voxxy_last:#{ip}"

    # Rate-limit: if already posted within the last hour, re-serve or throttle
    if Rails.cache.exist?(rate_key)
      if (last = Rails.cache.read(cache_key))
        return render json: { recommendations: last }, status: :ok
      else
        minutes_left = ((Rails.cache.read(rate_key) - Time.current) / 60.0).ceil
        return render json: { error: "Rate limit exceeded. Try again in #{minutes_left} minute(s)." }, status: :too_many_requests
      end
    end

    # First POST in this hour: set rate-limit key
    Rails.cache.write(rate_key, Time.current + 1.hour, expires_in: 1.hour)

    # Validate inputs
    user_responses    = params[:responses]
    activity_location = params[:activity_location]
    date_notes        = params[:date_notes]

    if user_responses.blank? || activity_location.blank? || date_notes.blank?
      return render json: { error: "Missing required parameters" }, status: :unprocessable_entity
    end

    # Fetch from OpenAI
    recs = fetch_recommendations_from_openai(user_responses, activity_location, date_notes)

    if recs
      Rails.cache.write(cache_key, recs, expires_in: 1.hour)
      render json: { recommendations: recs }, status: :ok
    else
      render json: { error: "Failed to generate recommendations" }, status: :unprocessable_entity
    end
  end

    def try_voxxy_cached
      ip        = request.remote_ip
      cache_key = "try_voxxy_last:#{ip}"
      recs = Rails.cache.read(cache_key)

      if recs.present?
        render json: { recommendations: recs }, status: :ok
      else
        render json: { error: "No cached recommendations" }, status: :not_found
      end
    end

  private

  def fetch_trending_recommendations_from_openai(activity_location, date_notes)
    client = OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"])
    prompt = <<~PROMPT
      You are an AI assistant that provides restaurant recommendations based solely on location and timing.
      The event is taking place in #{activity_location}, planned for #{date_notes}.
      Recommend 5 trending or popular restaurants in the area.
      Provide each recommendation in **valid JSON format** using the following structure:

      {
        "restaurants": [
          {
            "name": "Restaurant Name",
            "price_range": "$ - $$$$",
            "description": "Short description of the restaurant, including cuisine type and atmosphere.",
            "reason": "Explain why this restaurant is trending or popular in this area.",
            "hours": "Hours of operation (e.g., Mon-Fri: 9 AM - 10 PM, Sat-Sun: 8 AM - 11 PM)",
            "website": "Valid website link or null if unknown",
            "address": "Restaurant address or 'Not available'"
          }
        ]
      }
      - The response must be valid JSON.
    PROMPT

    response = client.chat(
      parameters: {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI assistant that provides structured restaurant recommendations in JSON format." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      }
    )

    recommendations_json = response.dig("choices", 0, "message", "content")

    begin
      recommendations = JSON.parse(recommendations_json)["restaurants"]
      enrich_recommendations(recommendations)
    rescue JSON::ParserError
      nil
    end
  end

  def fetch_recommendations_from_openai(user_responses, activity_location, date_notes)
    client = OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"])
    prompt = <<~PROMPT
      You are an AI assistant that provides restaurant recommendations based on user preferences.
      The user has provided the following preferences: #{user_responses}.
      This event will take place in #{activity_location}, and it is planned for #{date_notes}.

      Considering these details, recommend 5 restaurants that best match the user's preferences and location.
      Provide each recommendation in **valid JSON format** using the following structure:

      {
        "restaurants": [
          {
            "name": "Restaurant Name",
            "price_range": "$ - $$$$",
            "description": "Short description of the restaurant, including cuisine type and atmosphere.",
            "reason": "Explain why this recommendation was chosen based on user feedback.",
            "hours": "Hours of operation (e.g., Mon-Fri: 9 AM - 10 PM, Sat-Sun: 8 AM - 11 PM)",
            "website": "Valid website link or null if unknown",
            "address": "Restaurant address or 'Not available'"
          }
        ]
      }
      - The response must be valid JSON.
    PROMPT

    response = client.chat(
      parameters: {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI assistant that provides structured restaurant recommendations in JSON format." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      }
    )

    recommendations_json = response.dig("choices", 0, "message", "content")

    begin
      recommendations = JSON.parse(recommendations_json)["restaurants"]
      enrich_recommendations(recommendations)
    rescue JSON::ParserError
      nil
    end
  end

  def enrich_recommendations(recommendations)
    recommendations.map { |rec| enrich_recommendation(rec) }
  end

  def enrich_recommendation(rec)
    # Build a query string using the restaurant's name and address.
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
