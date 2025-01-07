class ChatChannel < ApplicationCable::Channel
  def subscribed
    stream_from "chat_#{params[:user_id]}"
  end

  def receive(data)
    user_message = data["message"]

    response = chat_with_gpt(user_message)

    ActionCable.server.broadcast(
      "chat_#{params[:user_id]}",
      { message: response }
    )
  end

  private

  def chat_with_gpt(message)
    # Use your GPT API key securely
    api_key = ENV["OPENAI_API_KEY"]
    response = HTTParty.post(
      "https://api.openai.com/v1/chat/completions",
      headers: {
        "Authorization" => "Bearer #{api_key}",
        "Content-Type" => "application/json"
      },
      body: {
        model: "gpt-4",
        messages:  [ { role: "user", content: message } ]
      }.to_json
    )

    response.parsed_response.dig("choices", 0, "message", "content") || "Sorry, I couldn't understand that."
  rescue => e
    "Error: #{e.message}"
  end
end
