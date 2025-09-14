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
      Rails.logger.error "Google Places Find Place failed for #{name}: #{e.message}" if Rails.env.development?
      nil
    end
  end

  def self.get_place_details(place_id, fields = [ "photos", "reviews" ])
    return nil unless place_id

    # Memoize place details per place_id
    place_cache[place_id] ||= begin
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
      Rails.logger.error "Google Places Details failed for #{place_id}: #{e.message}" if Rails.env.development?
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

  def self.nearby_search(location, type, radius_meters = 16093, min_rating = 3.5, keyword = nil)
    cache_key = "nearby_#{location}_#{type}_#{radius_meters}_#{min_rating}_#{keyword}"

    place_cache[cache_key] ||= begin
      # First, geocode the location to get coordinates
      geocode_url = "https://maps.googleapis.com/maps/api/geocode/json?" \
                    "address=#{CGI.escape(location)}&key=#{api_key}"

      geocode_response = Net::HTTP.get_response(URI(geocode_url))
      geocode_data = JSON.parse(geocode_response.body)

      if geocode_data["results"].empty?
        Rails.logger.error "Could not geocode location: #{location}" if Rails.env.development?
        return []
      end

      lat = geocode_data["results"][0]["geometry"]["location"]["lat"]
      lng = geocode_data["results"][0]["geometry"]["location"]["lng"]

      # Now search for nearby places
      nearby_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?" \
                   "location=#{lat},#{lng}&radius=#{radius_meters}&type=#{type}"

      # Add keyword parameter if provided
      nearby_url += "&keyword=#{CGI.escape(keyword)}" if keyword.present?
      nearby_url += "&key=#{api_key}"

      all_venues = []
      next_page_token = nil

      # Google Places returns max 20 results per page, up to 60 total
      3.times do |page|
        url = next_page_token ? "#{nearby_url}&pagetoken=#{next_page_token}" : nearby_url

        # Wait a bit between page requests (Google requires this for pagination)
        sleep(2) if next_page_token

        response = Net::HTTP.get_response(URI(url))
        data = JSON.parse(response.body)

        if data["status"] == "OK" && data["results"]
          venues = data["results"].map do |place|
            {
              place_id: place["place_id"],
              name: place["name"],
              address: place["vicinity"] || place["formatted_address"],
              rating: place["rating"],
              user_ratings_total: place["user_ratings_total"],
              price_level: place["price_level"],
              business_status: place["business_status"],
              types: place["types"],
              location: {
                lat: place["geometry"]["location"]["lat"],
                lng: place["geometry"]["location"]["lng"]
              },
              photos: place["photos"] ? place["photos"][0] : nil,
              opening_hours: place["opening_hours"]
            }
          end

          all_venues.concat(venues)
          next_page_token = data["next_page_token"]

          break unless next_page_token
        else
          Rails.logger.warn "Nearby search returned status: #{data["status"]}" if Rails.env.development?
          break
        end
      end

      # Filter venues by rating and operational status
      filtered_venues = all_venues.select do |venue|
        is_operational = venue[:business_status] == "OPERATIONAL"
        has_good_rating = venue[:rating].nil? || venue[:rating] >= min_rating
        has_enough_reviews = venue[:user_ratings_total].nil? || venue[:user_ratings_total] >= 10

        is_operational && has_good_rating && has_enough_reviews
      end

      filtered_venues
    rescue => e
      Rails.logger.error "Google Places Nearby Search failed: #{e.message}" if Rails.env.development?
      []
    end
  end

  def self.get_detailed_venue_info(place_id)
    return nil unless place_id

    cache_key = "detailed_#{place_id}"

    place_cache[cache_key] ||= begin
      fields = "place_id,name,formatted_address,formatted_phone_number,opening_hours,website," \
               "rating,user_ratings_total,price_level,business_status,types,reviews,photos"

      details_url = "https://maps.googleapis.com/maps/api/place/details/json?" \
                    "place_id=#{place_id}&fields=#{fields}&key=#{api_key}"

      response = Net::HTTP.get_response(URI(details_url))
      data = JSON.parse(response.body)

      if data["result"]
        result = data["result"]
        {
          place_id: result["place_id"],
          name: result["name"],
          address: result["formatted_address"],
          phone: result["formatted_phone_number"],
          website: result["website"],
          rating: result["rating"],
          user_ratings_total: result["user_ratings_total"],
          price_level: result["price_level"],
          business_status: result["business_status"],
          types: result["types"],
          hours: format_opening_hours(result["opening_hours"]),
          reviews: result["reviews"] || [],
          photos: (result["photos"] || []).first(3)
        }
      else
        nil
      end
    rescue => e
      Rails.logger.error "Failed to get venue details for #{place_id}: #{e.message}" if Rails.env.development?
      nil
    end
  end

  def self.format_opening_hours(hours_data)
    return "Hours not available" unless hours_data && hours_data["weekday_text"]

    # Convert Google's format to a more concise format
    hours_data["weekday_text"].map do |day_hours|
      day_hours.gsub("Monday", "Mon")
               .gsub("Tuesday", "Tue")
               .gsub("Wednesday", "Wed")
               .gsub("Thursday", "Thu")
               .gsub("Friday", "Fri")
               .gsub("Saturday", "Sat")
               .gsub("Sunday", "Sun")
    end.join(", ")
  end

  def self.convert_price_level_to_string(price_level)
    return "$" unless price_level
    "$" * [ price_level, 4 ].min
  end
end
