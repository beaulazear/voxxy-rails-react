class Registration < ApplicationRecord
  belongs_to :event, counter_cache: :registered_count
  belongs_to :user, optional: true
  belongs_to :vendor_application, optional: true, counter_cache: :submissions_count

  # Email automation associations
  has_many :email_deliveries, dependent: :destroy

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, inclusion: { in: %w[pending confirmed cancelled approved rejected waitlist] }, allow_blank: true
  validates :email, uniqueness: { scope: :event_id, message: "already registered for this event" }
  validates :business_name, presence: true, if: :vendor_registration?
  validates :vendor_category, presence: true, if: :vendor_registration?

  before_create :generate_ticket_code
  after_create :send_confirmation_email
  after_update :send_status_update_email, if: :saved_change_to_status?

  scope :confirmed, -> { where(status: "confirmed") }
  scope :pending, -> { where(status: "pending") }
  scope :approved, -> { where(status: "approved") }
  scope :rejected, -> { where(status: "rejected") }
  scope :waitlist, -> { where(status: "waitlist") }
  scope :vendor_registrations, -> { where.not(vendor_application_id: nil) }
  scope :by_category, ->(category) { where(vendor_category: category) }

  def confirm!
    update(status: "confirmed")
  end

  def cancel!
    update(status: "cancelled")
  end

  def check_in!
    update(checked_in: true, checked_in_at: Time.current)
  end

  def approve!
    update(status: "approved")
  end

  def reject!
    update(status: "rejected")
  end

  def move_to_waitlist!
    update(status: "waitlist")
  end

  def vendor_registration?
    vendor_application_id.present?
  end

  private

  def generate_ticket_code
    self.ticket_code = SecureRandom.hex(8).upcase
  end

  def send_confirmation_email
    RegistrationEmailService.send_confirmation(self)
    # Notify event owner if this is a vendor application
    RegistrationEmailService.notify_owner_of_submission(self) if vendor_registration?
  rescue StandardError => e
    Rails.logger.error "Failed to send confirmation email for registration #{id}: #{e.message}"
    # Don't raise - we don't want to block registration creation if email fails
  end

  def send_status_update_email
    RegistrationEmailService.send_status_update(self)
  rescue StandardError => e
    Rails.logger.error "Failed to send status update email for registration #{id}: #{e.message}"
    # Don't raise - we don't want to block status updates if email fails
  end
end
