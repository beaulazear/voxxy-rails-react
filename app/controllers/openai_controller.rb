require "openai"

class OpenaiController < ApplicationController
    skip_before_action :authorized, only: [ :generate_haiku ]

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

    private

    def format_recommendation(rec)
      {
        name: rec.name,
        description: rec.description,
        hours: rec.hours,
        price_range: rec.price_range,
        address: rec.address,
        website: rec.website
      }
    end

    def generate_cache_key(user_responses, activity_location, date_notes)
      hash_input = "#{user_responses}-#{activity_location}-#{date_notes}"
      "recommendations_#{Digest::SHA256.hexdigest(hash_input)}"
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
        JSON.parse(recommendations_json)["restaurants"]
      rescue JSON::ParserError
        nil
      end
    end
end
