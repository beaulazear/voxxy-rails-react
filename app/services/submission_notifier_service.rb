# app/services/submission_notifier_service.rb
require "sendgrid-ruby"
include SendGrid

class SubmissionNotifierService
  FROM_EMAIL = SendGrid::Email.new(email: "team@voxxyai.com", name: "Voxxy Team")
  TO_EMAIL   = SendGrid::Email.new(email: "team@voxxyai.com")

  def self.notify(type, submission)
    sg = SendGrid::API.new(api_key: ENV["VoxxyKeyAPI"])

    subject = "New #{type.to_s.humanize} Submission Received"
    body_html = build_html_body(type.to_s.humanize, submission)
    content = SendGrid::Content.new(type: "text/html", value: body_html)

    mail = SendGrid::Mail.new
    mail.from = FROM_EMAIL
    mail.subject = subject
    personalization = SendGrid::Personalization.new
    personalization.add_to(TO_EMAIL)
    mail.add_personalization(personalization)
    mail.add_content(content)

    response = sg.client.mail._("send").post(request_body: mail.to_json)
    unless response.status_code.to_i == 202
      Rails.logger.error "SendGrid Error: #{response.status_code} - #{response.body}"
      raise "SubmissionNotifierService failed with status #{response.status_code}"
    end

    Rails.logger.info "Submission notification sent: #{type} (ID: #{submission.id})"
  end

  private_class_method def self.build_html_body(type_human, submission)
    attributes = submission.attributes.except("id", "created_at", "updated_at")
      .map { |k, v| "<li><strong>#{k.humanize}:</strong> #{v}</li>" }
      .join

    <<~HTML
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 20px;">
          <div style="max-width:600px; margin:auto; background:#fff; padding:20px; border-radius:8px;">
            <h2 style="color:#333;">#{type_human} Submission Received</h2>
            <ul style="list-style:none; padding:0;">
              #{attributes}
            </ul>
            <p>Please log on to the admin page of the application to review all submissions.</p>
          </div>
        </body>
      </html>
    HTML
  end
end
