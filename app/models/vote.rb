class Vote < ApplicationRecord
    belongs_to :user
    belongs_to :pinned_activity

    validates :user_id, uniqueness: { scope: :pinned_activity_id, message: "has already voted for this activity" }
end
