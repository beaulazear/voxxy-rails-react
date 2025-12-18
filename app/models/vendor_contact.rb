class VendorContact < ApplicationRecord
  # Associations
  belongs_to :organization
  belongs_to :vendor, optional: true
  belongs_to :registration, optional: true

  # Validations
  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :phone, format: { with: /\A[0-9\-\(\)\s\+\.]*\z/ }, allow_blank: true
  validates :status, inclusion: { in: %w[new contacted interested converted closed] }
  validates :contact_type, inclusion: { in: %w[lead vendor partner client other] }, allow_blank: true

  # Scopes
  scope :by_organization, ->(org_id) { where(organization_id: org_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :by_contact_type, ->(type) { where(contact_type: type) }
  scope :recent, -> { order(created_at: :desc) }
  scope :recently_contacted, -> { where.not(last_contacted_at: nil).order(last_contacted_at: :desc) }
  scope :with_email, -> { where.not(email: nil) }
  scope :with_phone, -> { where.not(phone: nil) }

  # Callbacks
  before_save :normalize_email

  # Instance methods
  def record_interaction!
    update!(
      interaction_count: interaction_count + 1,
      last_contacted_at: Time.current
    )
  end

  def add_tag(tag_name)
    return if tags.include?(tag_name)
    self.tags = (tags || []) << tag_name
    save
  end

  def remove_tag(tag_name)
    return unless tags.include?(tag_name)
    self.tags = (tags || []).reject { |t| t == tag_name }
    save
  end

  def full_contact_info
    [ name, company_name, email, phone ].compact.join(" | ")
  end

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end
