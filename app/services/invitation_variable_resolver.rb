# Service to resolve template variables in invitation reminder emails
# Similar to EmailVariableResolver but works with VendorContact instead of Registration
#
# Usage:
#   resolver = InvitationVariableResolver.new(event, vendor_contact)
#   subject = resolver.resolve(scheduled_email.subject_template)
#   body = resolver.resolve(scheduled_email.body_template)
#
# Supported variables:
#   Event variables: (same as EmailVariableResolver)
#     [eventName], [eventDate], [eventTime], [eventLocation], [eventVenue]
#     [eventDescription], [applicationDeadline], [paymentDueDate]
#     [organizationName], [organizationEmail]
#
#   Vendor Contact variables:
#     [firstName] - Contact first name
#     [lastName] - Contact last name
#     [fullName] - Contact full name
#     [businessName] - Business/company name
#     [email] - Contact email
#     [greetingName] - Preferred greeting (business name or first name)
#
#   Special variables:
#     [unsubscribeLink] - Unsubscribe URL
#     [eventLink] - Public event page URL
#
#   Not supported (vendor hasn't applied yet):
#     [vendorCategory] - N/A
#     [boothNumber] - N/A
#     [applicationDate] - N/A
#     [dashboardLink] - N/A
#
class InvitationVariableResolver
  attr_reader :event, :vendor_contact, :base_url

  def initialize(event, vendor_contact, base_url: nil)
    @event = event
    @vendor_contact = vendor_contact
    @base_url = base_url || FrontendUrlHelper.presents_frontend_url
  end

  # Resolve all variables in a template string
  def resolve(template)
    return template unless template.is_a?(String)

    resolved = template.dup

    # Resolve event variables
    resolved = resolve_event_variables(resolved)

    # Resolve vendor contact variables
    resolved = resolve_vendor_contact_variables(resolved)

    # Resolve special variables
    resolved = resolve_special_variables(resolved)

    resolved
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
  end

  def resolve_vendor_contact_variables(template)
    # Parse full name into first/last
    name_parts = (vendor_contact.name || "").split(" ", 2)
    first_name = name_parts[0] || ""
    last_name = name_parts[1] || ""

    # Greeting name: businessName preferred, fallback to firstName
    greeting_name = if vendor_contact.business_name.present?
      vendor_contact.business_name
    elsif first_name.present?
      first_name
    else
      "there"  # Ultimate fallback
    end

    template
      .gsub("[greetingName]", greeting_name)
      .gsub("[firstName]", first_name)
      .gsub("[lastName]", last_name)
      .gsub("[fullName]", vendor_contact.name || "")
      .gsub("[businessName]", vendor_contact.business_name || "")
      .gsub("[email]", vendor_contact.email || "")
      # Variables not applicable for contacts who haven't applied yet
      .gsub("[vendorCategory]", "")
      .gsub("[boothNumber]", "")
      .gsub("[applicationDate]", "")
  end

  def resolve_special_variables(template)
    template
      .gsub("[unsubscribeLink]", unsubscribe_link)
      .gsub("[eventLink]", event_link)
      .gsub("[bulletinLink]", event_link)  # Bulletin link is same as event link
      .gsub("[dashboardLink]", event_link)  # Redirect to event page (no dashboard yet)
  end

  def format_date(date)
    return "" unless date

    date.strftime("%A, %B %-d, %Y")
  rescue
    ""
  end

  def unsubscribe_link
    begin
      # Generate a secure unsubscribe token for this vendor contact
      unsubscribe_token = UnsubscribeTokenService.generate_token(
        email: vendor_contact.email,
        event: event,
        organization: event.organization
      )
      UnsubscribeTokenService.generate_unsubscribe_url(unsubscribe_token.token, frontend_url: base_url)
    rescue => e
      Rails.logger.error("Failed to generate unsubscribe link for invitation: #{e.message}")
      # Fallback to empty string if token generation fails
      ""
    end
  end

  def event_link
    "#{base_url}/events/#{event.slug}"
  end
end
