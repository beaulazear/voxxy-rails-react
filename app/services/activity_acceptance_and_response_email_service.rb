require "sendgrid-ruby"
include SendGrid

class ActivityAcceptanceAndResponseEmailService
  def self.send_acceptance_and_response_email(participant, response)
    activity = participant.activity
    host     = activity.user
    user     = participant.user

    return unless activity && host&.email && user&.name && response

    Rails.logger.info "Sending acceptance + response email to host (#{host.email}) for Activity ##{activity.id}"

    from    = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
    to      = SendGrid::Email.new(email: host.email)
    subject = "🎉 #{user.name} joined and submitted their preferences!"

    homepage_url = "https://www.voxxyai.com"

    # Determine activity type for better messaging
    activity_type_text = case activity.activity_type&.downcase
    when "restaurant"
                          "dining preferences"
    when "cocktails"
                          "nightlife preferences"
    when "meeting"
                          "availability"
    else
                          "preferences"
    end

    html = <<~HTML
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f8f8f8;">
          <div style="max-width: 600px; background: white; padding: 20px; margin: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                 alt="Voxxy Logo" width="300"
                 style="max-width: 100%; height: auto; margin-bottom: 20px;">

            <h1 style="color: #8e44ad;">Great news! 🎉</h1>

            <p style="font-size: 18px; color: #444;">
              <strong>#{user.name}</strong> has joined your activity and submitted their #{activity_type_text}!
            </p>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8e44ad;">
              <p style="font-size: 16px; color: #333; margin: 0;">
                <strong>#{activity.emoji} #{activity.activity_name}</strong>
              </p>
            </div>

            <p style="font-size: 16px; color: #666; line-height: 1.5;">
              #{user.name} accepted your invitation and shared their #{activity_type_text} in one go!#{' '}
              You're one step closer to having everyone on board.
            </p>

            <a href="#{homepage_url}"
               style="display: inline-block; padding: 12px 24px; margin: 20px 0; color: white; background-color: #8e44ad; text-decoration: none; border-radius: 8px; font-size: 18px;">
              View Activity Details
            </a>

            <p style="font-size: 14px; color: #999; margin-top: 20px;">
              Keep the momentum going! Your amazing plan is coming together.<br>
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
