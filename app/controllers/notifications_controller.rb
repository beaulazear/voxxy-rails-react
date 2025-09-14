class NotificationsController < ApplicationController
  before_action :authorized
  before_action :set_notification, only: [ :show, :update, :destroy ]

  # GET /notifications
  def index
    @notifications = current_user.notifications
                                 .includes(:activity, :triggering_user)
                                 .recent
                                 .limit(50)

    render json: @notifications.map { |notification|
      {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.notification_type,
        read: notification.read,
        created_at: notification.created_at,
        data: notification.data,
        activity: notification.activity ? {
          id: notification.activity.id,
          activity_name: notification.activity.activity_name,
          activity_type: notification.activity.activity_type
        } : nil,
        triggering_user: notification.triggering_user ? {
          id: notification.triggering_user.id,
          name: notification.triggering_user.name
        } : nil
      }
    }
  end

  # GET /notifications/:id
  def show
    render json: {
      id: @notification.id,
      title: @notification.title,
      body: @notification.body,
      type: @notification.notification_type,
      read: @notification.read,
      created_at: @notification.created_at,
      data: @notification.data,
      activity: @notification.activity,
      triggering_user: @notification.triggering_user
    }
  end

  # PUT /notifications/:id/read
  def mark_as_read
    @notification = current_user.notifications.find(params[:id])
    @notification.mark_as_read!
    render json: { success: true, message: "Notification marked as read" }
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: "Notification not found" }, status: :not_found
  end

  # PUT /notifications/mark-all-read
  def mark_all_as_read
    current_user.notifications.unread.update_all(read: true)
    render json: { success: true, message: "All notifications marked as read" }
  end

  # DELETE /notifications/:id
  def destroy
    @notification.destroy
    render json: { success: true, message: "Notification deleted" }
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: "Notification not found" }, status: :not_found
  end

  # POST /notifications (for testing/manual creation)
  def create
    notification = Notification.create_and_send!(
      user: current_user,
      title: params[:title] || "Test Notification",
      body: params[:body] || "This is a test notification",
      notification_type: params[:notification_type] || "general",
      data: params[:data] || {}
    )

    render json: { success: true, notification: notification }
  rescue => e
    render json: { success: false, message: e.message }, status: :unprocessable_entity
  end

  # Test notification method
  def send_test_to_self
    if current_user.can_receive_push_notifications?
      title = params[:title] || "Test Notification 🔔"
      body = params[:body] || "Push notifications are working!"

      Notification.create_and_send!(
        user: current_user,
        title: title,
        body: body,
        notification_type: "general",
        data: { type: "self_test", timestamp: Time.current.to_i }
      )

      render json: { 
        success: true, 
        message: "Test notification sent!"
      }
    else
      render json: {
        success: false,
        message: "Cannot send notifications. Please enable push notifications in your settings."
      }, status: :unprocessable_entity
    end
  end

  def test
    if current_user.can_receive_push_notifications?
      title = params[:title] || "Test Notification! 🚀"
      body = params[:body] || "Push notifications are working from your backend!"

      Notification.create_and_send!(
        user: current_user,
        title: title,
        body: body,
        notification_type: "general",
        data: { type: "test", timestamp: Time.current.to_i }
      )

      render json: { success: true, message: "Test notification sent!" }
    else
      render json: {
        success: false,
        message: "User cannot receive push notifications. Check push_notifications setting and push_token."
      }
    end
  end

  private

  def set_notification
    @notification = current_user.notifications.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: "Notification not found" }, status: :not_found
  end
end
