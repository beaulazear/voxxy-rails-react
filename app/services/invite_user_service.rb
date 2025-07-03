require "sendgrid-ruby"
include SendGrid

class InviteUserService
  def self.send_invitation(activity, invited_email, inviter)
    return unless activity && invited_email.present? && inviter

    invited_email = invited_email.strip.downcase
    user = User.find_by("lower(email) = ?", invited_email)

    # Find or create activity participant
    participant = activity.activity_participants.find_or_create_by(invited_email: invited_email) do |p|
      p.user = user if user
    end

    # Ensure participant has a guest token
    participant.regenerate_guest_token! if participant.guest_response_token.blank?

    # Determine email type: New user vs. Existing user
    if user.nil?
      send_new_user_invite(invited_email, activity, inviter, participant)
    else
      send_existing_user_invite(user, activity, inviter, participant)
    end
  rescue StandardError => e
    Rails.logger.error "Failed to send invitation email: #{e.message}"
  end

  private

  def self.send_new_user_invite(email, activity, inviter, participant)
    frontend_host = ENV.fetch("APP_BASE_URL", Rails.env.production? ? "https://voxxyai.com" : "http://localhost:3000")

    # Use guest response link instead of signup link
    response_link = "#{frontend_host}#/activities/#{activity.id}/respond/#{participant.guest_response_token}"
    signup_link = "#{frontend_host}#/invite_signup?invited_email=#{email}&activity_id=#{activity.id}"

    subject = "#{inviter.name} Invited You to Join #{activity.activity_name}!"
    content = <<~HTML
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                   alt="Voxxy Logo" width="300"
                   style="max-width: 100%; height: auto; margin-bottom: 20px;">
          <h1>Hey there! 🎉</h1>
          <p><strong>#{inviter.name}</strong> invited you to join <strong>#{activity.activity_name}</strong> on <strong>Voxxy</strong>! 🚀</p>
      #{'    '}
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Quick Response (No Account Needed) ⚡</h3>
            <p>Submit your preferences instantly without creating an account:</p>
            <a href="#{response_link}"#{' '}
               style="display: inline-block; padding: 12px 24px; color: white; background-color: #28a745; text-decoration: none; border-radius: 5px; margin: 10px;">
              Submit Preferences Now 🍽️
            </a>
          </div>
      #{'    '}
          <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 20px;">
            <h3>Or Join Voxxy for Full Access 💜</h3>
            <p>Create an account to manage all your activities and get personalized recommendations:</p>
            <a href="#{signup_link}"#{' '}
               style="display: inline-block; padding: 10px 20px; color: white; background-color: #8e44ad; text-decoration: none; border-radius: 5px;">
              Create Account & Join 📝
            </a>
          </div>
      #{'    '}
          <p style="margin-top: 20px;">See you soon on Voxxy! 🥳</p>
        </body>
      </html>
    HTML

    send_email(email, subject, content)
  end

  def self.send_existing_user_invite(user, activity, inviter, participant)
    frontend_host = ENV.fetch("APP_BASE_URL", Rails.env.production? ? "https://voxxyai.com" : "http://localhost:3000")

    # Provide both options - quick response and full login
    response_link = "#{frontend_host}#/activities/#{activity.id}/respond/#{participant.guest_response_token}"
    login_link = "#{frontend_host}#/login?redirect=boards"

    subject = "#{inviter.name} Invited You to #{activity.activity_name} on Voxxy!"
    content = <<~HTML
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <div style="max-width: 600px; background: white; padding: 20px; margin: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                 alt="Voxxy Logo" width="300"
                 style="max-width: 100%; height: auto; margin-bottom: 20px;">
            <h1>Hey #{user.name}! 🎉</h1>
            <p><strong>#{inviter.name}</strong> invited you to join <strong>#{activity.activity_name}</strong> on <strong>Voxxy</strong>! 🚀</p>
      #{'      '}
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Quick Response ⚡</h3>
              <p>Submit your preferences right away:</p>
              <a href="#{response_link}"#{' '}
                 style="display: inline-block; padding: 12px 24px; color: white; background-color: #28a745; text-decoration: none; border-radius: 5px; margin: 10px;">
                Submit Preferences Now 🍽️
              </a>
            </div>
      #{'      '}
            <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 20px;">
              <h3>Or Login for Full Dashboard 💜</h3>
              <a href="#{login_link}"#{' '}
                 style="display: inline-block; padding: 10px 20px; color: white; background-color: #8e44ad; text-decoration: none; border-radius: 5px;">
                View Your Dashboard 📅
              </a>
            </div>
      #{'      '}
            <p style="margin-top: 20px;">See you on Voxxy! 🥳</p>
          </div>
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
