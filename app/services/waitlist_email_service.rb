class WaitlistEmailService < BaseEmailService
  def self.send_waitlist_email(email)
    Rails.logger.info "Sending waitlist email to: #{email}"

    subject = "You're on the list — now what?"

    content = <<~HTML
      <p style="#{BASE_STYLES[:text]}">
        You're officially on the Voxxy waitlist — and we're so glad you're here.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Voxxy is designed to take the chaos out of group plans — because we've all watched too many birthdays, trips,#{' '}
        and dinners die in the group chat. We're building something smarter: a space where you can align with your#{' '}
        people faster, and actually make memories.
      </p>

      <p style="#{BASE_STYLES[:text]}">
        You'll be the first to know when we roll out new features, events, and launch perks. And if you're up for it,#{' '}
        we'd love to invite you into our beta program soon (aka the inner circle).
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Stay tuned — and thanks for being part of this from the ground up.
      </p>

      <p style="#{BASE_STYLES[:text]}; margin-top: 30px;">
        Less chaos,<br/>
        Team Voxxy
      </p>
    HTML

    email_html = build_simple_email_template(
      "Hello from Voxxy!",
      content
    )

    send_email(email, subject, email_html)

    Rails.logger.info "Waitlist email sent successfully to #{email}"
  rescue StandardError => e
    Rails.logger.error "Failed to send waitlist email: #{e.message}"
    raise
  end
end
