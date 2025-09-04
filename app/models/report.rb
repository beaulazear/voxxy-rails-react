class Report < ApplicationRecord
  # Associations
  belongs_to :reportable, polymorphic: true
  belongs_to :reporter, class_name: "User"
  belongs_to :activity, optional: true
  belongs_to :reviewed_by, class_name: "User", optional: true

  # Validations
  validates :reason, presence: true
  validates :status, inclusion: { in: %w[pending reviewing resolved dismissed] }
  validates :resolution_action, inclusion: {
    in: %w[content_deleted user_warned user_suspended user_banned dismissed no_action],
    allow_nil: true
  }

  # Prevent duplicate reports from same user
  validates :reporter_id, uniqueness: {
    scope: [ :reportable_type, :reportable_id ],
    message: "has already reported this content"
  }

  # Scopes
  scope :pending, -> { where(status: "pending") }
  scope :reviewing, -> { where(status: "reviewing") }
  scope :resolved, -> { where(status: "resolved") }
  scope :dismissed, -> { where(status: "dismissed") }
  scope :recent, -> { order(created_at: :desc) }
  scope :unreviewed, -> { where(reviewed_at: nil) }
  scope :overdue, -> { pending.where("created_at < ?", 24.hours.ago) }

  # Report reasons
  REASONS = {
    spam: "Spam or misleading",
    harassment: "Harassment or bullying",
    hate: "Hate speech or discrimination",
    inappropriate: "Inappropriate or offensive",
    violence: "Violence or dangerous content",
    other: "Other"
  }.freeze

  # Callbacks
  after_create :notify_admins
  after_update :log_status_change, if: :saved_change_to_status?

  # Instance methods
  def review!(admin_user)
    update!(
      status: "reviewing",
      reviewed_by: admin_user,
      reviewed_at: Time.current
    )
  end

  def resolve!(action, notes = nil, admin_user = nil)
    update!(
      status: "resolved",
      resolution_action: action,
      resolution_notes: notes,
      reviewed_by: admin_user || reviewed_by,
      reviewed_at: reviewed_at || Time.current
    )

    # Execute resolution action
    case action
    when "content_deleted"
      delete_reported_content!
    when "user_warned"
      warn_offending_user!
    when "user_suspended"
      suspend_offending_user!
    when "user_banned"
      ban_offending_user!
    end
  end

  def dismiss!(reason = nil, admin_user = nil)
    update!(
      status: "dismissed",
      resolution_action: "dismissed",
      resolution_notes: reason,
      reviewed_by: admin_user || reviewed_by,
      reviewed_at: reviewed_at || Time.current
    )
  end

  def overdue?
    pending? && created_at < 24.hours.ago
  end

  def pending?
    status == "pending"
  end

  def reported_user
    case reportable_type
    when "Comment"
      reportable.user
    when "User"
      reportable
    when "Activity"
      reportable.user
    else
      nil
    end
  end

  def reported_content
    case reportable_type
    when "Comment"
      reportable.content
    when "Activity"
      reportable.activity_name
    else
      "N/A"
    end
  end

  private

  def notify_admins
    # Send email notification to admins
    ReportNotificationService.new(self).send_admin_notification

    # Send Slack notification if configured
    # SlackNotificationService.new(self).notify_report if Rails.application.credentials.slack_webhook_url
  end

  def log_status_change
    Rails.logger.info "Report ##{id} status changed from #{saved_change_to_status[0]} to #{saved_change_to_status[1]}"
  end

  def delete_reported_content!
    reportable.destroy! if reportable.present?
  end

  def warn_offending_user!
    user = reported_user
    return unless user

    # Send warning email
    UserModerationEmailService.new(user, "warned", self).send_email

    # Log warning
    user.moderation_actions.create!(
      action_type: "warned",
      reason: "Content violation: #{reason}",
      report: self,
      moderator: reviewed_by || User.find_by(admin: true)
    )
  end

  def suspend_offending_user!
    user = reported_user
    return unless user

    user.suspend!(7.days, "Content violation: #{reason}", reviewed_by || User.find_by(admin: true))
  end

  def ban_offending_user!
    user = reported_user
    return unless user

    user.ban!("Content violation: #{reason}", reviewed_by || User.find_by(admin: true))
  end
end
