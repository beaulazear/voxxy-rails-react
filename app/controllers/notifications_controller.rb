# Update app/controllers/notifications_controller.rb
class NotificationsController < ApplicationController
  before_action :authorized!

  def send_test_to_self
    if current_user.can_receive_push_notifications?
      title = params[:title] || "Test to #{current_user.name}! 🚀"
      body = params[:body] || "This notification was sent directly to you!"

      PushNotificationService.send_notification(
        current_user,
        title,
        body,
        {
          type: "self_test",
          timestamp: Time.current.to_i,
          user_id: current_user.id.to_s
        }
      )

      render json: { success: true, message: "Test notification sent to yourself!" }
    else
      render json: {
        success: false,
        message: "Cannot send notifications. Check your notification settings and push token."
      }
    end
  end

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
