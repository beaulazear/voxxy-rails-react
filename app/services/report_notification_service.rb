class ReportNotificationService
  include SendGrid
  def initialize(report)
    @report = report
  end

  def send_admin_notification
    # Get all admin users
    admin_users = User.where(admin: true)

    admin_users.each do |admin|
      next unless admin.email_notifications

      send_email_to_admin(admin)
    end

    # Log the report
    Rails.logger.info "New report ##{@report.id} submitted: #{@report.reason} - #{@report.reportable_type}"
  end

  private

  def send_email_to_admin(admin)
    mail_to = admin.email

    mail_params = {
      personalizations: [ {
        to: [ { email: mail_to } ],
        dynamic_template_data: {
          admin_name: admin.name,
          report_id: @report.id,
          report_reason: Report::REASONS[@report.reason.to_sym] || @report.reason,
          report_description: @report.description || "No additional details provided",
          reporter_name: @report.reporter.name,
          reportable_type: @report.reportable_type,
          reported_content: truncate_content(@report.reported_content),
          reported_user_name: @report.reported_user&.name || "N/A",
          reported_user_email: @report.reported_user&.email || "N/A",
          review_url: "#{Rails.application.config.frontend_url}/admin/reports/#{@report.id}",
          created_at: @report.created_at.strftime("%B %d, %Y at %I:%M %p %Z"),
          is_overdue: @report.overdue?,
          subject: "🚨 New Content Report - 24hr Response Required"
        }
      } ],
      from: { email: "noreply@voxxyai.com", name: "Voxxy Moderation" },
      template_id: get_template_id
    }

    begin
      sg = SendGrid::API.new(api_key: ENV["VoxxyKeyAPI"])
      response = sg.client.mail._("send").post(request_body: mail_params.to_json)

      Rails.logger.info "Report notification sent to admin: #{admin.email}"
    rescue => e
      Rails.logger.error "Failed to send report notification to #{admin.email}: #{e.message}"
    end
  end

  def get_template_id
    # You'll need to create this template in SendGrid
    # For now, use a fallback to basic email
    ENV["SENDGRID_REPORT_NOTIFICATION_TEMPLATE"] || send_basic_email
  end

  def send_basic_email
    # Fallback to basic email if template doesn't exist
    mail_params = {
      personalizations: [ {
        to: [ { email: "admin@voxxyai.com" } ],
        subject: "🚨 New Content Report ##{@report.id} - Requires Review"
      } ],
      from: { email: "noreply@voxxyai.com", name: "Voxxy Moderation" },
      content: [ {
        type: "text/html",
        value: basic_email_html
      } ]
    }

    sg = SendGrid::API.new(api_key: ENV["VoxxyKeyAPI"])
    sg.client.mail._("send").post(request_body: mail_params.to_json)
  end

  def basic_email_html
    <<~HTML
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B6B;">⚠️ New Content Report Requires Review</h2>
      #{'  '}
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Report ID:</strong> ##{@report.id}</p>
          <p><strong>Reason:</strong> #{Report::REASONS[@report.reason.to_sym] || @report.reason}</p>
          <p><strong>Reporter:</strong> #{@report.reporter.name}</p>
          <p><strong>Reported Content Type:</strong> #{@report.reportable_type}</p>
          <p><strong>Reported User:</strong> #{@report.reported_user&.name || 'N/A'}</p>
          <p><strong>Submitted:</strong> #{@report.created_at.strftime("%B %d, %Y at %I:%M %p")}</p>
        </div>
      #{'  '}
        #{@report.overdue? ? '<p style="color: #FF0000; font-weight: bold;">⏰ This report is OVERDUE for review!</p>' : ''}
      #{'  '}
        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0;"><strong>Description:</strong></p>
          <p style="margin: 10px 0;">#{@report.description || 'No additional details provided'}</p>
        </div>
      #{'  '}
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Reported Content:</strong></p>
          <p style="margin: 10px 0; font-style: italic;">#{truncate_content(@report.reported_content)}</p>
        </div>
      #{'  '}
        <div style="margin: 30px 0;">
          <a href="#{Rails.application.config.frontend_url}/admin/reports/#{@report.id}"#{' '}
             style="background: #FF6B6B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Review Report
          </a>
        </div>
      #{'  '}
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      #{'  '}
        <p style="color: #666; font-size: 14px;">
          <strong>Remember:</strong> All reports must be reviewed within 24 hours per our content moderation policy.
        </p>
      </div>
    HTML
  end

  def truncate_content(content, length = 200)
    return "N/A" if content.blank?
    content.length > length ? "#{content[0...length]}..." : content
  end
end
