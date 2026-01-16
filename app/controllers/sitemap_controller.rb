class SitemapController < ApplicationController
  # Skip authorization for public sitemap
  skip_before_action :authorized

  def show
    # Only generate sitemaps for production domains (not staging)
    if request.host == "voxxyai.com" || request.host == "www.voxxyai.com"
      render plain: "Sitemap not available", status: :not_found
      return
    end

    # Generate sitemap based on the domain
    @base_url = "https://#{request.host}"
    @urls = generate_sitemap_urls

    respond_to do |format|
      format.xml { render template: "sitemap/show", layout: false }
    end
  end

  private

  def generate_sitemap_urls
    urls = []

    # Homepage - highest priority
    urls << {
      loc: @base_url,
      changefreq: "daily",
      priority: 1.0,
      lastmod: Date.today
    }

    # Static pages - adjust based on your actual routes
    static_pages = [
      { path: "/about", priority: 0.8 },
      { path: "/contact", priority: 0.7 },
      { path: "/how-it-works", priority: 0.8 },
      { path: "/faq", priority: 0.7 },
      { path: "/community", priority: 0.6 },
      { path: "/privacy", priority: 0.5 },
      { path: "/terms", priority: 0.5 }
    ]

    static_pages.each do |page|
      urls << {
        loc: "#{@base_url}#{page[:path]}",
        changefreq: "monthly",
        priority: page[:priority],
        lastmod: Date.today
      }
    end

    # Add public activities/events if you want them indexed
    # Uncomment if you have public pages you want indexed:
    # Activity.where(public: true).find_each do |activity|
    #   urls << {
    #     loc: "#{@base_url}/activities/#{activity.id}",
    #     changefreq: "weekly",
    #     priority: 0.6,
    #     lastmod: activity.updated_at.to_date
    #   }
    # end

    urls
  end
end
