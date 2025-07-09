# app/serializers/user_serializer.rb
class UserSerializer < BaseSerializer
  def self.basic(user)
    user_basic(user)
  end

  def self.full(user)
    basic(user).merge(
      preferences: user.preferences,
      text_notifications: user.text_notifications,
      email_notifications: user.email_notifications,
      push_notifications: user.push_notifications,
      confirmation_token: user.confirmation_token,
      admin: user.admin
    )
  end

  def self.dashboard(user)
    full(user).merge(
      activities: user.activities.map { |a| ActivitySerializer.owned_activity(a) },
      participant_activities: ActivityParticipant
        .includes(activity: [ :user, :participants, :comments, :pinned_activities ])
        .where("user_id = ? OR invited_email = ?", user.id, user.email)
        .map { |ap| ActivitySerializer.participant_activity(ap) }
    )
  end
end
