# app/controllers/photos_controller.rb
require "net/http"
require "uri"

class PhotosController < ApplicationController
  # Allow public access to photos for sharing/embedding
  skip_before_action :authorized, only: [ :show ]

  # Add rate limiting to prevent abuse
  before_action :check_rate_limit, only: [ :show ]

  def show
    photo_reference = params[:photo_reference]
    max_width = params[:max_width] || 400

    if photo_reference.blank?
      return render json: { error: "Photo reference required" }, status: :bad_request
    end

    # Validate photo_reference format (Google photo references are alphanumeric with specific characters)
    unless photo_reference.match?(/\A[A-Za-z0-9_-]+\z/)
      return render json: { error: "Invalid photo reference format" }, status: :bad_request
    end

    # Validate max_width to prevent abuse
    max_width = max_width.to_i
    max_width = 400 if max_width <= 0 || max_width > 1600

    # Check if this photo reference exists in our database (optional security measure)
    # Temporarily disabled for testing - uncomment for production
    # unless photo_reference_exists?(photo_reference)
    #   return render json: { error: 'Photo not found in our system' }, status: :not_found
    # end

    begin
      # Make request to Google Places API with our server-side key
      google_url = "https://maps.googleapis.com/maps/api/place/photo?" \
                  "maxwidth=#{max_width}&photo_reference=#{photo_reference}&key=#{ENV['PLACES_KEY']}"

      uri = URI(google_url)

      # Use Net::HTTP to fetch the image
      Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
        request = Net::HTTP::Get.new(uri)
        response = http.request(request)

        if response.is_a?(Net::HTTPSuccess)
          # Set caching headers
          response_headers = {
            "Cache-Control" => "public, max-age=86400", # Cache for 24 hours
            "Content-Type" => response["content-type"] || "image/jpeg"
          }

          # Forward the image data to the client
          send_data response.body,
                   type: response["content-type"] || "image/jpeg",
                   disposition: "inline",
                   filename: "photo_#{photo_reference[0..10]}.jpg"

          # Set response headers after send_data
          response_headers.each { |key, value| response.headers[key] = value }

        elsif response.is_a?(Net::HTTPRedirection)
          # Google sometimes returns redirects, follow them
          redirect_url = response["location"]
          redirect_uri = URI(redirect_url)

          Net::HTTP.start(redirect_uri.host, redirect_uri.port, use_ssl: true) do |redirect_http|
            redirect_request = Net::HTTP::Get.new(redirect_uri)
            redirect_response = redirect_http.request(redirect_request)

            if redirect_response.is_a?(Net::HTTPSuccess)
              send_data redirect_response.body,
                       type: redirect_response["content-type"] || "image/jpeg",
                       disposition: "inline",
                       filename: "photo_#{photo_reference[0..10]}.jpg"
            else
              render json: { error: "Photo not found" }, status: :not_found
            end
          end
        else
          render json: { error: "Photo not found" }, status: :not_found
        end
      end

    rescue => e
      Rails.logger.error "Photo proxy error: #{e.message}"
      render json: { error: "Failed to load photo" }, status: :internal_server_error
    end
  end

  private

  def check_rate_limit
    # Simple rate limiting: 100 photo requests per IP per hour
    cache_key = "photo_rate_limit:#{request.remote_ip}"
    current_count = Rails.cache.read(cache_key) || 0

    if current_count >= 100
      render json: { error: "Rate limit exceeded" }, status: :too_many_requests
      return
    end

    Rails.cache.write(cache_key, current_count + 1, expires_in: 1.hour)
  end

  def photo_reference_exists?(photo_reference)
    # Robust check that handles different data types Rails might return
    # Use a simple database search for the photo reference
    begin
      # Search for the photo reference in the photos JSON column
      # This works regardless of whether Rails deserializes the JSON or not
      PinnedActivity.where("photos::text LIKE ?", "%\"#{photo_reference}\"%").exists?
    rescue => e
      Rails.logger.warn "Photo reference validation failed: #{e.message}"
      # If validation fails, allow the request (fail open for usability)
      true
    end
  end
end
