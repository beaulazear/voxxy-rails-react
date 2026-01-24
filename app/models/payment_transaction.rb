class PaymentTransaction < ApplicationRecord
  belongs_to :payment_integration
  belongs_to :event
  belongs_to :vendor_contact, optional: true
  belongs_to :registration, optional: true

  validates :provider_transaction_id, presence: true, uniqueness: true
  validates :provider, presence: true
  validates :payer_email, presence: true

  enum payment_status: { pending: 0, paid: 1, refunded: 2, cancelled: 3 }

  scope :matched, -> { where.not(vendor_contact_id: nil) }
  scope :unmatched, -> { where(vendor_contact_id: nil) }
  scope :for_event, ->(event_id) { where(event_id: event_id) }

  after_update :sync_to_contact_and_registration, if: :saved_change_to_payment_status?

  def matched?
    vendor_contact_id.present?
  end

  def unmatched?
    !matched?
  end

  private

  def sync_to_contact_and_registration
    return unless vendor_contact.present?

    # Update vendor contact payment fields
    vendor_contact.update(
      payment_status: payment_status,
      payment_amount: amount,
      payment_date: transaction_created_at,
      payment_provider: provider
    )

    # Update registration vendor_fee_paid if registration exists
    if registration.present?
      registration.update(
        vendor_fee_paid: payment_status == "paid",
        payment_provider: provider,
        payment_amount: amount
      )
    end
  end
end
