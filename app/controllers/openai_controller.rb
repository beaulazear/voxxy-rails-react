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
          sleep(1) # Delay before retrying
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

        client = OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"])

        begin
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

          - Ensure that the hours of operation are included as part of the **description**.
          - If exact hours are unavailable, provide an estimated time based on typical restaurant hours.
          - The response must be valid JSON.
        PROMPT

          response = client.chat(
            parameters: {
              model: "gpt-4",
              messages: [
                { role: "system", content: "You are an AI assistant that provides structured restaurant recommendations in JSON format." },
                { role: "user", content: prompt }
              ],
              temperature: 0.7
            }
          )

          # Extract JSON from the response
          recommendations_json = response.dig("choices", 0, "message", "content")

          # Parse JSON safely
          begin
            recommendations = JSON.parse(recommendations_json)["restaurants"]
            render json: { recommendations: recommendations }, status: :ok
          rescue JSON::ParserError
            render json: { error: "Failed to parse recommendations" }, status: :unprocessable_entity
          end
        rescue Faraday::TooManyRequestsError => e
          Rails.logger.error "Too many requests: #{e.message}"
          sleep(1)
          retry
        end
      end
end
