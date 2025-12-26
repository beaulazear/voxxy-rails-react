class VendorApplication < ApplicationRecord
  belongs_to :event
  has_many :registrations, dependent: :nullify

  validates :name, presence: true
  validates :status, inclusion: { in: %w[active inactive] }
  validates :shareable_code, presence: true, uniqueness: true
  validates :booth_price, presence: true, numericality: { greater_than_or_equal_to: 0 }, on: :create

  before_validation :generate_shareable_code, on: :create

  scope :active, -> { where(status: "active") }
  scope :inactive, -> { where(status: "inactive") }
  scope :recent, -> { order(created_at: :desc) }

  # Add a category to the application
  def add_category(category_name)
    return if categories.include?(category_name)
    self.categories ||= []
    self.categories << category_name
    save
  end

  # Remove a category from the application
  def remove_category(category_name)
    return unless categories.include?(category_name)
    self.categories.delete(category_name)
    save
  end

  # Check if application accepts submissions
  def accepting_submissions?
    status == "active"
  end

  # Get submissions grouped by status
  def submissions_by_status
    registrations.group(:status).count
  end

  # Get submissions filtered by category
  def submissions_by_category(category)
    registrations.where(vendor_category: category)
  end

  # Generate shareable link for this application
  def shareable_url(base_url = nil)
    base_url ||= presents_frontend_url
    "#{base_url}/apply/#{shareable_code}"
  end

  private

  # Get the correct Voxxy Presents frontend URL based on environment
  def presents_frontend_url
    if Rails.env.production?
      primary_domain = ENV.fetch("PRIMARY_DOMAIN", "voxxyai.com")
      if primary_domain.include?("voxxyai.com")
        # Staging environment
        "https://voxxy-presents-client-staging.onrender.com"
      else
        # Production environment
        "https://www.voxxypresents.com"
      end
    else
      ENV.fetch("FRONTEND_URL", "http://localhost:5173")
    end
  end

  # Generate a unique shareable code
  # Format: EVENT-YYYYMM-RANDOM (e.g., EVENT-202511-A1B2C3)
  def generate_shareable_code
    return if shareable_code.present?

    loop do
      # Create a readable code: EVENT-202511-A1B2C3
      date_part = Time.current.strftime("%Y%m")
      random_part = SecureRandom.alphanumeric(6).upcase
      code = "EVENT-#{date_part}-#{random_part}"

      # Check uniqueness
      unless VendorApplication.exists?(shareable_code: code)
        self.shareable_code = code
        break
      end
    end
  end
end
