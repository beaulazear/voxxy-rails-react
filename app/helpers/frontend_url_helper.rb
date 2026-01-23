module FrontendUrlHelper
  # Get the correct Voxxy Presents frontend URL based on environment
  # This ensures consistent URL generation across invitations, unsubscribe links, etc.
  def self.presents_frontend_url
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
