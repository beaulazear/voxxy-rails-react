# app/models/time_slot_vote.rb
class TimeSlotVote < ApplicationRecord
    belongs_to :user
    belongs_to :time_slot

    validates :user_id, uniqueness: { scope: :time_slot_id }
end
