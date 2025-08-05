class EmailVerificationService < BaseEmailService
  def self.send_verification_email(user)
    Rails.logger.info "Sending verification email to: #{user.email}"

    subject = "Verify your email - Welcome to Voxxy"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hi #{user.name || "there"},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Welcome to Voxxy! To get started, please verify your email address by entering this code in the app:
      </p>

      <div style="text-align: center; margin: 40px 0;">
        <div style="
          display: inline-block;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #cc31e8;
          background: #f8f9fa;
          padding: 20px 30px;
          border-radius: 12px;
          border: 2px solid #cc31e8;
          font-family: 'Courier New', monospace;
        ">
          #{user.confirmation_code}
        </div>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        This code will expire in 24 hours for security reasons.
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
