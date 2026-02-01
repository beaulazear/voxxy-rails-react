class Organization < ApplicationRecord
  belongs_to :user
  has_many :events, dependent: :destroy
  has_many :budgets, as: :budgetable, dependent: :destroy
  has_many :vendor_contacts, dependent: :destroy
  has_many :contact_lists, dependent: :destroy
  has_many :email_campaign_templates, dependent: :destroy
  has_many :payment_integrations, dependent: :destroy

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  before_validation :generate_slug, on: :create

  scope :active, -> { where(active: true) }
  scope :verified, -> { where(verified: true) }

  # Eventbrite integration
  def eventbrite_connected?
    eventbrite_api_token.present? && eventbrite_connected
  end

  # Reply-to email for outgoing emails (with fallback chain)
  # Priority: 1) org email, 2) producer's account email, 3) support email
  def reply_to_email
    email.presence || user&.email || "support@voxxypresents.com"
  end

  # Reply-to name for outgoing emails
  def reply_to_name
    name || user&.name
  end

  private

  def generate_slug
    self.slug = name.parameterize if name.present? && slug.blank?
  end
end
