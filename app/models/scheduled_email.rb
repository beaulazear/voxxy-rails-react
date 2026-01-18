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
  # NOTE: After email is sent, returns the persisted count (actual recipients who received email)
  # Before sending, calculates dynamically based on current filters (for planning purposes)
  def recipient_count
    # If email already sent, use the persisted value (historical accuracy)
    # This prevents the count from changing if registration statuses change after email was sent
    return self[:recipient_count] if status == "sent" && self[:recipient_count].present?

    # Otherwise, calculate current count based on filters (for planning/scheduling)
    calculate_current_recipient_count
  end

  # Calculate how many recipients would receive this email if sent right now
  # Used for planning and showing current counts for scheduled emails
  def calculate_current_recipient_count
    return 0 unless event

    # Special handling for announcement emails - they go to invited vendor contacts, not registrations
    if is_announcement_email?
      return event.event_invitations.count
    end

    # Start with all registrations for this event
    recipients = event.registrations.where(email_unsubscribed: false)

    # Apply filter criteria if present
    if filter_criteria.present?
      # Filter by status (e.g., ['approved', 'confirmed'])
      if filter_criteria["status"].present?
        recipients = recipients.where(status: filter_criteria["status"])
      end

      # Filter by vendor category
      if filter_criteria["vendor_category"].present?
        recipients = recipients.where(vendor_category: filter_criteria["vendor_category"])
      end

      # Filter by excluded status
      if filter_criteria["exclude_status"].present?
        recipients = recipients.where.not(status: filter_criteria["exclude_status"])
      end

      # Filter by location
      if filter_criteria["location_city"].present?
        # Note: registrations table doesn't have city field yet
        # This is prepared for future use
      end

      if filter_criteria["location_state"].present?
        # Note: registrations table doesn't have state field yet
        # This is prepared for future use
      end
    end

    recipients.count
  end

  # Aggregated delivery counts (for sent emails with SendGrid tracking)
  # Returns hash with counts by delivery status
  def delivery_counts
    return {} unless status == "sent"

    {
      total_sent: self[:recipient_count] || 0,
      delivered: email_deliveries.where(status: "delivered").count,
      bounced: email_deliveries.where(status: "bounced").count,
      dropped: email_deliveries.where(status: "dropped").count,
      unsubscribed: email_deliveries.where(status: "unsubscribed").count,
      pending: email_deliveries.where(status: [ "queued", "sent" ]).count
    }
  end

  # Count of emails that failed to deliver (bounced or dropped)
  def undelivered_count
    return 0 unless status == "sent"
    email_deliveries.where(status: [ "bounced", "dropped" ]).count
  end

  # Count of recipients who unsubscribed
  def unsubscribed_count
    return 0 unless status == "sent"
    email_deliveries.where(status: "unsubscribed").count
  end

  # Count of successfully delivered emails
  def delivered_count
    return 0 unless status == "sent"
    email_deliveries.where(status: "delivered").count
  end

  # Delivery success rate as percentage
  def delivery_rate
    return 0.0 unless status == "sent"
    total = self[:recipient_count] || 0
    return 0.0 if total.zero?

    delivered = delivered_count
    (delivered.to_f / total * 100).round(1)
  end

  # Check if email can be edited
  def editable?
    status != "sent"
  end

  # Check if email can be sent
  def sendable?
    status == "scheduled" && scheduled_for && scheduled_for <= Time.current
  end

  private

  # Check if this is an announcement email (goes to invited contacts, not registrations)
  def is_announcement_email?
    # Check if it's an announcement by trigger type
    return true if trigger_type == "on_application_open"

    # Also check by name for backward compatibility
    name.downcase.include?("announcement") || name.downcase.include?("immediate")
  end
end
