class ScheduledEmail < ApplicationRecord
  # Associations
  belongs_to :event
  belongs_to :email_campaign_template, optional: true
  belongs_to :email_template_item, optional: true
  has_many :email_deliveries, dependent: :destroy
  has_one :latest_delivery, -> { order(created_at: :desc) }, class_name: "EmailDelivery"

  # Validations
  validates :name, presence: true
  validates :status, presence: true, inclusion: {
    in: %w[scheduled paused sent failed cancelled]
  }

  # Scopes
  scope :scheduled, -> { where(status: "scheduled") }
  scope :paused, -> { where(status: "paused") }
  scope :sent, -> { where(status: "sent") }
  scope :pending, -> { where(status: "scheduled").where("scheduled_for <= ?", Time.current) }
  scope :upcoming, -> { where(status: "scheduled").where("scheduled_for > ?", Time.current) }
  scope :by_schedule, -> { order(:scheduled_for) }

  # Computed delivery status for UI
  def delivery_status
    latest_delivery&.status || "pending"
  end

  # Dynamic recipient count - calculated on-the-fly based on current registrations
  def recipient_count
    return 0 unless event

    # Start with all registrations for this event
    recipients = event.registrations.where(email_unsubscribed: false)

    # Apply filter criteria if present
    if filter_criteria.present?
      # Filter by status (e.g., ['approved', 'confirmed'])
      if filter_criteria['status'].present?
        recipients = recipients.where(status: filter_criteria['status'])
      end

      # Filter by vendor category
      if filter_criteria['vendor_category'].present?
        recipients = recipients.where(vendor_category: filter_criteria['vendor_category'])
      end

      # Filter by excluded status
      if filter_criteria['exclude_status'].present?
        recipients = recipients.where.not(status: filter_criteria['exclude_status'])
      end

      # Filter by location
      if filter_criteria['location_city'].present?
        # Note: registrations table doesn't have city field yet
        # This is prepared for future use
      end

      if filter_criteria['location_state'].present?
        # Note: registrations table doesn't have state field yet
        # This is prepared for future use
      end
    end

    recipients.count
  end

  # Check if email can be edited
  def editable?
    status != "sent"
  end

  # Check if email can be sent
  def sendable?
    status == "scheduled" && scheduled_for && scheduled_for <= Time.current
  end
end
