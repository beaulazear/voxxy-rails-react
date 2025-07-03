# app/models/activity_participant.rb
class ActivityParticipant < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :activity

  before_create :generate_guest_token

  # Method to regenerate token if needed
  def regenerate_guest_token!
    update!(guest_response_token: SecureRandom.urlsafe_base64(32))
  end

  private

  def generate_guest_token
    self.guest_response_token ||= SecureRandom.urlsafe_base64(32)
  end
end
