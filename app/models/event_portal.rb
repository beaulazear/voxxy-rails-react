class EventPortal < ApplicationRecord
  belongs_to :event

  # Generate portal URL using event slug, with optional email parameter for pre-filling
  def portal_url(email = nil, base_url = nil)
    base_url ||= presents_frontend_url
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
end
