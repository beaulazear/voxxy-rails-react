class Activity < ApplicationRecord
    belongs_to :user
    has_many :responses, dependent: :destroy
    has_many :activity_participants, dependent: :destroy
    has_many :participants, -> { distinct.joins(:activity_participants).where(activity_participants: { accepted: true }) }, through: :activity_participants, source: :user
    has_many :pinned_activities, dependent: :destroy
    has_many :comments, dependent: :destroy
    has_many :time_slots, dependent: :destroy

    after_update :schedule_reminders, if: :saved_change_to_finalized?
    after_update :reschedule_reminders, if: :saved_change_to_date_time?

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

    def schedule_reminders
    return unless finalized? && date_time.present?

    activity_datetime = Time.parse(date_time)
    current_time = Time.current

    # Schedule 1 hour reminder
    one_hour_before = activity_datetime - 1.hour
    if one_hour_before > current_time
      ActivityReminderJob.set(wait_until: one_hour_before)
                        .perform_later(id, "1_hour")
    end

    # Schedule 30 minute reminder
    thirty_min_before = activity_datetime - 30.minutes
    if thirty_min_before > current_time
      ActivityReminderJob.set(wait_until: thirty_min_before)
                        .perform_later(id, "30_minutes")
    end

    # Schedule day-of reminder (9 AM on the day of the activity)
    activity_date = activity_datetime.to_date
    day_of_reminder = activity_date.beginning_of_day + 9.hours
    if day_of_reminder > current_time && day_of_reminder < activity_datetime
      ActivityReminderJob.set(wait_until: day_of_reminder)
                        .perform_later(id, "day_of")
    end

    Rails.logger.info "Scheduled reminders for activity #{id} at #{activity_datetime}"
  end

  def reschedule_reminders
    # Cancel existing jobs (this is simplified - in production you'd want to track job IDs)
    # Then reschedule with new times
    schedule_reminders if finalized?
  end

  def date_day_must_be_in_future
    return if will_save_change_to_completed? && completed

    if date_day < Date.today
        errors.add(:date_day, "must be a future date")
    end
  end
end
