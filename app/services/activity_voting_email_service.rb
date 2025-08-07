class ActivityVotingEmailService < BaseEmailService
  def self.send_voting_emails(activity)
    Rails.logger.info "Sending voting-stage emails for Activity ##{activity.id}: \"#{activity.activity_name}\""

    recipient_emails = activity.participants.map(&:email).map(&:strip).map(&:downcase).uniq
    recipient_emails.reject! { |email| email == activity.user&.email }

    recipient_emails.each do |email|
      next unless can_send_email_to_address?(email)

      user = User.find_by("lower(email) = ?", email)
      if user
        send_existing_user_vote(user, activity)
      else
        send_new_user_vote(email, activity)
      end
    end
  rescue StandardError => e
    Rails.logger.error "Failed to send voting emails: #{e.message}"
    raise
  end

  private_class_method def self.frontend_host
    Rails.env.production? ? "https://voxxyai.com" : "http://localhost:3000"
  end

  private_class_method def self.send_new_user_vote(email, activity)
    signup_link = "#{frontend_host}#/invite_signup?invited_email=#{CGI.escape(email)}&activity_id=#{activity.id}"
    subject = "Sign Up & Vote on Your Voxxy Activity! 📝"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Welcome! 🎉
      </p>

      <p style="#{BASE_STYLES[:text]}">
        You've been invited to vote on <strong>#{activity.activity_name}</strong>!
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Create a free Voxxy account to cast your vote and help finalize the plans.
      </p>
    HTML

    email_html = build_simple_email_template(
      "Welcome to Voxxy!",
      content,
      "Sign Up & Vote Now",
      signup_link
    )

    send_email(email, subject, email_html)
    Rails.logger.info "Sent new user voting email to #{email}"
  end

  private_class_method def self.send_existing_user_vote(user, activity)
    login_link = "#{frontend_host}#/login?redirect=vote&activity_id=#{activity.id}"
    subject = "Your Vote Is Needed on #{activity.activity_name}! 🗳️"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        Hey #{user.name}! 🗳️
      </p>

      <p style="#{BASE_STYLES[:text]}">
        It's time to vote on <strong>#{activity.activity_name}</strong>.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Your input helps us lock in the perfect plan!
      </p>
    HTML

    email_html = build_simple_email_template(
      "Time to Vote!",
      content,
      "Log In & Vote Now",
      login_link
    )

    send_email(user.email, subject, email_html)
    Rails.logger.info "Sent existing user voting email to #{user.email}"
  end
end
