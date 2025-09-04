class ReportNotificationService < BaseEmailService
  def initialize(report)
    @report = report
  end

  def send_admin_notification
    # Get all admin users
    admin_users = User.where(admin: true)

    admin_users.each do |admin|
      next unless self.class.can_send_email_to_user?(admin)

      send_email_to_admin(admin)
    end

    # Log the report
    Rails.logger.info "New report ##{@report.id} submitted: #{@report.reason} - #{@report.reportable_type}"
  end

  private

  def send_email_to_admin(admin)
    Rails.logger.info "Sending report notification to admin: #{admin.email}"

    subject = "🚨 New Content Report ##{@report.id} - 24hr Response Required"

    # Build the review URL using app_base_url
    review_url = "#{self.class.app_base_url}/#/admin/reports/#{@report.id}"

    # Format the report reason
    formatted_reason = Report::REASONS[@report.reason.to_sym] || @report.reason

    content = <<~HTML
      <div style="background: #dc3545; color: white; padding: 10px; border-radius: 8px; margin-bottom: 20px;">
        <p style="#{BASE_STYLES[:text]}; color: white; margin: 0;">
          <strong>⏰ 24-HOUR RESPONSE REQUIRED</strong>
          #{@report.overdue? ? '<br/><strong>⚠️ THIS REPORT IS OVERDUE!</strong>' : ''}
        </p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="#{BASE_STYLES[:title]}; font-size: 18px; margin-top: 0;">Report Details</h3>
      #{'  '}
        <p style="#{BASE_STYLES[:text]}">
          <strong>Report ID:</strong> ##{@report.id}<br/>
          <strong>Reason:</strong> #{formatted_reason}<br/>
          <strong>Reporter:</strong> #{@report.reporter.name}<br/>
          <strong>Content Type:</strong> #{@report.reportable_type}<br/>
          <strong>Reported User:</strong> #{@report.reported_user&.name || 'N/A'}<br/>
          <strong>Submitted:</strong> #{@report.created_at.strftime("%B %d, %Y at %I:%M %p")}
        </p>
      </div>

      #{@report.description.present? ?#{' '}
        "<div style='background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;'>
          <p style='#{BASE_STYLES[:text]}; margin: 0;'><strong>Additional Details:</strong></p>
          <p style='#{BASE_STYLES[:text]}; margin: 10px 0 0 0;'>#{@report.description}</p>
        </div>" : ""
      }

      #{@report.reported_content.present? ?
        "<div style='background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;'>
          <p style='#{BASE_STYLES[:text]}; margin: 0;'><strong>Reported Content:</strong></p>
          <p style='#{BASE_STYLES[:text]}; margin: 10px 0 0 0; font-style: italic;'>
            \"#{truncate_content(@report.reported_content)}\"
          </p>
        </div>" : ""
      }

      <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #0066cc; margin-bottom: 20px;">
        <p style="#{BASE_STYLES[:text]}; margin: 0;">
          <strong>Reported User Info:</strong><br/>
          Name: #{@report.reported_user&.name || 'N/A'}<br/>
          Email: #{@report.reported_user&.email || 'N/A'}<br/>
          Warnings: #{@report.reported_user&.warnings_count || 0}/3<br/>
          Status: #{@report.reported_user&.status || 'Active'}
        </p>
      </div>

      <p style="#{BASE_STYLES[:text]}; color: #666;">
        <strong>Remember:</strong> All reports must be reviewed within 24 hours per App Store content moderation policy.
      </p>
    HTML

    email_html = self.class.build_simple_email_template(
      "New Report Requires Review",
      content,
      "Review Report",
      review_url
    )

    self.class.send_email(admin.email, subject, email_html)

    Rails.logger.info "Report notification sent successfully to #{admin.email}"
  rescue StandardError => e
    Rails.logger.error "Failed to send report notification to #{admin.email}: #{e.message}"
  end

  def truncate_content(content, length = 200)
    return "N/A" if content.blank?
    content.length > length ? "#{content[0...length]}..." : content
  end
end
