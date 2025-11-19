class Event < ApplicationRecord
  belongs_to :organization
  has_many :registrations, dependent: :destroy
  has_many :vendor_applications, dependent: :destroy
  has_one :budget, as: :budgetable, dependent: :destroy

  validates :title, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[draft published cancelled completed] }, allow_blank: true

  before_validation :generate_slug, on: :create
  before_save :update_registration_status

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

  private

  def generate_slug
    self.slug = title.parameterize if title.present? && slug.blank?
  end

  def update_registration_status
    self.registration_open = false if full?
  end
end
