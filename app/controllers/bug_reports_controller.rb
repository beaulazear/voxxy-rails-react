# app/controllers/bug_reports_controller.rb
class BugReportsController < ApplicationController
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
      @bug_report = BugReport.new(bug_report_params)
      if @bug_report.save
        SubmissionNotifierService.notify(:bug_report, @bug_report)
        render json: @bug_report, status: :created
      else
        render json: { errors: @bug_report.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def bug_report_params
      params.require(:bug_report).permit(:name, :email, :bug_description, :steps_to_reproduce)
    end
end
