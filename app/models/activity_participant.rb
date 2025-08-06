# app/models/activity_participant.rb
class ActivityParticipant < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :activity

  before_create :generate_guest_token
  after_create :send_invite_notification

  # Method to regenerate token if needed
  def regenerate_guest_token!
    update!(guest_response_token: SecureRandom.urlsafe_base64(32))
  end

  private

  def generate_guest_token
    self.guest_response_token ||= SecureRandom.urlsafe_base64(32)
  end

  def send_invite_notification
    return unless user # Only send to registered users

    title = "New Activity Invite! 🎉"
    body = "#{activity.user.name} invited you to '#{activity.activity_name}'"

    Notification.create_and_send!(
      user: user,
      title: title,
      body: body,
      notification_type: 'activity_invite',
      activity: activity,
      triggering_user: activity.user,
      data: { activityId: activity.id }
    )
  end
end
