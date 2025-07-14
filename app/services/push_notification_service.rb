# Create app/services/push_notification_service.rb
require "net/http"
require "json"

class PushNotificationService
  EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

  class << self
    def send_notification(user, title, body, data = {})
      return unless user.can_receive_push_notifications?

      payload = {
        to: user.push_token,
        title: title,
        body: body,
        data: data,
        sound: "default",
        badge: 1
      }

      send_to_expo([ payload ])
    end

    private

    def send_to_expo(payloads)
      return if payloads.empty?

      uri = URI(EXPO_PUSH_URL)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true

      request = Net::HTTP::Post.new(uri)
      request["Accept"] = "application/json"
      request["Content-Type"] = "application/json"
      request.body = payloads.to_json

      begin
        response = http.request(request)
        Rails.logger.info "Expo response: #{response.code} - #{response.body}"

        if response.code != "200"
          Rails.logger.error "Expo push notification failed: #{response.code} - #{response.body}"
        end
      rescue => e
        Rails.logger.error "Error sending push notification: #{e.message}"
      end
    end
  end
end
