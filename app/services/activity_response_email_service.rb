class ActivityResponseEmailService < BaseEmailService
  def self.send_response_email(response, activity)
    host = activity.user

    # Handle both user and guest responses
    if response.is_guest_response?
      participant_name = response.email
      participant_email = response.email
    else
      participant = response.user
      return unless participant&.name && participant&.email
      participant_name = participant.name
      participant_email = participant.email
    end

    return unless activity && host&.email && participant_name

    Rails.logger.info "Sending response email to host (#{host.email}) for Activity ##{activity.id}"

    subject = "#{participant_name} submitted their Voxxy preferences! 📝"
    homepage_url = "https://www.voxxyai.com"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        New Preferences Received! 🥳
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>#{participant_name}</strong> just submitted their preferences for:<br>
        <strong>#{activity.emoji} #{activity.activity_name}</strong>
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Stay tuned for more updates as everyone joins in!
      </p>
    HTML

    email_html = build_simple_email_template(
      "New Preferences Received!",
      content,
      "Go to Voxxy",
      homepage_url
    )

    send_email(host.email, subject, email_html)

    Rails.logger.info "   ↳ Response email sent successfully to #{host.email}"
  rescue StandardError => e
    Rails.logger.error "Failed to send response email: #{e.message}"
    raise
  end
end
