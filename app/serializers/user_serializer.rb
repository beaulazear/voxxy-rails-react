# app/serializers/user_serializer.rb
class UserSerializer < BaseSerializer
  def self.basic(user)
    user_basic(user)
  end

  def self.full(user)
    basic(user).merge(
      preferences: user.preferences,
      favorite_food: user.favorite_food,
      text_notifications: user.text_notifications,
      email_notifications: user.email_notifications,
      push_notifications: user.push_notifications,
      confirmation_code: user.confirmation_code,
      admin: user.admin,
      # Policy acceptance status
      terms_accepted: user.has_accepted_terms?,
      privacy_policy_accepted: user.has_accepted_privacy_policy?,
      community_guidelines_accepted: user.has_accepted_community_guidelines?,
      all_policies_accepted: user.has_accepted_all_policies?,
      needs_policy_acceptance: user.needs_to_accept_updated_policies?
    )
  end

  def self.dashboard(user)
    full(user).merge(
      activities: user.activities.map { |a| ActivitySerializer.owned_activity(a) },
      participant_activities: ActivityParticipant
        .includes(
          activity: [
            :user, :participants, :responses, :activity_participants,
            { comments: :user },
            { pinned_activities: [ :votes, { comments: :user }, :voters ] }
          ]
        )
        .where("user_id = ? OR invited_email = ?", user.id, user.email)
        .map { |ap| ActivitySerializer.participant_activity(ap) }
    )
  end
end
