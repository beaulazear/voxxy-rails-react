require "sendgrid-ruby"
require "uri"
include SendGrid

class EmailVerificationService
  def self.send_verification_email(user)
    Rails.logger.info "Attempting to send email with API key: #{ENV['VoxxyKeyAPI']&.slice(0, 4)}..."
    Rails.logger.info "To: #{user.email}, From: team@voxxyai.com"

    from = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
    to = SendGrid::Email.new(email: user.email)
    subject = "Verify Your Email Address"

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
          <body>
            <h1>Welcome to Voxxy!</h1>
            <p>Hi #{user.name},</p>
            <p>Thank you for signing up! Click the link below to verify your email:</p>
            <p>
              <a href="#{verification_link}" style="color: blue; text-decoration: underline;">
                Verify Email
              </a>
            </p>
            <p>If you didn’t sign up for Voxxy, you can ignore this email.</p>
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
