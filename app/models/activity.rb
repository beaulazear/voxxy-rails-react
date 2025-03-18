class Activity < ApplicationRecord
    belongs_to :user
    has_many :responses, dependent: :destroy
    has_many :activity_participants, dependent: :destroy
    has_many :participants, -> { distinct.joins(:activity_participants).where(activity_participants: { accepted: true }) }, through: :activity_participants, source: :user
    has_many :pinned_activities, dependent: :destroy
    has_many :comments, dependent: :destroy

    validates :activity_name, :activity_type, :activity_location, :date_notes, presence: true
    validate :date_day_must_be_in_future, if: -> { date_day.present? }

    private

    def date_day_must_be_in_future
      return if will_save_change_to_completed? && completed

      if date_day < Date.today
        errors.add(:date_day, "must be a future date")
      end
    end
end
