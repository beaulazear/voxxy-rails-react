class ReportsController < ApplicationController
  before_action :set_report, only: [ :show, :update ]
  before_action :ensure_admin, only: [ :index, :show, :update, :review, :resolve, :dismiss, :stats ]

  # GET /reports (Admin only)
  def index
    # Manual pagination setup
    page = params[:page].to_i > 0 ? params[:page].to_i : 1
    per_page = params[:per_page].to_i > 0 ? params[:per_page].to_i : 20

    # Build query
    reports_query = Report.includes(:reporter, :reportable, :reviewed_by).recent

    # Filter by status if provided
    reports_query = reports_query.where(status: params[:status]) if params[:status].present?

    # Filter overdue reports
    reports_query = reports_query.overdue if params[:overdue] == "true"

    # Get total count before pagination
    total_count = reports_query.count

    # Apply pagination
    @reports = reports_query.offset((page - 1) * per_page).limit(per_page)

    render json: {
      reports: @reports.map { |r| report_json(r) },
      meta: {
        total: total_count,
        page: page,
        per_page: per_page,
        total_pages: (total_count.to_f / per_page).ceil,
        overdue_count: Report.overdue.count
      }
    }
  end

  # POST /reports (Create a new report)
  def create
    @report = Report.new(report_params)
    @report.reporter = current_user

    if @report.save
      render json: {
        status: "success",
        message: "Report submitted successfully. We will review it within 24 hours.",
        report_id: @report.id
      }, status: :created
    else
      render json: {
        status: "error",
        errors: @report.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # GET /reports/:id (Admin only)
  def show
    render json: report_json(@report)
  end

  # PATCH /reports/:id/review (Admin only)
  def review
    @report = Report.find(params[:id])

    if @report.review!(current_user)
      render json: {
        status: "success",
        message: "Report marked as under review",
        report: report_json(@report)
      }
    else
      render json: {
        status: "error",
        message: "Failed to update report status"
      }, status: :unprocessable_entity
    end
  end

  # PATCH /reports/:id/resolve (Admin only)
  def resolve
    @report = Report.find(params[:id])

    if @report.resolve!(
      params[:resolution_action],
      params[:resolution_notes],
      current_user
    )
      render json: {
        status: "success",
        message: "Report resolved successfully",
        report: report_json(@report)
      }
    else
      render json: {
        status: "error",
        message: "Failed to resolve report"
      }, status: :unprocessable_entity
    end
  end

  # PATCH /reports/:id/dismiss (Admin only)
  def dismiss
    @report = Report.find(params[:id])

    if @report.dismiss!(params[:reason], current_user)
      render json: {
        status: "success",
        message: "Report dismissed",
        report: report_json(@report)
      }
    else
      render json: {
        status: "error",
        message: "Failed to dismiss report"
      }, status: :unprocessable_entity
    end
  end

  # GET /reports/stats (Admin only)
  def stats
    ensure_admin

    render json: {
      total_reports: Report.count,
      pending_reports: Report.pending.count,
      overdue_reports: Report.overdue.count,
      resolved_today: Report.resolved.where("reviewed_at > ?", 24.hours.ago).count,
      reports_by_reason: Report.group(:reason).count,
      reports_by_status: Report.group(:status).count,
      average_resolution_time: calculate_average_resolution_time
    }
  end

  private

  def set_report
    @report = Report.find(params[:id])
  end

  def report_params
    params.require(:report).permit(
      :reportable_type,
      :reportable_id,
      :reason,
      :description,
      :activity_id
    )
  end

  def ensure_admin
    unless current_user&.admin?
      render json: {
        status: "error",
        message: "Unauthorized. Admin access required."
      }, status: :forbidden
    end
  end

  def report_json(report)
    {
      id: report.id,
      reportable_type: report.reportable_type,
      reportable_id: report.reportable_id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      reported_content: report.reported_content,
      reporter: {
        id: report.reporter.id,
        name: report.reporter.name
      },
      reported_user: report.reported_user ? {
        id: report.reported_user.id,
        name: report.reported_user.name,
        email: report.reported_user.email,
        warnings_count: report.reported_user.warnings_count
      } : nil,
      reviewed_by: report.reviewed_by ? {
        id: report.reviewed_by.id,
        name: report.reviewed_by.name
      } : nil,
      reviewed_at: report.reviewed_at,
      resolution_action: report.resolution_action,
      resolution_notes: report.resolution_notes,
      overdue: report.overdue?,
      created_at: report.created_at,
      updated_at: report.updated_at
    }
  end

  def calculate_average_resolution_time
    resolved_reports = Report.resolved.where.not(reviewed_at: nil)
    return 0 if resolved_reports.empty?

    total_time = resolved_reports.sum do |report|
      (report.reviewed_at - report.created_at) / 3600.0 # Convert to hours
    end

    (total_time / resolved_reports.count).round(2)
  end
end
