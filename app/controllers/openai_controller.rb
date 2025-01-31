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

        if user_responses.blank?
            render json: { error: "No responses provided" }, status: :unprocessable_entity
            return
        end

        client = OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"])

        begin
            response = client.chat(
                parameters: {
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: "You are an AI assistant that provides restaurant recommendations based on user preferences." },
                        { role: "user", content: "Here are the user responses for restaurant preferences:\n\n#{user_responses}\n\nBased on this, recommend 5 restaurants that best match their preferences. Format each recommendation **exactly** as follows:\n\nRestaurant Name - Price Range ($ - $$$$): Short description of the restaurant.\n\nIf no price range is available, omit it." }
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
