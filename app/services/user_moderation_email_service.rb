class UserModerationEmailService
  include SendGrid

  def initialize(user, action_type, report = nil)
    @user = user
    @action_type = action_type
    @report = report
  end

  def send_email
    case @action_type
    when "warning", "warned"
      send_warning_email
    when "suspended"
      send_suspension_email
    when "banned"
      send_ban_email
    end
  rescue => e
    Rails.logger.error "Failed to send moderation email to #{@user.email}: #{e.message}"
  end

  private

  def send_warning_email
    mail_params = build_mail_params(
      "⚠️ Warning: Community Guidelines Violation",
      warning_email_html
    )
    send_email_via_sendgrid(mail_params)
  end

  def send_suspension_email
    mail_params = build_mail_params(
      "Account Suspended",
      suspension_email_html
    )
    send_email_via_sendgrid(mail_params)
  end

  def send_ban_email
    mail_params = build_mail_params(
      "Account Banned",
      ban_email_html
    )
    send_email_via_sendgrid(mail_params)
  end

  def build_mail_params(subject, html_content)
    if ENV["SENDGRID_USER_MODERATION_TEMPLATE"]
      {
        personalizations: [ {
          to: [ { email: @user.email } ],
          dynamic_template_data: {
            user_name: @user.name,
            action_type: @action_type,
            violation_reason: @report&.reason || "Community guidelines violation",
            violation_details: @report ? "Report ##{@report.id}: #{@report.description}" : nil,
            suspension_end_date: @user.suspended_until&.strftime("%B %d, %Y"),
            ban_reason: @user.ban_reason,
            appeal_email: "support@voxxyai.com",
            subject: subject
          }
        } ],
        from: { email: "noreply@voxxyai.com", name: "Voxxy Safety Team" },
        template_id: ENV["SENDGRID_USER_MODERATION_TEMPLATE"]
      }
    else
      {
        personalizations: [ {
          to: [ { email: @user.email } ],
          subject: subject
        } ],
        from: { email: "noreply@voxxyai.com", name: "Voxxy Safety Team" },
        content: [ {
          type: "text/html",
          value: html_content
        } ]
      }
    end
  end

  def send_email_via_sendgrid(mail_params)
    sg = SendGrid::API.new(api_key: ENV["VoxxyKeyAPI"])
    response = sg.client.mail._("send").post(request_body: mail_params.to_json)

    Rails.logger.info "Moderation email sent to: #{@user.email} (type: #{@action_type})"
    response
  end

  def warning_email_html
    <<~HTML
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B6B;">⚠️ Account Warning</h2>
      #{'  '}
        <p>Dear #{@user.name},</p>
      #{'  '}
        <p>We're writing to inform you that your recent activity has violated our community guidelines.</p>
      #{'  '}
        #{@report ? "<p><strong>Violation:</strong> #{@report.reason}</p>" : ""}
        #{@report&.description ? "<p><strong>Details:</strong> #{@report.description}</p>" : ""}
      #{'  '}
        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0;"><strong>Warning #{@user.warnings_count} of 3</strong></p>
          <p style="margin: 10px 0 0 0;">Please review our community guidelines. Further violations may result in suspension or permanent ban.</p>
        </div>
      #{'  '}
        <p>If you believe this warning was issued in error, please contact us at support@voxxyai.com</p>
      #{'  '}
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">Voxxy Safety Team</p>
      </div>
    HTML
  end

  def suspension_email_html
    <<~HTML
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B6B;">Account Suspended</h2>
      #{'  '}
        <p>Dear #{@user.name},</p>
      #{'  '}
        <p>Your account has been suspended for violating our community guidelines.</p>
      #{'  '}
        <div style="background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <p style="margin: 0;"><strong>Suspension Reason:</strong> #{@user.suspension_reason}</p>
          <p style="margin: 10px 0 0 0;"><strong>Your account will be reinstated on:</strong> #{@user.suspended_until&.strftime("%B %d, %Y at %I:%M %p")}</p>
        </div>
      #{'  '}
        <p>During this time, you will not be able to:</p>
        <ul>
          <li>Create or join activities</li>
          <li>Post comments</li>
          <li>Send messages</li>
        </ul>
      #{'  '}
        <p>If you believe this suspension was issued in error, please contact us at support@voxxyai.com</p>
      #{'  '}
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">Voxxy Safety Team</p>
      </div>
    HTML
  end

  def ban_email_html
    <<~HTML
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF0000;">Account Permanently Banned</h2>
      #{'  '}
        <p>Dear #{@user.name},</p>
      #{'  '}
        <p>We regret to inform you that your account has been permanently banned from Voxxy for severe or repeated violations of our community guidelines.</p>
      #{'  '}
        <div style="background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <p style="margin: 0;"><strong>Ban Reason:</strong> #{@user.ban_reason}</p>
          <p style="margin: 10px 0 0 0;">This decision is final and your account cannot be reinstated.</p>
        </div>
      #{'  '}
        <h3>Appeal Process</h3>
        <p>If you believe this ban was issued in error, you may submit an appeal by emailing support@voxxyai.com with:</p>
        <ul>
          <li>Your account email</li>
          <li>Explanation of why you believe the ban was in error</li>
          <li>Any supporting evidence</li>
        </ul>
      #{'  '}
        <p>Appeals are reviewed within 7 business days.</p>
      #{'  '}
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">Voxxy Safety Team</p>
      </div>
    HTML
  end
end
