# app/controllers/share_controller.rb
class ShareController < ActionController::Base
  include ApplicationHelper

  # Share pages need to be publicly accessible for rich previews
  # Disable CSRF protection for share links since they're GET requests
  skip_before_action :verify_authenticity_token

  def favorite
    @favorite_id = params[:id]
    @name = params[:name]
    @address = params[:address]
    @latitude = params[:lat]
    @longitude = params[:lng]

    # Fetch full details from database if favorite exists
    @favorite = UserActivity.find_by(id: @favorite_id) if @favorite_id.present?

    # Use database values if available, otherwise fall back to URL params
    if @favorite
      @name ||= @favorite.title || @favorite.name || @favorite.activity_name
      @address ||= @favorite.address
      @latitude ||= @favorite.latitude
      @longitude ||= @favorite.longitude
      @description = @favorite.description
      @price_range = @favorite.price_range
      @activity_type = @favorite.activity_type
      @photos = parse_photos(@favorite.photos)
      @share_image = @photos&.first || nil
    end

    # Build rich description for Open Graph
    @og_description = build_og_description

    respond_to do |format|
      format.json do
        render json: {
          id: @favorite_id,
          name: @name,
          address: @address,
          latitude: @latitude,
          longitude: @longitude
        }
      end
      format.html { render :favorite, layout: "share" }
    end
  end

  private

  def parse_photos(photos)
    return [] unless photos
    return photos if photos.is_a?(Array)
    return JSON.parse(photos) if photos.is_a?(String)
    []
  rescue JSON::ParserError
    []
  end

  def build_og_description
    parts = []

    # Activity type context
    if @activity_type.present?
      type_text = case @activity_type.downcase
      when "cocktails" then "🍸 Amazing cocktail bar"
      when "restaurant" then "🍽️ Great restaurant"
      when "brunch" then "🥂 Perfect brunch spot"
      when "coffee" then "☕ Cozy coffee shop"
      else "✨ Great place"
      end
      parts << type_text
    end

    # Price range
    parts << "#{@price_range}" if @price_range.present?

    # Location
    if @address.present?
      short_address = @address.split(",").first(2).join(",")
      parts << "📍 #{short_address}"
    end

    # Description snippet
    if @description.present?
      snippet = @description.length > 100 ? "#{@description[0..97]}..." : @description
      parts << snippet
    end

    parts.join(" • ")
  end
end
