class UserModerationEmailService < BaseEmailService
  def self.send_moderation_email(user, action_type, report = nil)
    return unless can_send_email_to_user?(user)
    
    case action_type
    when "warning", "warned"
      send_warning_email(user, report)
    when "suspended"
      send_suspension_email(user, report)
    when "banned"
      send_ban_email(user, report)
    end
  rescue => e
    Rails.logger.error "Failed to send moderation email to #{user.email}: #{e.message}"
  end

  # For backward compatibility
  def initialize(user, action_type, report = nil)
    @user = user
    @action_type = action_type
    @report = report
  end

  def send_email
    self.class.send_moderation_email(@user, @action_type, @report)
  end

  private

  def self.send_warning_email(user, report = nil)
    Rails.logger.info "Sending warning email to: #{user.email}"

    subject = "⚠️ Warning: Community Guidelines Violation"

    content = <<~HTML
      <p style="#{BASE_STYLES[:subtitle]}">
        Dear #{user.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We're writing to inform you that your recent activity has violated our community guidelines.
      </p>

      #{report ? "<p style='#{BASE_STYLES[:text]}'><strong>Violation:</strong> #{report.reason}</p>" : ""}
      #{report&.description ? "<p style='#{BASE_STYLES[:text]}'><strong>Details:</strong> #{report.description}</p>" : ""}

      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="#{BASE_STYLES[:text]}; margin: 0;">
          <strong>Warning #{user.warnings_count} of 3</strong>
        </p>
        <p style="#{BASE_STYLES[:text]}; margin: 10px 0 0 0;">
          Please review our community guidelines. Further violations may result in suspension or permanent ban.
        </p>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        If you believe this warning was issued in error, please contact us at team@voxxyai.com
      </p>

      <p style="#{BASE_STYLES[:text]}; margin-top: 30px;">
        Stay safe,<br/>
        The Voxxy Safety Team
      </p>
    HTML

    email_html = build_simple_email_template(
      "Community Guidelines Warning",
      content,
      "Review Guidelines",
      "#{app_base_url}/community-guidelines"
    )

    send_email(user.email, subject, email_html)

    Rails.logger.info "Warning email sent successfully to #{user.email}"
  rescue StandardError => e
    Rails.logger.error "Failed to send warning email: #{e.message}"
    raise
  end

  def self.send_suspension_email(user, report = nil)
    Rails.logger.info "Sending suspension email to: #{user.email}"

    subject = "Account Suspended"

    suspension_end = user.suspended_until&.strftime("%B %d, %Y at %I:%M %p") || "N/A"

    content = <<~HTML
      <p style="#{BASE_STYLES[:subtitle]}">
        Dear #{user.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        Your account has been suspended for violating our community guidelines.
      </p>

      <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
        <p style="#{BASE_STYLES[:text]}; margin: 0;">
          <strong>Suspension Reason:</strong> #{user.suspension_reason || report&.reason || "Community guidelines violation"}
        </p>
        <p style="#{BASE_STYLES[:text]}; margin: 10px 0 0 0;">
          <strong>Your account will be reinstated on:</strong> #{suspension_end}
        </p>
      </div>

      <p style="#{BASE_STYLES[:text]}">
        During this time, you will not be able to:
      </p>
      <ul style="#{BASE_STYLES[:text]}; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Create or join activities</li>
        <li style="margin-bottom: 8px;">Post comments</li>
        <li style="margin-bottom: 8px;">Send messages</li>
      </ul>

      <p style="#{BASE_STYLES[:text]}">
        If you believe this suspension was issued in error, you can appeal this decision.
      </p>

      <p style="#{BASE_STYLES[:text]}; margin-top: 30px;">
        The Voxxy Safety Team
      </p>
    HTML

    email_html = build_simple_email_template(
      "Your Account Has Been Suspended",
      content,
      "Contact Support",
      "mailto:team@voxxyai.com?subject=Account%20Suspension%20Appeal"
    )

    send_email(user.email, subject, email_html)

    Rails.logger.info "Suspension email sent successfully to #{user.email}"
  rescue StandardError => e
    Rails.logger.error "Failed to send suspension email: #{e.message}"
    raise
  end

  def self.send_ban_email(user, report = nil)
    Rails.logger.info "Sending ban email to: #{user.email}"

    subject = "Account Permanently Banned"

    content = <<~HTML
      <p style="#{BASE_STYLES[:subtitle]}">
        Dear #{user.name},
      </p>

      <p style="#{BASE_STYLES[:text]}">
        We regret to inform you that your account has been permanently banned from Voxxy for severe or repeated violations of our community guidelines.
      </p>

      <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
        <p style="#{BASE_STYLES[:text]}; margin: 0;">
          <strong>Ban Reason:</strong> #{user.ban_reason || report&.reason || "Severe community guidelines violation"}
        </p>
        <p style="#{BASE_STYLES[:text]}; margin: 10px 0 0 0;">
          This decision is final and your account cannot be reinstated.
        </p>
      </div>

      <h3 style="#{BASE_STYLES[:title]}; font-size: 20px; margin-top: 30px;">Appeal Process</h3>
      
      <p style="#{BASE_STYLES[:text]}">
        If you believe this ban was issued in error, you may submit an appeal by emailing team@voxxyai.com with:
      </p>
      
      <ul style="#{BASE_STYLES[:text]}; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Your account email</li>
        <li style="margin-bottom: 8px;">Explanation of why you believe the ban was in error</li>
        <li style="margin-bottom: 8px;">Any supporting evidence</li>
      </ul>

      <p style="#{BASE_STYLES[:text]}">
        Appeals are reviewed within 7 business days.
      </p>

      <p style="#{BASE_STYLES[:text]}; margin-top: 30px;">
        The Voxxy Safety Team
      </p>
    HTML

    email_html = build_simple_email_template(
      "Account Ban Notice",
      content,
      "Submit Appeal",
      "mailto:team@voxxyai.com?subject=Account%20Ban%20Appeal&body=Account%20Email:%20#{user.email}%0A%0AReason%20for%20Appeal:%0A"
    )

    send_email(user.email, subject, email_html)

    Rails.logger.info "Ban email sent successfully to #{user.email}"
  rescue StandardError => e
    Rails.logger.error "Failed to send ban email: #{e.message}"
    raise
  end
end