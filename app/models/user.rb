class User < ApplicationRecord
  has_secure_password

  before_create :generate_confirmation_token

  validates :name, presence: true
  validates :username, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, length: { minimum: 6 }

  def verify!
    update_columns(confirmed_at: Time.current, confirmation_token: nil)
  end

  private

  def generate_confirmation_token
    self.confirmation_token = SecureRandom.hex(10) unless self.confirmed_at
  end
end
