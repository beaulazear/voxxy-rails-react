# app/services/google_places_service.rb
class GooglePlacesService
  CACHE_DURATION = 7.days # Cache places data longer since it changes infrequently

  def self.enrich_recommendations(recommendations)
    recommendations.map { |rec| enrich_recommendation(rec) }
  end

  def self.enrich_recommendation(rec)
    cache_key = generate_places_cache_key(rec["name"], rec["address"])

    # Try to get from cache first
    cached_data = Rails.cache.read(cache_key)
    if cached_data
      return rec.merge(cached_data)
    end

    # If not cached, fetch from API
    places_data = fetch_places_data(rec["name"], rec["address"])

    # Cache the result for future use
    Rails.cache.write(cache_key, places_data, expires_in: CACHE_DURATION)

    rec.merge(places_data)
  end

  # Lazy loading version - only fetch when actually needed
  def self.enrich_recommendation_lazy(rec)
    rec.merge({
      "photos" => [],
      "reviews" => [],
      "places_data_available" => can_fetch_places_data?(rec["name"], rec["address"])
    })
  end

  def self.fetch_places_data_for_pinned(pinned_activity)
    return if pinned_activity.photos.present? && pinned_activity.reviews.present?

    places_data = fetch_places_data(pinned_activity.title, pinned_activity.address)

    pinned_activity.update(
      photos: places_data["photos"],
      reviews: places_data["reviews"]
    )
  end

  private

  def self.fetch_places_data(name, address)
    place_id = find_place_id(name, address)
    return default_places_data unless place_id

    fetch_place_details(place_id)
  rescue StandardError => e
    Rails.logger.error "Error fetching places data for #{name}: #{e.message}"
    default_places_data
  end

  def self.find_place_id(name, address)
    cache_key = "place_id_#{generate_cache_key(name, address)}"

    Rails.cache.fetch(cache_key, expires_in: 30.days) do
      query = CGI.escape("#{name} #{address}")
      url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?" \
            "input=#{query}&inputtype=textquery&fields=place_id&key=#{ENV['PLACES_KEY']}"

      response = Net::HTTP.get_response(URI(url))
      data = JSON.parse(response.body)

      data.dig("candidates", 0, "place_id")
    end
  end

  def self.fetch_place_details(place_id)
    # Only fetch the fields you actually need to minimize cost
    fields = "photos,reviews,rating,user_ratings_total"
    url = "https://maps.googleapis.com/maps/api/place/details/json?" \
          "place_id=#{place_id}&fields=#{fields}&key=#{ENV['PLACES_KEY']}"

    response = Net::HTTP.get_response(URI(url))
    data = JSON.parse(response.body)

    result = data["result"] || {}

    {
      "photos" => limit_photos(result["photos"] || []),
      "reviews" => limit_reviews(result["reviews"] || []),
      "rating" => result["rating"],
      "user_ratings_total" => result["user_ratings_total"]
    }
  end

  def self.limit_photos(photos)
    # Only keep 3-5 photos to reduce data transfer and storage
    photos.first(5)
  end

  def self.limit_reviews(reviews)
    # Only keep the most recent/relevant reviews
    reviews
      .sort_by { |review| review["time"] || 0 }
      .reverse
      .first(10)
  end

  def self.can_fetch_places_data?(name, address)
    return false if name.blank? || address.blank?

    # Check if we've already attempted this recently
    attempt_key = "places_attempt_#{generate_cache_key(name, address)}"
    !Rails.cache.exist?(attempt_key)
  end

  def self.generate_places_cache_key(name, address)
    "places_data_#{generate_cache_key(name, address)}"
  end

  def self.generate_cache_key(name, address)
    Digest::SHA256.hexdigest("#{name.to_s.downcase.strip}-#{address.to_s.downcase.strip}")
  end

  def self.default_places_data
    {
      "photos" => [],
      "reviews" => [],
      "rating" => nil,
      "user_ratings_total" => nil
    }
  end
end
