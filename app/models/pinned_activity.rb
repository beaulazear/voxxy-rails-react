class PinnedActivity < ApplicationRecord
  belongs_to :activity
  has_many :comments, dependent: :destroy
  has_many :votes, dependent: :destroy
  has_many :voters, through: :votes, source: :user

  def vote_count
    votes.count
  end
end
