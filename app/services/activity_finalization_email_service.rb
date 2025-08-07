class ActivityFinalizationEmailService < BaseEmailService
  def self.send_finalization_emails(activity)
    Rails.logger.info "Sending finalization emails for Activity ##{activity.id}: \"#{activity.activity_name}\""

    subject = "Your Voxxy Activity is Finalized! 📅"

    # Build share URL
    url_opts  = Rails.application.config.action_mailer.default_url_options
    share_url = Rails.application.routes.url_helpers.share_activity_url(activity, **url_opts)

    recipient_emails = []
    recipient_emails += activity.participants.map(&:email)
    recipient_emails += activity.responses.map(&:email).compact
    recipient_emails.uniq!
    recipient_emails.reject! { |email| email == activity.user&.email }

    # Fetch pinned restaurant selection, if any
    pinned = activity.pinned_activities.find_by(selected: true)

    recipient_emails.each do |email|
      next unless can_send_email_to_address?(email)
      Rails.logger.info " → Sending to: #{email}"

      content = <<~HTML
        <p style="#{BASE_STYLES[:text]}">
          <strong>#{activity.emoji} #{activity.activity_name}</strong>
        </p>
      HTML

      if activity.date_day.present? && activity.date_time.present?
        content += <<~HTML
          <p style="#{BASE_STYLES[:text]}">
            <strong>🗓 Date & Time:</strong> #{activity.date_day.strftime("%A, %B %-d, %Y")} at #{activity.date_time.strftime("%I:%M %p")}
          </p>
        HTML
      end

      if pinned
        content += <<~HTML
          <p style="#{BASE_STYLES[:text]}">
            <strong>📍 Final Selection:</strong><br>
            #{pinned.title}<br>
            #{pinned.address}
          </p>
        HTML
      end

      content += <<~HTML
        <p style="#{BASE_STYLES[:text]}">
          View full details and share your plan with everyone!
        </p>
      HTML

      email_html = build_simple_email_template(
        "Your Activity is Finalized!",
        content,
        "View & Share Plan",
        share_url
      )

      send_email(email, subject, email_html)

      Rails.logger.info "   ↳ Finalization email sent successfully to #{email}"
    end
  rescue StandardError => e
    Rails.logger.error "Failed to send finalization emails: #{e.message}"
    raise
  end
end
