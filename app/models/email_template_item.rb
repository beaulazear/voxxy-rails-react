class EmailTemplateItem < ApplicationRecord
  # Associations
  belongs_to :email_campaign_template, counter_cache: :email_count

  # Validations
  validates :name, presence: true
  validates :subject_template, presence: true
  validates :body_template, presence: true
  validates :trigger_type, presence: true, inclusion: {
    in: %w[
      days_before_event
      days_after_event
      days_before_deadline
      on_event_date
      on_application_open
      on_application_submit
      on_approval
      days_before_payment_deadline
      on_payment_deadline
    ]
  }
  validates :position, numericality: {
    only_integer: true,
    greater_than_or_equal_to: 1,
    less_than_or_equal_to: 40
  }
  validate :max_items_per_template

  # Scopes
  scope :enabled, -> { where(enabled_by_default: true) }
  scope :by_position, -> { order(:position) }
  scope :by_category, ->(category) { where(category: category) }

  private

  def max_items_per_template
    if email_campaign_template && email_campaign_template.email_template_items.count >= 40 && new_record?
      errors.add(:base, "cannot exceed 40 emails per template")
    end
  end
end
