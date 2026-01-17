# Controller for venue owners to test their scheduled emails
# Venue owners can only send the 7 scheduled emails to their own email address
class Api::V1::Presents::EmailTestsController < Api::V1::Presents::BaseController
  before_action :require_venue_owner

  # GET /api/v1/presents/email_tests
  def index
    @test_email = current_user.email
    @scheduled_emails = scheduled_emails_data

    render json: {
      test_email: @test_email,
      scheduled_emails: @scheduled_emails,
      total_count: 7
    }
  end

  # POST /api/v1/presents/email_tests/send_scheduled
  def send_scheduled
    service = Admin::EmailTestService.new(current_user)
    @results = service.send_scheduled_emails_to_user

    render json: {
      message: "Sending 7 scheduled emails to #{current_user.email}",
      recipient: current_user.email,
      results: @results,
      success_count: @results.count { |r| r[:status] == "sent" },
      failure_count: @results.count { |r| r[:status] == "failed" }
    }
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def scheduled_emails_data
    [
      { position: 1, name: "1 Day Before Application Deadline", subject: "Last Chance: [eventName] Applications Close Tomorrow" },
      { position: 2, name: "Application Deadline Day", subject: "URGENT: [eventName] Applications Close Today" },
      { position: 3, name: "1 Day Before Payment Due", subject: "Reminder: Payment Due Tomorrow - [eventName]" },
      { position: 4, name: "Payment Due Today", subject: "URGENT: Payment Due Today - [eventName]" },
      { position: 5, name: "1 Day Before Event", subject: "Tomorrow: [eventName] Final Details" },
      { position: 6, name: "Day of Event", subject: "Today: [eventName]" },
      { position: 7, name: "Day After Event - Thank You", subject: "Thank You for Participating in [eventName]" }
    ]
  end
end
