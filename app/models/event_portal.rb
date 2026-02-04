class EventPortal < ApplicationRecord
  belongs_to :event

  # Validations
  validates :access_token, presence: true, uniqueness: true

  # Callbacks
  before_validation :generate_access_token, on: :create

  # Generate portal URL using secure access token (primary method)
  def portal_url(email = nil, base_url = nil)
    base_url ||= FrontendUrlHelper.presents_frontend_url
    url = "#{base_url}/portal/#{access_token}"
    url += "?email=#{CGI.escape(email)}" if email.present?
    url
  end

  # Legacy: Generate portal URL using event slug (deprecated, keep for backward compatibility)
  def portal_url_by_slug(email = nil, base_url = nil)
    base_url ||= FrontendUrlHelper.presents_frontend_url
    url = "#{base_url}/portal/#{event.slug}"
    url += "?email=#{CGI.escape(email)}" if email.present?
    url
  end

  # Track when a vendor views the portal
  def track_view!
    increment!(:view_count)
    touch(:last_viewed_at)
  end

  private

  # Generate a secure unique token for portal access
  def generate_access_token
    self.access_token ||= SecureRandom.urlsafe_base64(32)
  end
end
