require "sendgrid-ruby"
require "uri"
include SendGrid

class WaitlistEmailService
  def self.send_waitlist_email(email)
    Rails.logger.info "Attempting to send waitlist email with API key: #{ENV['VoxxyKeyAPI']&.slice(0, 4)}..."
    Rails.logger.info "To: #{email}, From: team@voxxyai.com"

    from    = SendGrid::Email.new(email: "team@voxxyai.com", name: "Team Voxxy")
    to      = SendGrid::Email.new(email: email)
    subject = "You’re on the list — now what?"

    # build your HTML body
    html_content = <<~HTML
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f8f8f8;">
          <div style="max-width: 600px; background: white; padding: 20px; margin: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                 alt="Voxxy Logo" width="300"
                 style="max-width: 100%; height: auto; margin-bottom: 20px;">
            <h1 style="color: #8e44ad;">Hello from Voxxy!</h1>
            <p style="font-size: 16px; color: #444; text-align: left; line-height: 1.5;">
              You’re officially on the Voxxy waitlist — and we’re so glad you’re here.
            </p>
            <p style="font-size: 16px; color: #444; text-align: left; line-height: 1.5;">
              Voxxy is designed to take the chaos out of group plans — because we’ve all watched too many birthdays, trips, and dinners die in the group chat. We’re building something smarter: a space where you can align with your people faster, and actually make memories.
            </p>
            <p style="font-size: 16px; color: #444; text-align: left; line-height: 1.5;">
              You’ll be the first to know when we roll out new features, events, and launch perks. And if you’re up for it, we’d love to invite you into our beta program soon (aka the inner circle).
            </p>
            <p style="font-size: 16px; color: #444; text-align: left; line-height: 1.5;">
              Stay tuned — and thanks for being part of this from the ground up.
            </p>
            <p style="font-size: 16px; color: #444; text-align: left; margin-top: 30px;">
              Less chaos,<br/>
              Team Voxxy
            </p>
          </div>
        </body>
      </html>
    HTML

    content = Content.new(type: "text/html", value: html_content)

    mail = SendGrid::Mail.new
    mail.from    = from
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
    raise
  end
end
