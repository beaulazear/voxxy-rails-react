require "sendgrid-ruby"
include SendGrid

class InviteUserService
  def self.send_invitation(activity, invited_email, inviter)
    return unless activity && invited_email.present? && inviter

    invited_email = invited_email.strip.downcase
    user = User.find_by("lower(email) = ?", invited_email)

    # Determine email type: New user vs. Existing user
    if user.nil?
      send_new_user_invite(invited_email, activity, inviter)
    else
      send_existing_user_invite(user, activity, inviter)
    end
  rescue StandardError => e
    Rails.logger.error "Failed to send invitation email: #{e.message}"
  end

  private

  def self.send_new_user_invite(email, activity, inviter)
    frontend_host = Rails.env.production? ? "https://voxxyai.com" : "http://localhost:3000"
    signup_link = "#{frontend_host}#/invite_signup?invited_email=#{email}&activity_id=#{activity.id}"

    subject = "#{inviter.name} Invited You to Join Voxxy!"
    content = <<~HTML
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1>Hey there! 🎉</h1>
          <p><strong>#{inviter.name}</strong> invited you to join <strong>#{activity.activity_name}</strong> on <strong>Voxxy</strong>! 🚀</p>
          <p>Join now and start planning amazing activities together! 💜</p>
          <a href="#{signup_link}"#{' '}
             style="display: inline-block; padding: 10px 20px; color: white; background-color: #8e44ad; text-decoration: none; border-radius: 5px;">
            Accept Invitation & Sign Up 📝
          </a>
          <p style="margin-top: 20px;">See you soon on Voxxy! 🥳</p>
        </body>
      </html>
    HTML

    send_email(email, subject, content)
  end

  def self.send_existing_user_invite(user, activity, inviter)
    frontend_host = Rails.env.production? ? "https://voxxyai.com" : "http://localhost:3000"
    login_link = "#{frontend_host}#/login?redirect=boards".strip

    subject = "#{inviter.name} Invited You to a New Activity on Voxxy!"
    content = <<~HTML
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1>Hey #{user.name}! 🎉</h1>
          <p><strong>#{inviter.name}</strong> invited you to join <strong>#{activity.activity_name}</strong> on <strong>Voxxy</strong>! 🚀</p>
          <p>Click below to log in and check it out! 💜</p>
          <a href="#{login_link}"#{' '}
             style="display: inline-block; padding: 10px 20px; color: white; background-color: #8e44ad; text-decoration: none; border-radius: 5px;">
            View Your Invite 📅
          </a>
          <p style="margin-top: 20px;">See you on Voxxy! 🥳</p>
        </body>
      </html>
    HTML

    send_email(user.email, subject, content)
  end

  def self.send_email(to_email, subject, content_html)
    from = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
    to = SendGrid::Email.new(email: to_email)
    content = Content.new(type: "text/html", value: content_html)

    mail = SendGrid::Mail.new
    mail.from = from
    mail.subject = subject
    personalization = SendGrid::Personalization.new
    personalization.add_to(to)
    mail.add_personalization(personalization)
    mail.add_content(content)

    sg = SendGrid::API.new(api_key: ENV["VoxxyKeyAPI"])
    response = sg.client.mail._("send").post(request_body: mail.to_json)

    Rails.logger.info "Sent invitation email to #{to_email}: #{response.status_code}"
  end
end
