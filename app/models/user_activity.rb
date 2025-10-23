class UserActivity < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :pinned_activity

  # Validations
  validates :user_id, uniqueness: { scope: :pinned_activity_id, message: "has already interacted with this pinned activity" }
  validates :flagged, inclusion: { in: [ true, false ] }
  validates :favorited, inclusion: { in: [ true, false ] }

  # JSON serialization for reviews and photos (same as PinnedActivity)
  serialize :reviews, coder: JSON
  serialize :photos, coder: JSON

  # Initialize JSON fields
  after_initialize do
    self.reviews ||= []
    self.photos  ||= []
  end

  # Scopes for filtering
  scope :flagged, -> { where(flagged: true) }
  scope :favorited, -> { where(favorited: true) }
  scope :by_user, ->(user) { where(user: user) }

  # Class methods for finding or creating user activities
  def self.find_or_create_for_user_and_pinned_activity(user, pinned_activity)
    find_or_create_by(user: user, pinned_activity: pinned_activity) do |user_activity|
      # Copy data from pinned_activity when creating
      user_activity.copy_from_pinned_activity(pinned_activity)
    end
  end

  # Instance methods
  def flag!
    update!(flagged: true)
  end

  def unflag!
    update!(flagged: false)
  end

  def favorite!
    update!(favorited: true)
  end

  def unfavorite!
    update!(favorited: false)
  end

  def toggle_flag!
    update!(flagged: !flagged)
  end

  def toggle_favorite!
    update!(favorited: !favorited)
  end

  # Copy data from associated pinned_activity
  def copy_from_pinned_activity(pinned_activity = self.pinned_activity)
    # Enrich pinned_activity with Google Places data before copying
    ensure_enriched_photos_and_reviews(pinned_activity)

    self.title = pinned_activity.title
    self.hours = pinned_activity.hours
    self.price_range = pinned_activity.price_range
    self.address = pinned_activity.address
    self.description = pinned_activity.description
    self.reason = pinned_activity.reason
    self.website = pinned_activity.website
    self.reviews = pinned_activity.reviews || []
    self.photos = pinned_activity.photos || []
    # Copy latitude/longitude
    self.latitude = pinned_activity.latitude
    self.longitude = pinned_activity.longitude
  end

  # Update data from pinned_activity (useful for keeping data in sync)
  def sync_with_pinned_activity!
    copy_from_pinned_activity
    save!
  end

  private

  # Ensures the pinned_activity has enriched photos and reviews before copying
  def ensure_enriched_photos_and_reviews(pinned_activity)
    return unless pinned_activity.title.present? && pinned_activity.address.present?

    # Check if photos/reviews need refreshing (same logic as PinnedActivitySerializer)
    needs_refresh = pinned_activity.photos.blank? ||
                   pinned_activity.reviews.blank? ||
                   needs_photo_url_update?(pinned_activity.photos)

    if needs_refresh
      places_data = GooglePlacesService.enrich_place_data(
        pinned_activity.title,
        pinned_activity.address
      )

      # Update the pinned_activity record with fetched data
      pinned_activity.update_columns(
        photos: places_data[:photos].to_json,
        reviews: places_data[:reviews].to_json
      )
    end
  end

  # Check if photos need URL updates (for existing records with old or incorrect URLs)
  def needs_photo_url_update?(photos_json)
    return false if photos_json.blank?

    begin
      photos = JSON.parse(photos_json.is_a?(String) ? photos_json : photos_json.to_json)
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
