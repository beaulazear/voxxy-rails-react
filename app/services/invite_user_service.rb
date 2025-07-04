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

    response_link = "#{frontend_host}#/activities/#{activity.id}/respond/#{participant.guest_response_token}"
    signup_link = "#{frontend_host}#/invite_signup?invited_email=#{email}&activity_id=#{activity.id}"

    subject = "#{inviter.name} invited you to #{activity.activity_name}!"
    content = <<~HTML
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Montserrat', Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%); min-height: 100vh;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: rgba(255, 255, 255, 0.95); border-radius: 16px; padding: 40px 30px; text-align: center; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
      #{'        '}
              <!-- Logo -->
              <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                   alt="Voxxy Logo" width="200" style="margin-bottom: 30px; max-width: 100%; height: auto;">
      #{'        '}
              <!-- Main Title -->
              <h1 style="font-family: 'Montserrat', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #2d3748; margin: 0 0 10px 0;">
                You're invited! 🎉
              </h1>
      #{'        '}
              <!-- Subtitle -->
              <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; color: #718096; margin: 0 0 35px 0; line-height: 1.5;">
                <strong style="color: #2d3748;">#{inviter.name}</strong> wants you to join <strong style="color: #2d3748;">#{activity.activity_name}</strong> on Voxxy
              </p>

              <!-- Main CTA Section -->
              <div style="background-color: #f7fafc; border: 2px solid #9D60F8; border-radius: 12px; padding: 30px; margin-bottom: 25px;">
                <h2 style="font-family: 'Montserrat', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #2d3748; margin: 0 0 12px 0;">
                  Quick Response ⚡
                </h2>
                <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14px; color: #4a5568; margin: 0 0 25px 0; line-height: 1.4;">
                  No account needed - just click and share your preferences!
                </p>
                <a href="#{response_link}"
                   style="display: inline-block; font-family: 'Montserrat', Arial, sans-serif; padding: 16px 32px; font-size: 16px; font-weight: 600; color: white; background-color: #9D60F8; text-decoration: none; border-radius: 8px;">
                  Submit My Preferences
                </a>
              </div>

              <!-- Secondary option -->
              <div style="padding-top: 25px; border-top: 1px solid #e2e8f0;">
                <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 13px; color: #a0aec0; margin: 0 0 18px 0;">
                  Want to manage multiple activities?
                </p>
                <a href="#{signup_link}"
                   style="display: inline-block; font-family: 'Montserrat', Arial, sans-serif; padding: 12px 24px; font-size: 14px; font-weight: 500; color: #9D60F8; background-color: transparent; border: 1.5px solid #9D60F8; text-decoration: none; border-radius: 6px;">
                  Create Account
                </a>
              </div>
      #{'        '}
              <!-- Footer -->
              <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14px; color: #718096; margin: 30px 0 0 0;">
                See you on Voxxy! ✨
              </p>
            </div>
          </div>
        </body>
      </html>
    HTML

    send_email(email, subject, content)
  end

  def self.send_existing_user_invite(user, activity, inviter, participant)
    frontend_host = ENV.fetch("APP_BASE_URL", Rails.env.production? ? "https://voxxyai.com" : "http://localhost:3000")

    response_link = "#{frontend_host}#/activities/#{activity.id}/respond/#{participant.guest_response_token}"
    login_link = "#{frontend_host}#/login?redirect=boards"

    subject = "#{inviter.name} invited you to #{activity.activity_name}!"
    content = <<~HTML
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Montserrat', Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%); min-height: 100vh;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: rgba(255, 255, 255, 0.95); border-radius: 16px; padding: 40px 30px; text-align: center; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
      #{'        '}
              <!-- Logo -->
              <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                   alt="Voxxy Logo" width="200" style="margin-bottom: 30px; max-width: 100%; height: auto;">
      #{'        '}
              <!-- Main Title -->
              <h1 style="font-family: 'Montserrat', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #2d3748; margin: 0 0 10px 0;">
                Hey #{user.name}! 🎉
              </h1>
      #{'        '}
              <!-- Subtitle -->
              <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; color: #718096; margin: 0 0 35px 0; line-height: 1.5;">
                <strong style="color: #2d3748;">#{inviter.name}</strong> invited you to join <strong style="color: #2d3748;">#{activity.activity_name}</strong>
              </p>

              <!-- Main CTA Section -->
              <div style="background-color: #f7fafc; border: 2px solid #9D60F8; border-radius: 12px; padding: 30px; margin-bottom: 25px;">
                <h2 style="font-family: 'Montserrat', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #2d3748; margin: 0 0 12px 0;">
                  Quick Response ⚡
                </h2>
                <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14px; color: #4a5568; margin: 0 0 25px 0; line-height: 1.4;">
                  Jump right in and share your preferences!
                </p>
                <a href="#{response_link}"
                   style="display: inline-block; font-family: 'Montserrat', Arial, sans-serif; padding: 16px 32px; font-size: 16px; font-weight: 600; color: white; background-color: #9D60F8; text-decoration: none; border-radius: 8px;">
                  Submit My Preferences
                </a>
              </div>

              <!-- Secondary option -->
              <div style="padding-top: 25px; border-top: 1px solid #e2e8f0;">
                <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 13px; color: #a0aec0; margin: 0 0 18px 0;">
                  Or access your full dashboard
                </p>
                <a href="#{login_link}"
                   style="display: inline-block; font-family: 'Montserrat', Arial, sans-serif; padding: 12px 24px; font-size: 14px; font-weight: 500; color: #9D60F8; background-color: transparent; border: 1.5px solid #9D60F8; text-decoration: none; border-radius: 6px;">
                  View Dashboard
                </a>
              </div>
      #{'        '}
              <!-- Footer -->
              <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14px; color: #718096; margin: 30px 0 0 0;">
                See you on Voxxy! ✨
              </p>
            </div>
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
