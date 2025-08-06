class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :activity, optional: true
  belongs_to :pinned_activity, optional: true

  validates :content, presence: true
  
  after_create :send_comment_notifications

  private

  def send_comment_notifications
    return unless activity # Only send for activity comments

    # Notify all participants except the commenter
    participants_to_notify = ([activity.user] + activity.participants.to_a) - [user]
    
    participants_to_notify.each do |participant|
      title = "New Comment 💬"
      body = "#{user.name} commented: '#{content.truncate(50)}'"

      Notification.create_and_send!(
        user: participant,
        title: title,
        body: body,
        notification_type: 'comment',
        activity: activity,
        triggering_user: user,
        data: { activityId: activity.id, commentId: id }
      )
    end
  end
end
