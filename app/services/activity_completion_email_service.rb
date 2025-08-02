class ActivityCompletionEmailService < BaseEmailService
  def self.send_completion_emails(activity)
    Rails.logger.info "Sending completion emails for Activity ##{activity.id}: \"#{activity.activity_name}\""

    subject = "Thanks for using Voxxy! 🎉"

    host = Rails.application.config.action_mailer.default_url_options[:host]
    port = Rails.application.config.action_mailer.default_url_options[:port]

    contact_url = URI::HTTP.build(
      host: host,
      port: port,
      path: "/",
      fragment: "contact"
    ).to_s

    recipient_emails = []
    recipient_emails << activity.user.email if activity.respond_to?(:user) && activity.user&.email
    recipient_emails += activity.participants.map(&:email) if activity.respond_to?(:participants)
    recipient_emails.uniq!

    recipient_emails.each do |email|
      Rails.logger.info " → Sending to: #{email}"

      content = <<~HTML
        <p style="#{BASE_STYLES[:text]}">
          Hey there! 👋
        </p>

        <p style="#{BASE_STYLES[:text]}">
          Thanks for using Voxxy to plan <strong>"#{activity.activity_name}"</strong>. We hope you had an amazing time!
        </p>

        <p style="#{BASE_STYLES[:text]}">
          If you'd like to give us feedback or report a bug, please drop us a line — we're always looking to improve.
        </p>
      HTML

      email_html = build_simple_email_template(
        "Thanks for using Voxxy!",
        content,
        "Contact Us 📬",
        contact_url
      )

      send_email(email, subject, email_html)

      Rails.logger.info "   ↳ Completion email sent successfully to #{email}"
    end
  rescue StandardError => e
    Rails.logger.error "Failed to send completion emails: #{e.message}"
    raise
  end
end
