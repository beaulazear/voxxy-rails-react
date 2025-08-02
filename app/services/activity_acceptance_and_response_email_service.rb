class ActivityAcceptanceAndResponseEmailService < BaseEmailService
  def self.send_acceptance_and_response_email(participant, response)
    activity = participant.activity
    host     = activity.user
    user     = participant.user

    return unless activity && host&.email && user&.name && response

    Rails.logger.info "Sending acceptance + response email to host (#{host.email}) for Activity ##{activity.id}"

    subject = "#{user.name} joined and submitted their preferences! 🎉"
    homepage_url = "https://www.voxxyai.com"

    # Determine activity type for better messaging
    activity_type_text = case activity.activity_type&.downcase
    when "restaurant"
      "dining preferences"
    when "cocktails"
      "nightlife preferences"
    when "meeting"
      "availability"
    else
      "preferences"
    end

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Great news! 🎉
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>#{user.name}</strong> has joined your activity and submitted their #{activity_type_text}!
      </p>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #805ad5;">
        <p style="#{BASE_STYLES[:text]}; margin: 0;">
          <strong>#{activity.emoji} #{activity.activity_name}</strong>
        </p>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        #{user.name} accepted your invitation and shared their #{activity_type_text} in one go!#{' '}
        You're one step closer to having everyone on board.
      </p>
    HTML

    email_html = build_simple_email_template(
      "Great News!",
      content,
      "View Activity Details",
      homepage_url
    )

    send_email(host.email, subject, email_html)

    Rails.logger.info "   ↳ Acceptance + response email sent successfully to #{host.email}"
  rescue StandardError => e
    Rails.logger.error "Failed to send acceptance and response email: #{e.message}"
    raise
  end
end
