# Enhanced app/services/push_notification_service.rb
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

    def send_activity_invite(activity, invited_user)
      return unless invited_user.can_receive_push_notifications?

      host_name = activity.user.name.split(" ").first
      activity_type = activity.activity_type || "activity"
      activity_config = get_activity_config(activity.activity_type)

      send_notification(
        invited_user,
        "#{activity_config[:emoji]} New Activity Invite!",
        "#{host_name} invited you to #{activity_type.downcase}",
        {
          type: "activity_invite",
          activityId: activity.id.to_s,
          hostName: host_name,
          activityType: activity.activity_type
        }
      )
    end

    def send_activity_update(activity, message_type = "update")
      participants = get_activity_participants(activity)
      activity_config = get_activity_config(activity.activity_type)

      title = case message_type
      when "finalized"
                 "#{activity_config[:emoji]} Activity Finalized!"
      when "reminder"
                 "#{activity_config[:emoji]} Activity Reminder"
      else
                 "#{activity_config[:emoji]} Activity Update"
      end

      body = case message_type
      when "finalized"
               "#{activity.activity_name} is ready to go!"
      when "reminder"
               "Don't forget about #{activity.activity_name}!"
      else
               "#{activity.activity_name} has been updated"
      end

      notifications = participants.map do |user|
        {
          user: user,
          title: title,
          body: body,
          data: {
            type: "activity_update",
            activityId: activity.id.to_s,
            messageType: message_type,
            activityType: activity.activity_type
          }
        }
      end

      send_bulk_notifications(notifications)
    end

    def send_new_comment_notification(comment)
      activity = comment.activity
      return unless activity

      participants = get_activity_participants(activity)
      # Don't notify the comment author
      participants = participants.reject { |user| user.id == comment.user_id }
      return if participants.empty?

      activity_config = get_activity_config(activity.activity_type)
      commenter_name = comment.user.name.split(" ").first

      notifications = participants.map do |user|
        {
          user: user,
          title: "#{activity_config[:emoji]} New Comment",
          body: "#{commenter_name} commented on #{activity.activity_name}",
          data: {
            type: "new_comment",
            activityId: activity.id.to_s,
            commentId: comment.id.to_s,
            commenterName: commenter_name,
            activityType: activity.activity_type
          }
        }
      end

      send_bulk_notifications(notifications)
    end

    def send_venue_suggestion_notification(pinned_activity)
      activity = pinned_activity.activity
      return unless activity

      participants = get_activity_participants(activity)
      # Don't notify if the host suggested the venue (they created it)
      # Actually, let's notify everyone including the host for consistency
      return if participants.empty?

      activity_config = get_activity_config(activity.activity_type)

      notifications = participants.map do |user|
        {
          user: user,
          title: "#{activity_config[:emoji]} New Venue Suggestion!",
          body: "#{pinned_activity.title} was suggested for #{activity.activity_name}",
          data: {
            type: "venue_suggestion",
            activityId: activity.id.to_s,
            pinnedActivityId: pinned_activity.id.to_s,
            venueTitle: pinned_activity.title,
            activityType: activity.activity_type
          }
        }
      end

      send_bulk_notifications(notifications)
    end

    def send_activity_change_notification(activity, changes)
      participants = get_activity_participants(activity)
      # Don't notify the activity host since they made the change
      participants = participants.reject { |user| user.id == activity.user_id }
      return if participants.empty?

      activity_config = get_activity_config(activity.activity_type)
      host_name = activity.user.name.split(" ").first

      # Create a human-readable change message
      change_message = format_activity_changes(changes)

      notifications = participants.map do |user|
        {
          user: user,
          title: "#{activity_config[:emoji]} Activity Updated",
          body: "#{host_name} updated #{activity.activity_name}: #{change_message}",
          data: {
            type: "activity_changed",
            activityId: activity.id.to_s,
            hostName: host_name,
            changes: changes.keys,
            activityType: activity.activity_type
          }
        }
      end

      send_bulk_notifications(notifications)
    end

    # Test method to send immediate reminder
    def send_test_reminder(activity, user)
      activity_config = get_activity_config(activity.activity_type)

      send_notification(
        user,
        "#{activity_config[:emoji]} Test Reminder!",
        "This is how reminders will look for #{activity.activity_name}",
        {
          type: "test_reminder",
          activityId: activity.id.to_s,
          activityType: activity.activity_type
        }
      )
    end

    private

    def get_activity_participants(activity)
      participants = [ activity.user ] # Include the host

      # Add accepted participants
      activity.participants.each do |participant|
        participants << participant
      end

      participants.select(&:can_receive_push_notifications?)
    end

    def get_activity_config(activity_type)
      configs = {
        "Restaurant" => { emoji: "🍜", display: "Lets Eat!" },
        "Meeting" => { emoji: "⏰", display: "Lets Meet!" },
        "Game Night" => { emoji: "🎮", display: "Game Time!" },
        "Cocktails" => { emoji: "🍸", display: "Lets Go Out!" }
      }

      configs[activity_type] || { emoji: "🎉", display: "Lets Meet!" }
    end

    def format_activity_changes(changes)
      change_messages = []

      if changes.key?("activity_name")
        change_messages << "name changed"
      end

      if changes.key?("date_time") || changes.key?("date_day")
        change_messages << "date/time updated"
      end

      if changes.key?("activity_location")
        change_messages << "location changed"
      end

      if changes.key?("group_size")
        change_messages << "group size updated"
      end

      if changes.key?("welcome_message")
        change_messages << "welcome message updated"
      end

      if changes.key?("activity_type")
        change_messages << "activity type changed"
      end

      change_messages.any? ? change_messages.join(", ") : "details updated"
    end

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
          Rails.logger.info "✅ Sent #{payloads.count} push notifications successfully"
        else
          Rails.logger.error "❌ Expo push notification failed: #{response.code} - #{response.body}"
        end
      rescue => e
        Rails.logger.error "❌ Error sending push notification: #{e.message}"
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
