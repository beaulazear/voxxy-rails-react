require "sendgrid-ruby"
require "uri"
include SendGrid

class EmailVerificationService
  def self.send_verification_email(user)
    Rails.logger.info "Attempting to send email with API key: #{ENV['VoxxyKeyAPI']&.slice(0, 4)}..."
    Rails.logger.info "To: #{user.email}, From: team@voxxyai.com"

    from = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
    to = SendGrid::Email.new(email: user.email)
    subject = "🚀 Verify Your Email - Welcome to Voxxy!"

    Rails.logger.info "User confirmation token: #{user.confirmation_token}"

    verification_link = URI::HTTP.build(
      host: Rails.application.config.action_mailer.default_url_options[:host],
      port: Rails.application.config.action_mailer.default_url_options[:port],
      path: "/verify",
      query: "token=#{user.confirmation_token}"
    ).to_s + "#/verify"

    Rails.logger.info "Verification link: #{verification_link}"

    content = Content.new(
      type: "text/html",
      value: <<~HTML
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f8f8f8;">
            <div style="max-width: 600px; background: white; padding: 20px; margin: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        #{'      '}
              <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1742052456/VOXXY_FULL_2_gdzqjx.jpg"
                   alt="Voxxy Logo" width="300"
                   style="max-width: 100%; height: auto; margin-bottom: 20px;">
        #{'      '}
              <h1 style="color: #8e44ad;">Welcome to Voxxy, #{user.name || "friend"}! 🎉</h1>
        #{'      '}
              <p style="font-size: 16px; color: #444;">
                Thank you for signing up! Before we get started, we need to verify your email address. Just click the button below to confirm your account:
              </p>

              <a href="#{verification_link}"
                 style="display: inline-block; padding: 12px 24px; margin: 20px 0; color: white; background-color: #8e44ad; text-decoration: none; border-radius: 8px; font-size: 18px;">
                ✅ Verify My Email
              </a>

              <p style="font-size: 14px; color: #666; margin-top: 15px;">
                If you didn’t sign up for Voxxy, no worries! Just ignore this email.
              </p>

              <p style="font-size: 14px; color: #999; margin-top: 20px;">
                🚀 See you soon on Voxxy! <br>
                - The Voxxy Team
              </p>
            </div>
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
