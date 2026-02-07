class AdminMailer < ApplicationMailer
  default from: "Voxxy System <system@voxxypresents.com>"

  # Send alert to admins when critical SendGrid errors occur
  def critical_sendgrid_error(email:, reason:, event_data:)
    @email = email
    @reason = reason
    @event_data = event_data
    @timestamp = Time.current

    mail(
      to: "team@voxxypresents.com",
      subject: "[CRITICAL] SendGrid Delivery Error - Domain Authentication Issue"
    )
  end
end
