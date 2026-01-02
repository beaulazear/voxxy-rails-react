class EmailCampaignTemplate < ApplicationRecord
  # Associations
  belongs_to :organization, optional: true  # NULL for system templates
  has_many :email_template_items, dependent: :destroy
  has_many :events
  has_many :scheduled_emails

  # Validations
  validates :name, presence: true
  validates :template_type, presence: true, inclusion: { in: %w[system user] }
  validates :name, uniqueness: { scope: :organization_id }
  validate :only_one_system_default

  # Scopes
  scope :system_templates, -> { where(template_type: "system") }
  scope :user_templates, -> { where(template_type: "user") }
  scope :default_template, -> { where(is_default: true).first }
  scope :for_organization, ->(org_id) { where(organization_id: org_id) }

  private

  def only_one_system_default
    if template_type == "system" && is_default?
      existing = EmailCampaignTemplate.where(template_type: "system", is_default: true)
                                      .where.not(id: id)
      if existing.exists?
        errors.add(:is_default, "only one system template can be default")
      end
    end
  end
end
