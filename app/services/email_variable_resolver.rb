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
#     [paymentDueDate] - Payment due date
#     [organizationName] - Organization name
#     [organizationEmail] - Organization contact email
#     [ageRestriction] - Event age restriction
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
#     [boothPrice] - Booth/space fee (from vendor application)
#     [installDate] - Installation date (from vendor application)
#     [installTime] - Installation time range (from vendor application)
#     [categoryList] - Bulleted list of vendor categories
#
#   Special variables:
#     [unsubscribeLink] - Unsubscribe URL
#     [eventLink] - Public event page URL (use as hub for all vendor application details)
#     [bulletinLink] - Public event bulletin page URL (same as eventLink)
#     [dashboardLink] - Event-specific vendor portal URL (/portal/{event-slug})
#     [invitationLink] - Same as eventLink

class EmailVariableResolver
  attr_reader :event, :registration, :base_url

  def initialize(event, registration = nil, base_url: nil)
    @event = event
    @registration = registration
    @base_url = base_url || FrontendUrlHelper.presents_frontend_url
  end

  # Resolve all variables in a template string
  def resolve(template)
    return template unless template.is_a?(String)

    resolved = template.dup

    # Resolve event variables
    resolved = resolve_event_variables(resolved)

    # Resolve vendor/registration variables (if registration present)
    resolved = resolve_registration_variables(resolved) if registration

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
    template
      .gsub("[eventName]", event.title || "")
      .gsub("[eventDate]", format_date(event.event_date))
      .gsub("[eventTime]", event.start_time || "")
      .gsub("[eventLocation]", event.location || "")
      .gsub("[eventVenue]", event.venue || "")
      .gsub("[eventDescription]", event.description || "")
      .gsub("[applicationDeadline]", format_date(event.application_deadline))
      .gsub("[paymentDueDate]", format_date(event.payment_deadline))
      .gsub("[organizationName]", event.organization&.name || "")
      .gsub("[organizationEmail]", event.organization&.email || "")
      .gsub("[ageRestriction]", event.age_restriction || "")
  end

  def resolve_registration_variables(template)
    # Parse full name into first/last
    name_parts = (registration.name || "").split(" ", 2)
    first_name = name_parts[0] || ""
    last_name = name_parts[1] || ""

    # Get booth number if the field exists
    booth_number = registration.respond_to?(:booth_number) ? (registration.booth_number&.to_s || "TBD") : "TBD"

    # Greeting name: businessName preferred, fallback to firstName
    greeting_name = if registration.business_name.present?
      registration.business_name
    elsif first_name.present?
      first_name
    else
      "there"  # Ultimate fallback if both are missing
    end

    # Get vendor application variables if available
    vendor_app = registration.vendor_application
    booth_price = vendor_app ? format_currency(vendor_app.booth_price) : ""
    install_date = vendor_app ? format_date(vendor_app.install_date) : ""
    install_time = vendor_app ? format_install_time(vendor_app.install_start_time, vendor_app.install_end_time) : ""
    category_list = vendor_app ? format_category_list(vendor_app.categories) : ""

    template
      .gsub("[greetingName]", greeting_name)
      .gsub("[firstName]", first_name)
      .gsub("[lastName]", last_name)
      .gsub("[fullName]", registration.name || "")
      .gsub("[businessName]", registration.business_name || "")
      .gsub("[email]", registration.email || "")
      .gsub("[vendorCategory]", registration.vendor_category || "")
      .gsub("[boothNumber]", booth_number)
      .gsub("[applicationDate]", format_date(registration.created_at))
      .gsub("[boothPrice]", booth_price)
      .gsub("[installDate]", install_date)
      .gsub("[installTime]", install_time)
      .gsub("[categoryList]", category_list)
  end

  def resolve_special_variables(template)
    template
      .gsub("[unsubscribeLink]", unsubscribe_link)
      .gsub("[eventLink]", event_link)
      .gsub("[bulletinLink]", event_link)  # Bulletin link is same as event link
      .gsub("[dashboardLink]", dashboard_link)
      .gsub("[invitationLink]", event_link)  # Invitation link is same as event link
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

  def format_install_time(start_time, end_time)
    return "" unless start_time && end_time

    "#{start_time} - #{end_time}"
  rescue
    ""
  end

  def format_category_list(categories)
    return "" unless categories.is_a?(Array) && categories.any?

    categories.map { |cat| "• #{cat}" }.join("\n")
  rescue
    ""
  end

  def unsubscribe_link
    return "" unless registration

    begin
      # Generate a secure unsubscribe token for this registration
      unsubscribe_token = UnsubscribeTokenService.generate_for_registration(registration)
      UnsubscribeTokenService.generate_unsubscribe_url(unsubscribe_token.token, frontend_url: base_url)
    rescue => e
      Rails.logger.error("Failed to generate unsubscribe link: #{e.message}")
      # Fallback to empty string if token generation fails
      ""
    end
  end

  def event_link
    "#{base_url}/events/#{event.slug}"
  end

  def dashboard_link
    return "" unless registration

    # Use the event's stored portal URL with secure access token
    event_portal = event.event_portal
    return "" unless event_portal

    "#{base_url}/portal/#{event_portal.access_token}"
  end
end
