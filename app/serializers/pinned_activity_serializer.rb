class PinnedActivitySerializer < BaseSerializer
  PINNED_FIELDS = [
    :id, :title, :hours, :price_range, :address, :selected,
    :description, :activity_id, :reviews, :photos, :reason, :website
  ].freeze

  def self.basic(pinned_activity)
    pinned_activity.slice(*PINNED_FIELDS).merge(
      vote_count: pinned_activity.vote_count
    )
  end

  def self.full(pinned_activity)
    basic(pinned_activity).merge(
      comments: pinned_activity.comments.map { |c| CommentSerializer.basic(c) },
      voters: pinned_activity.voters.map { |v| user_minimal(v) },
      votes: VoteSerializer.basic_list(pinned_activity.votes)
    )
  end

  def self.with_places_data(pinned_activity)
    # Fetch Google Places data if not already cached in DB
    needs_refresh = pinned_activity.photos.blank? ||
                   pinned_activity.reviews.blank? ||
                   needs_photo_url_update?(pinned_activity.photos)

    if needs_refresh
      places_data = GooglePlacesService.enrich_place_data(
        pinned_activity.title,
        pinned_activity.address
      )

      # Update the record with fetched data
      pinned_activity.update_columns(
        photos: places_data[:photos].to_json,
        reviews: places_data[:reviews].to_json
      )
    end

    full(pinned_activity)
  end

  def self.list_for_activity(pinned_activities)
    pinned_activities.map { |pa| with_places_data(pa) }
  end

  private

  # Check if photos need URL updates (for existing records with old or incorrect URLs)
  def self.needs_photo_url_update?(photos_json)
    return false if photos_json.blank?

    begin
      photos = JSON.parse(photos_json)
      return false unless photos.is_a?(Array) && photos.any?

      # If any photo has old Google URLs, missing internal URLs, or missing port, we need to update
      photos.any? do |photo|
        photo["photo_reference"] && (
          !photo["photo_url"] ||
          photo["photo_url"].include?("googleapis.com") || # Old Google URLs need to be replaced
          photo["photo_url"].include?("http://localhost/") # Missing port number
        )
      end
    rescue JSON::ParserError
      true # If we can't parse, refresh to be safe
    end
  end
end
