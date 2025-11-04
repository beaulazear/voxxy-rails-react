class Vendor < ApplicationRecord
  belongs_to :user
  has_many :budget_line_items, dependent: :nullify

  VENDOR_TYPES = %w[venue catering entertainment market_vendor].freeze

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :vendor_type, inclusion: { in: VENDOR_TYPES }
  validates :contact_email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  before_validation :generate_slug, on: :create

  scope :active, -> { where(active: true) }
  scope :verified, -> { where(verified: true) }
  scope :by_type, ->(type) { where(vendor_type: type) }

  def increment_views!
    increment!(:views_count)
  end

  private

  def generate_slug
    self.slug = name.parameterize if name.present? && slug.blank?
  end
end
