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
      @name ||= @favorite.title
      @address ||= @favorite.address
      @latitude ||= @favorite.latitude
      @longitude ||= @favorite.longitude
      @description = @favorite.description
      @reason = @favorite.reason
      @price_range = @favorite.price_range
      @website = @favorite.website
      @hours = @favorite.hours

      # Get activity type from pinned_activity if available
      @activity_type = @favorite.pinned_activity&.activity&.activity_type

      # Parse photos and reviews
      @photos = parse_photos(@favorite.photos)
      @reviews = parse_reviews(@favorite.reviews)
      @share_image = @photos&.first&.dig("photo_url") || nil
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

  def parse_reviews(reviews)
    return [] unless reviews
    return reviews if reviews.is_a?(Array)
    return JSON.parse(reviews) if reviews.is_a?(String)
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

    # Average rating from reviews
    if @reviews.present? && @reviews.any?
      ratings = @reviews.map { |r| (r["rating"] || r[:rating]).to_f }.compact
      if ratings.any?
        avg_rating = (ratings.sum / ratings.size).round(1)
        parts << "⭐ #{avg_rating}/5 (#{ratings.size} reviews)"
      end
    end

    # Description snippet or reason
    description_text = @description.presence || @reason.presence
    if description_text.present?
      snippet = description_text.length > 100 ? "#{description_text[0..97]}..." : description_text
      parts << snippet
    end

    parts.join(" • ")
  end
end
