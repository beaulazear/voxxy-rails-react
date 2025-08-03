class UserActivitySerializer
  def self.single(user_activity)
    {
      id: user_activity.id,
      user_id: user_activity.user_id,
      pinned_activity_id: user_activity.pinned_activity_id,
      title: user_activity.title,
      hours: user_activity.hours,
      price_range: user_activity.price_range,
      address: user_activity.address,
      description: user_activity.description,
      reason: user_activity.reason,
      website: user_activity.website,
      reviews: user_activity.reviews || [],
      photos: user_activity.photos || [],
      flagged: user_activity.flagged,
      favorited: user_activity.favorited,
      created_at: user_activity.created_at,
      updated_at: user_activity.updated_at,
      # Include pinned activity and activity info
      pinned_activity: {
        id: user_activity.pinned_activity.id,
        activity_id: user_activity.pinned_activity.activity_id,
        selected: user_activity.pinned_activity.selected,
        vote_count: user_activity.pinned_activity.vote_count
      },
      activity: {
        id: user_activity.pinned_activity.activity.id,
        title: user_activity.pinned_activity.activity.activity_name,
        date: user_activity.pinned_activity.activity.date_day,
        activity_type: user_activity.pinned_activity.activity.activity_type,
        user: {
          id: user_activity.pinned_activity.activity.user.id,
          name: user_activity.pinned_activity.activity.user.name
        }
      }
    }
  end

  def self.collection(user_activities)
    user_activities.map { |user_activity| single(user_activity) }
  end
end
