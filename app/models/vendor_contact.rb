class VendorContact < ApplicationRecord
  # Associations
  belongs_to :organization
  belongs_to :vendor, optional: true
  belongs_to :registration, optional: true
  has_many :event_invitations, dependent: :destroy
  has_many :invited_events, through: :event_invitations, source: :event
  belongs_to :payment_transaction, optional: true
  has_many :payment_transactions, foreign_key: :contact_id

  # Validations
  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :phone, format: { with: /\A[0-9\-\(\)\s\+\.]*\z/ }, allow_blank: true
  validates :status, inclusion: { in: %w[new contacted interested converted closed] }
  validates :contact_type, inclusion: { in: %w[lead vendor partner client other] }, allow_blank: true
  validates :website, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]), message: "must be a valid URL" }, allow_blank: true
  validates :instagram_handle, format: { with: /\A@?[\w\.]+\z/, message: "must be a valid Instagram handle" }, allow_blank: true
  validates :tiktok_handle, format: { with: /\A@?[\w\.]+\z/, message: "must be a valid TikTok handle" }, allow_blank: true

  # Enums
  enum payment_status: { pending: 0, paid: 1, refunded: 2, cancelled: 3 }

  # Scopes
  scope :by_organization, ->(org_id) { where(organization_id: org_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :by_contact_type, ->(type) { where(contact_type: type) }
  scope :by_location, ->(location) { where("location ILIKE ?", "%#{location}%") }
  scope :by_category, ->(category) { where("categories @> ?", [ category ].to_json) }
  scope :by_tags, ->(tags) {
    # Match ANY of the provided tags (OR operation)
    conditions = tags.map { "tags @> ?" }.join(" OR ")
    values = tags.map { |tag| [ tag ].to_json }
    where(conditions, *values)
  }
  scope :featured, -> { where(featured: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :recently_contacted, -> { where.not(last_contacted_at: nil).order(last_contacted_at: :desc) }
  scope :with_email, -> { where.not(email: nil) }
  scope :with_phone, -> { where.not(phone: nil) }
  scope :payment_pending, -> { where(payment_status: :pending) }
  scope :payment_paid, -> { where(payment_status: :paid) }

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
    [ name, business_name, email, phone ].compact.join(" | ")
  end

  def add_category(category_name)
    return if categories.include?(category_name)
    self.categories = (categories || []) << category_name
    save
  end

  def remove_category(category_name)
    return unless categories.include?(category_name)
    self.categories = (categories || []).reject { |c| c == category_name }
    save
  end

  def toggle_featured!
    update!(featured: !featured)
  end

  def social_links
    {
      instagram: instagram_handle ? "https://instagram.com/#{instagram_handle.delete_prefix('@')}" : nil,
      tiktok: tiktok_handle ? "https://tiktok.com/@#{tiktok_handle.delete_prefix('@')}" : nil,
      website: website
    }.compact
  end

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end
