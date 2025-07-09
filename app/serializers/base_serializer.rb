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
      created_at: user.created_at,
      confirmed_at: user.confirmed_at,
      profile_pic_url: user.profile_pic_url
    }
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
