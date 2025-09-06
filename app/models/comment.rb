class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :activity, optional: true
  belongs_to :pinned_activity, optional: true

  # Polymorphic association for reports
  has_many :reports, as: :reportable, dependent: :destroy

  validates :content, presence: true
  validate :content_must_be_appropriate

  # Add attribute to skip notifications when needed
  attr_accessor :skip_notifications

  # Clean content before saving
  before_validation :clean_content
  after_create :send_comment_notifications, unless: :skip_notifications

  private

  def clean_content
    return if content.nil?

    # Clean the content of profanity (replace with asterisks)
    self.content = ContentFilterService.clean(content)
  end

  def content_must_be_appropriate
    return if content.nil?

    errors_list = ContentFilterService.validation_errors(content)

    if errors_list.any?
      errors.add(:content, errors_list.join(", "))
    end
  end

  def send_comment_notifications
    return unless activity # Only send for activity comments

    # Get all participants including the host
    participants = [ activity.user ] + activity.participants.to_a
    # Remove the commenter from the list
    participants_to_notify = participants.uniq.reject { |p| p.id == user.id }

    participants_to_notify.each do |participant|
      commenter_name = user.name.split(" ").first
      title = "New Comment 💬"
      body = "#{commenter_name} commented: #{content.truncate(50)}"

      Notification.create_and_send!(
        user: participant,
        title: title,
        body: body,
        notification_type: "comment",
        activity: activity,
        triggering_user: user,
        data: {
          activityId: activity.id,
          commentId: id,
          commenterName: commenter_name,
          activityType: activity.activity_type
        }
      )
    end
  end
end
