require "sendgrid-ruby"
include SendGrid

class ThankYouEmailService
  def self.send_thank_you_email(activity)
    return unless activity && activity.participants.any?

    activity.participants.each do |participant|
      next unless participant.email # Skip if no email

      from = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
      to = SendGrid::Email.new(email: participant.email)
      subject = "🎉 Thanks for Joining #{activity.activity_name} on Voxxy!"

      survey_link = "https://docs.google.com/forms/d/e/1FAIpQLScfrIiWXdpKLj_6va6XjcbRU5nxReNnhQb0nS192G8LVX3UCw/viewform"

      content = Content.new(
        type: "text/html",
        value: <<~HTML
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
              <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.svg"
                   alt="Voxxy Logo" width="400"
                   style="max-width: 100%; height: auto; margin-bottom: 20px;">
          #{'    '}
              <h1>Hey #{participant.name || "friend"}! 🎉</h1>
              <p>We hope you had an <strong>amazing</strong> time at <strong>#{activity.activity_name}</strong>! 🎊</p>
              <p>Thank you for using <strong>Voxxy</strong> to plan your adventure! 🚀</p>
              <p>We’re still growing and would <strong>love</strong> your feedback! 💜</p>
              <p>Your thoughts help us make Voxxy even better! 🌍</p>
          #{'    '}
              <p style="margin-top: 20px; font-size: 18px;"><strong>Take 2 minutes to share your thoughts!</strong> ✨</p>
              <a href="#{survey_link}"
                 style="display: inline-block; padding: 12px 24px; color: white; background-color: #8e44ad; text-decoration: none; border-radius: 8px; font-size: 16px;">
                Fill Out the Feedback Form 📝
              </a>

              <p style="margin-top: 30px;">See you next time on Voxxy! 🥳</p>
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

      Rails.logger.info "Sent thank-you email to #{participant.email}: #{response.status_code}"
    end
  rescue StandardError => e
    Rails.logger.error "Failed to send thank-you email: #{e.message}"
  end
end
