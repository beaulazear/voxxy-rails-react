class ActivityParticipant < ApplicationRecord
    belongs_to :activity
    belongs_to :user, optional: true  # Allows pending invites
end
