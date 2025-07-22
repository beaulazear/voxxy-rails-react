class User < ApplicationRecord
  has_secure_password
  has_many :activities, dependent: :destroy
  has_many :activity_participants, dependent: :destroy
  has_many :joined_activities, through: :activity_participants, source: :activity
  has_many :comments, dependent: :destroy
  has_many :votes, dependent: :destroy

  before_create :generate_confirmation_token

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }
  validates :password_confirmation, presence: true, if: -> { password.present? }

  before_validation :set_defaults_for_notifications, on: :create

  has_one_attached :profile_pic

  # Add this method to get the profile picture URL
  def profile_pic_url
    if profile_pic.attached?
      Rails.application.routes.url_helpers.rails_blob_url(profile_pic, only_path: true)
    else
      nil
    end
  end

  # Optional: method to get display image (profile_pic or fallback to avatar)
  def display_image_url
    profile_pic_url || avatar
  end

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
    self.password_confirmation = new_password
    save!
  end

  def can_receive_push_notifications?
    push_notifications && push_token.present?
  end

  private

  def generate_confirmation_token
    self.confirmation_token = SecureRandom.hex(10) unless self.confirmed_at
  end

  def set_defaults_for_notifications
    self.preferences ||= ""
    self.text_notifications = true if text_notifications.nil?
    self.email_notifications = true if email_notifications.nil?
    self.push_notifications = true if push_notifications.nil?
  end
end
