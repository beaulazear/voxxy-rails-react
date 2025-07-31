class PlacesController < ApplicationController
  skip_before_action :authorized, only: [ :photo ]

  # Proxy endpoint for Google Places photos to keep API key secure
  def photo
    photo_reference = params[:photo_reference]
    max_width = params[:max_width] || 400

    # Validate parameters
    if photo_reference.blank?
      return render json: { error: "Photo reference is required" }, status: :bad_request
    end

    # Validate max_width is a reasonable number
    max_width = max_width.to_i
    if max_width <= 0 || max_width > 1600
      max_width = 400
    end

    # Check if Google Places API key is configured
    api_key = ENV["PLACES_KEY"]
    if api_key.blank?
      Rails.logger.error "Google Places API key not configured"
      return render json: { error: "Service temporarily unavailable" }, status: :service_unavailable
    end

    begin
      # Build Google Places API URL
      google_url = "https://maps.googleapis.com/maps/api/place/photo?" \
                  "maxwidth=#{max_width}&photo_reference=#{photo_reference}&key=#{api_key}"

      # Log the request for monitoring (without exposing the API key)
      Rails.logger.info "Places API photo request: reference=#{photo_reference}, width=#{max_width}"

      # Redirect to Google's API (they handle caching, CDN, etc.)
      redirect_to google_url, allow_other_host: true

    rescue => e
      Rails.logger.error "Places API proxy error: #{e.message}"
      render json: { error: "Unable to fetch photo" }, status: :internal_server_error
    end
  end
end
