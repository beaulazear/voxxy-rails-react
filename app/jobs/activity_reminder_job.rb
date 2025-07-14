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
