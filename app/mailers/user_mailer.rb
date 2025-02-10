class UserMailer < ApplicationMailer
  default from: "team@voxxyai.com"

  def verification_email(user)
    @user = user
    @verification_link = "#{Rails.application.config.action_mailer.default_url_options[:host]}/verify?token=#{user.confirmation_token}"
    mail(to: @user.email, subject: "Verify Your Email Address")
  end

  def invitation_email(email, activity, inviter)
    @activity = activity
    @inviter = inviter
    frontend_host = Rails.env.production? ? "https://voxxyai.com" : "http://localhost:3000"
    @signup_link = "#{frontend_host}#/invite_signup?invited_email=#{email}&activity_id=#{activity.id}"

    mail(to: email, subject: "#{inviter.name} Invited You to Join Voxxy!")
  end

  def existing_user_invite_email(user, activity, inviter)
    @activity = activity
    @inviter = inviter
    frontend_host = Rails.env.production? ? "https://voxxyai.com" : "http://localhost:3000"
    # ✅ Ensure the login link is properly encoded and has no trailing spaces
    @login_link = "#{frontend_host}#/login?redirect=boards".strip

    mail(to: user.email, subject: "#{inviter.name} Invited You to a New Activity on Voxxy!")
  end
end
