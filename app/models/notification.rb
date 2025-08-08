class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :activity, optional: true
  belongs_to :triggering_user, class_name: "User", optional: true

  validates :title, :body, :notification_type, presence: true
  validates :notification_type, inclusion: {
    in: %w[
      activity_invite activity_update activity_finalized activity_changed
      comment reminder general participant_joined participant_left
    ]
  }

  scope :unread, -> { where(read: false) }
  scope :read, -> { where(read: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :for_user, ->(user) { where(user: user) }

  # Class method to create and optionally send push notification
  def self.create_and_send!(user:, title:, body:, notification_type:, activity: nil, triggering_user: nil, data: {})
    notification = create!(
      user: user,
      title: title,
      body: body,
      notification_type: notification_type,
      activity: activity,
      triggering_user: triggering_user,
      data: data
    )

    # Send push notification if user can receive them
    if user.can_receive_push_notifications?
      PushNotificationService.send_notification(
        user,
        title,
        body,
        data.merge(
          type: notification_type,
          notificationId: notification.id,
          activityId: activity&.id
        )
      )
    end

    notification
  end

  # Helper method for activity invites
  def self.send_activity_invite(activity, invited_user)
    return unless invited_user.can_receive_push_notifications?

    host_name = activity.user.name.split(" ").first
    emoji = ActivityConfig.emoji_for(activity.activity_type)

    create_and_send!(
      user: invited_user,
      title: "#{host_name} needs your preferences! #{emoji}",
      body: "Help them plan the perfect activity",
      notification_type: "activity_invite",
      activity: activity,
      triggering_user: activity.user,
      data: {
        hostName: host_name,
        activityType: activity.activity_type
      }
    )
  end

  # Helper method for activity updates (finalized, reminder, etc.)
  def self.send_activity_update(activity, message_type = "update")
    participants = get_activity_participants(activity)
    emoji = ActivityConfig.emoji_for(activity.activity_type)

    title = case message_type
    when "finalized"
      "#{emoji} Activity Finalized!"
    when "reminder"
      "#{emoji} Activity Reminder"
    else
      "#{emoji} Activity Update"
    end

    body = case message_type
    when "finalized"
      "#{activity.activity_name} is ready to go!"
    when "reminder"
      "Don't forget about #{activity.activity_name}!"
    else
      "#{activity.activity_name} has been updated"
    end

    participants.each do |participant|
      create_and_send!(
        user: participant,
        title: title,
        body: body,
        notification_type: message_type == "finalized" ? "activity_finalized" : "activity_update",
        activity: activity,
        data: {
          messageType: message_type,
          activityType: activity.activity_type
        }
      )
    end
  end


  # Helper method for activity changes
  def self.send_activity_change(activity, changes)
    # Don't notify the activity host since they made the change
    participants = get_activity_participants(activity).reject { |u| u.id == activity.user_id }
    return if participants.empty?

    emoji = ActivityConfig.emoji_for(activity.activity_type)
    host_name = activity.user.name.split(" ").first
    change_message = format_activity_changes(changes)

    participants.each do |participant|
      create_and_send!(
        user: participant,
        title: "#{emoji} Activity Updated",
        body: "#{host_name} updated #{activity.activity_name}: #{change_message}",
        notification_type: "activity_changed",
        activity: activity,
        triggering_user: activity.user,
        data: {
          hostName: host_name,
          changes: changes.keys,
          activityType: activity.activity_type
        }
      )
    end
  end

  def mark_as_read!
    update!(read: true)
  end

  def mark_as_unread!
    update!(read: false)
  end

  private

  def self.get_activity_participants(activity)
    participants = [ activity.user ] # Include the host
    participants += activity.participants.to_a
    participants.uniq.select(&:can_receive_push_notifications?)
  end

  def self.format_activity_changes(changes)
    change_messages = []

    change_messages << "name changed" if changes.key?("activity_name")
    change_messages << "date/time updated" if changes.key?("date_time") || changes.key?("date_day")
    change_messages << "location changed" if changes.key?("activity_location")
    change_messages << "group size updated" if changes.key?("group_size")
    change_messages << "welcome message updated" if changes.key?("welcome_message")
    change_messages << "activity type changed" if changes.key?("activity_type")

    change_messages.any? ? change_messages.join(", ") : "details updated"
  end
end
