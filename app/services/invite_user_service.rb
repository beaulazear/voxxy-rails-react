class InviteUserService < BaseEmailService
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

  def self.get_activity_type_info(activity_type)
    config = ActivityConfig.get(activity_type)
    { emoji: config[:emoji], description: config[:description] }
  end

  def self.send_new_user_invite(email, activity, inviter, participant)
    # Note: New users don't have preferences yet, so we always send these invites
    frontend_host = app_base_url

    response_link = "#{frontend_host}#/activities/#{activity.id}/respond/#{participant.guest_response_token}"
    signup_link = "#{frontend_host}#/invite_signup?invited_email=#{email}&activity_id=#{activity.id}"

    activity_info = get_activity_type_info(activity.activity_type)

    subject = "Help #{inviter.name} pick a #{activity.activity_type == 'Restaurant' ? 'restaurant' : 'bar'}"
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
              <h1 style="font-family: 'Montserrat', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #2d3748; margin: 0 0 20px 0;">
                #{activity.activity_type == 'Restaurant' ? '🍜 Finding the perfect restaurant' : '🍸 Finding the perfect bar'}
              </h1>
      #{'        '}
              <!-- Action Request -->
              <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; color: #4a5568; margin: 0 0 25px 0; line-height: 1.5;">
                <strong style="color: #2d3748;">#{inviter.name}</strong> is collecting ideas for #{activity.activity_type == 'Restaurant' ? 'your next meal' : 'your next night out'}.
                <br><span style="color: #2d3748; font-weight: 500;">Click below to start your quick survey.</span>
              </p>


              <!-- Main CTA Section -->
              <div style="background-color: #f7fafc; border: 2px solid #9D60F8; border-radius: 12px; padding: 30px; margin-bottom: 25px;">
                <h2 style="font-family: 'Montserrat', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #2d3748; margin: 0 0 12px 0;">
                  Action Required
                </h2>
                <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14px; color: #4a5568; margin: 0 0 25px 0; line-height: 1.4;">
                  Complete a 2-minute survey to share your preferences.
                </p>
                <a href="#{response_link}"
                   style="display: inline-block; font-family: 'Montserrat', Arial, sans-serif; padding: 16px 32px; font-size: 16px; font-weight: 600; color: white; background-color: #9D60F8; text-decoration: none; border-radius: 8px;">
                  Start Survey
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
              <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 12px; color: #718096; margin: 30px 0 0 0;">
                This is an automated notification from Voxxy
              </p>
            </div>
          </div>
        </body>
      </html>
    HTML

    # Add headers to mark as transactional email (not promotional)
    headers = {
      "X-Entity-Ref-ID" => "activity-#{activity.id}-#{participant.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "preference-request"]}',
      "Importance" => "high",
      "X-MSMail-Priority" => "High"
    }
    send_email(email, subject, content, headers)
  end

  def self.send_existing_user_invite(user, activity, inviter, participant)
    return unless can_send_email_to_user?(user)

    frontend_host = app_base_url

    response_link = "#{frontend_host}#/activities/#{activity.id}/respond/#{participant.guest_response_token}"
    accept_with_preferences_link = "#{frontend_host}#/activities/#{activity.id}/respond/#{participant.guest_response_token}/accept_with_preferences"
    login_link = "#{frontend_host}#/login?redirect=boards"

    activity_info = get_activity_type_info(activity.activity_type)
    has_saved_preferences = user.has_saved_preferences?

    subject = "Help #{inviter.name} pick a #{activity.activity_type == 'Restaurant' ? 'restaurant' : 'bar'}"
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
              <h1 style="font-family: 'Montserrat', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #2d3748; margin: 0 0 20px 0;">
                #{activity.activity_type == 'Restaurant' ? '🍜 Finding the perfect restaurant' : '🍸 Finding the perfect bar'}
              </h1>
      #{'        '}
              <!-- Action Request -->
              <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; color: #4a5568; margin: 0 0 25px 0; line-height: 1.5;">
                Hi #{user.name}! <strong style="color: #2d3748;">#{inviter.name}</strong> is collecting ideas for #{activity.activity_type == 'Restaurant' ? 'your next meal' : 'your next night out'}.
                <br><span style="color: #2d3748; font-weight: 500;">Click below to start your quick survey.</span>
              </p>


              <!-- Main CTA Section -->
              <div style="background-color: #f7fafc; border: 2px solid #9D60F8; border-radius: 12px; padding: 30px; margin-bottom: 25px;">
                <h2 style="font-family: 'Montserrat', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #2d3748; margin: 0 0 12px 0;">
                  Action Required
                </h2>
                #{has_saved_preferences ?
                  "<p style='font-family: \"Montserrat\", Arial, sans-serif; font-size: 14px; color: #4a5568; margin: 0 0 25px 0; line-height: 1.4;'>
                    Accept the invitation using your saved preferences, or take the survey to customize your response.
                  </p>
                  <a href='#{accept_with_preferences_link}'
                     style='display: inline-block; font-family: \"Montserrat\", Arial, sans-serif; padding: 16px 32px; font-size: 16px; font-weight: 600; color: white; background-color: #9D60F8; text-decoration: none; border-radius: 8px; margin-bottom: 15px;'>
                    Accept & Use My Preferences
                  </a>
                  <br>
                  <a href='#{response_link}'
                     style='display: inline-block; font-family: \"Montserrat\", Arial, sans-serif; padding: 12px 24px; font-size: 14px; font-weight: 500; color: #9D60F8; background-color: transparent; border: 1.5px solid #9D60F8; text-decoration: none; border-radius: 6px;'>
                    Take Survey Instead
                  </a>" :
                  "<p style='font-family: \"Montserrat\", Arial, sans-serif; font-size: 14px; color: #4a5568; margin: 0 0 25px 0; line-height: 1.4;'>
                    Accept the invitation and complete a 2-minute survey to share your preferences.
                  </p>
                  <a href='#{response_link}'
                     style='display: inline-block; font-family: \"Montserrat\", Arial, sans-serif; padding: 16px 32px; font-size: 16px; font-weight: 600; color: white; background-color: #9D60F8; text-decoration: none; border-radius: 8px;'>
                    Accept & Respond
                  </a>"
                }
              </div>

              <!-- Secondary option -->
              <div style="padding-top: 25px; border-top: 1px solid #e2e8f0;">
                <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 13px; color: #a0aec0; margin: 0 0 18px 0;">
                  Or view all your activities
                </p>
                <a href="#{login_link}"
                   style="display: inline-block; font-family: 'Montserrat', Arial, sans-serif; padding: 12px 24px; font-size: 14px; font-weight: 500; color: #9D60F8; background-color: transparent; border: 1.5px solid #9D60F8; text-decoration: none; border-radius: 6px;">
                  View Dashboard
                </a>
              </div>
      #{'        '}
              <!-- Footer -->
              <p style="font-family: 'Montserrat', Arial, sans-serif; font-size: 12px; color: #718096; margin: 30px 0 0 0;">
                This is an automated notification from Voxxy
              </p>
            </div>
          </div>
        </body>
      </html>
    HTML

    # Add headers to mark as transactional email (not promotional)
    headers = {
      "X-Entity-Ref-ID" => "activity-#{activity.id}-#{participant.id}",
      "X-SMTPAPI" => '{"category": ["transactional", "preference-request"]}',
      "Importance" => "high",
      "X-MSMail-Priority" => "High"
    }
    send_email(user.email, subject, content, headers)
  end
end
