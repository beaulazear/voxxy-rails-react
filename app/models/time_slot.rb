# app/models/time_slot.rb
class TimeSlot < ApplicationRecord
    belongs_to :activity
    has_many   :time_slot_votes, dependent: :destroy
    has_many   :voters, through: :time_slot_votes, source: :user

    def votes_count
      time_slot_votes.count
    end

    def user_voted?(user)
      return false unless user
      time_slot_votes.exists?(user_id: user.id)
    end
end
