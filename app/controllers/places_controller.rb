class PlacesController < ApplicationController
  skip_before_action :authorized, only: [ :photo, :search, :details ]

  require "net/http"
  require "uri"
  require "json"

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

  # GET /places/search?query=Brooklyn&types=geocode
  # Valid types:
  #   - "geocode" for all geographic locations (includes neighborhoods)
  #   - "(cities)" for cities only
  #   - "(regions)" for administrative areas
  #   - "address" for precise addresses
  def search
    query = params[:query]
    types = params[:types] || "(cities)"  # Default to cities if not specified

    if query.blank? || query.length < 2
      render json: { results: [] }, status: :ok
      return
    end

    begin
      results = google_places_search(query, types)
      render json: { results: results }, status: :ok
    rescue StandardError => e
      Rails.logger.error "Google Places search error: #{e.message}"
      render json: { error: "Location search failed" }, status: :internal_server_error
    end
  end

  # GET /places/details?place_id=ChIJ...
  def details
    place_id = params[:place_id]

    if place_id.blank?
      render json: { error: "Place ID is required" }, status: :bad_request
      return
    end

    begin
      details = google_places_details(place_id)
      render json: { details: details }, status: :ok
    rescue StandardError => e
      Rails.logger.error "Google Places details error: #{e.message}"
      render json: { error: "Place details fetch failed" }, status: :internal_server_error
    end
  end

  private

  def google_places_search(query, types = "(cities)")
    api_key = ENV["PLACES_KEY"]
    return [] if api_key.blank?

    uri = URI("https://maps.googleapis.com/maps/api/place/autocomplete/json")
    params = {
      input: query,
      types: types,
      language: "en",
      key: api_key
    }
    uri.query = URI.encode_www_form(params)

    Rails.logger.info "Places API search request: query=#{query}, types=#{types}"

    response = Net::HTTP.get_response(uri)

    if response.code == "200"
      data = JSON.parse(response.body)

      if data["status"] == "OK"
        # Transform the results to match our mobile app expectations
        data["predictions"].map do |prediction|
          {
            place_id: prediction["place_id"],
            description: prediction["description"],
            structured_formatting: prediction["structured_formatting"],
            types: prediction["types"]
          }
        end
      else
        Rails.logger.error "Google Places API error: #{data['status']} - #{data['error_message']}"
        []
      end
    else
      Rails.logger.error "Google Places HTTP error: #{response.code} - #{response.body}"
      []
    end
  end

  def google_places_details(place_id, fields = "geometry,address_components,formatted_address")
    api_key = ENV["PLACES_KEY"]
    return nil if api_key.blank?

    uri = URI("https://maps.googleapis.com/maps/api/place/details/json")
    params = {
      place_id: place_id,
      fields: fields,
      key: api_key
    }
    uri.query = URI.encode_www_form(params)

    Rails.logger.info "Places API details request: place_id=#{place_id}"

    response = Net::HTTP.get_response(uri)

    if response.code == "200"
      data = JSON.parse(response.body)

      if data["status"] == "OK"
        data["result"]
      else
        Rails.logger.error "Google Places Details API error: #{data['status']} - #{data['error_message']}"
        nil
      end
    else
      Rails.logger.error "Google Places Details HTTP error: #{response.code} - #{response.body}"
      nil
    end
  end
end
