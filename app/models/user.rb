class User < ApplicationRecord
  has_secure_password
  has_many :activities, dependent: :destroy
  has_many :activity_participants
  has_many :joined_activities, through: :activity_participants, source: :activity

  before_create :generate_confirmation_token

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, length: { minimum: 6 }
  validates :password_confirmation, presence: true

  def verify!
    update_columns(confirmed_at: Time.current, confirmation_token: nil)
  end

  def generate_password_reset_token
    self.reset_password_token = SecureRandom.hex(10)
    self.reset_password_sent_at = Time.current
    save!(validate: false)
  end

  def password_reset_token_valid?
    reset_password_sent_at > 24.hours.ago
  end

  def reset_password!(new_password)
    self.reset_password_token = nil
    self.reset_password_sent_at = nil
    self.password = new_password
    save!
  end

  private

  def generate_confirmation_token
    self.confirmation_token = SecureRandom.hex(10) unless self.confirmed_at
  end
end
