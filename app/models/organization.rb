class Organization < ApplicationRecord
  belongs_to :user
  has_many :events, dependent: :destroy
  has_many :budgets, as: :budgetable, dependent: :destroy
  has_many :vendor_contacts, dependent: :destroy
  has_many :email_campaign_templates, dependent: :destroy

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  before_validation :generate_slug, on: :create

  scope :active, -> { where(active: true) }
  scope :verified, -> { where(verified: true) }

  private

  def generate_slug
    self.slug = name.parameterize if name.present? && slug.blank?
  end
end
