module ApplicationHelper
  def app_base_url
    if Rails.env.production?
      primary_domain = ENV.fetch("PRIMARY_DOMAIN", "voxxyai.com")
      "https://#{primary_domain}"
    else
      "http://localhost:3000"
    end
  end
end
