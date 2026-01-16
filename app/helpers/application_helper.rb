module ApplicationHelper
  def app_base_url
    if Rails.env.production?
      primary_domain = ENV.fetch("PRIMARY_DOMAIN", "voxxyai.com")
      "https://#{primary_domain}"
    else
      "http://localhost:3000"
    end
  end

  # SEO Helper Methods
  # Use these in your controllers to set custom page titles and descriptions:
  #
  # Example in a controller:
  #   def show
  #     @event = Event.find(params[:id])
  #     set_meta_tags(
  #       title: "#{@event.title} | Voxxy Events",
  #       description: @event.description,
  #       og_image: @event.image_url
  #     )
  #   end

  def set_meta_tags(title: nil, description: nil, keywords: nil, og_title: nil, og_description: nil, og_image: nil, twitter_title: nil, twitter_description: nil, twitter_image: nil)
    content_for(:title, title) if title
    content_for(:description, description) if description
    content_for(:keywords, keywords) if keywords
    content_for(:og_title, og_title || title) if og_title || title
    content_for(:og_description, og_description || description) if og_description || description
    content_for(:og_image, og_image) if og_image
    content_for(:twitter_title, twitter_title || title) if twitter_title || title
    content_for(:twitter_description, twitter_description || description) if twitter_description || description
    content_for(:twitter_image, twitter_image || og_image) if twitter_image || og_image
  end

  def page_title(title = nil)
    base_title = "Voxxy"
    if title.present?
      "#{title} | #{base_title}"
    else
      "#{base_title} - AI-Powered Group Planning & Event Coordination"
    end
  end

  def is_production_domain?
    request.host == "heyvoxxy.com" ||
      request.host == "www.heyvoxxy.com" ||
      request.host == "voxxypresents.com" ||
      request.host == "www.voxxypresents.com"
  end

  def is_staging_domain?
    request.host == "voxxyai.com" || request.host == "www.voxxyai.com"
  end
end
