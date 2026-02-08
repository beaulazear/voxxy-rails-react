# app/controllers/api/v1/shared/bug_reports_controller.rb
class Api::V1::Shared::BugReportsController < ApplicationController
  skip_before_action :authorized, only: [ :create ]

    def index
      @bug_reports = BugReport.all
      render json: @bug_reports
    end

    def show
      @bug_report = BugReport.find(params[:id])
      render json: @bug_report
    end

    def create
      report_params = bug_report_params

      # Handle description alias (frontend uses 'description', model uses 'bug_description')
      if report_params[:description].present? && report_params[:bug_description].blank?
        report_params[:bug_description] = report_params[:description]
      end

      @bug_report = BugReport.new(report_params)
      if @bug_report.save
        # Only notify if service exists (avoid errors in development)
        SubmissionNotifierService.notify(:bug_report, @bug_report) if defined?(SubmissionNotifierService)
        render json: @bug_report, status: :created
      else
        render json: { errors: @bug_report.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def bug_report_params
      params.require(:bug_report).permit(
        :name,
        :email,
        :bug_description,
        :description, # Alias for bug_description (frontend uses this)
        :steps_to_reproduce,
        error_context: {} # Allow nested JSON
      )
    end
end
