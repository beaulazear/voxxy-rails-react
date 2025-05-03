require "sendgrid-ruby"
require "uri"
include SendGrid

class ActivityCompletionEmailService
  def self.send_completion_emails(activity)
    Rails.logger.info "Sending completion emails for Activity ##{activity.id}: “#{activity.activity_name}”"

    from    = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
    subject = "🎉 Thanks for Completing Your Voxxy Activity!"

    host = Rails.application.config.action_mailer.default_url_options[:host]
    port = Rails.application.config.action_mailer.default_url_options[:port]

    contact_url = URI::HTTP.build(
      host: host,
      port: port,
      path: "/#/contact"
    ).to_s

    recipient_emails = []
    recipient_emails << activity.user.email if activity.respond_to?(:user) && activity.user&.email
    recipient_emails += activity.participants.map(&:email)
    recipient_emails.uniq!

    recipient_emails.each do |email|
      to = SendGrid::Email.new(email: email)
      Rails.logger.info " → To: #{email}"

      html = <<~HTML
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f8f8f8;">
            <div style="max-width: 600px; background: white; padding: 20px; margin: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
              <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1742052456/VOXXY_FULL_2_gdzqjx.jpg"
                   alt="Voxxy Logo" width="300"
                   style="max-width: 100%; height: auto; margin-bottom: 20px;">

              <h1 style="color: #8e44ad;">Hey there! 👋</h1>

              <p style="font-size: 16px; color: #444;">
                Thanks for using Voxxy to plan “#{activity.activity_name}.” We hope you had an amazing time!
              </p>

              <p style="font-size: 16px; color: #444;">
                If you’d like to give us feedback or report a bug, please drop us a line:
              </p>

              <a href="#{contact_url}"
                 style="display: inline-block; padding: 12px 24px; margin: 20px 0; color: white; background-color: #8e44ad; text-decoration: none; border-radius: 8px; font-size: 18px;">
                📬 Contact Us
              </a>

              <p style="font-size: 14px; color: #999; margin-top: 20px;">
                We’re always here to help make your next adventure even better! <br>
                – The Voxxy Team
              </p>
            </div>
          </body>
        </html>
      HTML

      mail = SendGrid::Mail.new
      mail.from    = from
      mail.subject = subject

      personalization = Personalization.new
      personalization.add_to(to)
      mail.add_personalization(personalization)
      mail.add_content(Content.new(type: "text/html", value: html))

      sg       = SendGrid::API.new(api_key: ENV["VoxxyKeyAPI"])
      response = sg.client.mail._("send").post(request_body: mail.to_json)

      Rails.logger.info "   ↳ SendGrid Response: #{response.status_code}"
      if response.status_code.to_i != 202
        Rails.logger.error "   ↳ Error body: #{response.body}"
        raise "SendGrid Error: #{response.body}"
      end
    end
  rescue OpenSSL::SSL::SSLError => e
    Rails.logger.error "SSL Error: #{e.message}"
    raise
  end
end
