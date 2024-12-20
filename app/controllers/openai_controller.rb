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
end
