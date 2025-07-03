# app/models/response.rb
class Response < ApplicationRecord
  belongs_to :activity
  belongs_to :user, optional: true  # This is crucial for guest responses

  # Validation: either user_id OR email must be present, but not both
  validates :email, presence: true, if: -> { user_id.blank? }
  validates :user_id, presence: true, if: -> { email.blank? }

  # Prevent duplicate responses by email
  validates :email, uniqueness: { scope: :activity_id }, allow_blank: true

  # Prevent duplicate responses by user
  validate :unique_user_response_per_activity

  # Store accessor for availability JSON field
  store_accessor :availability

  # Notes are required
  validates :notes, presence: true

  def participant_identifier
    user_id? ? user.name : email
  end

  def is_guest_response?
    email.present? && user_id.blank?
  end

  private

  def unique_user_response_per_activity
    if user_id.present?
      existing = Response.where(activity_id: activity_id, user_id: user_id)
      existing = existing.where.not(id: id) if persisted?

      if existing.exists?
        errors.add(:user_id, "has already responded to this activity")
      end
    end
  end
end
