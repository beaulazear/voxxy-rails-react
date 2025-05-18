require "sendgrid-ruby"
require "uri"
include SendGrid

class NewUserEmailService
  def self.new_user_email_service(user)
    Rails.logger.info "Attempting to send waitlist email with API key: #{ENV['VoxxyKeyAPI']&.slice(0, 4)}..."
    Rails.logger.info "To: #{user.email}, From: team@voxxyai.com"

    from    = SendGrid::Email.new(email: "team@voxxyai.com", name: "Team Voxxy")
    to      = SendGrid::Email.new(email: user.email)
    subject = "You’re in. Let’s Voxxy."

    html_content = <<~HTML
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f8f8f8;">
          <div style="max-width: 600px; background: white; padding: 20px; margin: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                 alt="Voxxy Logo" width="300"
                 style="max-width: 100%; height: auto; margin-bottom: 20px;">
            <h1 style="color: #8e44ad;">Welcome to Voxxy, #{user.name || "friend"}! 🎉</h1>
            <p style="font-size: 16px; color: #444; text-align: left; line-height: 1.5;">
              You just unlocked early access to Voxxy — welcome to the beta crew.
            </p>
            <p style="font-size: 16px; color: #444; text-align: left; line-height: 1.5;">
                Right now, you can try our two core tools:
            </p>
            <ul>
            <li style="text-align: left;">
                Let’s Eat — smart dining suggestions
            </li>
            <li style="text-align: left;">
                Let’s Meet — find a time that actually works for everyone
            </li>
            </ul>
            <p style="font-size: 16px; color: #444; text-align: left; line-height: 1.5;">
                This is a live product, which means things are changing fast — and your feedback helps shape what comes next. Found a bug? Got a feature idea? Just reply to this email or submit through the feedback button in the app.
            </p>
            <p style="font-size: 16px; color: #444; text-align: left; line-height: 1.5;">
              We’re so excited to build this with you.
            </p>
            <p style="font-size: 16px; color: #444; text-align: left; margin-top: 30px;">
              Less chaos. More memories,<br/>
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
