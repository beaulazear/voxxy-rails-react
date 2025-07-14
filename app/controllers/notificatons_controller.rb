# Update app/controllers/notifications_controller.rb
class NotificationsController < ApplicationController
  before_action :authorized!

  def send_test_to_self
    if current_user.can_receive_push_notifications?
      title = params[:title] || "Test to #{current_user.name}! 🚀"
      body = params[:body] || "This notification was sent directly to you!"

      PushNotificationService.send_notification(
        current_user,
        title,
        body,
        {
          type: "self_test",
          timestamp: Time.current.to_i,
          user_id: current_user.id.to_s
        }
      )

      render json: { success: true, message: "Test notification sent to yourself!" }
    else
      render json: {
        success: false,
        message: "Cannot send notifications. Check your notification settings and push token."
      }
    end
  end

  def test
    if current_user.can_receive_push_notifications?
      title = params[:title] || "Test Notification! 🚀"
      body = params[:body] || "Push notifications are working from your backend!"

      PushNotificationService.send_notification(
        current_user,
        title,
        body,
        { type: "test", timestamp: Time.current.to_i }
      )

      render json: { success: true, message: "Test notification sent!" }
    else
      render json: {
        success: false,
        message: "User cannot receive push notifications. Check push_notifications setting and push_token."
      }
    end
  end
end

# Create app/jobs/activity_reminder_job.rb (if using Sidekiq/ActiveJob)
class ActivityReminderJob < ApplicationJob
  queue_as :default

  def perform(activity_id, reminder_type = "1_hour")
    activity = Activity.find_by(id: activity_id)
    return unless activity&.finalized?

    case reminder_type
    when "1_hour"
      send_one_hour_reminder(activity)
    when "30_minutes"
      send_thirty_minute_reminder(activity)
    when "day_of"
      send_day_of_reminder(activity)
    end
  end

  private

  def send_one_hour_reminder(activity)
    participants = get_activity_participants(activity)
    activity_type = activity.activity_type || "activity"
    activity_config = get_activity_config(activity.activity_type)

    notifications = participants.map do |user|
      {
        user: user,
        title: "#{activity_config[:emoji]} Starting Soon!",
        body: "#{activity.activity_name} starts in 1 hour - time to get ready!",
        data: {
          type: "activity_reminder",
          activityId: activity.id.to_s,
          reminderType: "1_hour",
          activityType: activity.activity_type
        }
      }
    end

    PushNotificationService.send_bulk_notifications(notifications)
  end

  def send_thirty_minute_reminder(activity)
    participants = get_activity_participants(activity)
    activity_config = get_activity_config(activity.activity_type)

    notifications = participants.map do |user|
      {
        user: user,
        title: "#{activity_config[:emoji]} Almost Time!",
        body: "#{activity.activity_name} starts in 30 minutes - let's go!",
        data: {
          type: "activity_reminder",
          activityId: activity.id.to_s,
          reminderType: "30_minutes",
          activityType: activity.activity_type
        }
      }
    end

    PushNotificationService.send_bulk_notifications(notifications)
  end

  def send_day_of_reminder(activity)
    participants = get_activity_participants(activity)
    activity_config = get_activity_config(activity.activity_type)
    time_str = format_activity_time(activity)

    notifications = participants.map do |user|
      {
        user: user,
        title: "#{activity_config[:emoji]} Today's the Day!",
        body: "Don't forget: #{activity.activity_name} at #{time_str}",
        data: {
          type: "activity_reminder",
          activityId: activity.id.to_s,
          reminderType: "day_of",
          activityType: activity.activity_type
        }
      }
    end

    PushNotificationService.send_bulk_notifications(notifications)
  end

  def get_activity_participants(activity)
    # Get all users who should receive notifications
    participants = [ activity.user ] # Include the host

    # Add accepted participants
    activity.participants.includes(:user).each do |participant|
      participants << participant.user if participant.accepted?
    end

    # Filter to only users who can receive push notifications
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

  def format_activity_time(activity)
    return "TBD" unless activity.date_time

    time = Time.parse(activity.date_time)
    time.strftime("%-I:%M %p")
  rescue
    "TBD"
  end
end

# Update app/models/activity.rb to schedule reminders
class Activity < ApplicationRecord
  # ... your existing code

  after_update :schedule_reminders, if: :saved_change_to_finalized?
  after_update :reschedule_reminders, if: :saved_change_to_date_time?

  private

  def schedule_reminders
    return unless finalized? && date_time.present?

    activity_datetime = Time.parse(date_time)
    current_time = Time.current

    # Schedule 1 hour reminder
    one_hour_before = activity_datetime - 1.hour
    if one_hour_before > current_time
      ActivityReminderJob.set(wait_until: one_hour_before)
                        .perform_later(id, "1_hour")
    end

    # Schedule 30 minute reminder
    thirty_min_before = activity_datetime - 30.minutes
    if thirty_min_before > current_time
      ActivityReminderJob.set(wait_until: thirty_min_before)
                        .perform_later(id, "30_minutes")
    end

    # Schedule day-of reminder (9 AM on the day of the activity)
    activity_date = activity_datetime.to_date
    day_of_reminder = activity_date.beginning_of_day + 9.hours
    if day_of_reminder > current_time && day_of_reminder < activity_datetime
      ActivityReminderJob.set(wait_until: day_of_reminder)
                        .perform_later(id, "day_of")
    end

    Rails.logger.info "Scheduled reminders for activity #{id} at #{activity_datetime}"
  end

  def reschedule_reminders
    # Cancel existing jobs (this is simplified - in production you'd want to track job IDs)
    # Then reschedule with new times
    schedule_reminders if finalized?
  end
end

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
      activity.participants.includes(:user).each do |participant|
        participants << participant.user if participant.accepted?
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
