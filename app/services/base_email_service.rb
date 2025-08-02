require "sendgrid-ruby"

class BaseEmailService
  include SendGrid
  # Consistent sender information
  SENDER_EMAIL = "team@voxxyai.com"
  SENDER_NAME = "Voxxy"

  # Voxxy brand email styling
  BASE_STYLES = {
    body: "margin: 0; padding: 0; font-family: 'Montserrat', Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%); min-height: 100vh;",
    container: "max-width: 600px; margin: 0 auto; padding: 40px 20px;",
    inner_container: "background: rgba(255, 255, 255, 0.95); border-radius: 16px; padding: 40px 30px; text-align: center; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);",
    header: "margin-bottom: 30px;",
    logo: "margin-bottom: 30px; max-width: 100%; height: auto; width: 200px;",
    title: "font-family: 'Montserrat', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #2d3748; margin: 0 0 16px 0;",
    subtitle: "font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; color: #718096; margin: 0 0 20px 0; line-height: 1.5;",
    text: "font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; color: #4a5568; line-height: 1.5; margin: 0 0 16px 0; text-align: left;",
    button: "display: inline-block; font-family: 'Montserrat', Arial, sans-serif; padding: 16px 32px; font-size: 16px; font-weight: 600; color: white; background-color: #9D60F8; text-decoration: none; border-radius: 8px; margin: 20px 0;",
    footer: "font-family: 'Montserrat', Arial, sans-serif; font-size: 14px; color: #718096; margin: 30px 0 0 0; text-align: center;"
  }.freeze

  def self.send_email(to_email, subject, content_html, additional_headers = {})
    from = SendGrid::Email.new(email: SENDER_EMAIL, name: SENDER_NAME)
    to = SendGrid::Email.new(email: to_email)
    content = Content.new(type: "text/html", value: content_html)

    mail = SendGrid::Mail.new
    mail.from = from
    mail.subject = subject

    personalization = SendGrid::Personalization.new
    personalization.add_to(to)
    mail.add_personalization(personalization)
    mail.add_content(content)

    # Add spam-prevention headers
    mail.add_header(SendGrid::Header.new(key: "X-Priority", value: "3"))
    mail.add_header(SendGrid::Header.new(key: "X-Mailer", value: "Voxxy Application"))
    mail.add_header(SendGrid::Header.new(key: "List-Unsubscribe", value: "<mailto:unsubscribe@voxxyai.com>"))

    # Add custom headers
    additional_headers.each do |key, value|
      mail.add_header(SendGrid::Header.new(key: key, value: value))
    end

    sg = SendGrid::API.new(api_key: ENV["VoxxyKeyAPI"])
    response = sg.client.mail._("send").post(request_body: mail.to_json)

    Rails.logger.info "Email sent to #{to_email}: #{response.status_code}"

    if response.status_code.to_i != 202
      Rails.logger.error "SendGrid Error: #{response.body}"
      raise "SendGrid Error: #{response.body}"
    end

    response
  rescue StandardError => e
    Rails.logger.error "Email sending failed: #{e.message}"
    raise
  end

  def self.build_simple_email_template(title, content, button_text = nil, button_url = nil)
    <<~HTML
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>#{title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="#{BASE_STYLES[:body]}">
          <div style="#{BASE_STYLES[:container]}">
            <div style="#{BASE_STYLES[:inner_container]}">
              <!-- Logo -->
              <div style="#{BASE_STYLES[:header]}">
                <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                     alt="Voxxy" style="#{BASE_STYLES[:logo]}">
              </div>
      
              <!-- Main Title -->
              <h1 style="#{BASE_STYLES[:title]}">#{title}</h1>
      
              <!-- Content -->
              <div>
                #{content}
              </div>
      
              <!-- Button -->
              #{button_text && button_url ?
                "<div style='text-align: center; margin: 30px 0;'>
                  <a href='#{button_url}' style='#{BASE_STYLES[:button]}'>#{button_text}</a>
                </div>" : ""
              }
      
              <!-- Footer -->
              <div style="#{BASE_STYLES[:footer]}">
                <p style="margin: 0 0 10px 0;">See you on Voxxy! ✨</p>
                <p style="font-size: 12px; color: #a0aec0; margin: 0;">
                  If you didn't expect this email, you can safely ignore it.
                  <br><a href="mailto:unsubscribe@voxxyai.com" style="color: #9D60F8; text-decoration: none;">Unsubscribe</a>
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    HTML
  end
end