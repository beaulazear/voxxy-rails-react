class EmailVerificationService < BaseEmailService
  def self.send_verification_email(user)
    Rails.logger.info "Sending verification email to: #{user.email}"

    verification_link = URI::HTTP.build(
      host: Rails.application.config.action_mailer.default_url_options[:host],
      port: Rails.application.config.action_mailer.default_url_options[:port],
      path: "/verify",
      query: "token=#{user.confirmation_token}"
    ).to_s + "#/verify"

    subject = "Verify your email - Welcome to Voxxy"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{user.name || "there"},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Welcome to Voxxy! To get started, please verify your email address by clicking the button below:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="#{verification_link}" style="#{BASE_STYLES[:button]}">
          Verify Email Address
        </a>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        This link will expire in 24 hours for security reasons.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        If you didn't create a Voxxy account, you can safely ignore this email.
      </p>
    HTML

    email_html = build_simple_email_template(
      "Verify Your Email Address",
      content
    )

    send_email(user.email, subject, email_html, {})

    Rails.logger.info "Verification email sent successfully to #{user.email}"
  rescue StandardError => e
    Rails.logger.error "Failed to send verification email: #{e.message}"
    raise
  end
end
