class UnsubscribeToken < ApplicationRecord
  belongs_to :event, optional: true
  belongs_to :organization, optional: true

  validates :token, presence: true, uniqueness: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :expires_at, presence: true

  before_validation :generate_token, on: :create
  before_validation :set_expiration, on: :create

  scope :active, -> { where('expires_at > ?', Time.current).where(used_at: nil) }
  scope :expired, -> { where('expires_at <= ?', Time.current) }
  scope :used, -> { where.not(used_at: nil) }

  def expired?
    expires_at <= Time.current
  end

  def used?
    used_at.present?
  end

  def active?
    !expired? && !used?
  end

  def mark_as_used!
    update!(used_at: Time.current)
  end

  def self.find_active_token(token)
    find_by!(token: token).tap do |unsubscribe_token|
      raise ActiveRecord::RecordNotFound, "Token has expired" if unsubscribe_token.expired?
      raise ActiveRecord::RecordNotFound, "Token has already been used" if unsubscribe_token.used?
    end
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end

  def set_expiration
    # Tokens expire in 90 days (long-lived for email links)
    self.expires_at ||= 90.days.from_now
  end
end
