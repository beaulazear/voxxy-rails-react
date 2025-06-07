require "sendgrid-ruby"
include SendGrid

class ActivityResponseEmailService
  def self.send_response_email(response, activity)
    participant = response.user
    host = activity.user

    return unless activity && host&.email && participant&.name

    Rails.logger.info "Sending response email to host (#{host.email}) for Activity ##{activity.id}"

    from    = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
    to      = SendGrid::Email.new(email: host.email)
    subject = "📝 #{participant.name} submitted their Voxxy preferences!"

    homepage_url = "https://www.voxxyai.com"

    html = <<~HTML
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f8f8f8;">
          <div style="max-width: 600px; background: white; padding: 20px; margin: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                 alt="Voxxy Logo" width="300"
                 style="max-width: 100%; height: auto; margin-bottom: 20px;">

            <h1 style="color: #8e44ad;">New Preferences Received! 🥳</h1>

            <p style="font-size: 18px; color: #444;">
              <strong>#{participant.name}</strong> just submitted their preferences for:<br>
              <strong>#{activity.emoji} #{activity.activity_name}</strong>
            </p>

            <a href="#{homepage_url}"
               style="display: inline-block; padding: 12px 24px; margin: 20px 24px; color: white; background-color: #8e44ad; text-decoration: none; border-radius: 8px; font-size: 18px;">
              Go to Voxxy
            </a>

            <p style="font-size: 14px; color: #999; margin-top: 20px;">
              Stay tuned for more updates as everyone joins in!<br>
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
  rescue OpenSSL::SSL::SSLError => e
    Rails.logger.error "SSL Error: #{e.message}"
    raise
  end
end
