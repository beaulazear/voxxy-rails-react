# Controller for venue owners to test their scheduled and notification emails
# Venue owners can send test emails to their own email address
class Api::V1::Presents::EmailTestsController < Api::V1::Presents::BaseController
  before_action :require_venue_owner

  # GET /api/v1/presents/email_tests
  def index
    @test_email = current_user.email
    @email_categories = email_categories_data

    render json: {
      test_email: @test_email,
      email_categories: @email_categories,
      total_count: 10
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

  # POST /api/v1/presents/email_tests/send_notification_emails
  def send_notification_emails
    service = Admin::EmailTestService.new(current_user)
    @results = service.send_notification_emails_to_producer

    render json: {
      message: "Sending 3 notification emails to #{current_user.email}",
      recipient: current_user.email,
      results: @results,
      success_count: @results.count { |r| r[:status] == "sent" },
      failure_count: @results.count { |r| r[:status] == "failed" }
    }
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # POST /api/v1/presents/email_tests/send_all
  def send_all
    service = Admin::EmailTestService.new(current_user)
    scheduled_results = service.send_scheduled_emails_to_user
    notification_results = service.send_notification_emails_to_producer

    @results = scheduled_results + notification_results

    render json: {
      message: "Sending all 10 emails to #{current_user.email}",
      recipient: current_user.email,
      results: @results,
      success_count: @results.count { |r| r[:status] == "sent" },
      failure_count: @results.count { |r| r[:status] == "failed" }
    }
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def email_categories_data
    [
      {
        name: "Scheduled Automated Emails",
        description: "Time-based automated emails sent throughout the event lifecycle",
        count: 7,
        emails: [
          { position: 1, name: "1 Day Before Application Deadline", subject: "Last Chance: [eventName] Applications Close Tomorrow" },
          { position: 2, name: "Application Deadline Day", subject: "URGENT: [eventName] Applications Close Today" },
          { position: 3, name: "1 Day Before Payment Due", subject: "Reminder: Payment Due Tomorrow - [eventName]" },
          { position: 4, name: "Payment Due Today", subject: "URGENT: Payment Due Today - [eventName]" },
          { position: 5, name: "1 Day Before Event", subject: "Tomorrow: [eventName] Final Details" },
          { position: 6, name: "Day of Event", subject: "Today: [eventName]" },
          { position: 7, name: "Day After Event - Thank You", subject: "Thank You for Participating in [eventName]" }
        ]
      },
      {
        name: "System Notification Emails",
        description: "Emails sent to vendors when you make important updates",
        count: 3,
        emails: [
          { name: "Category Changed", subject: "Category Update - [eventName]" },
          { name: "Event Details Changed", subject: "Event Update - [eventName]" },
          { name: "Payment Confirmed", subject: "Payment Confirmed - [eventName]" }
        ]
      }
    ]
  end
end
