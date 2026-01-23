class BulletinRead < ApplicationRecord
  # Associations
  belongs_to :bulletin
  belongs_to :user, optional: true

  # Validations
  validate :must_have_user_or_email

  # Callbacks
  before_save :normalize_email
  before_save :set_read_at

  private

  def must_have_user_or_email
    if user_id.blank? && registration_email.blank?
      errors.add(:base, "Must have either user_id or registration_email")
    end
  end

  def normalize_email
    self.registration_email = registration_email.downcase if registration_email.present?
  end

  def set_read_at
    self.read_at ||= Time.current
  end
end
