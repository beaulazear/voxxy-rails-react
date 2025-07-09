# app/serializers/pinned_activity_serializer.rb
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
end
