# Service to calculate scheduled send times for emails based on trigger rules
#
# Usage:
#   calculator = EmailScheduleCalculator.new(event)
#   send_time = calculator.calculate(email_template_item)
#
# Trigger types:
#   - days_before_event: X days before event_date
#   - days_after_event: X days after event_date
#   - days_before_deadline: X days before application_deadline
#   - on_event_date: On the event_date at trigger_time
#   - on_application_open: When applications open (event created)
#   - on_application_submit: When vendor submits application (handled by callback)
#   - on_approval: When vendor is approved (handled by callback)
#   - days_before_payment_deadline: X days before payment_due_date
#   - on_payment_deadline: On the payment_due_date at trigger_time

class EmailScheduleCalculator
  attr_reader :event

  def initialize(event)
    @event = event
  end

  # Calculate the scheduled send time for an email template item
  # Returns a DateTime or nil if cannot be calculated
  def calculate(email_template_item)
    trigger_type = email_template_item.trigger_type
    trigger_value = email_template_item.trigger_value || 0
    trigger_time = email_template_item.trigger_time || "09:00"

    case trigger_type
    when "days_before_event"
      calculate_days_before_event(trigger_value, trigger_time)
    when "days_after_event"
      calculate_days_after_event(trigger_value, trigger_time)
    when "days_before_deadline"
      calculate_days_before_deadline(trigger_value, trigger_time)
    when "on_event_date"
      calculate_on_event_date(trigger_time)
    when "on_application_open"
      calculate_on_application_open(trigger_value, trigger_time)
    when "days_before_payment_deadline"
      calculate_days_before_payment_deadline(trigger_value, trigger_time)
    when "on_payment_deadline"
      calculate_on_payment_deadline(trigger_time)
    when "on_application_submit", "on_approval"
      # These are triggered by callbacks, not scheduled in advance
      nil
    else
      nil
    end
  end

  # Batch calculate for multiple email template items
  # Returns a hash: { email_template_item_id => scheduled_time }
  def calculate_batch(email_template_items)
    email_template_items.each_with_object({}) do |item, hash|
      scheduled_time = calculate(item)
      hash[item.id] = scheduled_time if scheduled_time
    end
  end

  private

  def calculate_days_before_event(days, time)
    return nil unless event.event_date

    scheduled_date = event.event_date - days.days
    combine_date_and_time(scheduled_date, time)
  end

  def calculate_days_after_event(days, time)
    return nil unless event.event_date

    scheduled_date = event.event_date + days.days
    combine_date_and_time(scheduled_date, time)
  end

  def calculate_days_before_deadline(days, time)
    return nil unless event.application_deadline

    scheduled_date = event.application_deadline - days.days
    combine_date_and_time(scheduled_date, time)
  end

  def calculate_on_event_date(time)
    return nil unless event.event_date

    combine_date_and_time(event.event_date, time)
  end

  def calculate_on_application_open(days_offset, time)
    # Applications open when event is created
    # Add optional offset (usually 0)
    scheduled_date = event.created_at.to_date + days_offset.days
    combine_date_and_time(scheduled_date, time)
  end

  def calculate_days_before_payment_deadline(days, time)
    return nil unless event.payment_deadline

    scheduled_date = event.payment_deadline - days.days
    combine_date_and_time(scheduled_date, time)
  end

  def calculate_on_payment_deadline(time)
    return nil unless event.payment_deadline

    combine_date_and_time(event.payment_deadline, time)
  end

  # Combine a date with a time string (e.g., "09:00") or Time object
  # Returns a DateTime in UTC
  def combine_date_and_time(date, time_input)
    # Handle both string ("09:00") and Time objects
    if time_input.is_a?(Time) || time_input.is_a?(ActiveSupport::TimeWithZone)
      hour = time_input.hour
      minute = time_input.min
    else
      hour, minute = time_input.to_s.split(":").map(&:to_i)
    end

    # Use UTC timezone
    Time.use_zone("UTC") do
      Time.zone.local(date.year, date.month, date.day, hour, minute, 0)
    end
  end
end
