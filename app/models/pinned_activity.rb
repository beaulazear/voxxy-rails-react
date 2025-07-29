class PinnedActivity < ApplicationRecord
  belongs_to :activity
  has_many :comments, dependent: :destroy
  has_many :votes, dependent: :destroy
  has_many :voters, through: :votes, source: :user
  has_many :user_activities, dependent: :destroy

  serialize :reviews, coder: JSON
  serialize :photos, coder: JSON

  after_initialize do
    self.reviews ||= []
    self.photos  ||= []
  end

  def vote_count
    votes.count
  end
end
