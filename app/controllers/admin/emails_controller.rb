# Admin controller for testing all 21 Voxxy Presents emails
# Admin-only access - sends emails to admin's own email address
class Admin::EmailsController < ApplicationController
  before_action :authorized
  before_action :require_admin

  # GET /admin/emails
  def index
    @test_email = current_user.email
    @email_categories = email_categories_data
  end

  # POST /admin/emails/send_all
  def send_all
    service = Admin::EmailTestService.new(current_user)
    @results = service.send_all_emails_to_admin

    respond_to do |format|
      format.json { render json: { results: @results, recipient: current_user.email } }
      format.html do
        flash[:notice] = "Sending all 21 emails to #{current_user.email}. Check your inbox in a few minutes."
        redirect_to admin_emails_path
      end
    end
  rescue => e
    respond_to do |format|
      format.json { render json: { error: e.message }, status: :unprocessable_entity }
      format.html do
        flash[:alert] = "Error sending emails: #{e.message}"
        redirect_to admin_emails_path
      end
    end
  end

  # POST /admin/emails/send_scheduled
  def send_scheduled
    service = Admin::EmailTestService.new(current_user)
    @results = service.send_scheduled_emails_to_user

    respond_to do |format|
      format.json { render json: { results: @results, recipient: current_user.email } }
      format.html do
        flash[:notice] = "Sending 7 scheduled emails to #{current_user.email}. Check your inbox in a few minutes."
        redirect_to admin_emails_path
      end
    end
  rescue => e
    respond_to do |format|
      format.json { render json: { error: e.message }, status: :unprocessable_entity }
      format.html do
        flash[:alert] = "Error sending scheduled emails: #{e.message}"
        redirect_to admin_emails_path
      end
    end
  end

  # POST /admin/emails/setup_test_data
  def setup_test_data
    service = Admin::EmailTestService.new(current_user)
    @test_data = service.setup_test_data

    respond_to do |format|
      format.json { render json: { message: "Test data created successfully", data: @test_data } }
      format.html do
        flash[:notice] = "Test data created successfully"
        redirect_to admin_emails_path
      end
    end
  rescue => e
    respond_to do |format|
      format.json { render json: { error: e.message }, status: :unprocessable_entity }
      format.html do
        flash[:alert] = "Error creating test data: #{e.message}"
        redirect_to admin_emails_path
      end
    end
  end

  # DELETE /admin/emails/cleanup_test_data
  def cleanup_test_data
    service = Admin::EmailTestService.new(current_user)
    service.cleanup_test_data

    respond_to do |format|
      format.json { render json: { message: "Test data cleaned up successfully" } }
      format.html do
        flash[:notice] = "Test data cleaned up successfully"
        redirect_to admin_emails_path
      end
    end
  rescue => e
    respond_to do |format|
      format.json { render json: { error: e.message }, status: :unprocessable_entity }
      format.html do
        flash[:alert] = "Error cleaning up test data: #{e.message}"
        redirect_to admin_emails_path
      end
    end
  end

  private

  def require_admin
    unless current_user&.admin?
      respond_to do |format|
        format.json { render json: { error: "Admin access required" }, status: :forbidden }
        format.html do
          flash[:alert] = "Admin access required"
          redirect_to root_path
        end
      end
    end
  end

  def email_categories_data
    [
      {
        name: "Scheduled Automated Emails",
        description: "Time-based automated emails sent throughout the event lifecycle",
        count: 7,
        emails: [
          { name: "1 Day Before Application Deadline", subject: "Last Chance: Applications Close Tomorrow" },
          { name: "Application Deadline Day", subject: "URGENT: Applications Close Today" },
          { name: "1 Day Before Payment Due", subject: "Reminder: Payment Due Tomorrow" },
          { name: "Payment Due Today", subject: "URGENT: Payment Due Today" },
          { name: "1 Day Before Event", subject: "Tomorrow: Final Details" },
          { name: "Day of Event", subject: "Today: Event Name" },
          { name: "Day After Event - Thank You", subject: "Thank You for Participating" }
        ]
      },
      {
        name: "Vendor Application Emails",
        description: "Emails sent when vendors apply and receive status updates",
        count: 4,
        emails: [
          { name: "Application Confirmation", subject: "Application Received" },
          { name: "Application Approved", subject: "Your Application Was Approved" },
          { name: "Application Rejected", subject: "Application Status Update" },
          { name: "Moved to Waitlist", subject: "Waitlist Status" }
        ]
      },
      {
        name: "Event Invitation Emails",
        description: "Emails for inviting vendors and tracking responses",
        count: 5,
        emails: [
          { name: "Vendor Invitation", subject: "Event Name is coming" },
          { name: "Invitation Accepted - Vendor Confirmation", subject: "Thank You for Accepting" },
          { name: "Invitation Accepted - Producer Notification", subject: "Vendor accepted invitation" },
          { name: "Invitation Declined - Vendor Confirmation", subject: "Invitation Declined" },
          { name: "Invitation Declined - Producer Notification", subject: "Vendor declined invitation" }
        ]
      },
      {
        name: "Admin/Producer Notification Emails",
        description: "Emails sent to producers for important updates",
        count: 5,
        emails: [
          { name: "New Vendor Submission Notification", subject: "New Vendor Application" },
          { name: "Payment Confirmed", subject: "Payment Confirmed" },
          { name: "Category Changed", subject: "Category Update" },
          { name: "Event Details Changed (Bulk)", subject: "Event Update" },
          { name: "Event Canceled (Bulk)", subject: "Event Canceled" }
        ]
      }
    ]
  end
end
