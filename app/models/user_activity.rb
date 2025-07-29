class UserActivity < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :pinned_activity
  
  # Validations
  validates :user_id, uniqueness: { scope: :pinned_activity_id, message: "has already interacted with this pinned activity" }
  validates :flagged, inclusion: { in: [true, false] }
  validates :favorited, inclusion: { in: [true, false] }
  
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
    self.title = pinned_activity.title
    self.hours = pinned_activity.hours
    self.price_range = pinned_activity.price_range
    self.address = pinned_activity.address
    self.description = pinned_activity.description
    self.reason = pinned_activity.reason
    self.website = pinned_activity.website
    self.reviews = pinned_activity.reviews || []
    self.photos = pinned_activity.photos || []
  end
  
  # Update data from pinned_activity (useful for keeping data in sync)
  def sync_with_pinned_activity!
    copy_from_pinned_activity
    save!
  end
end