# app/services/google_places_service.rb
require "net/http"
require "uri"
require "cgi"

class GooglePlacesService
  def self.api_key
    @api_key ||= ENV["PLACES_KEY"]
  end

  # Class-level cache for place details (shared across requests)
  def self.place_cache
    @place_cache ||= {}
  end

  def self.find_place_by_name_and_address(name, address)
    query = CGI.escape("#{name} #{address}")
    cache_key = "find_place_#{query}"

    place_cache[cache_key] ||= begin
      Rails.logger.info "🔍 Google Places API: Finding place for '#{name}' at '#{address}'"

      find_place_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?" \
                      "input=#{query}&inputtype=textquery&fields=place_id&key=#{api_key}"

      response = Net::HTTP.get_response(URI(find_place_url))
      data = JSON.parse(response.body)

      if data["candidates"] && data["candidates"].any?
        data["candidates"].first["place_id"]
      else
        nil
      end
    rescue => e
      Rails.logger.error "❌ Google Places Find Place failed for #{name}: #{e.message}"
      nil
    end
  end

  def self.get_place_details(place_id, fields = [ "photos", "reviews" ])
    return nil unless place_id

    # Memoize place details per place_id
    place_cache[place_id] ||= begin
      Rails.logger.info "📸 Google Places API: Fetching details for place #{place_id}"

      fields_param = fields.join(",")
      details_url = "https://maps.googleapis.com/maps/api/place/details/json?" \
                   "place_id=#{place_id}&fields=#{fields_param}&key=#{api_key}"

      response = Net::HTTP.get_response(URI(details_url))
      data = JSON.parse(response.body)

      if data["result"]
        # Convert photo references to internal proxy URLs (API key stays hidden)
        processed_photos = (data["result"]["photos"] || []).map do |photo|
          photo_ref = photo["photo_reference"]
          photo.merge(
            "photo_url" => internal_photo_url(photo_ref, 400),
            "photo_url_small" => internal_photo_url(photo_ref, 200),
            "photo_url_large" => internal_photo_url(photo_ref, 800),
            # Keep photo_reference for potential future use, but don't expose it in URLs
            "photo_reference" => photo_ref
          )
        end

        {
          photos: processed_photos,
          reviews: data["result"]["reviews"] || []
        }
      else
        { photos: [], reviews: [] }
      end
    rescue => e
      Rails.logger.error "❌ Google Places Details failed for #{place_id}: #{e.message}"
      { photos: [], reviews: [] }
    end
  end

  def self.enrich_place_data(name, address)
    place_id = find_place_by_name_and_address(name, address)
    return { photos: [], reviews: [] } unless place_id

    get_place_details(place_id)
  end

  def self.photo_url(photo_reference, max_width = 400)
    "https://maps.googleapis.com/maps/api/place/photo?" \
    "maxwidth=#{max_width}&photo_reference=#{photo_reference}&key=#{api_key}"
  end

  # Generate internal photo URLs that proxy through our backend (keeps API key hidden)
  def self.internal_photo_url(photo_reference, max_width = 400)
    # Build the base URL based on environment
    if Rails.env.development?
      base_url = "http://localhost:3001"
    else
      protocol = Rails.application.config.force_ssl ? "https" : "http"
      host = Rails.application.config.action_mailer.default_url_options[:host] || "localhost:3001"
      base_url = "#{protocol}://#{host}"
    end

    "#{base_url}/photos/#{photo_reference}?max_width=#{max_width}"
  end
end
