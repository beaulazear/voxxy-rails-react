require "sendgrid-ruby"
require "uri"
include SendGrid

class ActivityFinalizationEmailService
  def self.send_finalization_emails(activity)
    Rails.logger.info "Sending finalization emails for Activity ##{activity.id}: “#{activity.activity_name}”"

    # Sender info
    from    = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
    subject = "📅 Your Voxxy Activity is Finalized!"

    # Build share URL
    host = Rails.application.config.action_mailer.default_url_options[:host]
    port = Rails.application.config.action_mailer.default_url_options[:port]
    url_opts  = Rails.application.config.action_mailer.default_url_options
    share_url = Rails.application.routes.url_helpers.share_activity_url(activity, **url_opts)

    recipient_emails = []
    recipient_emails += activity.participants.map(&:email)
    recipient_emails += activity.responses.map(&:email).compact
    recipient_emails.uniq!
    recipient_emails.reject! { |email| email == activity.user&.email }

    # Fetch pinned restaurant selection, if any
    pinned = activity.pinned_activities.find_by(selected: true)

    recipient_emails.each do |email|
      to = SendGrid::Email.new(email: email)
      Rails.logger.info " → To: #{email}"

      # Build email HTML content
      html = <<~HTML
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f8f8f8;">
            <div style="max-width: 600px; background: white; padding: 20px; margin: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
              <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                   alt="Voxxy Logo" width="300"
                   style="max-width: 100%; height: auto; margin-bottom: 20px;">

              <h1 style="color: #8e44ad;">Your Voxxy Activity is Finalized! 🎉</h1>

              <h2 style="color: #444;">#{activity.emoji} #{activity.activity_name}</h2>
      HTML

      if activity.date_day.present? && activity.date_time.present?
        html += <<~HTML
              <p style="font-size: 16px; color: #444;">
                <strong>🗓 Date & Time:</strong> #{activity.date_day.strftime("%A, %B %-d, %Y")} at #{activity.date_time.strftime("%I:%M %p")}
              </p>
        HTML
      end

      if pinned
        html += <<~HTML
              <p style="font-size: 16px; color: #444;">
                <strong>📍 Final Selection:</strong><br>
                #{pinned.title}<br>
                #{pinned.address}
              </p>
        HTML
      end

      html += <<~HTML
              <p style="font-size: 16px; color: #444;">View full details and share your plan:</p>

              <a href="#{share_url}"
                 style="display: inline-block; padding: 12px 24px; margin: 20px 0; color: white; background-color: #8e44ad; text-decoration: none; border-radius: 8px; font-size: 18px;">
                View & Share Plan
              </a>

              <p style="font-size: 14px; color: #999; margin-top: 20px;">
                We can’t wait to hear how it goes!<br>
                – The Voxxy Team
              </p>
            </div>
          </body>
        </html>
      HTML

      # Prepare and send mail
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
