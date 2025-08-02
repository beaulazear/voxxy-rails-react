class ActivityAcceptanceEmailService < BaseEmailService
  def self.send_acceptance_email(participant)
    activity = participant.activity
    host     = activity.user
    user     = participant.user

    return unless activity && host&.email && user&.name

    Rails.logger.info "Sending acceptance email to host (#{host.email}) for Activity ##{activity.id}"

    subject = "#{user.name} has accepted their Voxxy invitation! 🎉"

    homepage_url = "https://www.voxxyai.com/#/login"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        You've got a new RSVP! 🙌
      </p>

      <p style="#{BASE_STYLES[:text]}">
        <strong>#{user.name}</strong> has accepted their invitation to:<br>
        <strong>#{activity.emoji} #{activity.activity_name}</strong>
      </p>

      <p style="#{BASE_STYLES[:text]}">
        You're one step closer to an unforgettable plan.
      </p>
    HTML

    email_html = build_simple_email_template(
      "New RSVP Received!",
      content,
      "View on Voxxy",
      homepage_url
    )

    send_email(host.email, subject, email_html)

    Rails.logger.info "   ↳ Acceptance email sent successfully to #{host.email}"
  rescue StandardError => e
    Rails.logger.error "Failed to send acceptance email: #{e.message}"
    raise
  end
end
