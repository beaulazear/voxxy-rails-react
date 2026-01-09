class Registration < ApplicationRecord
  belongs_to :event, counter_cache: :registered_count
  belongs_to :user, optional: true
  belongs_to :vendor_application, optional: true, counter_cache: :submissions_count

  # Email automation associations
  has_many :email_deliveries, dependent: :destroy

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, inclusion: { in: %w[pending confirmed cancelled approved rejected waitlist] }, allow_blank: true
  validates :payment_status, inclusion: { in: %w[pending paid confirmed overdue] }, allow_blank: true
  validates :email, uniqueness: { scope: :event_id, message: "already registered for this event" }
  validates :business_name, presence: true, if: :vendor_registration?
  validates :vendor_category, presence: true, if: :vendor_registration?

  # Track previous category for change detection
  attribute :previous_vendor_category, :string

  before_create :generate_ticket_code
  after_create :send_confirmation_email
  after_update :send_status_update_email, if: :saved_change_to_status?
  after_update :track_category_change, if: :saved_change_to_vendor_category?

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

  # Mark payment as confirmed
  # Options:
  #   send_email: true/false - whether to send confirmation email (default: false, requires explicit confirmation)
  def confirm_payment!(send_email: false)
    update!(
      payment_status: "confirmed",
      payment_confirmed_at: Time.current,
      status: "approved" # Auto-approve when payment confirmed
    )

    # Only send email if explicitly requested
    if send_email
      RegistrationEmailService.send_payment_confirmation(self)
    else
      Rails.logger.info "Payment confirmed for registration #{id}. Email notification skipped (requires explicit confirmation)."
    end
  end

  # Check if payment is overdue
  def payment_overdue?
    return false unless vendor_registration?
    return false if payment_status == "confirmed" || payment_status == "paid"

    payment_deadline = event.payment_deadline
    return false unless payment_deadline

    Date.current > payment_deadline
  end

  # Returns hash with category change information
  def category_change_info
    return nil unless saved_change_to_vendor_category?

    {
      old_category: saved_change_to_vendor_category[0],
      new_category: saved_change_to_vendor_category[1],
      changed_at: updated_at
    }
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

  def track_category_change
    # Log the category change
    Rails.logger.info "Category changed for registration #{id}: #{saved_change_to_vendor_category[0]} -> #{saved_change_to_vendor_category[1]}"
    # NOTE: Email notification is NOT sent automatically
    # Must be triggered explicitly via EmailNotificationsController#send_category_change
  end
end
