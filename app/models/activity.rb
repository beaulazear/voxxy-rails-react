class Activity < ApplicationRecord
    belongs_to :user

    validates :activity_name, :activity_type, :activity_location, :group_size, :date_notes, presence: true
end
