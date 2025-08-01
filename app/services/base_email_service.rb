require "sendgrid-ruby"
include SendGrid

class BaseEmailService
  # Consistent sender information
  SENDER_EMAIL = "team@voxxyai.com"
  SENDER_NAME = "Voxxy"
  
  # Standard email styling that's spam-friendly
  BASE_STYLES = {
    body: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;",
    container: "background: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e1e5e9;",
    header: "text-align: center; margin-bottom: 30px;",
    title: "color: #2d3748; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;",
    text: "color: #4a5568; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;",
    button: "display: inline-block; padding: 12px 24px; background-color: #805ad5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px; margin: 20px 0;",
    footer: "color: #718096; font-size: 14px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;"
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
    mail.add_header("X-Priority", "3")
    mail.add_header("X-Mailer", "Voxxy Application")
    mail.add_header("List-Unsubscribe", "<mailto:unsubscribe@voxxyai.com>")
    
    # Add custom headers
    additional_headers.each do |key, value|
      mail.add_header(key, value)
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
        </head>
        <body style="#{BASE_STYLES[:body]}">
          <div style="#{BASE_STYLES[:container]}">
            <div style="#{BASE_STYLES[:header]}">
              <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                   alt="Voxxy" width="120" style="max-width: 100%; height: auto;">
            </div>
            
            <h1 style="#{BASE_STYLES[:title]}">#{title}</h1>
            
            <div>
              #{content}
            </div>
            
            #{button_text && button_url ? 
              "<div style='text-align: center;'>
                <a href='#{button_url}' style='#{BASE_STYLES[:button]}'>#{button_text}</a>
              </div>" : ""
            }
            
            <div style="#{BASE_STYLES[:footer]}">
              <p>Best regards,<br>The Voxxy Team</p>
              <p style="font-size: 12px; color: #a0aec0;">
                If you didn't expect this email, you can safely ignore it.
                <br><a href="mailto:unsubscribe@voxxyai.com" style="color: #a0aec0;">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    HTML
  end
end