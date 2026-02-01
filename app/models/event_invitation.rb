class EventInvitation < ApplicationRecord
  # Associations
  belongs_to :event
  belongs_to :vendor_contact
  has_many :email_deliveries, dependent: :destroy

  # Validations
  validates :status, inclusion: { in: %w[pending sent viewed accepted declined expired] }
  validates :vendor_contact_id, uniqueness: { scope: :event_id, message: "has already been invited to this event" }
  validates :invitation_token, presence: true, uniqueness: true

  # Callbacks
  before_validation :generate_invitation_token, on: :create
  before_create :set_expires_at

  # Scopes
  scope :pending, -> { where(status: "pending") }
  scope :sent, -> { where(status: "sent") }
  scope :viewed, -> { where(status: "viewed") }
  scope :accepted, -> { where(status: "accepted") }
  scope :declined, -> { where(status: "declined") }
  scope :expired, -> { where(status: "expired") }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status) { where(status: status) }

  # Instance methods

  # Mark invitation as sent
  def mark_as_sent!
    update!(status: "sent", sent_at: Time.current)
  end

  # Mark invitation as viewed
  def mark_as_viewed!
    update!(status: "viewed") if status == "sent" || status == "pending"
  end

  # Accept the invitation
  def accept!(response_notes: nil)
    return false if status == "accepted" || status == "declined"
    return false if expired?

    update!(
      status: "accepted",
      responded_at: Time.current,
      response_notes: response_notes
    )
  end

  # Decline the invitation
  def decline!(response_notes: nil)
    return false if status == "accepted" || status == "declined"
    return false if expired?

    update!(
      status: "declined",
      responded_at: Time.current,
      response_notes: response_notes
    )
  end

  # Check if invitation has expired
  def expired?
    expires_at.present? && expires_at < Time.current
  end

  # Mark invitation as expired
  def mark_as_expired!
    update!(status: "expired") if expired? && status != "accepted" && status != "declined"
  end

  # Check if invitation can be responded to
  def can_respond?
    !expired? && status != "accepted" && status != "declined"
  end

  # Generate shareable invitation URL
  def invitation_url(base_url = nil)
    base_url ||= presents_frontend_url
    "#{base_url}/invitations/#{invitation_token}"
  end

  private

  # Generate a secure unique token for the invitation
  def generate_invitation_token
    self.invitation_token ||= SecureRandom.urlsafe_base64(32)
  end

  # Set expiration date based on event's application_deadline or event_date
  def set_expires_at
    return if expires_at.present?

    if event.present?
      # Use application_deadline if available, otherwise use event_date
      self.expires_at = event.application_deadline || event.event_date
    end
  end

  # Get the correct Voxxy Presents frontend URL based on environment
  def presents_frontend_url
    FrontendUrlHelper.presents_frontend_url
  end
end
