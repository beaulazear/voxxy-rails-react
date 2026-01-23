# Service to filter which registrations should receive an email
# based on filter criteria from email template items
#
# Usage:
#   service = RecipientFilterService.new(event, filter_criteria)
#   recipients = service.filter_recipients
#
# Filter criteria examples (stored as JSONB):
#   { "statuses": ["approved", "pending"] }
#   { "vendor_categories": ["Food", "Beverage"] }
#   { "exclude_unsubscribed": true }
#   { "payment_status": "paid" }
#   { "application_status": "submitted" }
#
# Multiple criteria are combined with AND logic

class RecipientFilterService
  attr_reader :event, :filter_criteria

  def initialize(event, filter_criteria = {})
    @event = event
    @filter_criteria = filter_criteria || {}
  end

  # Returns filtered collection of Registration records
  def filter_recipients
    scope = event.registrations

    # Apply each filter
    scope = filter_by_status(scope)
    scope = filter_by_vendor_category(scope)
    scope = filter_by_payment_status(scope)
    scope = filter_by_application_status(scope)
    scope = exclude_unsubscribed(scope)

    scope
  end

  # Returns count of recipients without loading all records
  def recipient_count
    filter_recipients.count
  end

  # Returns array of recipient emails
  def recipient_emails
    filter_recipients.pluck(:email)
  end

  # Check if a specific registration matches the filter criteria
  def matches?(registration)
    return false unless registration.event_id == event.id

    # Check each criteria
    return false if filter_criteria["statuses"].present? && !filter_criteria["statuses"].include?(registration.status)
    return false if filter_criteria["vendor_categories"].present? && !filter_criteria["vendor_categories"].include?(registration.vendor_category)
    return false if filter_criteria["payment_status"].present? && registration.payment_status != filter_criteria["payment_status"]
    return false if filter_criteria["application_status"].present? && registration.application_status != filter_criteria["application_status"]

    # Check unsubscribe status (both old and new systems)
    if filter_criteria["exclude_unsubscribed"] != false # Default to true
      return false if registration.email_unsubscribed?
      return false if EmailUnsubscribe.unsubscribed_from_event?(registration.email, event)
    end

    true
  end

  private

  def filter_by_status(scope)
    # Support both singular and plural keys for backward compatibility
    statuses = filter_criteria["statuses"] ||
               filter_criteria[:statuses] ||
               filter_criteria["status"] ||
               filter_criteria[:status]

    return scope unless statuses.present?

    # Convert single value to array
    statuses_array = Array(statuses)

    scope.where(status: statuses_array)
  end

  def filter_by_vendor_category(scope)
    categories = filter_criteria["vendor_categories"] || filter_criteria[:vendor_categories]
    return scope unless categories.present?

    scope.where(vendor_category: categories)
  end

  def filter_by_payment_status(scope)
    payment_status = filter_criteria["payment_status"] || filter_criteria[:payment_status]
    return scope unless payment_status.present?

    # Convert single value to array
    payment_statuses_array = Array(payment_status)

    scope.where(payment_status: payment_statuses_array)
  end

  def filter_by_application_status(scope)
    application_status = filter_criteria["application_status"] || filter_criteria[:application_status]
    return scope unless application_status.present?

    scope.where(application_status: application_status)
  end

  def exclude_unsubscribed(scope)
    exclude = filter_criteria["exclude_unsubscribed"] || filter_criteria[:exclude_unsubscribed]

    # Default to true - always exclude unsubscribed unless explicitly set to false
    exclude = true if exclude.nil?

    return scope unless exclude

    # First, filter by the old email_unsubscribed field (backwards compatibility)
    scope = scope.where(email_unsubscribed: false)

    # Then, exclude emails in the new EmailUnsubscribe table
    # This includes: global unsubscribes, organization unsubscribes, and event-specific unsubscribes
    unsubscribed_emails = EmailUnsubscribe
      .for_email(scope.pluck(:email))
      .where(
        "(scope = 'global') OR " \
        "(scope = 'organization' AND organization_id = ?) OR " \
        "(scope = 'event' AND event_id = ?)",
        event.organization_id,
        event.id
      )
      .pluck(:email)
      .map(&:downcase)
      .uniq

    if unsubscribed_emails.any?
      # Exclude these emails from the scope
      scope = scope.where.not("LOWER(email) IN (?)", unsubscribed_emails)
    end

    scope
  end
end
