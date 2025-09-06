class Activity < ApplicationRecord
    belongs_to :user
    has_many :responses, dependent: :destroy
    has_many :activity_participants, dependent: :destroy
    has_many :participants, -> { distinct.joins(:activity_participants).where(activity_participants: { accepted: true }) }, through: :activity_participants, source: :user
    has_many :pinned_activities, dependent: :destroy
    has_many :comments, dependent: :destroy
    has_many :time_slots, dependent: :destroy
    has_many :notifications, dependent: :destroy

    after_update :schedule_reminders, if: :saved_change_to_finalized?
    after_update :reschedule_reminders, if: :saved_change_to_date_time?
    after_update :send_activity_finalized_notifications, if: :saved_change_to_finalized?
    after_update :send_activity_updated_notifications, if: :activity_updated?

    validates :activity_name, :activity_type, :date_notes, presence: true
    validate :date_day_must_be_in_future, if: -> { date_day.present? }
    validate :content_must_be_appropriate

    before_validation :clean_content

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
    return
    return unless finalized?
    return unless date_day.present? && date_time.present?

    begin
      # Combine date_day with the time portion of date_time to get actual activity datetime
      # date_time is stored as "2000-01-01T14:36:00.000Z" so we extract just the time part
      time_part = date_time.strftime("%H:%M:%S")
      activity_datetime = DateTime.parse("#{date_day} #{time_part}")
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
    rescue => e
      # Log the error but don't break the update process
      Rails.logger.error "Failed to schedule reminders for activity #{id}: #{e.message}"
    end
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

  # Notification methods
  def send_activity_finalized_notifications
    return unless finalized?

    # Get all participants (host + accepted participants)
    all_users = [ user ] + participants.to_a
    selected_place = pinned_activities.find_by(selected: true)

    all_users.each do |participant|
      title = "Activity Finalized! ✅"
      body = if selected_place
        case activity_type
        when "Game Night"
          "#{activity_name} has been finalized! You'll be playing #{selected_place.title}"
        when "Restaurant", "Cocktails"
          "#{activity_name} has been finalized at #{selected_place.title}"
        else
          "#{activity_name} has been finalized with #{selected_place.title}"
        end
      else
        "#{activity_name} has been finalized with all the details"
      end

      Notification.create_and_send!(
        user: participant,
        title: title,
        body: body,
        notification_type: "activity_finalized",
        activity: self,
        triggering_user: user,
        data: { activityId: id, selectedPlaceId: selected_place&.id }
      )
    end
  end

  def send_activity_updated_notifications
    # Only send if significant fields changed (not internal state changes)
    return unless activity_name_changed? || activity_location_changed? || date_day_changed? || date_time_changed?

    # Get all participants except the person making the change (assuming it's the host)
    participants.each do |participant|
      title = "Activity Updated 📝"
      body = "#{user.name} updated details for '#{activity_name}'"

      Notification.create_and_send!(
        user: participant,
        title: title,
        body: body,
        notification_type: "activity_update",
        activity: self,
        triggering_user: user,
        data: { activityId: id }
      )
    end
  end

  def activity_updated?
    activity_name_changed? || activity_location_changed? || date_day_changed? || date_time_changed?
  end

  def clean_content
    # Clean activity name and welcome message
    self.activity_name = ContentFilterService.clean(activity_name) if activity_name.present?
    self.welcome_message = ContentFilterService.clean(welcome_message) if welcome_message.present?
    self.date_notes = ContentFilterService.clean(date_notes) if date_notes.present?
  end

  def content_must_be_appropriate
    # Check activity name
    if activity_name.present? && ContentFilterService.inappropriate?(activity_name)
      errors.add(:activity_name, "contains inappropriate content")
    end

    # Check welcome message if present
    if welcome_message.present? && ContentFilterService.inappropriate?(welcome_message)
      errors.add(:welcome_message, "contains inappropriate content")
    end

    # Check date notes
    if date_notes.present? && ContentFilterService.inappropriate?(date_notes)
      errors.add(:date_notes, "contains inappropriate content")
    end
  end
end
