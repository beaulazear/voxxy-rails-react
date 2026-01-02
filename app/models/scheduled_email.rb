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

  # Check if email can be edited
  def editable?
    status != "sent"
  end

  # Check if email can be sent
  def sendable?
    status == "scheduled" && scheduled_for && scheduled_for <= Time.current
  end
end
