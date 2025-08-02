class NewUserEmailService < BaseEmailService
  def self.send_welcome_email(user)
    Rails.logger.info "Sending welcome email to: #{user.email}"

    subject = "You're in. Let's Voxxy."

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{user.name || "friend"},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        You just unlocked early access to Voxxy — welcome to the beta crew! 🎉
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Right now, you can try our two core tools:
      </p>

      <ul style="#{BASE_STYLES[:text]}; padding-left: 20px;">
        <li style="margin-bottom: 8px;"><strong>Let's Eat</strong> — smart dining suggestions</li>
        <li style="margin-bottom: 8px;"><strong>Let's Meet</strong> — find a time that actually works for everyone</li>
      </ul>

      <p style="#{BASE_STYLES[:text]}">
        This is a live product, which means things are changing fast — and your feedback helps shape what comes next.#{' '}
        Found a bug? Got a feature idea? Just reply to this email or submit through the feedback button in the app.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We're so excited to build this with you.
      </p>

      <p style="#{BASE_STYLES[:text]}; margin-top: 30px;">
        Less chaos. More memories,<br/>
        Team Voxxy
      </p>
    HTML

    email_html = build_simple_email_template(
      "Welcome to Voxxy!",
      content
    )

    send_email(user.email, subject, email_html)

    Rails.logger.info "Welcome email sent successfully to #{user.email}"
  rescue StandardError => e
    Rails.logger.error "Failed to send welcome email: #{e.message}"
    raise
  end

  # Alias for backward compatibility
  def self.new_user_email_service(user)
    send_welcome_email(user)
  end
end
