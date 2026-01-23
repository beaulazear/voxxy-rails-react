class UnsubscribeTokenService
  def self.generate_token(email:, event: nil, organization: nil)
    UnsubscribeToken.create!(
      email: email,
      event: event,
      organization: organization
    )
  end

  def self.generate_for_registration(registration)
    event = registration.event
    organization = event.organization

    generate_token(
      email: registration.email,
      event: event,
      organization: organization
    )
  end

  def self.validate_and_get_context(token)
    unsubscribe_token = UnsubscribeToken.find_active_token(token)

    {
      token: unsubscribe_token,
      email: unsubscribe_token.email,
      event: unsubscribe_token.event,
      organization: unsubscribe_token.organization
    }
  end

  def self.process_unsubscribe(token, scope:)
    context = validate_and_get_context(token)
    unsubscribe_token = context[:token]
    email = context[:email]
    event = context[:event]
    organization = context[:organization]

    # Validate scope is allowed
    unless EmailUnsubscribe::SCOPES.include?(scope)
      raise ArgumentError, "Invalid scope: #{scope}"
    end

    # Create the unsubscribe record
    unsubscribe_record = case scope
    when 'event'
      raise ArgumentError, "Cannot unsubscribe from event - no event context in token" unless event
      EmailUnsubscribe.create_or_find_unsubscribe(
        email: email,
        scope: 'event',
        event: event,
        source: 'user_action'
      )
    when 'organization'
      raise ArgumentError, "Cannot unsubscribe from organization - no organization context in token" unless organization
      EmailUnsubscribe.create_or_find_unsubscribe(
        email: email,
        scope: 'organization',
        organization: organization,
        source: 'user_action'
      )
    when 'global'
      EmailUnsubscribe.create_or_find_unsubscribe(
        email: email,
        scope: 'global',
        source: 'user_action'
      )
    end

    # Mark token as used
    unsubscribe_token.mark_as_used!

    # Also update the Registration model's email_unsubscribed flag if global unsubscribe
    if scope == 'global' && event
      event.registrations.where(email: email).update_all(email_unsubscribed: true)
    end

    unsubscribe_record
  end

  def self.generate_unsubscribe_url(token, frontend_url: nil)
    base_url = frontend_url || ENV['PRESENTS_FRONTEND_URL'] || 'https://voxxypresents.com'
    "#{base_url}/unsubscribe/#{token}"
  end
end
