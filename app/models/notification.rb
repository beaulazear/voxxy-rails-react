class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :activity, optional: true
  belongs_to :triggering_user, class_name: 'User', optional: true

  validates :title, :body, :notification_type, presence: true
  validates :notification_type, inclusion: { 
    in: %w[activity_invite activity_update activity_finalized comment reminder general] 
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

  def mark_as_read!
    update!(read: true)
  end

  def mark_as_unread!
    update!(read: false)
  end
end