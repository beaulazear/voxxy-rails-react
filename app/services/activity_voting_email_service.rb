require "sendgrid-ruby"
include SendGrid

class ActivityVotingEmailService
  def self.send_voting_emails(activity)
    Rails.logger.info "Sending voting-stage emails for Activity ##{activity.id}: “#{activity.activity_name}”"

    recipient_emails = activity.participants.map(&:email).map(&:strip).map(&:downcase).uniq
    recipient_emails.reject! { |email| email == activity.user&.email }

    recipient_emails.each do |email|
      user = User.find_by("lower(email) = ?", email)
      if user
        send_existing_user_vote(user, activity)
      else
        send_new_user_vote(email, activity)
      end
    end
  rescue StandardError => e
    Rails.logger.error "Failed to send voting emails: #{e.message}"
  end

  private

  def self.frontend_host
    Rails.env.production? ? "https://voxxyai.com" : "http://localhost:3000"
  end

  def self.send_new_user_vote(email, activity)
    signup_link = "#{frontend_host}#/invite_signup?invited_email=#{CGI.escape(email)}&activity_id=#{activity.id}"
    subject     = "📝 Sign Up & Vote on Your Voxxy Activity!"
    html = <<~HTML
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
               alt="Voxxy Logo" width="300" style="max-width:100%;height:auto;margin-bottom:20px;">

          <h1>Welcome! 🎉</h1>
          <p>You’ve been invited to vote on <strong>#{activity.activity_name}</strong>!</p>
          <p>Create a free Voxxy account to cast your vote and help finalize the plans.</p>

          <a href="#{signup_link}"
             style="display:inline-block;padding:12px 24px;margin:20px 0;color:white;
                    background-color:#8e44ad;text-decoration:none;border-radius:8px;font-size:18px;">
            Sign Up & Vote Now
          </a>

          <p style="font-size:14px;color:#999;margin-top:20px;">
            Can’t wait to see which option wins!<br>– The Voxxy Team
          </p>
        </body>
      </html>
    HTML

    send_email(email, subject, html)
  end

  def self.send_existing_user_vote(user, activity)
    # Existing users get a login + direct-vote prompt
    login_link = "#{frontend_host}#/login?redirect=vote&activity_id=#{activity.id}"
    subject    = "🗳️ Your Vote Is Needed on #{activity.activity_name}!"
    html = <<~HTML
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f8f8f8;">
          <div style="max-width:600px;background:white;padding:20px;margin:auto;
                      border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <img src="https://res.cloudinary.com/dgtpgywhl/image/upload/v1746365141/Voxxy_Header_syvpzb.png"
                 alt="Voxxy Logo" width="300" style="max-width:100%;height:auto;margin-bottom:20px;">

            <h1 style="color:#8e44ad;">Hey #{user.name}! 🗳️</h1>
            <p>It’s time to vote on <strong>#{activity.activity_name}</strong>.</p>
            <p>Your input helps us lock in the perfect plan!</p>

            <a href="#{login_link}"
               style="display:inline-block;padding:12px 24px;margin:20px 0;color:white;
                      background-color:#8e44ad;text-decoration:none;border-radius:8px;font-size:18px;">
              Log In & Vote Now
            </a>

            <p style="font-size:14px;color:#999;margin-top:20px;">
              Thanks for being part of the adventure!<br>– The Voxxy Team
            </p>
          </div>
        </body>
      </html>
    HTML

    send_email(user.email, subject, html)
  end

  def self.send_email(to_email, subject, content_html)
    from = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
    to   = SendGrid::Email.new(email: to_email)
    content = Content.new(type: "text/html", value: content_html)

    mail = SendGrid::Mail.new
    mail.from    = from
    mail.subject = subject
    personalization = Personalization.new
    personalization.add_to(to)
    mail.add_personalization(personalization)
    mail.add_content(content)

    sg = SendGrid::API.new(api_key: ENV["VoxxyKeyAPI"])
    response = sg.client.mail._("send").post(request_body: mail.to_json)
    Rails.logger.info "Sent voting email to #{to_email}: #{response.status_code}"
  end
end
