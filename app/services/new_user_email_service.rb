class NewUserEmailService < BaseEmailService
  def self.send_welcome_email(user)
    return unless can_send_email_to_user?(user)
    Rails.logger.info "Sending welcome email to: #{user.email}"

    subject = "You're in. Let's Voxxy."

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{user.name || "friend"},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Welcome to Voxxy! We're excited to have you here. 🎉
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Voxxy helps you find the perfect spot for food and drinks with friends — no more endless group chats trying to pick a place.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Have feedback or questions? Just reply to this email — we'd love to hear from you.
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
