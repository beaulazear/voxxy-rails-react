class AdminController < ApplicationController
  before_action :authorized
  before_action :admin_authorized

  def analytics
    render json: {
      total_users: User.count,
      total_activities: Activity.count,
      activities_by_status: {
        collecting: Activity.where(active: true, finalized: false, completed: false).count,
        voting: Activity.joins(:responses).where(active: true, finalized: false, completed: false).having('COUNT(responses.id) > 0').group('activities.id').count.length,
        finalized: Activity.where(finalized: true, completed: false).count,
        completed: Activity.where(completed: true).count
      }
    }
  end

  private

  def admin_authorized
    render json: { error: "Admin access required" }, status: :forbidden unless @current_user&.admin?
  end
end