# Create app/controllers/notifications_controller.rb
class NotificationsController < ApplicationController
  before_action :authenticate_user! # or however you handle auth

  def test
    if current_user.can_receive_push_notifications?
      title = params[:title] || "Test Notification! 🚀"
      body = params[:body] || "Push notifications are working from your backend!"

      PushNotificationService.send_notification(
        current_user,
        title,
        body,
        { type: "test", timestamp: Time.current.to_i }
      )

      render json: { success: true, message: "Test notification sent!" }
    else
      render json: {
        success: false,
        message: "User cannot receive push notifications. Check push_notifications setting and push_token."
      }
    end
  end
end
