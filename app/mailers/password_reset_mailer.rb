class PasswordResetMailer < ApplicationMailer
    default from: "team@voxxyai.com"

    def send_reset_email(user)
      @user = user
      host = Rails.application.config.action_mailer.default_url_options[:host]
      port = Rails.application.config.action_mailer.default_url_options[:port]
      protocol = Rails.env.production? ? "https" : "http"

      @reset_link = "#{protocol}://#{host}:#{port}/reset-password?token=#{user.reset_password_token}"
      mail(to: @user.email, subject: "Password Reset Instructions")
    end
end
