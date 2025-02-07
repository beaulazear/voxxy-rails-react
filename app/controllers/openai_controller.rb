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
            Format each recommendation **exactly** as follows:

            Restaurant Name - Price Range ($ - $$$$): Short description of the restaurant.

            If no price range is available, omit it.
          PROMPT

          response = client.chat(
            parameters: {
              model: "gpt-4",
              messages: [
                { role: "system", content: "You are an AI assistant that provides restaurant recommendations based on user preferences." },
                { role: "user", content: prompt }
              ],
              temperature: 0.7
            }
          )

          recommendations = response.dig("choices", 0, "message", "content")&.split("\n")&.map(&:strip)

          if recommendations.present?
            render json: { recommendations: recommendations }, status: :ok
          else
            render json: { error: "No recommendations generated" }, status: :unprocessable_entity
          end
        rescue Faraday::TooManyRequestsError => e
          Rails.logger.error "Too many requests: #{e.message}"
          sleep(1)
          retry
        end
      end
end
