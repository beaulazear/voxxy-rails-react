class EmailUnsubscribe < ApplicationRecord
  SCOPES = %w[event organization global].freeze
  SOURCES = %w[user_action sendgrid_webhook admin_action].freeze

  belongs_to :event, optional: true
  belongs_to :organization, optional: true

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :scope, presence: true, inclusion: { in: SCOPES }
  validates :unsubscribed_at, presence: true
  validates :unsubscribe_source, inclusion: { in: SOURCES }, allow_nil: true

  # Conditional validations based on scope
  validates :event_id, presence: true, if: -> { scope == "event" }
  validates :organization_id, presence: true, if: -> { scope == "organization" }
  validates :event_id, absence: true, if: -> { scope == "global" }
  validates :organization_id, absence: true, if: -> { scope == "global" }

  # Uniqueness validations
  validates :event_id, uniqueness: { scope: :email }, if: -> { scope == "event" && event_id.present? }
  validates :organization_id, uniqueness: { scope: :email }, if: -> { scope == "organization" && organization_id.present? }
  validates :email, uniqueness: true, if: -> { scope == "global" }

  before_validation :normalize_email
  before_validation :set_unsubscribed_at, on: :create

  scope :global, -> { where(scope: "global") }
  scope :for_event, ->(event) { where(scope: "event", event_id: event.id) }
  scope :for_organization, ->(org) { where(scope: "organization", organization_id: org.id) }
  scope :for_email, ->(email) {
    # Handle both single email string and array of emails
    if email.is_a?(Array)
      # Normalize all emails in the array
      normalized_emails = email.map { |e| e.to_s.downcase.strip }.compact.uniq
      where(email: normalized_emails)
    else
      # Single email string
      where(email: email.to_s.downcase.strip)
    end
  }

  # Check if an email is unsubscribed from a specific event
  def self.unsubscribed_from_event?(email, event)
    normalized_email = email.downcase.strip
    for_email(normalized_email).where(
      "(scope = 'event' AND event_id = ?) OR (scope = 'organization' AND organization_id = ?) OR scope = 'global'",
      event.id,
      event.organization_id
    ).exists?
  end

  # Check if an email is unsubscribed from an organization
  def self.unsubscribed_from_organization?(email, organization)
    normalized_email = email.downcase.strip
    for_email(normalized_email).where(
      "(scope = 'organization' AND organization_id = ?) OR scope = 'global'",
      organization.id
    ).exists?
  end

  # Check if an email is globally unsubscribed
  def self.unsubscribed_globally?(email)
    normalized_email = email.downcase.strip
    for_email(normalized_email).global.exists?
  end

  # Check if an email applies to a given event and organization
  def applies_to?(event, organization)
    case scope
    when "event"
      event_id == event.id
    when "organization"
      organization_id == organization.id
    when "global"
      true
    else
      false
    end
  end

  # Create or find unsubscribe record
  def self.create_or_find_unsubscribe(email:, scope:, event: nil, organization: nil, source: "user_action")
    normalized_email = email.downcase.strip

    attrs = {
      email: normalized_email,
      scope: scope,
      unsubscribe_source: source
    }

    attrs[:event_id] = event.id if event && scope == "event"
    attrs[:organization_id] = organization.id if organization && scope == "organization"

    # Try to find existing record first
    existing = case scope
    when "event"
      find_by(email: normalized_email, scope: "event", event_id: event.id)
    when "organization"
      find_by(email: normalized_email, scope: "organization", organization_id: organization.id)
    when "global"
      find_by(email: normalized_email, scope: "global")
    end

    existing || create!(attrs)
  end

  # Resubscribe - delete the unsubscribe record to allow emails again
  def self.resubscribe(email:, scope:, event: nil, organization: nil)
    normalized_email = email.downcase.strip

    record = case scope
    when "event"
      find_by(email: normalized_email, scope: "event", event_id: event&.id)
    when "organization"
      find_by(email: normalized_email, scope: "organization", organization_id: organization&.id)
    when "global"
      find_by(email: normalized_email, scope: "global")
    end

    if record
      record.destroy!

      # If was globally unsubscribed, also update Registration records
      if scope == "global" && event
        event.registrations.where(email: normalized_email).update_all(email_unsubscribed: false)
      end

      true
    else
      false
    end
  end

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end

  def set_unsubscribed_at
    self.unsubscribed_at ||= Time.current
  end
end
