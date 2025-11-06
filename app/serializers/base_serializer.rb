# app/serializers/base_serializer.rb
class BaseSerializer
  def self.user_basic(user)
    return nil unless user
    {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      admin: user.admin,
      role: user.role,  # V3.0: Critical for frontend routing
      product_context: user.product_context,  # V3.0: Track which products user has access to
      created_at: user.created_at,
      confirmed_at: user.confirmed_at,
      profile_pic_url: user.profile_pic_url,
      neighborhood: user.neighborhood,
      city: user.city,
      state: user.state,
      full_location: user.full_location,
      location_complete: user.location_complete?,
      coordinates: user.coordinates
    }
  end

  def self.user_with_preferences(user)
    return nil unless user
    user_basic(user).merge(
      preferences: user.preferences,
      favorite_food: user.favorite_food,
      bar_preferences: user.bar_preferences
    )
  end

  def self.user_minimal(user)
    return nil unless user
    {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      confirmed_at: user.confirmed_at,
      profile_pic_url: user.profile_pic_url
    }
  end
end
