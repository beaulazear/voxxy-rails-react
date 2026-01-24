class PaymentSyncLog < ApplicationRecord
  belongs_to :payment_integration

  validates :sync_type, presence: true

  scope :recent, -> { order(created_at: :desc).limit(10) }
  scope :with_errors, -> { where.not(error_messages: nil) }
  scope :successful, -> { where(error_messages: nil).where.not(completed_at: nil) }

  def duration
    return nil unless started_at && completed_at
    completed_at - started_at
  end

  def successful?
    error_messages.blank? && completed_at.present?
  end

  def failed?
    error_messages.present?
  end
end
