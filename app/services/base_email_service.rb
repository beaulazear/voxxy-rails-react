require "sendgrid-ruby"

class BaseEmailService
  include SendGrid
  # Consistent sender information
  SENDER_EMAIL = "noreply@voxxypresents.com"
  SENDER_NAME = "Voxxy Presents"

  # Get the application base URL dynamically from environment
  def self.app_base_url
    if Rails.env.production?
      primary_domain = ENV.fetch("PRIMARY_DOMAIN", "voxxyai.com")
      "https://#{primary_domain}"
    else
      # Allow configuring frontend URL for development (Voxxy Presents runs on port 5173)
      ENV.fetch("FRONTEND_URL", "http://localhost:5173")
    end
  end

  # Get the correct frontend URL based on user role and environment
  def self.user_frontend_url(user)
    # Check if we're in production environment (could be staging or prod deployment)
    if Rails.env.production?
      # Use PRIMARY_DOMAIN to determine if staging or production
      primary_domain = ENV.fetch("PRIMARY_DOMAIN", "voxxyai.com")

      if primary_domain.include?("voxxyai.com")
        # Staging environment (voxxyai.com API)
        if user.presents_user?
          "https://voxxy-presents-client-staging.onrender.com"
        else
          "https://voxxyai.com"
        end
      else
        # Production environment (heyvoxxy.com API)
        if user.presents_user?
          "https://www.voxxypresents.com"
        else
          "https://heyvoxxy.com"
        end
      end
    else
      # Development: Allow override or use localhost
      if user.presents_user?
        ENV.fetch("PRESENTS_FRONTEND_URL", "http://localhost:5173")
      else
        ENV.fetch("MOBILE_FRONTEND_URL", "http://localhost:3000")
      end
    end
  end

  # Check if user can receive emails
  def self.can_send_email_to_user?(user)
    return true unless user.respond_to?(:email_notifications) # If no preference field, allow
    user.email_notifications
  end

  # Check if email address belongs to a user with email preferences
  def self.can_send_email_to_address?(email_address)
    user = User.find_by(email: email_address.to_s.strip.downcase)
    return true unless user # If no user found, allow (new user invites, etc.)
    can_send_email_to_user?(user)
  end

  # Simplified, deliverability-focused email styling
  BASE_STYLES = {
    body: "margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;",
    container: "max-width: 600px; margin: 0 auto; padding: 20px;",
    inner_container: "background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0;",
    header: "margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;",
    logo: "max-width: 100%; height: auto; width: 150px;",
    title: "font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 15px 0; line-height: 1.3;",
    subtitle: "font-size: 16px; color: #666666; margin: 0 0 20px 0; line-height: 1.4;",
    text: "font-size: 15px; color: #333333; line-height: 1.6; margin: 0 0 15px 0;",
    link: "color: #0066cc; text-decoration: underline;",
    footer: "font-size: 13px; color: #888888; margin: 25px 0 0 0; padding-top: 20px; border-top: 1px solid #e0e0e0;"
  }.freeze

  def self.send_email(to_email, subject, content_html, additional_headers = {}, from_name: nil)
    from = SendGrid::Email.new(email: SENDER_EMAIL, name: from_name || SENDER_NAME)
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
    mail.add_header(SendGrid::Header.new(key: "List-Unsubscribe", value: "<mailto:unsubscribe@voxxypresents.com>"))

    # Add custom headers
    additional_headers.each do |key, value|
      mail.add_header(SendGrid::Header.new(key: key, value: value))
    end

    sg = SendGrid::API.new(api_key: ENV.fetch("VoxxyKeyAPI"))
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

  def self.build_simple_email_template(title, content, link_text = nil, link_url = nil)
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
            <div style="#{BASE_STYLES[:inner_container]}">
              <!-- Header -->
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

              <!-- Link -->
              #{link_text && link_url ?
                "<p style='#{BASE_STYLES[:text]}'>
                  <a href='#{link_url}' style='#{BASE_STYLES[:link]}'>#{link_text}</a>
                </p>" : ""
              }

              <!-- Footer -->
              <div style="#{BASE_STYLES[:footer]}">
                <p style="margin: 0 0 8px 0;">See you on Voxxy.</p>
                <p style="margin: 0 0 12px 0;">
                  If you didn't expect this email, you can safely ignore it.
                  <br><a href="mailto:unsubscribe@voxxypresents.com" style="#{BASE_STYLES[:link]}">Unsubscribe</a>
                </p>
                <p style="margin: 0; font-size: 12px; color: #aaaaaa;">
                  Powered by Voxxy Presents
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    HTML
  end
end
