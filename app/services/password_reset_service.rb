require "sendgrid-ruby"
require "uri"
include SendGrid

class PasswordResetService
  def self.send_reset_email(user)
    Rails.logger.info "Attempting to send password reset email with API key: #{ENV['VoxxyKeyAPI']&.slice(0, 4)}..."
    Rails.logger.info "To: #{user.email}, From: team@voxxyai.com"

    from = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
    to = SendGrid::Email.new(email: user.email)
    subject = "Password Reset Instructions"

    Rails.logger.info "User reset token: #{user.reset_password_token}"

    # app/services/password_reset_service.rb

    frontend_host = Rails.env.production? ? "https://www.voxxyai.com" : "http://localhost:3000"

    # Manually construct the reset link to include the hash
    reset_link = "#{frontend_host}/#/reset-password?token=#{user.reset_password_token}"

    Rails.logger.info "Password Reset Link: #{reset_link}"

    content = Content.new(
      type: "text/html",
      value: <<~HTML
        <html>
          <body>
            <h1>Password Reset Instructions</h1>
            <p>Hello #{user.name},</p>
            <p>We received a request to reset your password. Click the link below to set a new password:</p>
            <p>
              <a href="#{reset_link}" style="color: blue; text-decoration: underline;">
                Reset Password
              </a>
            </p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </body>
        </html>
      HTML
    )

    # Build and send email
    mail = SendGrid::Mail.new
    mail.from = from
    mail.subject = subject
    personalization = SendGrid::Personalization.new
    personalization.add_to(to)
    mail.add_personalization(personalization)
    mail.add_content(content)

    sg = SendGrid::API.new(api_key: ENV["VoxxyKeyAPI"])
    response = sg.client.mail._("send").post(request_body: mail.to_json)

    Rails.logger.info "SendGrid Response: #{response.status_code} - #{response.body}"

    raise "SendGrid Error: #{response.body}" if response.status_code.to_i != 202
  rescue OpenSSL::SSL::SSLError => e
    Rails.logger.error "SSL Error: #{e.message}"
    Rails.logger.error "Ensure CA certificates are updated on your system."
    raise
  end
end