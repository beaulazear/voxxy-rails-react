class ActivitySerializer < BaseSerializer
  ACTIVITY_FIELDS = [
    :id, :activity_name, :allow_participant_time_selection, :collecting,
    :voting, :finalized, :activity_type, :activity_location, :group_size,
    :date_notes, :created_at, :active, :emoji, :date_day, :date_time,
    :welcome_message, :completed, :radius, :is_solo
  ].freeze

  def self.basic(activity)
    activity.slice(*ACTIVITY_FIELDS)
  end

  def self.created(activity)
    basic(activity).merge(
      user: user_with_preferences(activity.user),
      participants: activity.participants.map { |p| user_with_preferences(p) },
      activity_participants: ActivityParticipantSerializer.basic_list(activity.activity_participants)
    )
  end

  def self.updated(activity)
    basic(activity).merge(
      user: user_with_preferences(activity.user),
      participants: activity.participants.map { |p| user_with_preferences(p) },
      activity_participants: ActivityParticipantSerializer.basic_list(activity.activity_participants),
      responses: ResponseSerializer.for_activity(activity.responses),
      comments: activity.comments.map { |c| CommentSerializer.basic(c) }
    )
  end

  def self.list_item(activity)
    basic(activity).merge(
      user: user_with_preferences(activity.user),
      participants: activity.participants.map { |p| user_with_preferences(p) },
      responses: ResponseSerializer.for_activity(activity.responses),
      activity_participants: ActivityParticipantSerializer.basic_list(activity.activity_participants)
    )
  end

  def self.owned_activity(activity)
    basic(activity).merge(
      user: user_with_preferences(activity.user),
      participants: activity.participants.map { |p| user_with_preferences(p) },
      comments: activity.comments.map { |c| CommentSerializer.basic(c) },
      pinned_activities: activity.pinned_activities.map { |pa| PinnedActivitySerializer.full(pa) },
      responses: ResponseSerializer.for_activity(activity.responses),
      activity_participants: ActivityParticipantSerializer.basic_list(activity.activity_participants)
    )
  end

  def self.participant_activity(activity_participant)
    activity = activity_participant.activity
    {
      id: activity_participant.id,
      accepted: activity_participant.accepted,
      invited_email: activity_participant.invited_email,
      activity: basic(activity).merge(
        user: user_with_preferences(activity.user),
        participants: activity.participants.map { |p| user_with_preferences(p) },
        comments: activity.comments.map { |c| CommentSerializer.basic(c) },
        pinned_activities: activity.pinned_activities.map { |pa| PinnedActivitySerializer.full(pa) },
        responses: ResponseSerializer.for_activity(activity.responses)
      )
    }
  end

  def self.participant_view(activity)
    basic(activity).merge(
      user: user_with_preferences(activity.user),
      participants: activity.participants.map { |p| user_with_preferences(p) },
      comments: activity.comments.map { |c| CommentSerializer.basic(c) },
      pinned_activities: activity.pinned_activities.map { |pa| PinnedActivitySerializer.full(pa) },
      responses: ResponseSerializer.for_activity(activity.responses),
      activity_participants: ActivityParticipantSerializer.basic_list(activity.activity_participants)
    )
  end
end
