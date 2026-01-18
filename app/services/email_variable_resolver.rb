# Service to resolve template variables in email content
#
# Usage:
#   resolver = EmailVariableResolver.new(event, registration)
#   subject = resolver.resolve(scheduled_email.subject_template)
#   body = resolver.resolve(scheduled_email.body_template)
#
# Supported variables:
#   Event variables:
#     [eventName] - Event title
#     [eventDate] - Formatted event date
#     [eventTime] - Event time
#     [eventLocation] - Event location/address
#     [eventVenue] - Event venue name
#     [eventDescription] - Event description
#     [applicationDeadline] - Application deadline date
#     [boothPrice] - Booth/vendor price
#     [categoryPrice] - Alias for boothPrice (backwards compatibility)
#     [paymentDueDate] - Payment due date
#     [organizationName] - Organization name
#     [organizationEmail] - Organization contact email
#
#   Vendor/Registration variables:
#     [firstName] - Vendor first name
#     [lastName] - Vendor last name
#     [fullName] - Vendor full name
#     [businessName] - Business name
#     [email] - Vendor email
#     [vendorCategory] - Vendor category (Food, Art, etc.)
#     [boothNumber] - Assigned booth number (if any)
#     [applicationDate] - Date application was submitted
#
#   Vendor Application variables (from active vendor application):
#     [installDate] - Setup/install date
#     [installTime] - Setup/install time range
#     [installStartTime] - Setup/install start time
#     [installEndTime] - Setup/install end time
#     [paymentLink] - Payment link URL
#
#   Special variables:
#     [unsubscribeLink] - Unsubscribe URL
#     [eventLink] - Public event page URL
#     [bulletinLink] - Public event bulletin page URL (same as eventLink)
#     [dashboardLink] - Vendor dashboard URL

class EmailVariableResolver
  attr_reader :event, :registration, :base_url, :vendor_application

  def initialize(event, registration = nil, base_url: nil)
    @event = event
    @registration = registration
    @base_url = base_url || ENV["FRONTEND_URL"] || "https://voxxy.io"
    @vendor_application = event&.active_vendor_application
  end

  # Resolve all variables in a template string
  def resolve(template)
    return template unless template.is_a?(String)

    resolved = template.dup

    # Resolve event variables
    resolved = resolve_event_variables(resolved)

    # Resolve vendor/registration variables (if registration present)
    resolved = resolve_registration_variables(resolved) if registration

    # Resolve vendor application variables (if vendor_application present)
    resolved = resolve_vendor_application_variables(resolved) if vendor_application

    # Resolve special variables
    resolved = resolve_special_variables(resolved)

    resolved
  end

  # Resolve both subject and body for a scheduled email
  def resolve_email(subject_template, body_template)
    {
      subject: resolve(subject_template),
      body: resolve(body_template)
    }
  end

  private

  def resolve_event_variables(template)
    # Get booth price from vendor_application if available, otherwise use event ticket_price
    booth_price = vendor_application&.booth_price || event.ticket_price

    template
      .gsub("[eventName]", event.title || "")
      .gsub("[eventDate]", format_date(event.event_date))
      .gsub("[eventTime]", event.start_time || "")
      .gsub("[eventLocation]", event.location || "")
      .gsub("[eventVenue]", event.venue || "")
      .gsub("[eventDescription]", event.description || "")
      .gsub("[applicationDeadline]", format_date(event.application_deadline))
      .gsub("[boothPrice]", format_currency(booth_price))
      .gsub("[categoryPrice]", format_currency(booth_price))  # Alias for boothPrice (backwards compatibility)
      .gsub("[paymentDueDate]", format_date(event.payment_deadline))
      .gsub("[organizationName]", event.organization&.name || "")
      .gsub("[organizationEmail]", event.organization&.email || "")
  end

  def resolve_registration_variables(template)
    # Parse full name into first/last
    name_parts = (registration.name || "").split(" ", 2)
    first_name = name_parts[0] || ""
    last_name = name_parts[1] || ""

    # Get booth number if the field exists
    booth_number = registration.respond_to?(:booth_number) ? (registration.booth_number&.to_s || "TBD") : "TBD"

    template
      .gsub("[firstName]", first_name)
      .gsub("[lastName]", last_name)
      .gsub("[fullName]", registration.name || "")
      .gsub("[businessName]", registration.business_name || "")
      .gsub("[email]", registration.email || "")
      .gsub("[vendorCategory]", registration.vendor_category || "")
      .gsub("[boothNumber]", booth_number)
      .gsub("[applicationDate]", format_date(registration.created_at))
  end

  def resolve_vendor_application_variables(template)
    # Format install time range
    install_time = ""
    if vendor_application.install_start_time.present? && vendor_application.install_end_time.present?
      install_time = "#{vendor_application.install_start_time} - #{vendor_application.install_end_time}"
    elsif vendor_application.install_start_time.present?
      install_time = vendor_application.install_start_time
    elsif vendor_application.install_end_time.present?
      install_time = vendor_application.install_end_time
    end

    template
      .gsub("[installDate]", format_date(vendor_application.install_date))
      .gsub("[installTime]", install_time)
      .gsub("[installStartTime]", vendor_application.install_start_time || "")
      .gsub("[installEndTime]", vendor_application.install_end_time || "")
      .gsub("[paymentLink]", vendor_application.payment_link || "")
  end

  def resolve_special_variables(template)
    template
      .gsub("[unsubscribeLink]", unsubscribe_link)
      .gsub("[eventLink]", event_link)
      .gsub("[bulletinLink]", event_link)  # Bulletin link is same as event link
      .gsub("[dashboardLink]", dashboard_link)
  end

  def format_date(date)
    return "" unless date

    date.strftime("%A, %B %-d, %Y")
  rescue
    ""
  end

  def format_time(time)
    return "" unless time

    time.strftime("%-I:%M %p")
  rescue
    ""
  end

  def format_currency(amount)
    return "" unless amount

    "$#{amount.to_i}"
  rescue
    ""
  end

  def unsubscribe_link
    return "" unless registration

    # Use unsubscribe_token if available, otherwise use registration ID
    token = registration.respond_to?(:unsubscribe_token) ? (registration.unsubscribe_token || registration.id) : registration.id
    "#{base_url}/unsubscribe?token=#{token}"
  end

  def event_link
    "#{base_url}/events/#{event.slug}"
  end

  def dashboard_link
    return "" unless registration

    "#{base_url}/vendor/dashboard"
  end
end
