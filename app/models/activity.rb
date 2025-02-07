class Activity < ApplicationRecord
    belongs_to :user
    has_many :responses, dependent: :destroy
    has_many :activity_participants, dependent: :destroy
    has_many :participants, through: :activity_participants, source: :user

    validates :activity_name, :activity_type, :activity_location, :group_size, :date_notes, presence: true
end
