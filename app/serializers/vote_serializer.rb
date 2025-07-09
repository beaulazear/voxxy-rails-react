# app/serializers/vote_serializer.rb
class VoteSerializer < BaseSerializer
  def self.basic(vote)
    {
      id: vote.id,
      user_id: vote.user_id
    }
  end

  def self.basic_list(votes)
    votes.map { |v| basic(v) }
  end
end
