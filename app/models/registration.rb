class Registration < ApplicationRecord
  belongs_to :event, counter_cache: :registered_count
  belongs_to :user, optional: true

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, inclusion: { in: %w[pending confirmed cancelled] }, allow_blank: true
  validates :email, uniqueness: { scope: :event_id, message: "already registered for this event" }

  before_create :generate_ticket_code
  after_create :send_confirmation_email

  scope :confirmed, -> { where(status: "confirmed") }
  scope :pending, -> { where(status: "pending") }

  def confirm!
    update(status: "confirmed")
  end

  def cancel!
    update(status: "cancelled")
  end

  def check_in!
    update(checked_in: true, checked_in_at: Time.current)
  end

  private

  def generate_ticket_code
    self.ticket_code = SecureRandom.hex(8).upcase
  end

  def send_confirmation_email
    # TODO: Implement RegistrationEmailService.send_confirmation(self)
  end
end
