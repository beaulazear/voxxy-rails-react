class AdminController < ApplicationController
  before_action :authorized
  before_action :admin_authorized

  def analytics
    render json: {
      total_users: User.count,
      total_activities: Activity.count,
      activities_by_status: {
        collecting: Activity.where(active: true, finalized: false, completed: false).count,
        voting: Activity.joins(:responses).where(active: true, finalized: false, completed: false).having("COUNT(responses.id) > 0").group("activities.id").count.length,
        finalized: Activity.where(finalized: true, completed: false).count,
        completed: Activity.where(completed: true).count
      }
    }
  end

  def admin_users
    begin
      admin_users_data = User.where(admin: true).select(:id, :name, :email)
      admin_users_count = User.where(admin: true).count
      render json: {
        total_admin_users: admin_users_count,
        admin_users: admin_users_data.map { |user| { name: user.name || "", email: user.email || "" } }
      }
    rescue => e
      render json: { error: "Failed to fetch admin users: #{e.message}" }, status: :internal_server_error
    end
  end

  private

  def admin_authorized
    render json: { error: "Admin access required" }, status: :forbidden unless @current_user&.admin?
  end
end
