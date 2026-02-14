class Event < ApplicationRecord
  belongs_to :organization
  has_many :registrations, dependent: :destroy
  has_many :vendor_applications, dependent: :destroy
  has_many :event_invitations, dependent: :destroy
  has_many :invited_contacts, through: :event_invitations, source: :vendor_contact
  has_one :budget, as: :budgetable, dependent: :destroy
  has_one :event_portal, dependent: :destroy
  has_many :bulletins, dependent: :destroy

  # Email automation associations
  belongs_to :email_campaign_template, optional: true
  has_many :scheduled_emails, dependent: :destroy
  has_many :email_deliveries, dependent: :destroy  # Direct association - deletes ALL email deliveries (scheduled + invitations)
  has_many :email_unsubscribes, dependent: :destroy
  has_many :unsubscribe_tokens, dependent: :delete_all

  # Payment integration associations
  has_many :payment_integrations, dependent: :destroy
  has_many :payment_transactions, dependent: :destroy

  validates :title, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[draft published cancelled completed] }, allow_blank: true
  validates :application_deadline, presence: true, on: :create
  validate :application_deadline_before_event_date, if: :application_deadline_changed?

  before_validation :generate_slug, on: :create
  before_save :update_registration_status
  after_create :assign_email_template_and_generate_emails
  after_create :create_event_portal

  scope :published, -> { where(published: true) }
  scope :upcoming, -> { where("event_date > ?", Time.current).order(event_date: :asc) }
  scope :past, -> { where("event_date <= ?", Time.current).order(event_date: :desc) }

  def full?
    capacity.present? && registered_count >= capacity
  end

  def spots_remaining
    return nil unless capacity.present?
    capacity - registered_count
  end

  def active_vendor_application
    vendor_applications.active.first
  end

  def has_vendor_application?
    vendor_applications.active.exists?
  end

  # Check if event details that would trigger notification emails have changed
  def details_changed_requiring_notification?
    saved_change_to_event_date? ||
    saved_change_to_venue? ||
    saved_change_to_location? ||
    saved_change_to_start_time? ||
    saved_change_to_end_time?
  end

  # Returns hash with information about what changed
  def event_change_info
    return nil unless details_changed_requiring_notification?

    changes = {}
    changes[:event_date] = { old: saved_change_to_event_date[0], new: saved_change_to_event_date[1] } if saved_change_to_event_date?
    changes[:venue] = { old: saved_change_to_venue[0], new: saved_change_to_venue[1] } if saved_change_to_venue?
    changes[:location] = { old: saved_change_to_location[0], new: saved_change_to_location[1] } if saved_change_to_location?
    changes[:start_time] = { old: saved_change_to_start_time[0], new: saved_change_to_start_time[1] } if saved_change_to_start_time?
    changes[:end_time] = { old: saved_change_to_end_time[0], new: saved_change_to_end_time[1] } if saved_change_to_end_time?

    {
      changed_fields: changes.keys,
      changes: changes,
      changed_at: updated_at
    }
  end

  # Check if event was just canceled
  def just_canceled?
    saved_change_to_status? && status == "cancelled"
  end

  # Count how many people would receive emails
  def email_notification_count
    registrations.where(email_unsubscribed: false).count
  end

  private

  def generate_slug
    self.slug = title.parameterize if title.present? && slug.blank?
  end

  def update_registration_status
    self.registration_open = false if full?
  end

  def application_deadline_before_event_date
    return unless application_deadline.present? && event_date.present?

    if application_deadline > event_date
      errors.add(:application_deadline, "must be on or before the event start date")
    end
  end

  def assign_email_template_and_generate_emails
    # If template not already assigned, assign one
    if email_campaign_template.blank?
      # Try to find organization's default template first
      template = organization.email_campaign_templates.find_by(is_default: true) if organization

      # Fallback to system default template
      template ||= EmailCampaignTemplate.default_template

      # If no template found, skip email generation gracefully
      return unless template

      # Assign the template
      update_column(:email_campaign_template_id, template.id)
    end

    # Generate scheduled emails (whether template was just assigned or already present)
    generate_scheduled_emails
  rescue => e
    # Log error but don't fail event creation
    Rails.logger.error("Failed to generate scheduled emails for event #{id}: #{e.message}")
  end

  def generate_scheduled_emails
    return unless email_campaign_template

    generator = ScheduledEmailGenerator.new(self)
    emails = generator.generate

    Rails.logger.info("Generated #{emails.count} scheduled emails for event #{id}")

    # Log any errors from generation
    generator.errors.each do |error|
      Rails.logger.warn("Email generation warning for event #{id}: #{error}")
    end

    emails
  rescue => e
    Rails.logger.error("Failed to generate scheduled emails for event #{id}: #{e.message}")
    []
  end

  def create_event_portal
    EventPortal.create!(event: self)
  rescue => e
    Rails.logger.error("Failed to create event portal for event #{id}: #{e.message}")
  end
end
