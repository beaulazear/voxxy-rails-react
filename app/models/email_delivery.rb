class EmailDelivery < ApplicationRecord
  # Associations
  belongs_to :scheduled_email
  belongs_to :event
  belongs_to :registration

  # Enums for status
  enum status: {
    queued: "queued",
    sent: "sent",
    delivered: "delivered",
    bounced: "bounced",
    dropped: "dropped",
    unsubscribed: "unsubscribed"
  }

  # Validations
  validates :sendgrid_message_id, presence: true, uniqueness: true
  validates :recipient_email, presence: true
  validates :status, presence: true

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
