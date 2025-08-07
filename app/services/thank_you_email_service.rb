class ThankYouEmailService < BaseEmailService
  def self.send_thank_you_email(activity)
    return unless activity && activity.participants.any?

    Rails.logger.info "Sending thank-you emails for Activity ##{activity.id}: \"#{activity.activity_name}\""

    survey_link = "https://docs.google.com/forms/d/e/1FAIpQLScfrIiWXdpKLj_6va6XjcbRU5nxReNnhQb0nS192G8LVX3UCw/viewform"

    activity.participants.each do |participant|
      next unless participant.email
      next unless can_send_email_to_user?(participant)

      Rails.logger.info " → Sending to: #{participant.email}"

      subject = "Thanks for joining #{activity.activity_name}! 🎉"

      content = <<~HTML
        <p style="#{BASE_STYLES[:text]}">
          Hey #{participant.name || "friend"}! 🎉
        </p>

        <p style="#{BASE_STYLES[:text]}">
          We hope you had an <strong>amazing</strong> time at <strong>#{activity.activity_name}</strong>!#{' '}
        </p>

        <p style="#{BASE_STYLES[:text]}">
          Thank you for using Voxxy to plan your adventure! We're still growing and would love your feedback.
        </p>

        <p style="#{BASE_STYLES[:text]}">
          Your thoughts help us make Voxxy even better — take 2 minutes to share!
        </p>
      HTML

      email_html = build_simple_email_template(
        "Thanks for using Voxxy!",
        content,
        "Fill Out Feedback Form 📝",
        survey_link
      )

      send_email(participant.email, subject, email_html)

      Rails.logger.info "   ↳ Thank-you email sent successfully to #{participant.email}"
    end
  rescue StandardError => e
    Rails.logger.error "Failed to send thank-you emails: #{e.message}"
    raise
  end
end
