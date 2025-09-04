class Admin::ModerationController < ApplicationController
  before_action :authenticate_user!
  before_action :ensure_admin

  # GET /admin/reports
  def reports_dashboard
    @stats = {
      total_reports: Report.count,
      pending_reports: Report.pending.count,
      overdue_reports: Report.overdue.count,
      resolved_today: Report.resolved.where("reviewed_at > ?", 24.hours.ago).count,
      average_resolution_time: calculate_average_resolution_time
    }

    @recent_reports = Report.includes(:reporter, :reportable, :reviewed_by)
                            .recent
                            .limit(10)

    @overdue_reports = Report.overdue
                             .includes(:reporter, :reportable)
                             .limit(5)

    render json: {
      stats: @stats,
      recent_reports: @recent_reports.map { |r| report_summary(r) },
      overdue_reports: @overdue_reports.map { |r| report_summary(r) },
      reports_by_reason: Report.group(:reason).count,
      reports_by_status: Report.group(:status).count
    }
  end

  # GET /admin/moderation_actions
  def moderation_actions_index
    @actions = ModerationAction.includes(:user, :moderator, :report)
                               .recent
                               .page(params[:page])

    render json: {
      actions: @actions.map { |a| action_json(a) },
      meta: pagination_meta(@actions)
    }
  end

  # GET /admin/users/:id/moderation_history
  def user_moderation_history
    @user = User.find(params[:id])

    @history = {
      user: user_summary(@user),
      reports_filed_by: @user.reports_as_reporter.count,
      reports_against: Report.where(reportable: @user.comments).count,
      moderation_actions: @user.moderation_actions.recent.limit(10).map { |a| action_json(a) },
      warnings_count: @user.warnings_count,
      status: @user.status,
      suspended_until: @user.suspended_until,
      banned_at: @user.banned_at
    }

    render json: @history
  end

  # POST /admin/users/:id/suspend
  def suspend_user
    @user = User.find(params[:id])
    duration = params[:duration].to_i.days
    reason = params[:reason]

    if @user.suspend!(duration, reason, current_user)
      render json: {
        status: "success",
        message: "User suspended until #{@user.suspended_until}",
        user: user_summary(@user)
      }
    else
      render json: { status: "error", message: "Failed to suspend user" }, status: :unprocessable_entity
    end
  end

  # POST /admin/users/:id/unsuspend
  def unsuspend_user
    @user = User.find(params[:id])

    if @user.unsuspend!(current_user)
      render json: {
        status: "success",
        message: "User suspension lifted",
        user: user_summary(@user)
      }
    else
      render json: { status: "error", message: "Failed to unsuspend user" }, status: :unprocessable_entity
    end
  end

  # POST /admin/users/:id/ban
  def ban_user
    @user = User.find(params[:id])
    reason = params[:reason]

    if @user.ban!(reason, current_user)
      render json: {
        status: "success",
        message: "User permanently banned",
        user: user_summary(@user)
      }
    else
      render json: { status: "error", message: "Failed to ban user" }, status: :unprocessable_entity
    end
  end

  # POST /admin/users/:id/unban
  def unban_user
    @user = User.find(params[:id])

    if @user.unban!(current_user)
      render json: {
        status: "success",
        message: "User ban lifted",
        user: user_summary(@user)
      }
    else
      render json: { status: "error", message: "Failed to unban user" }, status: :unprocessable_entity
    end
  end

  private

  def ensure_admin
    unless current_user&.admin?
      render json: { status: "error", message: "Unauthorized" }, status: :forbidden
    end
  end

  def report_summary(report)
    {
      id: report.id,
      reason: report.reason,
      status: report.status,
      reporter_name: report.reporter.name,
      reportable_type: report.reportable_type,
      created_at: report.created_at,
      overdue: report.overdue?
    }
  end

  def action_json(action)
    {
      id: action.id,
      action_type: action.action_type,
      user_name: action.user.name,
      moderator_name: action.moderator.name,
      reason: action.reason,
      created_at: action.created_at,
      expires_at: action.expires_at,
      active: action.active?
    }
  end

  def user_summary(user)
    {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      warnings_count: user.warnings_count,
      suspended_until: user.suspended_until,
      banned_at: user.banned_at,
      created_at: user.created_at
    }
  end

  def pagination_meta(collection)
    {
      total: collection.total_count,
      page: collection.current_page,
      per_page: collection.limit_value,
      total_pages: collection.total_pages
    }
  end

  def calculate_average_resolution_time
    resolved_reports = Report.resolved.where.not(reviewed_at: nil)
    return 0 if resolved_reports.empty?

    total_hours = resolved_reports.sum do |report|
      (report.reviewed_at - report.created_at) / 3600.0
    end

    (total_hours / resolved_reports.count).round(2)
  end
end
