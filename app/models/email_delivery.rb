class EmailDelivery < ApplicationRecord
  # Associations
  belongs_to :scheduled_email, optional: true
  belongs_to :event
  belongs_to :registration, optional: true
  belongs_to :event_invitation, optional: true

  # Enums for status
  enum status: {
    queued: "queued",
    sent: "sent",
    delivered: "delivered",
    bounced: "bounced",
    dropped: "dropped",
    unsubscribed: "unsubscribed"
  }

  # Enums for email type
  enum email_type: {
    invitation: "invitation",       # Manual invitation emails
    scheduled: "scheduled",          # Campaign template emails
    notification: "notification"     # System notification emails
  }, _prefix: true

  # Validations
  validates :sendgrid_message_id, presence: true, uniqueness: true
  validates :recipient_email, presence: true
  validates :status, presence: true

  # Ensure either scheduled_email_id OR event_invitation_id is present
  validate :must_have_email_source

  private

  def must_have_email_source
    # Must have at least one email source:
    # - scheduled_email_id (scheduled campaign emails)
    # - event_invitation_id (manual invitation emails)
    # - registration_id (system notification emails)
    if scheduled_email_id.blank? && event_invitation_id.blank? && registration_id.blank?
      errors.add(:base, "Must have either scheduled_email_id, event_invitation_id, or registration_id")
    end

    # Cannot have both recipient types (would be ambiguous)
    # Note: scheduled_email_id + event_invitation_id IS VALID (invitation-based scheduled emails)
    # Note: scheduled_email_id + registration_id IS VALID (registration-based scheduled emails)
    if registration_id.present? && event_invitation_id.present?
      errors.add(:base, "Cannot have both registration_id and event_invitation_id")
    end
  end

  # Scopes
  scope :failed, -> { where(status: [ "bounced", "dropped" ]) }
  scope :pending_retry, -> { where("next_retry_at IS NOT NULL AND next_retry_at <= ?", Time.current) }
  scope :soft_bounces, -> { where(status: "bounced", bounce_type: "soft") }
  scope :successful, -> { where(status: "delivered") }

  # Check if delivery failed
  def failed?
    bounced? || dropped?
  end

  # Check if can be retried
  def retryable?
    bounce_type == "soft" && retry_count < max_retries
  end
end
