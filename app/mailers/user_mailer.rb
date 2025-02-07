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
    @signup_link = "#{Rails.application.config.action_mailer.default_url_options[:host]}/signup?invited_email=#{email}&activity_id=#{activity.id}"

    mail(to: email, subject: "#{inviter.name} Invited You to Join Voxxy!")
  end

  def existing_user_invite_email(user, activity, inviter)
    @activity = activity
    @inviter = inviter
    @login_link = "#{Rails.application.config.action_mailer.default_url_options[:host]}/login"

    mail(to: user.email, subject: "#{inviter.name} Invited You to a New Activity on Voxxy!")
  end
end
