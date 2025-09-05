class ModerationAction < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :moderator, class_name: "User"
  belongs_to :report, optional: true

  # Validations
  validates :action_type, presence: true, inclusion: {
    in: %w[warned suspended banned unbanned content_removed appeal_approved appeal_rejected]
  }

  # Scopes
  scope :warnings, -> { where(action_type: "warned") }
  scope :suspensions, -> { where(action_type: "suspended") }
  scope :bans, -> { where(action_type: "banned") }
  scope :recent, -> { order(created_at: :desc) }
  scope :active, -> { where("expires_at IS NULL OR expires_at > ?", Time.current) }

  # Callbacks
  after_create :increment_user_warnings, if: -> { action_type == "warned" }
  after_create :send_notification

  # Class methods
  def self.log_action(user:, moderator:, action:, reason:, report: nil, expires_at: nil)
    create!(
      user: user,
      moderator: moderator,
      action_type: action,
      reason: reason,
      report: report,
      expires_at: expires_at
    )
  end

  # Instance methods
  def active?
    expires_at.nil? || expires_at > Time.current
  end

  def expired?
    expires_at.present? && expires_at <= Time.current
  end

  def expires_in
    return nil unless expires_at
    expires_at - Time.current
  end

  private

  def increment_user_warnings
    user.increment!(:warnings_count)
  end

  def send_notification
    # Log the action
    Rails.logger.info "Moderation action: #{moderator.name} #{action_type} #{user.name} - #{reason}"

    # Reload user to get updated warnings_count
    user.reload

    # Send email notification based on action type
    case action_type
    when "warned", "suspended", "banned"
      UserModerationEmailService.new(user, action_type, report).send_email
    end
  end
end
