class Activity < ApplicationRecord
    belongs_to :user
    has_many :responses, dependent: :destroy
    has_many :activity_participants, dependent: :destroy
    has_many :participants, -> { distinct.joins(:activity_participants).where(activity_participants: { accepted: true }) }, through: :activity_participants, source: :user
    has_many :pinned_activities, dependent: :destroy

    validates :activity_name, :activity_type, :activity_location, :group_size, :date_notes, presence: true
end
