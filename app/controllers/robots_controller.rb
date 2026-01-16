class RobotsController < ApplicationController
  # Skip CSRF protection for robots.txt
  skip_before_action :verify_authenticity_token

  def show
    # Block search engines on voxxyai.com (staging)
    if request.host == "voxxyai.com" || request.host == "www.voxxyai.com"
      render plain: blocking_robots_txt, content_type: "text/plain"
    else
      # Allow search engines on heyvoxxy.com and voxxypresents.com (production)
      render plain: allowing_robots_txt, content_type: "text/plain"
    end
  end

  private

  def blocking_robots_txt
    <<~ROBOTS
      # Staging environment - Block all search engines
      User-agent: *
      Disallow: /
    ROBOTS
  end

  def allowing_robots_txt
    <<~ROBOTS
      # Production environment - Allow all search engines
      User-agent: *
      Allow: /

      # Sitemap for improved crawling
      Sitemap: https://#{request.host}/sitemap.xml
    ROBOTS
  end
end
