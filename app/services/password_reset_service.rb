require "sendgrid-ruby"
require "uri"
include SendGrid

class PasswordResetService < BaseEmailService
  def self.send_reset_email(user)
    # Always send password reset emails regardless of email preferences (security-critical)
    Rails.logger.info "Attempting to send password reset email with API key: #{ENV.fetch('VoxxyKeyAPI')&.slice(0, 4)}..."
    Rails.logger.info "To: #{user.email}, From: team@voxxyai.com"

    # Determine product name based on user role
    product_name = user.presents_user? ? "Voxxy Presents" : "Voxxy"

    from = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
    to = SendGrid::Email.new(email: user.email)
    subject = "🔑 Reset Your Password on #{product_name}"

    # Use role-aware frontend URL to send users to the correct app
    frontend_host = user_frontend_url(user)

    # Voxxy Presents uses BrowserRouter (no hash), consumers use HashRouter (with #/)
    if user.presents_user?
      # Voxxy Presents: /reset-password (no hash)
      reset_link = "#{frontend_host}/reset-password?token=#{user.reset_password_token}"
    else
      # Consumer/Mobile: #/reset-password (with hash for legacy HashRouter)
      reset_link = "#{frontend_host}/#/reset-password?token=#{user.reset_password_token}"
    end

    Rails.logger.info "Password Reset Link: #{reset_link} (user role: #{user.role})"

    content = Content.new(
      type: "text/html",
      value: <<~HTML
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; background-color: #f9f9f9; padding: 30px;">
        #{'    '}
            <!-- Voxxy Logo -->
            <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"#{' '}
                 alt="Voxxy Logo" width="300" style="margin-bottom: 20px;">

            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);">
        #{'      '}
              <h1 style="color: #8e44ad; margin-bottom: 10px;">Reset Your Password</h1>
              <p style="color: #333; font-size: 16px;">Hey #{user.name},</p>
              <p style="color: #333; font-size: 16px;">
                We received a request to reset your #{product_name} password. Click the button below to set a new one:
              </p>

              <a href="#{reset_link}"
                 style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: bold;
                        color: white; background-color: #8e44ad; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                Reset My Password 🔑
              </a>

              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you didn't request this, no worries—you can safely ignore this email. 💜
              </p>
            </div>

            <p style="color: #888; font-size: 12px; margin-top: 20px;">
              Sent with 💜 from the Voxxy Team | <a href="#{app_base_url}" style="color: #8e44ad; text-decoration: none;">#{app_base_url.gsub('https://', '').gsub('http://', '')}</a>
            </p>

          </body>
        </html>
      HTML
    )

    mail = SendGrid::Mail.new
    mail.from = from
    mail.subject = subject
    personalization = SendGrid::Personalization.new
    personalization.add_to(to)
    mail.add_personalization(personalization)
    mail.add_content(content)

    sg = SendGrid::API.new(api_key: ENV.fetch("VoxxyKeyAPI"))
    response = sg.client.mail._("send").post(request_body: mail.to_json)

    Rails.logger.info "✅ Sent password reset email to #{user.email}: #{response.status_code}"

    raise "SendGrid Error: #{response.body}" if response.status_code.to_i != 202
  rescue StandardError => e
    Rails.logger.error "❌ Failed to send password reset email: #{e.message}"
  end
end
