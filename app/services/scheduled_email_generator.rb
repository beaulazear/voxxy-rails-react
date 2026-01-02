# Service to generate scheduled emails for an event from its email campaign template
#
# Usage:
#   generator = ScheduledEmailGenerator.new(event)
#   scheduled_emails = generator.generate
#
# This service:
# 1. Gets all enabled email template items from the event's campaign template
# 2. Calculates send times using EmailScheduleCalculator
# 3. Creates ScheduledEmail records for each email that can be scheduled
# 4. Skips callback-triggered emails (on_application_submit, on_approval)
# 5. Returns array of created ScheduledEmail records

class ScheduledEmailGenerator
  attr_reader :event, :template, :errors

  def initialize(event)
    @event = event
    @template = event.email_campaign_template
    @errors = []
  end

  # Generate all scheduled emails for the event
  # Returns array of created ScheduledEmail records
  def generate
    return [] unless template

    scheduled_emails = []
    calculator = EmailScheduleCalculator.new(event)

    # Get all enabled email template items, ordered by position
    template.email_template_items.enabled.by_position.each do |item|
      # Calculate scheduled time
      scheduled_time = calculator.calculate(item)

      # Skip if no scheduled time (callback-triggered emails)
      next unless scheduled_time

      # Skip if scheduled time is in the past (event created late)
      if scheduled_time < Time.current
        @errors << "Skipped '#{item.name}' - scheduled time (#{scheduled_time}) is in the past"
        next
      end

      # Create scheduled email
      scheduled_email = create_scheduled_email(item, scheduled_time)

      if scheduled_email.persisted?
        scheduled_emails << scheduled_email
      else
        @errors << "Failed to create '#{item.name}': #{scheduled_email.errors.full_messages.join(', ')}"
      end
    end

    scheduled_emails
  end

  # Generate only specific emails (by category or positions)
  # Options:
  #   category: "event_announcements", "payment_reminders", etc.
  #   positions: [1, 2, 3]
  def generate_selective(options = {})
    return [] unless template

    scheduled_emails = []
    calculator = EmailScheduleCalculator.new(event)

    # Filter items
    items = template.email_template_items.enabled.by_position
    items = items.where(category: options[:category]) if options[:category]
    items = items.where(position: options[:positions]) if options[:positions]

    items.each do |item|
      scheduled_time = calculator.calculate(item)
      next unless scheduled_time
      next if scheduled_time < Time.current

      scheduled_email = create_scheduled_email(item, scheduled_time)
      scheduled_emails << scheduled_email if scheduled_email.persisted?
    end

    scheduled_emails
  end

  # Regenerate all scheduled emails (deletes existing ones first)
  # Useful when event dates change
  def regenerate
    event.scheduled_emails.where(status: "scheduled").destroy_all
    generate
  end

  # Update scheduled times for existing emails (when event dates change)
  # Only updates emails that haven't been sent yet
  def update_scheduled_times
    calculator = EmailScheduleCalculator.new(event)
    updated_count = 0

    event.scheduled_emails.where(status: "scheduled").each do |scheduled_email|
      next unless scheduled_email.email_template_item

      new_time = calculator.calculate(scheduled_email.email_template_item)
      next unless new_time

      if new_time != scheduled_email.scheduled_for
        scheduled_email.update(scheduled_for: new_time)
        updated_count += 1
      end
    end

    updated_count
  end

  private

  def create_scheduled_email(email_template_item, scheduled_time)
    ScheduledEmail.create(
      event: event,
      email_campaign_template: template,
      email_template_item: email_template_item,
      name: email_template_item.name,
      subject_template: email_template_item.subject_template,
      body_template: email_template_item.body_template,
      trigger_type: email_template_item.trigger_type,
      scheduled_for: scheduled_time,
      filter_criteria: email_template_item.filter_criteria,
      status: "scheduled"
    )
  end
end
