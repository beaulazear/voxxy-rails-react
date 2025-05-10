class Activity < ApplicationRecord
    belongs_to :user
    has_many :responses, dependent: :destroy
    has_many :activity_participants, dependent: :destroy
    has_many :participants, -> { distinct.joins(:activity_participants).where(activity_participants: { accepted: true }) }, through: :activity_participants, source: :user
    has_many :pinned_activities, dependent: :destroy
    has_many :comments, dependent: :destroy
    has_many :time_slots, dependent: :destroy

    validates :activity_name, :activity_type, :date_notes, presence: true
    validate :date_day_must_be_in_future, if: -> { date_day.present? }

  def availability_tally
    tally = Hash.new(0)
    responses.each do |r|
      r.availability.each do |date, times|
        times.each { |time| tally["#{date} #{time}"] += 1 }
      end
    end
    tally
  end

  private

  def date_day_must_be_in_future
    return if will_save_change_to_completed? && completed

    if date_day < Date.today
        errors.add(:date_day, "must be a future date")
    end
  end
end
