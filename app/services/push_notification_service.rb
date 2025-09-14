# Simplified app/services/push_notification_service.rb
require "net/http"
require "json"

class PushNotificationService
  EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

  class << self
    # Core method to send a single notification
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

    # Method to send bulk notifications
    def send_bulk_notifications(notifications)
      # notifications should be an array of hashes with :user, :title, :body, :data
      payloads = notifications.filter_map do |notification|
        user = notification[:user]
        next unless user.can_receive_push_notifications?

        {
          to: user.push_token,
          title: notification[:title],
          body: notification[:body],
          data: notification[:data] || {},
          sound: "default",
          badge: 1
        }
      end

      send_to_expo(payloads) if payloads.any?
    end

    # Test method to send immediate reminder (kept for backward compatibility)
    def send_test_reminder(activity, user)
      emoji = ActivityConfig.emoji_for(activity.activity_type)

      send_notification(
        user,
        "#{emoji} Test Reminder!",
        "This is how reminders will look for #{activity.activity_name}",
        {
          type: "test_reminder",
          activityId: activity.id.to_s,
          activityType: activity.activity_type
        }
      )
    end

    private


    def send_to_expo(payloads)
      return if payloads.empty?

      uri = URI(EXPO_PUSH_URL)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true

      request = Net::HTTP::Post.new(uri)
      request["Accept"] = "application/json"
      request["Accept-Encoding"] = "gzip, deflate"
      request["Content-Type"] = "application/json"
      request.body = payloads.to_json

      begin
        response = http.request(request)
        result = JSON.parse(response.body)

        if response.code == "200"
          handle_expo_response(result, payloads)
          Rails.logger.debug "Sent #{payloads.count} push notifications" if Rails.env.development?
        else
          Rails.logger.error "Push notification failed: #{response.code}"
        end
      rescue => e
        Rails.logger.error "Error sending push notification: #{e.message}"
      end
    end

    def handle_expo_response(result, payloads)
      data = result["data"]
      return unless data.is_a?(Array)

      data.each_with_index do |ticket, index|
        if ticket["status"] == "error"
          Rails.logger.error "Push notification error for #{payloads[index][:to]}: #{ticket['message']}"

          # Handle specific errors
          if ticket["details"] && ticket["details"]["error"] == "DeviceNotRegistered"
            # Remove invalid push token
            user = User.find_by(push_token: payloads[index][:to])
            user&.update(push_token: nil)
            Rails.logger.info "Removed invalid push token for user"
          end
        end
      end
    end
  end
end
