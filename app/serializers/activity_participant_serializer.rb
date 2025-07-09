# app/serializers/activity_participant_serializer.rb
class ActivityParticipantSerializer < BaseSerializer
  def self.basic(activity_participant)
    {
      id: activity_participant.id,
      user_id: activity_participant.user_id,
      invited_email: activity_participant.invited_email,
      accepted: activity_participant.accepted,
      created_at: activity_participant.created_at
    }
  end

  def self.basic_list(activity_participants)
    activity_participants.map { |ap| basic(ap) }
  end
end
